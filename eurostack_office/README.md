# Euro-Office + Nextcloud on Kubernetes: a hands-on tutorial

This project runs a complete, **self-hosted** office suite in your own
Kubernetes cluster:

| Component       | What it does                                   | Kubernetes object          |
|-----------------|------------------------------------------------|----------------------------|
| **Nextcloud**   | File server: stores files, users, sharing, UI  | Deployment + Service + PVC |
| **PostgreSQL**  | Database for Nextcloud                         | StatefulSet + headless Service |
| **Euro-Office** | Online editor for documents, sheets, slides    | Deployment + Service + PVC |
| **Ingress**     | Lets your browser reach the two web apps       | Ingress                    |

Everything runs as containers inside your cluster, and all data lives on
your cluster's volumes. Nextcloud and Euro-Office are both open-source
software you host yourself. No external cloud service is used.

```
   Browser
      |
      |  http://cloud.localhost        http://office.localhost
      v                                   |
 +-----------+                            |
 |  Ingress  |----------------------------+
 +-----------+
      |                                   |
      v                                   v
 +-------------+  DocumentServerInternalUrl  +---------------+
 |  Nextcloud  | --------------------------> |  Euro-Office  |
 |  (files)    | <-------------------------- |  (editor)     |
 +-------------+         StorageUrl          +---------------+
      |
      v
 +-------------+
 | PostgreSQL  |
 +-------------+
```

## Quick start with the scripts

The root folder has helper scripts in Bash and PowerShell versions:

| Task | Bash | PowerShell | What happens |
|------|------|------------|--------------|
| Start | `./start.sh` | `.\start.ps1` | Applies `k8s/`, scales to 1 replica, waits until ready |
| Stop | `./stop.sh` | `.\stop.ps1` | Scales to 0 replicas. **Data is kept** |
| Remove | `./remove.sh` | `.\remove.ps1` | Deletes the namespace. **All data is lost** |

`remove` asks for confirmation. Skip the question with `./remove.sh -y`
or `.\remove.ps1 -Force`. If Windows blocks the PowerShell scripts, run
them with `powershell -ExecutionPolicy Bypass -File .\start.ps1`.

You still need an Ingress controller (Step 1 below) and your own
passwords (Step 2). The steps below show what the scripts do by hand,
which is the better way to learn.

## Without Kubernetes: Docker Compose

[docker-compose.yml](docker-compose.yml) runs the same three services on one
machine with Docker only. You do not need a cluster or an Ingress controller.

### Start it

```bash
cp .env.example .env      # then open .env and change the passwords
docker compose up -d
docker compose logs -f    # Ctrl+C stops following the logs, not the stack
```

The first start takes a few minutes. You are ready when the Nextcloud log
shows `>>> Euro-Office connector configured` and `docker compose ps`
shows `euro-office` as `healthy`.

### URLs

| What | URL | Who uses it |
|------|-----|-------------|
| Nextcloud | <http://localhost:8080> | You, in the browser |
| Euro-Office health check | <http://localhost:8081/healthcheck> | You, to check it says `true` |
| Euro-Office editor | <http://localhost:8081> | Nextcloud opens it for you. Do not use it directly |

Ports 8080 and 8081 are reserved for this solution in this repo. The
other solutions use other host ports, so you can run them at the same time.

To use other ports, change `NEXTCLOUD_PORT` and `EURO_OFFICE_PORT` in
`.env` **before the first start**. The setup script saves the editor URL
during the first install only.

### Users and passwords

All values come from your `.env` file:

| Account | Username | Password | Used for |
|---------|----------|----------|----------|
| Nextcloud admin | `NEXTCLOUD_ADMIN_USER` (default `admin`) | `NEXTCLOUD_ADMIN_PASSWORD` | Logging in to Nextcloud |
| PostgreSQL | `POSTGRES_USER` (default `nextcloud`) | `POSTGRES_PASSWORD` | Nextcloud's own database connection. You never log in with it |
| JWT secret | - | `JWT_SECRET` | Shared by Nextcloud and Euro-Office. Not a login |

