# MiniJira – a Kotlin app for demonstrating Kubernetes

A small issue tracker ("mini Jira") written in Kotlin with Spring Boot, backed by MySQL, and deployed to Kubernetes.

**Features:**
- **Basics:** login and registration, projects, and issues (story / task / bug, priority, assignee, story points).
- **Board:** a kanban board (To Do → In Progress → In Review → Done) with drag and drop. It shows the active sprint.
- **Sprint planning:** a backlog page where you drag issues into sprints, and can start and complete sprints.
- **Git integration:** commits that mention an issue key are linked to the issue (GitHub/GitLab webhook or a local git hook).
- **Also:** comments and a "My issues" page.

**Stack:** Kotlin 2.1, Spring Boot 3.5 (Web, Security, Data JPA, Thymeleaf, Actuator), Spring Session JDBC, Flyway and MySQL 8.4.

## Project layout

```
k8s/                      Kubernetes manifests (applied with kustomize: kubectl apply -k k8s/)
  00-namespace.yaml       namespace "minijira"
  10-secrets.yaml         DB credentials, admin password, git webhook secret (Secret)
  20-mysql.yaml           MySQL StatefulSet + PersistentVolumeClaim + headless Service
  30-app-config.yaml      app settings (ConfigMap)
  40-app.yaml             app Deployment (2 replicas, probes, init container) + Service
ucjira/                   the Kotlin application
  Dockerfile              two-stage build: Gradle/JDK builds the jar -> slim JRE image runs it
  docker-compose.yml      run app + MySQL locally without Kubernetes
  git-hooks/post-commit   sends local commits to the webhook (see "Git integration")
  src/main/kotlin/...     domain (entities, repositories, services), security, web controllers
  src/main/resources/
    db/migration/         Flyway SQL migrations (schema, session tables, sprints + commits)
    templates/            Thymeleaf HTML pages
    static/js/dnd.js      drag and drop for the board and the backlog
```

Commands below are run from the repository root unless stated otherwise.

## Quick start with scripts

The repository root has PowerShell and bash scripts that do the steps below for you:

| PowerShell | Bash | What it does |
|---|---|---|
| `./start.ps1` | `./start.sh` | Build the image, deploy, wait for the pods, port-forward to <http://localhost:9029> |
| `./stop.ps1` | `./stop.sh` | Scale app and MySQL to 0 pods (data is kept) |
| `./remove.ps1` | `./remove.sh` | Delete the namespace **including all data** (asks first) |

Options:
- `start`: `-NoBuild` / `--no-build` skips the image build, and `-NoPortForward` / `--no-port-forward` skips the port-forward.
- `remove`: `-Force` / `--yes` skips the confirmation, and `-RemoveImage` / `--remove-image` also deletes the Docker image.

## Run on Kubernetes (Docker Desktop)

Prerequisites: Docker Desktop with Kubernetes enabled. No local Java is needed because the build runs inside Docker.

```powershell
# 1. Build the image (stage 1 compiles with Gradle, stage 2 is the runtime image)
docker build -t minijira:1.0.0 ucjira

# 2. Deploy everything
kubectl apply -k k8s/

# 3. Watch it start: mysql-0 first, then the app pods (their init container waits for MySQL)
kubectl -n minijira get pods -w

# 4. Open the app
kubectl -n minijira port-forward svc/minijira 9029:9029
```

Then browse to <http://localhost:9029> and log in as `admin` / `admin` (or `alice` / `alice`, `bob` / `bob`). The demo data is created automatically on first start.

To remove everything, including the database volume, run `kubectl delete namespace minijira`.

## Run locally without Kubernetes

```powershell
docker compose -f ucjira/docker-compose.yml up --build
```

The app is then on <http://localhost:9030>. The Compose setup uses host port 9030, so it doesn't collide with the Kubernetes port-forward on 9029. MySQL is on `localhost:3306`.

If you use the git hook with the Compose setup, point it at port 9030: `git -C <your-repo> config ucjira.url http://localhost:9030/api/git/webhook`.

## Ports and URLs

| Setup | What | URL |
|---|---|---|
| Kubernetes (`./start.sh`) | UCJira | <http://localhost:9029> (via `kubectl port-forward`) |
| Kubernetes | Git webhook | <http://localhost:9029/api/git/webhook> |
| Docker Compose | UCJira | <http://localhost:9030> |
| Docker Compose | Git webhook | <http://localhost:9030/api/git/webhook> |
| Docker Compose | MySQL | `localhost:3306` (user `minijira` / `minijira`) |

In Kubernetes, MySQL is only reachable inside the cluster (`mysql:3306`).

## Sprint planning

Open a project and switch to the **Backlog & sprints** tab.

1. **Create a sprint** with a name, goal and dates. If you leave the name empty, it is called `<KEY> Sprint <n>`.
2. **Plan it:** drag issues from the backlog into the sprint, or use the dropdown on each row. Each sprint shows its issue count and story-point total.
3. **Start the sprint.** Only one sprint per project can be active. The **Board** now shows only the active sprint, with its goal and the days left.
4. **Complete the sprint.** Unfinished issues move to the backlog or to a planned sprint you choose. Done issues stay with the completed sprint.

## Git integration

Commits are linked to issues when the commit message mentions the issue key. For example, `DEMO-4: store sessions in MySQL` links the commit to DEMO-4. If the key follows **`Fixes`**, **`Closes`** or **`Resolves`** (as in `Fixes DEMO-4`), the issue also moves to **Done**. Linked commits are listed on the issue page, where you can also link a commit by hand.

