#!/usr/bin/env bash
# =============================================================================
# remove.sh - Remove Euro-Office + Nextcloud from the cluster, INCLUDING DATA
# =============================================================================
# Deletes the whole "eurostack" namespace. Kubernetes then deletes everything
# inside it: Pods, Services, Secrets, the Ingress and all PersistentVolume
# Claims. All uploaded files and the database are lost.
#
# The ingress-nginx controller is NOT removed, because other projects may
# use it.
#
# Usage:
#   ./remove.sh        # asks for confirmation
#   ./remove.sh -y     # no question, for scripts
# =============================================================================
set -euo pipefail

NAMESPACE="eurostack"

if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  echo "Namespace '$NAMESPACE' does not exist. Nothing to remove."
  exit 0
fi

echo ">>> Using cluster context: $(kubectl config current-context)"

if [[ "${1:-}" != "-y" ]]; then
  echo "This deletes namespace '$NAMESPACE' and ALL its data (files and database)."
  read -r -p "Type 'yes' to continue: " answer
  if [[ "$answer" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo ">>> Deleting namespace '$NAMESPACE' (this can take a minute)..."
kubectl delete namespace "$NAMESPACE" --wait=true

echo ">>> Removed."
