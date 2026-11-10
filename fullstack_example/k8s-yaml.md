# The Kubernetes YAML files, explained

This document walks through every file in [k8s/](k8s). It is written for someone who knows how to program and has used Docker a bit, but is new to Kubernetes.

Read it top to bottom the first time. Section 1 covers the ideas you need, and the later sections go through the files in the order they are applied.

---

## 1. The basics

### What Kubernetes does

Kubernetes (often written **k8s**) is a system that runs containers for you on one or more machines, called **nodes**. You don't tell it *"start this container now"*. You tell it **what you want to exist**, for example *"one MySQL container should always be running, with this disk attached"*, and Kubernetes keeps working to make that true. If a container crashes, it starts a new one. If a node dies, it moves the work to another node.

This is called **declarative** configuration. The YAML files describe the desired state, and Kubernetes keeps the real state in line with it.

### What a YAML file is

Each YAML file contains one or more **resources** (also called objects or manifests). A line containing only `---` separates resources in the same file. Every resource has the same four top-level parts:

```yaml
apiVersion: apps/v1      # which version of the Kubernetes API defines this type
kind: Deployment         # what type of object this is
metadata:                # identity: name, namespace, labels
  name: api
  namespace: app
spec:                    # the desired state; its contents depend on `kind`
  ...
```

If you're used to programming, think of `kind` as the class, `spec` as the constructor arguments, and `metadata.name` as the variable name. You send the file to the cluster with:

```bash
kubectl apply -f k8s/20-api.yaml
```

`apply` is idempotent: running it again with the same file changes nothing, and running it with an edited file updates only what changed.

### The building blocks used in this project

| Kind | In one sentence | Rough analogy |
|---|---|---|
| **Pod** | The smallest unit Kubernetes runs: one or more containers that share a network address. | A single `docker run` |
| **Deployment** | Keeps a number of identical pods running and replaces them on updates. | A supervisor process that restarts your app |
| **Service** | A stable name and IP address that forwards traffic to a group of pods. | A DNS name plus a small load balancer |
| **PersistentVolumeClaim (PVC)** | A request for disk space that outlives any single pod. | A Docker named volume |
| **Secret** | Holds sensitive key/value data such as passwords. | A `.env` file stored in the cluster |
| **ConfigMap** | Holds non-sensitive configuration or files. | Config files stored in the cluster |
| **CronJob** | Starts a pod on a schedule; the pod runs to completion and exits. | A crontab entry |
| **NetworkPolicy** | Firewall rules that say which pods can talk to which. | iptables / security group rules |
| **Namespace** | A named group that keeps resources apart from others in the cluster. | A folder or package |

You will notice that **this project never creates a Pod directly**. You almost never do in Kubernetes. Instead you create a Deployment (or a CronJob), and it creates the pods for you from a **template**. Pods are disposable: they get a new name and a new IP address every time they are recreated. That's why Services exist.

### Labels and selectors: how things find each other

This is the single most important idea for reading these files. Kubernetes objects don't point to each other by name very often. Instead:

1. Pods get **labels**, which are free-form key/value tags such as `app: mysql`.
2. Other objects use a **selector** that says *"I mean every pod with these labels"*.

```yaml
# In the Deployment's pod template: put a tag on each pod
labels:
  app: mysql

# In the Service: send traffic to every pod with that tag
selector:
  app: mysql
```

It works like a query (`SELECT * FROM pods WHERE app = 'mysql'`) that is evaluated all the time. When a pod is replaced, the new pod has the same label, so the Service finds it automatically. The Deployments, Services and NetworkPolicies in this project all connect this way.

### Why the files have numbers

`00-`, `10-`, `20-` and so on just control the order the files are applied in. The namespace has to exist before anything can be put inside it, and the database should come up before the API that depends on it. The gaps in the numbering leave room to add files in between later.

### What the deploy script adds