Commits reach UCJira through the webhook `POST /api/git/webhook`, authenticated with the shared secret `GIT_WEBHOOK_SECRET` (in `k8s/10-secrets.yaml`).

**Local repository (works with the local cluster).** Install the git hook in any repository:

```bash
cp ucjira/git-hooks/post-commit <your-repo>/.git/hooks/post-commit
# optional, defaults shown:
git -C <your-repo> config ucjira.url    http://localhost:9029/api/git/webhook
git -C <your-repo> config ucjira.secret change-me-webhook-secret
```

Keep the port-forward running (`./start.ps1`). Every commit is then sent to UCJira and you see the result, for example `UCJira: {"linked":["DEMO-4@1365e5a"],"closed":["DEMO-4"]}`. If `origin` is on GitHub or GitLab, the commit gets a link to it.

**GitHub / GitLab.** These need a public URL for the app, for example via an Ingress or a tunnel such as `ngrok http 9029`:
- **GitHub:** go to *Settings → Webhooks → Add webhook*. Set the payload URL to `https://<host>/api/git/webhook`, the content type to `application/json`, the secret to the value of `GIT_WEBHOOK_SECRET`, and choose *Just the push event*.
- **GitLab:** go to *Settings → Webhooks*. Set the URL to `https://<host>/api/git/webhook`, the secret token to the value of `GIT_WEBHOOK_SECRET`, and trigger on *Push events*.

## Demo scenarios

The footer of every page shows **which pod served the request**.

| Concept | Try this |
|---|---|
| **Pods & logs** | `kubectl -n minijira get pods -o wide` · `kubectl -n minijira logs -f deploy/minijira` |
| **Self-healing** | `kubectl -n minijira delete pod <app-pod>`: the Deployment immediately creates a replacement. |
| **Scaling** | `kubectl -n minijira scale deploy/minijira --replicas=4`, then `get pods`. |
| **Stateless app / shared sessions** | Log in, then delete the pod that served you. You stay logged in because HTTP sessions are stored in MySQL (Spring Session JDBC), so any pod can serve any user. |
| **Persistent storage** | `kubectl -n minijira delete pod mysql-0`. The StatefulSet recreates it and re-attaches the same PersistentVolumeClaim, so no data is lost. Compare with `kubectl delete namespace minijira`, which also deletes the volume. |
| **Configuration** | Change `APP_VERSION` in `k8s/30-app-config.yaml`, then run `kubectl apply -k k8s/` and `kubectl -n minijira rollout restart deploy/minijira`. The footer shows the new version. |
| **Secrets** | `kubectl -n minijira get secret mysql-credentials -o yaml`. Values are only base64 encoded, not encrypted. |
| **Rolling update (zero downtime)** | Make a visible change (e.g. a colour in `app.css`), run `docker build -t minijira:1.1.0 ucjira`, then `kubectl -n minijira set image deploy/minijira app=minijira:1.1.0` and `kubectl -n minijira rollout status deploy/minijira`. |
| **Rollback** | `kubectl -n minijira rollout undo deploy/minijira` · `kubectl -n minijira rollout history deploy/minijira` |
| **Health probes** | `kubectl -n minijira describe pod <app-pod>` shows the startup, liveness and readiness probes, which hit `/actuator/health/{liveness,readiness}`. Readiness also checks the DB connection: delete `mysql-0` and watch the app pods turn `0/1` until MySQL is back. |
| **Init containers** | Delete MySQL and an app pod together. The new app pod stays in `Init:0/1` until MySQL answers. |
| **Service discovery** | The app connects to the hostname `mysql`, which is the Service name resolved by cluster DNS. |
| **Load balancing** | `kubectl -n minijira run curl --rm -it --image=curlimages/curl -- sh`, then `for i in 1 2 3 4 5 6; do curl -s minijira:9029/login \| grep -o 'minijira-[a-z0-9-]*'; done`. `port-forward` always goes to a single pod, so test load balancing from inside the cluster. |

## Design notes

- **Image tags:** the Docker Desktop Kubernetes node caches images by tag, so rebuilding `minijira:1.0.0` and re-applying does **not** update the pods. The start scripts therefore deploy a content-based tag (`minijira:build-<id>`). When deploying by hand, always use a new tag for a new build (see *Rolling update* above).
- **Database schema** is owned by Flyway (`src/main/resources/db/migration`); Hibernate does not create tables. All replicas run the migration at start-up, and Flyway's lock ensures it is applied only once.
- **Issue numbers** (`DEMO-1`, `DEMO-2`, …) are allocated with a row lock on the project, so two pods creating issues at the same time never produce duplicates. Starting a sprint takes the same lock, so two pods can never both start a sprint for one project.
- **Webhook security:** GitHub requests are verified with the HMAC-SHA256 signature (`X-Hub-Signature-256`), and GitLab requests with `X-Gitlab-Token`. The endpoint is excluded from CSRF protection and login, and it is disabled when no secret is set. Re-delivered commits are ignored, and only `http(s)` commit URLs are rendered as links.
- **Graceful shutdown** is enabled (`server.shutdown: graceful`), so in-flight requests finish when Kubernetes stops a pod.
- **JVM memory** is sized from the container limit (`-XX:MaxRAMPercentage=75`).
- Secrets are committed to git **only because this is a demo**.
