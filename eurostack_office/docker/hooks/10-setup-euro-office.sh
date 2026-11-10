#!/bin/sh
# Docker Compose version of the setup hook in k8s/02-configmap-nextcloud-hooks.yaml.
# The official Nextcloud image runs this ONCE, right after the first install.
# If you change a URL later, re-run the occ commands with:
#   docker compose exec -u www-data nextcloud php occ config:app:set ...
set -e
OCC="php /var/www/html/occ"

echo ">>> Installing the Euro-Office connector app (app id: eurooffice)"
$OCC app:install eurooffice || $OCC app:enable eurooffice

# 1. DocumentServerUrl - the address the USER'S BROWSER uses (published port).
$OCC config:app:set eurooffice DocumentServerUrl \
  --value="$EURO_OFFICE_PUBLIC_URL"

# 2. DocumentServerInternalUrl - how NEXTCLOUD reaches Euro-Office on the
#    Compose network (the service name works as a hostname).
$OCC config:app:set eurooffice DocumentServerInternalUrl \
  --value="http://euro-office/"

# 3. StorageUrl - how EURO-OFFICE reaches Nextcloud on the Compose network.
$OCC config:app:set eurooffice StorageUrl \
  --value="http://nextcloud/"

# Shared JWT secret, must match JWT_SECRET in the euro-office service.
$OCC config:app:set eurooffice jwt_secret \
  --value="$EURO_OFFICE_JWT_SECRET"

# Compose networks use private IPs (172.x.x.x); allow Nextcloud to call them.
$OCC config:system:set allow_local_remote_servers --type=boolean --value=true

echo ">>> Euro-Office connector configured"