Two resources that the YAML files refer to are **not** in the [k8s/](k8s) folder. [scripts/k8s-up.sh](scripts/k8s-up.sh) creates them, so that secrets stay out of git:

- **Secret `app-secrets`**, built from your `.env` file (`kubectl create secret generic app-secrets --from-env-file=.env`). It holds `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER` and `MYSQL_PASSWORD`.
- **ConfigMap `db-init`**, built from the SQL files in [db/init/](db/init).

The script also rewrites the image names on the fly. In the YAML they're placeholders (`image: k8sexp-api`), and the script replaces them with the full registry path and a timestamp tag (for example `docker.io/magneka/k8sexp-api:20261107120000`) before applying.

### The overall picture

```
            Internet / your browser
                     │  port 8083
                     ▼
        ┌──────────────────────────┐
        │ Service nginx            │  type LoadBalancer (reachable from outside)
        └────────────┬─────────────┘
                     ▼
        ┌──────────────────────────┐
        │ Pod nginx                │  serves React, forwards /api
        └────────────┬─────────────┘
                     │  api:8080
                     ▼
        ┌──────────────────────────┐
        │ Service api → Pod api    │  type ClusterIP (internal only)
        └────────────┬─────────────┘
                     │  mysql:3306
                     ▼
        ┌──────────────────────────┐        ┌───────────────────────┐
        │ Service mysql → Pod mysql│◄───────│ CronJob mysql-backup  │
        │   disk: mysql-pvc        │        │   disk: mysql-backup-pvc
        └──────────────────────────┘        └───────────────────────┘

  Everything above lives in the namespace "app".
```

---

## 2. [00-namespace.yaml](k8s/00-namespace.yaml): the namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app
```

This is the simplest file. It creates a namespace called `app`.

A **namespace** is a named group inside the cluster. Every other resource in this project has `namespace: app` in its metadata, so it all ends up in the same group. This gives you:

- **No name clashes.** Another project in the same cluster can also have a Service called `mysql`, as long as it's in a different namespace.
- **Easy cleanup.** `kubectl delete namespace app` deletes everything in it.
- **Short DNS names.** Inside the same namespace, pods can reach a Service just by its name (`mysql`, `api`).

When you use `kubectl`, add `-n app` to see things in this namespace, for example `kubectl get pods -n app`.

---

## 3. [10-mysql.yaml](k8s/10-mysql.yaml): the database

This file holds three resources: a disk, the database itself, and a network name for it.

### 3.1 PersistentVolumeClaim `mysql-pvc`: the disk

```yaml
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
```

A container's own filesystem is thrown away when the container is replaced. A database obviously can't work like that, so we ask the cluster for a separate disk that lives on its own.

- A **PersistentVolumeClaim** is a *request* for storage: "I need 2 GiB". The cluster finds or creates a real disk (a **PersistentVolume**) to satisfy it. On Docker Desktop that's a folder on your machine; on a cloud provider it's a cloud disk. The YAML is the same either way.
- **`ReadWriteOnce`** means the disk can be mounted read-write by one node at a time. That's normal for block storage and fine for a single database.
- `2Gi` means 2 gibibytes (2 × 1024³ bytes). Kubernetes uses `Mi`/`Gi` for powers of 1024.

Deleting the MySQL pod doesn't touch this disk. That's the point.

### 3.2 Deployment `mysql`: the database server

```yaml
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.4
          ...
```

A **Deployment** says *"keep this many copies of this pod running"*. Breaking it down:

- **`replicas: 1`**: run one MySQL pod. A plain MySQL server can't just be copied to scale out, so one is correct here.
- **`strategy: Recreate`**: when the Deployment is updated (for example a new image), stop the old pod *first*, then start the new one. The default (`RollingUpdate`) starts the new one first to avoid downtime, but here both pods would need the same `ReadWriteOnce` disk at the same time, and two MySQL processes must never write to the same data files. A short downtime is the safe choice.
- **`selector.matchLabels`**: tells the Deployment which pods belong to it. It must match the labels in `template.metadata.labels`.
- **`template`**: the blueprint for each pod. Everything under it describes a pod, and it reads a lot like a `docker run` command or a service in `docker-compose.yml`.

#### The container

```yaml
image: mysql:8.4
ports:
  - containerPort: 3306