The admin and database values are read **only on the first install**.
Changing them in `.env` afterwards has no effect. Either change them in
Nextcloud, or delete all data and start again (see below).

Add more Nextcloud users in the web UI (**Accounts** in the user menu), or
from the command line:

```bash
docker compose exec -u www-data -e OC_PASS=a-good-password nextcloud php occ user:add --password-from-env --display-name="Kari Nordmann" kari
```

### Use it

1. Open <http://localhost:8080> and log in as the admin user.
2. Click **+ New** and create a document, spreadsheet or presentation.
3. It opens in the Euro-Office editor. Changes are saved back to Nextcloud.

### Stop, start and remove

```bash
docker compose stop        # stop the containers, data is kept
docker compose start       # start them again
docker compose down        # remove the containers, data is kept
docker compose down -v     # remove containers AND all data
```

### Troubleshooting

**Check the connection between Nextcloud and Euro-Office:**

```bash
docker compose exec -u www-data nextcloud php occ eurooffice:documentserver --check
```

**Errors such as `No space left on device` or a Nextcloud error page.** Docker's
disk is full. Check it with `docker system df`, then free space with
`docker image prune -a` and `docker builder prune`, or raise the disk limit in
Docker Desktop under **Settings > Resources**.

## The files, in order

The manifests in [k8s/](k8s/) are numbered. `kubectl apply -f k8s/` applies
them in alphabetical order, which is also the order you should read them in.
Every file is commented and explains the concept it introduces.

| File | Concept you learn |
|------|-------------------|
| [00-namespace.yaml](k8s/00-namespace.yaml) | Namespaces, labels |
| [01-secrets.yaml](k8s/01-secrets.yaml) | Secrets, `stringData`, why secrets are not encryption |
| [02-configmap-nextcloud-hooks.yaml](k8s/02-configmap-nextcloud-hooks.yaml) | ConfigMaps, mounting a script as a file |
| [03-persistent-volume-claims.yaml](k8s/03-persistent-volume-claims.yaml) | PersistentVolumeClaims, StorageClasses, access modes |
| [04-postgres-service.yaml](k8s/04-postgres-service.yaml) | Services, DNS names, headless Services |
| [05-postgres-statefulset.yaml](k8s/05-postgres-statefulset.yaml) | StatefulSets, `volumeClaimTemplates`, resources, exec probes |
| [06-euro-office-deployment.yaml](k8s/06-euro-office-deployment.yaml) | Deployments, `Recreate` strategy, env from Secrets, startup/readiness/liveness probes |
| [07-euro-office-service.yaml](k8s/07-euro-office-service.yaml) | ClusterIP Services, named ports, `port-forward` |
| [08-nextcloud-deployment.yaml](k8s/08-nextcloud-deployment.yaml) | `envFrom`, ConfigMap volumes, probes with custom headers |
| [09-nextcloud-service.yaml](k8s/09-nextcloud-service.yaml) | Service-to-service communication |
| [10-ingress.yaml](k8s/10-ingress.yaml) | Ingress rules, Ingress controllers, host-based routing |

## What you need

- A local Kubernetes cluster. Docker Desktop with Kubernetes enabled works
  well on Windows. kind, minikube and k3s also work.
- `kubectl` pointing at that cluster: `kubectl get nodes` should list a node.
- About **6 GB of free memory** for the cluster. Euro-Office alone uses
  1 to 4 GB.

## Step 1: Install an Ingress controller

