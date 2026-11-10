#!/usr/bin/env bash
# Remove the app from the current kubectl context (or KUBE_CONTEXT).
# Deleting the namespace also deletes the MySQL PVC, and with it the persistent data.
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f .k8s-port-forward.pid ]; then
  kill "$(cat .k8s-port-forward.pid)" 2>/dev/null || true
  rm -f .k8s-port-forward.pid .k8s-port-forward.log
  echo "Stopped port-forward"
fi

KCTX="${KUBE_CONTEXT:-$(kubectl config current-context)}"
k() { kubectl --context "$KCTX" "$@"; }
echo "Context: $KCTX"
k delete namespace app --ignore-not-found --wait=false

# Without a LoadBalancer controller nobody removes the cleanup finalizer, which would block deletion forever.
if [ -z "$(k -n app get svc nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)" ]; then
  k -n app patch svc nginx --type=merge -p '{"metadata":{"finalizers":null}}' >/dev/null 2>&1 || true
fi

if ! k wait --for=delete namespace/app --timeout=180s; then
  echo "Namespace app is still terminating. Check: kubectl --context $KCTX get ns app -o yaml" >&2
  exit 1
fi
