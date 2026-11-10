#!/usr/bin/env bash
# Deletes all workloads (and so all their containers) in every non-system namespace
# of the current kubectl context (or KUBE_CONTEXT). Services, PVCs, secrets and namespaces are kept.
# System namespaces are skipped so the cluster itself keeps running.
set -euo pipefail

KCTX="${KUBE_CONTEXT:-$(kubectl config current-context)}"
SYSTEM_NS="kube-system kube-public kube-node-lease local-path-storage"

echo "This deletes ALL deployments, statefulsets, daemonsets, replicasets, jobs, cronjobs and pods"
echo "in every namespace except: $SYSTEM_NS"
echo "Context: $KCTX"
read -r -p "Type the context name to confirm: " CONFIRM
[ "$CONFIRM" = "$KCTX" ] || { echo "Aborted."; exit 1; }

for ns in $(kubectl --context "$KCTX" get ns -o custom-columns=NAME:.metadata.name --no-headers); do
  case " $SYSTEM_NS " in *" $ns "*) continue ;; esac
  echo "--- $ns"
  kubectl --context "$KCTX" -n "$ns" delete deployments,statefulsets,daemonsets,replicasets,jobs,cronjobs,pods --all --wait=false
done

echo "Done."