An Ingress (file 10) is only a set of rules. The **ingress-nginx** controller
is the program that carries them out. Install it once per cluster:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/cloud/deploy.yaml
kubectl wait -n ingress-nginx --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=180s
```

On Docker Desktop, the controller gets `localhost` as its address, so
port 80 on your machine now leads into the cluster.

The URLs in Kubernetes mode are:

| What | URL |
|------|-----|
| Nextcloud | <http://cloud.localhost> (port 80, through the Ingress) |
| Euro-Office health check | <http://office.localhost/healthcheck> |
| Euro-Office editor | <http://office.localhost> (Nextcloud opens it for you) |

The controller owns port 80 on your machine. The other solutions in this
repo avoid port 80 (fullstack_example uses 8083 in Kubernetes).

> Using k3s or Rancher Desktop? They ship with Traefik. Skip this step and
> change `ingressClassName` in file 10 to `traefik`.

## Step 2: Change the passwords

Open [01-secrets.yaml](k8s/01-secrets.yaml) and replace the three
`change-me...` values. Generate random values with:

```bash
openssl rand -hex 32
```

## Step 3: Apply the manifests

You can apply everything at once:

```bash
kubectl apply -f k8s/
```

Or, better for learning, apply one file at a time and look at what appears:

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl get namespaces

kubectl apply -f k8s/01-secrets.yaml
kubectl get secrets -n eurostack
# ...and so on, file by file.
```

## Step 4: Watch it start

```bash
kubectl get pods -n eurostack -w
```

The first start takes a few minutes. Euro-Office generates fonts, and
Nextcloud installs itself and runs the setup script from file 02. Wait
until all three Pods show `1/1 Running`.

Useful commands while you wait:

```bash
kubectl describe pod -n eurostack -l app=euro-office   # events, probe failures
kubectl logs -n eurostack deploy/nextcloud -f          # follow the install
kubectl get pvc -n eurostack                           # volumes should be "Bound"
```

## Step 5: Use it

1. Open <http://office.localhost/healthcheck>. It should say `true`.
2. Open <http://cloud.localhost> and log in with the admin user from file 01
   (`admin` / `NEXTCLOUD_ADMIN_PASSWORD` unless you changed them).
3. Click **+ New** and create a document. It opens in the Euro-Office editor.

## Troubleshooting

**The editor does not open, or shows a security token error.** The JWT
secret differs between the two sides. Check the connector settings:

```bash
kubectl exec -n eurostack deploy/nextcloud -- su -s /bin/sh www-data -c "php occ eurooffice:documentserver --check"
```

**You changed a URL or secret after the first install.** The setup script in
file 02 only runs once. Run the commands again by hand, for example:

```bash
kubectl exec -n eurostack deploy/nextcloud -- su -s /bin/sh www-data -c "php occ config:app:set eurooffice DocumentServerUrl --value=http://office.localhost/"
```

You can also set the three addresses in the Nextcloud admin UI under
**Administration settings > Euro-Office**.

**A Pod stays in `Pending`.** Usually there is not enough memory, or a PVC
cannot be bound. `kubectl describe pod <name> -n eurostack` shows why.

**A Pod restarts repeatedly.** Look at the previous container's logs:

```bash
kubectl logs -n eurostack <pod-name> --previous
```

## Clean up

```bash
kubectl delete namespace eurostack
```

This deletes everything, including all volumes and files.

## Ideas for further exercises

- Add HTTPS with cert-manager and a `tls:` section in the Ingress.
- Move Euro-Office's bundled Redis and RabbitMQ into their own Deployments.
- Replace the Secrets file with Sealed Secrets or an external secret store.
- Package the manifests with Kustomize, with overlays for "dev" and "prod".

## Sources

- [Euro-Office Document Server on GitHub](https://github.com/euro-office/DocumentServer)
- [Nextcloud: Installing Euro-Office via Docker](https://docs.nextcloud.com/server/stable/admin_manual/office/euro-office/installation_docker.html)
- [Nextcloud: Euro-Office configuration](https://docs.nextcloud.com/server/stable/admin_manual/office/euro-office/configuration.html)
- [Euro-Office Nextcloud connector](https://github.com/Euro-Office/eurooffice-nextcloud)