```

The official MySQL 8.4 image from Docker Hub. `containerPort` is mostly documentation: it says the process listens on 3306. It doesn't open or publish anything by itself (the Service does that).

#### Environment variables from the Secret

```yaml
env:
  - name: MYSQL_ROOT_PASSWORD
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: MYSQL_ROOT_PASSWORD
```

Instead of writing passwords into the YAML, each variable is read from the Secret `app-secrets` at the moment the container starts. The MySQL image uses these four variables on first start to set the root password and create a database and an application user.

#### Volumes and mounts

```yaml
      volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        - name: db-init
          mountPath: /docker-entrypoint-initdb.d
  volumes:
    - name: mysql-data
      persistentVolumeClaim:
        claimName: mysql-pvc
    - name: db-init
      configMap:
        name: db-init
```

This happens in two steps. Under `volumes` (pod level) you say *what* storage the pod has and give each one a local name. Under `volumeMounts` (container level) you say *where* in the container's filesystem each one appears.

- **`mysql-data`** is the PVC from above, mounted where MySQL keeps its data files. That's what makes the data survive restarts.
- **`db-init`** is the ConfigMap that holds the SQL files from `db/init/`. Each key in the ConfigMap shows up as a file. The MySQL image runs every `.sql` file in `/docker-entrypoint-initdb.d` **only when the data directory is empty**, which in practice means the very first start. After that, the schema and seed data are already on the disk and the scripts are skipped.

#### Resources: requests and limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 384Mi
  limits:
    memory: 1Gi
```

- **`requests`** is what the pod is *guaranteed*. The scheduler only places the pod on a node with this much free capacity.
- **`limits`** is the *maximum*. Going over the memory limit gets the container killed (an "OOMKill") and restarted. Going over a CPU limit just slows it down (throttling).
- **`100m`** means 100 *millicores*, i.e. one tenth of a CPU core.

MySQL has a memory limit but intentionally no CPU limit, so it can use spare CPU when it's available instead of being throttled.

#### Readiness probe

```yaml
readinessProbe:
  exec:
    command: [sh, -c, 'mysqladmin ping -h 127.0.0.1 -u root -p"$MYSQL_ROOT_PASSWORD"']
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 6
```

A **probe** is a health check Kubernetes runs against the container. There are two kinds in this project:

- **Readiness**: *"is it ready to receive traffic?"* While it fails, the Service doesn't send traffic to the pod. The pod is **not** restarted.
- **Liveness**: *"is it still alive?"* If it fails enough times, Kubernetes **restarts** the container. (Used for the API; see below.)

Here Kubernetes runs `mysqladmin ping` inside the container: it waits 10 seconds, then checks every 10 seconds, allows 5 seconds per check, and marks the pod not ready after 6 failures in a row. This matters because MySQL takes a while to start, especially on the first run when it executes the init scripts. The deploy script's `kubectl rollout status` also waits for this probe to pass.

### 3.3 Service `mysql`: a stable address

```yaml
kind: Service
metadata:
  name: mysql
spec:
  type: ClusterIP
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
```

Pods get a new IP every time they're recreated, so you can't hardcode a pod's address. A **Service** gives a group of pods (chosen by `selector`) a fixed virtual IP and a **DNS name** equal to the Service name. Any pod in the `app` namespace can now connect to `mysql:3306`, and it will reach whatever MySQL pod is currently running.

- **`type: ClusterIP`** (the default) means the address is only reachable *from inside the cluster*. The database isn't exposed to the outside world.
- **`port`** is the port clients connect to on the Service; **`targetPort`** is the port on the pod. They're the same here, but they don't have to be.

