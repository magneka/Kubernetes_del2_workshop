#!/usr/bin/env bash
# Deploy to the current kubectl context (or KUBE_CONTEXT): build multi-arch images, push, apply.
# Usage: scripts/k8s-up.sh   (after `docker login`; pushes to Docker Hub user "magneka" by default)
# Optional: REGISTRY (default docker.io/magneka), TAG, PLATFORMS (default linux/amd64,linux/arm64), KUBE_CONTEXT.
# Without a LoadBalancer address, a background port-forward to nginx is started on LOCAL_PORT (default 8083).
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REGISTRY="${REGISTRY:-docker.io/magneka}"
for cmd in kubectl docker; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "error: '$cmd' is required but not found in PATH" >&2; exit 1; }
done
[ -f .env ] || { echo "error: .env not found in repo root" >&2; exit 1; }

TAG="${TAG:-$(date +%Y%m%d%H%M%S)}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER=k8sexp-builder
LOCAL_PORT="${LOCAL_PORT:-8083}"
SVC_PORT=8083  # port of service/nginx (k8s/30-nginx.yaml)
PF_PIDFILE=".k8s-port-forward.pid"
PF_LOG=".k8s-port-forward.log"
KCTX="${KUBE_CONTEXT:-$(kubectl config current-context)}"
k() { kubectl --context "$KCTX" "$@"; }

API_IMAGE="$REGISTRY/k8sexp-api:$TAG"
NGINX_IMAGE="$REGISTRY/k8sexp-nginx:$TAG"
echo "Context: $KCTX | images: $API_IMAGE, $NGINX_IMAGE ($PLATFORMS)"

# The default docker driver cannot build multi-platform images.
docker buildx inspect "$BUILDER" >/dev/null 2>&1 || docker buildx create --name "$BUILDER" --driver docker-container
# Remove the builder container (and its cache) when the script ends, on success or failure.
trap 'docker buildx rm "$BUILDER" >/dev/null 2>&1 || true' EXIT
docker buildx build --builder "$BUILDER" --platform "$PLATFORMS" -t "$API_IMAGE" --push api
docker buildx build --builder "$BUILDER" --platform "$PLATFORMS" -t "$NGINX_IMAGE" -f nginx/Dockerfile --push .

k apply -f k8s/00-namespace.yaml

k create secret generic app-secrets --namespace=app --from-env-file=.env \
  --dry-run=client -o yaml | k apply -f -
k create configmap db-init --namespace=app --from-file=db/init \
  --dry-run=client -o yaml | k apply -f -

for f in k8s/[0-9]*.yaml; do cat "$f"; echo '---'; done \
  | sed -e "s|image: k8sexp-api$|image: $API_IMAGE|" -e "s|image: k8sexp-nginx$|image: $NGINX_IMAGE|" \
  | k apply -f -

k -n app rollout status deployment/mysql --timeout=300s
k -n app rollout status deployment/api --timeout=300s
k -n app rollout status deployment/nginx --timeout=300s

echo "Waiting for external address of service/nginx ..."
for _ in $(seq 1 12); do
  ADDR="$(k -n app get svc nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}')"
  if [ -n "$ADDR" ]; then
    echo "App ready at http://$ADDR:$SVC_PORT"
    exit 0
  fi
  sleep 5
done

# No LoadBalancer provider: fall back to a background port-forward (stopped by k8s-down).
echo "No external address (cluster may lack a LoadBalancer provider). Starting port-forward on localhost:$LOCAL_PORT ..."
if [ -f "$PF_PIDFILE" ]; then kill "$(cat "$PF_PIDFILE")" 2>/dev/null || true; rm -f "$PF_PIDFILE"; fi
nohup kubectl --context "$KCTX" -n app port-forward svc/nginx "$LOCAL_PORT:$SVC_PORT" >"$PF_LOG" 2>&1 &
echo $! >"$PF_PIDFILE"
sleep 3
if kill -0 "$(cat "$PF_PIDFILE")" 2>/dev/null; then
  echo "App ready at http://localhost:$LOCAL_PORT  (port-forward pid $(cat "$PF_PIDFILE"), log $PF_LOG; stopped by k8s-down)"
else
  rm -f "$PF_PIDFILE"
  echo "error: port-forward failed (port $LOCAL_PORT in use?). See $PF_LOG. Retry with LOCAL_PORT=<port>." >&2
  exit 1
fi
