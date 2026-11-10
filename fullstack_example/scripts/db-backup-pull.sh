#!/usr/bin/env bash
# Copy the newest MySQL backup from the cluster (PVC mysql-backup-pvc) to a local folder.
# Usage: scripts/db-backup-pull.sh          copy the newest backup to the local folder
#        scripts/db-backup-pull.sh --list   list backups in the cluster and in the local folder
# Optional: BACKUP_DIR (default ./backups), KUBE_CONTEXT.
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

LIST=0
case "${1:-}" in
  "") ;;
  --list|-l) LIST=1 ;;
  *) echo "usage: $0 [--list]" >&2; exit 2 ;;
esac

KCTX="${KUBE_CONTEXT:-$(kubectl config current-context)}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
POD="backup-pull-$$"
k() { kubectl --context "$KCTX" -n app "$@"; }

mkdir -p "$BACKUP_DIR"
echo "Context: $KCTX"

trap 'k delete pod "$POD" --ignore-not-found --wait=false >/dev/null 2>&1 || true' EXIT

# Short-lived pod that only mounts the backup volume read-only so we can read from it.
k apply -f - >/dev/null <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $POD
spec:
  restartPolicy: Never
  containers:
    - name: pull
      image: busybox:1.36
      command: ["sleep", "300"]
      volumeMounts:
        - name: backup
          mountPath: /backup
          readOnly: true
  volumes:
    - name: backup
      persistentVolumeClaim:
        claimName: mysql-backup-pvc
        readOnly: true
EOF
k wait --for=condition=Ready "pod/$POD" --timeout=120s >/dev/null

if [ "$LIST" = 1 ]; then
  echo "In cluster (mysql-backup-pvc, times are UTC):"
  k exec "$POD" -- sh -c 'ls -lh /backup/db-*.sql.gz 2>/dev/null || echo "  (none)"'
  echo "Local ($BACKUP_DIR/):"
  ls -lh "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null || echo "  (none)"
  exit 0
fi

LATEST="$(k exec "$POD" -- sh -c 'ls -1t /backup/db-*.sql.gz 2>/dev/null | head -n 1')"
[ -n "$LATEST" ] || { echo "error: no backups found on mysql-backup-pvc" >&2; exit 1; }
NAME="$(basename "$LATEST")"

if [ -f "$BACKUP_DIR/$NAME" ]; then
  echo "Already up to date: $BACKUP_DIR/$NAME"
  exit 0
fi

# Stream to a temp name so an interrupted copy never looks like a finished backup.
k exec "$POD" -- cat "$LATEST" > "$BACKUP_DIR/$NAME.part"
gzip -t "$BACKUP_DIR/$NAME.part"
mv "$BACKUP_DIR/$NAME.part" "$BACKUP_DIR/$NAME"
echo "Saved $BACKUP_DIR/$NAME ($(wc -c < "$BACKUP_DIR/$NAME" | tr -d ' ') bytes)"