---

## 4. [20-api.yaml](k8s/20-api.yaml): the Go API

Two resources: a Deployment for the API and a Service in front of it. The structure is the same as for MySQL, so this section focuses on what's different.

### 4.1 Deployment `api`

#### Running as a non-root user

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 65532
  runAsGroup: 65532
```

The `securityContext` sets security options for the whole pod. Here it requires that the container **doesn't run as root**, and runs it as user/group 65532. That's the standard "nonroot" user in the *distroless* base image the API is built on. `runAsNonRoot` needs a *numeric* user ID to verify against, which is why the number is spelled out. If someone later builds an image that runs as root, Kubernetes refuses to start it instead of running it unsafely.

#### Image and pull policy

```yaml
image: k8sexp-api
imagePullPolicy: IfNotPresent
```

`k8sexp-api` is a placeholder that [scripts/k8s-up.sh](scripts/k8s-up.sh) replaces with the full, tagged image name. `IfNotPresent` means a node only downloads the image if it doesn't already have it. That works here because every deploy uses a new, unique timestamp tag.

#### Configuration

```yaml
env:
  - name: DB_HOST
    value: "mysql"
  - name: DB_PORT
    value: "3306"
  - name: API_PORT
    value: "8080"
  - name: MYSQL_USER
    valueFrom:
      secretKeyRef: ...
```

Non-secret values are written directly (`value:`), and credentials come from the Secret. Note `DB_HOST: "mysql"`: that's the **Service name** from the previous file, resolved through cluster DNS. The values are quoted because environment variables must be strings, and YAML would otherwise read `3306` as a number.

#### Resources

```yaml
requests:
  cpu: 50m
  memory: 64Mi
limits:
  cpu: 250m
  memory: 128Mi
```

A small Go binary needs very little: guaranteed 0.05 CPU and 64 MiB, at most 0.25 CPU and 128 MiB.

#### Readiness and liveness probes

```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
livenessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 15
  timeoutSeconds: 3
  failureThreshold: 3
```

Both probes make an HTTP GET to `/api/health`. Any status from 200 to 399 counts as healthy.

- **Readiness** starts after 5 seconds. Until it passes, nginx won't get any traffic routed to this pod.
- **Liveness** waits 30 seconds, giving the app time to start before Kubernetes starts judging it. After that, if the endpoint fails 3 times in a row (about 45 seconds), Kubernetes assumes the process is stuck and restarts it.

A common beginner mistake is to make the liveness probe too aggressive. Then a slow start gets the container killed over and over (a "restart loop"). The longer initial delay on liveness avoids this.

### 4.2 Service `api`

```yaml
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 8080
      targetPort: 8080
```

Same pattern as the MySQL Service: an internal-only name, `api:8080`, that nginx uses to forward `/api` requests. The API can't be reached from outside the cluster.

---

## 5. [30-nginx.yaml](k8s/30-nginx.yaml): the front door

### 5.1 Deployment `nginx`

```yaml
containers:
  - name: nginx
    image: k8sexp-nginx
    imagePullPolicy: IfNotPresent
    ports:
      - containerPort: 80
    resources:
      requests: { cpu: 25m, memory: 32Mi }
      limits:   { cpu: 250m, memory: 128Mi }
    readinessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 3
      periodSeconds: 10
```

This runs the nginx image built from [nginx/Dockerfile](nginx/Dockerfile). It contains the compiled React app and the nginx config that forwards `/api/` to `api:8080`. Nothing new here compared to the API: an image placeholder, small resource numbers, and a readiness probe that checks the front page loads.

### 5.2 Service `nginx`: the only public entry point

```yaml
kind: Service
metadata:
  name: nginx
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - port: 8083
      targetPort: 80
