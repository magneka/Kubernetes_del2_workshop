#!/usr/bin/env bash
# =============================================================================
# stop.sh - Stop Euro-Office + Nextcloud but KEEP all data
# =============================================================================
# Scales every workload down to 0 replicas. The Pods are removed, but the
# namespace, Secrets, Services and, most importantly, the PersistentVolume
# Claims (your files and database) stay. Run ./start.sh to bring it back.
#
# Usage:
#   ./stop.sh
# =============================================================================
set -euo pipefail

NAMESPACE="eurostack"

if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  echo "Namespace '$NAMESPACE' does not exist. Nothing to stop."
  exit 0
fi

echo ">>> Using cluster context: $(kubectl config current-context)"

# Stop the apps first, then the database they depend on.
echo ">>> Scaling Nextcloud and Euro-Office to 0"
kubectl scale -n "$NAMESPACE" deployment/nextcloud deployment/euro-office --replicas=0

echo ">>> Scaling PostgreSQL to 0"
kubectl scale -n "$NAMESPACE" statefulset/postgres --replicas=0

echo ">>> Waiting for the Pods to shut down..."
kubectl wait -n "$NAMESPACE" --for=delete pod --all --timeout=180s || true

echo
echo ">>> Stopped. Data is kept on these volumes:"
kubectl get pvc -n "$NAMESPACE"
