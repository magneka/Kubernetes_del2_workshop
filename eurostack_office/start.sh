#!/usr/bin/env bash
# =============================================================================
# start.sh - Deploy (or restart) Euro-Office + Nextcloud on Kubernetes
# =============================================================================
# What it does:
#   1. Checks that kubectl can reach a cluster.
#   2. Warns if no "nginx" Ingress controller is installed.
#   3. Applies every manifest in k8s/ (in numbered order).
#   4. Scales the workloads to 1 replica. This is needed after stop.sh:
#      "kubectl apply" does NOT undo a manual "kubectl scale".
#   5. Waits until everything is running.
#
# Usage:
#   ./start.sh
# =============================================================================
set -euo pipefail

NAMESPACE="eurostack"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMEOUT="15m"   # First start can take several minutes.

# --- 1. Check the cluster connection -----------------------------------------
if ! command -v kubectl >/dev/null 2>&1; then
  echo "ERROR: kubectl was not found in PATH." >&2
  exit 1
fi
if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "ERROR: kubectl cannot reach a cluster. Is Kubernetes running?" >&2
  exit 1
fi
echo ">>> Using cluster context: $(kubectl config current-context)"

# --- 2. Check for an Ingress controller ---------------------------------------
if ! kubectl get ingressclass nginx >/dev/null 2>&1; then
  echo "WARNING: No 'nginx' IngressClass found. The browser URLs will not work."
  echo "         Install ingress-nginx first (see README.md, Step 1)."
fi

# --- 3. Apply all manifests ---------------------------------------------------
echo ">>> Applying manifests from k8s/"
kubectl apply -f "$SCRIPT_DIR/k8s/"

# --- 4. Make sure every workload has 1 replica -------------------------------
echo ">>> Scaling workloads to 1 replica"
kubectl scale -n "$NAMESPACE" statefulset/postgres --replicas=1
kubectl scale -n "$NAMESPACE" deployment/euro-office deployment/nextcloud --replicas=1

# --- 5. Wait until everything is ready ---------------------------------------
echo ">>> Waiting for the workloads to become ready (up to $TIMEOUT)..."
kubectl rollout status -n "$NAMESPACE" statefulset/postgres     --timeout="$TIMEOUT"
kubectl rollout status -n "$NAMESPACE" deployment/euro-office   --timeout="$TIMEOUT"
kubectl rollout status -n "$NAMESPACE" deployment/nextcloud     --timeout="$TIMEOUT"

echo
kubectl get pods -n "$NAMESPACE"
echo
echo ">>> Ready."
echo "    Nextcloud:   http://cloud.localhost"
echo "    Euro-Office: http://office.localhost/healthcheck"