```

`port` is the port the Service listens on (8083), and `targetPort` is the port nginx listens on inside the pod (80). We use 8083 instead of 80 because on Docker Desktop a LoadBalancer Service takes that port on `localhost`, and port 80 is already used by the ingress-nginx controller in eurostack_office. Open the app at <http://localhost:8083>.

The one difference from the other Services is **`type: LoadBalancer`**. This asks the cluster for an address that's reachable from *outside* the cluster:

- On a **cloud provider** (AKS, EKS, GKE), this creates a real cloud load balancer with a public IP.
- On **Docker Desktop**, it's mapped to `localhost`.
- On clusters **without** a load balancer provider (for example plain kind or minikube), the external address stays `<pending>` forever. For that case, [scripts/k8s-up.sh](scripts/k8s-up.sh) falls back to `kubectl port-forward`, which tunnels a local port to the Service.

Because only this Service is a LoadBalancer, the browser can only ever talk to nginx. The API and database are hidden behind it.

---

## 6. [40-networkpolicy.yaml](k8s/40-networkpolicy.yaml): the firewall

By default, **every pod in a Kubernetes cluster can connect to every other pod**, even across namespaces. ClusterIP Services stop traffic from *outside* the cluster, but any other pod inside the cluster could still connect to `mysql.app:3306`. NetworkPolicies close that gap. The approach is a classic firewall setup: **deny everything, then allow only what's needed**.

> **Note:** NetworkPolicies are only enforced if the cluster's network plugin supports them (Calico, Cilium and most managed clusters do; some local setups don't). If it isn't supported, the policies are accepted without error but have no effect. The app still works either way, you just lose this extra layer.

### 6.1 `default-deny-ingress`

```yaml
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

- **`podSelector: {}`**: an empty selector matches **every pod** in the namespace.
- **`policyTypes: [Ingress]`**: this policy is about **incoming** traffic ("ingress"). Outgoing traffic ("egress") isn't restricted.
- There's no `ingress:` list, so **nothing** is allowed.

Result: no pod in `app` accepts any incoming connection. The next policies punch specific holes. Policies are **additive**: if any policy allows a connection, it's allowed.

### 6.2 `nginx-allow-external`

```yaml
spec:
  podSelector:
    matchLabels:
      app: nginx
  policyTypes:
    - Ingress
  ingress:
    - ports:
        - protocol: TCP
          port: 80
```

Applies to pods labeled `app: nginx`. The rule has a `ports` section but no `from` section, and a missing `from` means *"from any source"*. So anyone can reach nginx, but only on TCP port 80.

### 6.3 `api-allow-from-nginx`

```yaml
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx
      ports:
        - protocol: TCP
          port: 8080
```

Applies to the API pods. Only pods labeled `app: nginx` may connect, and only on port 8080. Here `podSelector` appears in two places with different meanings:

- the top-level `spec.podSelector` says **which pods this policy protects** (the API),
- the `from.podSelector` says **who is allowed in** (nginx).

### 6.4 `mysql-allow-from-api`

Same structure: only pods labeled `app: api` may connect to the MySQL pods, on port 3306.

### The full set of allowed traffic

```
anyone ──:80──▶ nginx ──:8080──▶ api ──:3306──▶ mysql
                                                  ▲
                    mysql-backup ──:3306──────────┘   (added in 50-mysql-backup.yaml)
```

Everything else going *into* a pod in this namespace is dropped. Even if an attacker got into the nginx container, they couldn't connect directly to MySQL.

---

## 7. [50-mysql-backup.yaml](k8s/50-mysql-backup.yaml): scheduled backups

Three resources: a disk for backups, a scheduled job that writes them, and a firewall opening so the job can reach the database.

### 7.1 PersistentVolumeClaim `mysql-backup-pvc`

```yaml
metadata:
  name: mysql-backup-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

A separate 1 GiB disk just for backup files. It's separate from `mysql-pvc` on purpose: if the database disk is lost or corrupted, the backups survive. A backup stored on the same disk as the data doesn't protect you much.

### 7.2 CronJob `mysql-backup`

A **CronJob** creates a **Job** on a schedule, and the Job creates a **Pod** that runs until it's finished. Unlike a Deployment, the pod isn't meant to keep running: it does its work and exits. So there are three nested levels, which explains the deep indentation:

```
CronJob   (when to run)
 └─ Job   (how to retry)
     └─ Pod (what to run)
```

#### Schedule and history

```yaml
spec:
  schedule: "*/10 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 1
  failedJobsHistoryLimit: 3
```

- **`schedule`** uses standard cron syntax (minute, hour, day of month, month, day of week). `*/10 * * * *` means every 10 minutes. The time is in the cluster's time zone, which is usually UTC.
- **`concurrencyPolicy: Forbid`**: if the previous backup is still running when the next one is due, skip the new one instead of running two at once.
- **`successfulJobsHistoryLimit` / `failedJobsHistoryLimit`**: how many finished Jobs (and their pods and logs) to keep. Keeping a few failed ones lets you read their logs with `kubectl logs` afterwards.

#### The Job

```yaml
jobTemplate:
  spec:
    backoffLimit: 1
    template:
      metadata:
        labels:
          app: mysql-backup
      spec:
        restartPolicy: Never
```

- **`backoffLimit: 1`**: if the pod fails, retry once, then give up until the next scheduled run.
- **`labels: app: mysql-backup`**: the NetworkPolicy below uses this label to let the backup pod through to MySQL.
- **`restartPolicy: Never`**: don't restart a failed container in place. The Job starts a fresh pod instead (up to `backoffLimit`). Jobs must use `Never` or `OnFailure`; the Deployment default, `Always`, makes no sense for something that's supposed to finish.

#### The container

```yaml
containers:
  - name: dump
    image: mysql:8.4
    env:
      - name: MYSQL_PWD
        valueFrom:
          secretKeyRef:
            name: app-secrets
            key: MYSQL_ROOT_PASSWORD
    command: ["bash", "-c"]
    args:
      - |
        ...script...
```

- It reuses the **`mysql:8.4` image**, but only for its `mysqldump` client tool. No database server runs in this pod.
- **`MYSQL_PWD`** is an environment variable the MySQL client tools read automatically. That keeps the password out of the command line, where it could show up in process listings.
- **`command`** replaces the image's normal entrypoint (which would start a MySQL server) with `bash -c`. **`args`** is the script to run. The `|` is YAML for "a multi-line string, keep the line breaks".

#### The backup script, line by line

```bash
set -euo pipefail
```
Stop at the first error, treat unset variables as errors, and make a pipeline fail if *any* command in it fails (not just the last). Without `pipefail`, a failing `mysqldump` piped into a successful `gzip` would look like success.

```bash
cd /backup
f="db-$(date +%Y%m%d-%H%M%S).sql.gz"
```
Go to the backup disk and choose a timestamped filename, e.g. `db-20261107-120000.sql.gz`.

```bash
mysqldump -h mysql -u root --single-transaction --routines --triggers --events --all-databases | gzip > "$f.tmp"
```
Connect to the Service `mysql` and dump every database, compressed with gzip.
- `--single-transaction` takes a consistent snapshot without locking the tables, so the app keeps working during the backup.
- `--routines --triggers --events` include stored procedures, triggers and scheduled events, which aren't all included by default.

```bash
mv "$f.tmp" "$f"
rm -f ./*.tmp
```
Write to a `.tmp` name first, and rename it only when the dump has fully succeeded. If the dump crashes halfway, you never end up with a half-written file that *looks* like a valid backup. Leftover `.tmp` files from earlier failed runs are then removed.

```bash
for old in $(ls -1t db-*.sql.gz | tail -n +4); do rm -f -- "$old"; done
```
List the backups newest first, skip the first three, and delete the rest. Only the **3 newest** backups are kept, so the 1 GiB disk doesn't fill up.

```bash
ls -l /backup
```
Print what's on the disk, so the job's log (`kubectl logs`) shows the result.

#### Mount and resources

```yaml
volumeMounts:
  - name: backup
    mountPath: /backup
...
volumes:
  - name: backup
    persistentVolumeClaim:
      claimName: mysql-backup-pvc
```
The backup PVC appears at `/backup` inside the pod. The resource requests and limits work as described in section 3.2.

[scripts/db-backup-pull.sh](scripts/db-backup-pull.sh) can copy these files from the cluster to your machine.

### 7.3 NetworkPolicy `mysql-allow-from-backup`

```yaml
spec:
  podSelector:
    matchLabels:
      app: mysql
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: mysql-backup
      ports:
        - protocol: TCP
          port: 3306
```

The `default-deny-ingress` policy from file 40 also blocks the backup pod from reaching MySQL. This policy adds one more allowed path: pods labeled `app: mysql-backup` may connect to MySQL on port 3306. It lives in this file rather than in file 40 so that everything related to backups is in one place. If you remove the backup feature, you delete one file.

---

## 8. Useful commands for exploring

```bash
kubectl get all -n app                        # pods, deployments, services, cronjobs at a glance
kubectl get pods -n app -o wide               # which node each pod runs on, and its IP
kubectl describe pod <pod-name> -n app        # details and recent events (great for "why won't it start?")
kubectl logs deployment/api -n app            # logs from the API
kubectl logs job/<job-name> -n app            # logs from a backup run
kubectl get pvc -n app                        # the disks and whether they're bound
kubectl get networkpolicy -n app              # the firewall rules
kubectl create job --from=cronjob/mysql-backup manual-backup -n app   # run a backup right now
kubectl explain deployment.spec.strategy      # built-in docs for any YAML field
```

`kubectl explain` is especially handy while learning: it documents any field in these files without leaving the terminal.

---

## 9. Quick reference: where each concept appears

| Concept | Where to look |
|---|---|
| Namespace | [00-namespace.yaml](k8s/00-namespace.yaml) |
| Deployment, replicas, pod template | [10-mysql.yaml](k8s/10-mysql.yaml), [20-api.yaml](k8s/20-api.yaml), [30-nginx.yaml](k8s/30-nginx.yaml) |
| `Recreate` vs rolling update | [10-mysql.yaml](k8s/10-mysql.yaml) |
| Secrets as environment variables | [10-mysql.yaml](k8s/10-mysql.yaml), [20-api.yaml](k8s/20-api.yaml), [50-mysql-backup.yaml](k8s/50-mysql-backup.yaml) |
| ConfigMap mounted as files | [10-mysql.yaml](k8s/10-mysql.yaml) |
| Persistent storage (PVC) | [10-mysql.yaml](k8s/10-mysql.yaml), [50-mysql-backup.yaml](k8s/50-mysql-backup.yaml) |
| Readiness and liveness probes | [10-mysql.yaml](k8s/10-mysql.yaml) (exec), [20-api.yaml](k8s/20-api.yaml) (HTTP, both kinds) |
| Resource requests and limits | every Deployment and the CronJob |
| Non-root security context | [20-api.yaml](k8s/20-api.yaml) |
| ClusterIP Service (internal) | [10-mysql.yaml](k8s/10-mysql.yaml), [20-api.yaml](k8s/20-api.yaml) |
| LoadBalancer Service (external) | [30-nginx.yaml](k8s/30-nginx.yaml) |
| NetworkPolicy (default deny + allow) | [40-networkpolicy.yaml](k8s/40-networkpolicy.yaml), [50-mysql-backup.yaml](k8s/50-mysql-backup.yaml) |
| CronJob / Job | [50-mysql-backup.yaml](k8s/50-mysql-backup.yaml) |
