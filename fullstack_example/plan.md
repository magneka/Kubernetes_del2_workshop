# Implementation Plan

Based on [overview.md](overview.md).

## Status

All steps are implemented and verified (debug compose end to end; Kubernetes manifests rendered and partly tested on Docker Desktop). The cloud deployment instructions (OVHcloud, Azure, AWS) in the README are written but not yet tested against real clusters.

Changes made after the original plan:
- Go source moved to `api/src/`; Dockerfiles stay in `api/`.
- Debug API container is interactive with no start command; Delve runs inside it from VS Code (no host port 2345).
- Each container has its own `.vscode` (launch/tasks); `.devcontainer/` installs extensions in the containers.
- MySQL host port is 3307 (3306 is used by mini_jira). API host port is 8082 (8080 is used by eurostack_office).
- Init SQL starts with `SET NAMES utf8mb4;` so Norwegian characters are not double-encoded.
- Kubernetes is generic (any cluster via `REGISTRY`, default Docker Hub `magneka`); the kind variant was dropped.
- Added `k8s-kill-all` to delete all workloads in non-system namespaces.
- Added scheduled MySQL backups: `k8s/50-mysql-backup.yaml` (separate PVC, CronJob every 10 min, keeps 3, extra NetworkPolicy) and `scripts/db-backup-pull.sh/.bat`.
- `k8s-up` falls back to a background `kubectl port-forward` (LOCAL_PORT, default 8083) when no LoadBalancer address appears; `k8s-down` stops it.
- `k8s-up` removes its temporary buildx builder on exit.
- README section "Deploy to the cloud" with instructions for OVHcloud, Azure (AKS + ACR) and AWS (EKS + ECR).

## Target folder structure

```
.env / .env.example / .gitignore / .dockerignore
db/init/01_schema.sql, 02_seed.sql
api/                      Go REST API (Dockerfiles here, code in src/)
  Dockerfile              (prod, multi-stage)
  Dockerfile.debug        (Delve + gopls, no CMD)
  src/                    go.mod, main.go, models.go, db.go, handlers.go, .vscode/ (in-container config)
web/                      React + Redux (Vite, TypeScript)
  package.json, vite.config.ts, index.html, src/..., .vscode/ (in-container config)
  Dockerfile.dev          (Vite dev server)
nginx/
  nginx.conf              (serves React build, proxies /api)
  Dockerfile              (builds web/ and copies dist into nginx)
docker-compose.debug.yml
.devcontainer/api/, .devcontainer/web/   (devcontainer.json per service)
scripts/
  debug-up.sh / debug-down.sh / debug-up.bat / debug-down.bat
  k8s-up.sh   / k8s-down.sh   / k8s-up.bat   / k8s-down.bat      (current kubectl context; REGISTRY defaults to docker.io/magneka)
  k8s-kill-all.sh / k8s-kill-all.bat                            (delete workloads in all non-system namespaces)
  db-backup-pull.sh / db-backup-pull.bat                        (list / fetch MySQL backups from the cluster to ./backups/)
.vscode/launch.json, tasks.json   (host side: React Chrome debug, compose up/down)
k8s/                      generic manifests (default StorageClass PVC, nginx LoadBalancer)
  00-namespace.yaml, 10-mysql.yaml, 20-api.yaml, 30-nginx.yaml, 40-networkpolicy.yaml, 50-mysql-backup.yaml
```

## Shared contract (all steps must follow)

**No compilation on the host.** Never run `go`, `npm`, `node` or `npx` on the host. Every build, dependency install (`go mod tidy`, `npm install`), hash generation and type-check runs inside a container, either via `docker run --rm -v ...` with `golang:1.23-alpine` / `node:22-alpine` or via the Dockerfiles.

**Env (`.env`, secret, git-ignored; `.env.example` committed)**
`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=appdb`, `MYSQL_USER=app`, `MYSQL_PASSWORD`, `DB_HOST=mysql`, `DB_PORT=3306`, `API_PORT=8080`

**Ports**
| Service | Port |
|---|---|
| MySQL | 3306 in network, host 3307 (debug compose) |
| Go API | 8080 in container, host 8082 (debug compose) |
| Delve | inside the api container (no host port) |
| Vite dev | 5173 |
| Nginx (k8s) | LoadBalancer port 8083 -> nginx 80 |

**Database tables** (InnoDB, utf8mb4)
- `users`: id, username (unique), email (unique), password_hash (bcrypt), role, created_at
- `customers`: id, name, email, phone, address, created_at
- `clients`: id, name, company, contact_person, email, phone, created_at
- `orders`: id, customer_id (FK customers), client_id (FK clients, nullable), order_date, status (`pending|processing|shipped|cancelled`), total_amount DECIMAL(10,2), description, created_at

**REST API** (JSON, prefix `/api`)
- `GET /api/health`
- For each of `users`, `customers`, `clients`, `orders`:
  `GET /api/{t}`, `GET /api/{t}/{id}`, `POST /api/{t}`, `PUT /api/{t}/{id}`, `DELETE /api/{t}/{id}`
- `users` accepts `password` on POST/PUT, hashes with bcrypt, never returns `password_hash`.
- Errors: `{"error": "..."}` with correct status codes. Parameterized queries only.

## Steps

| # | Step | Model | Why this model |
|---|---|---|---|
| 1 | DB schema, seed, env files | Claude Haiku 5.5 | Simple, declarative |
| 2 | Go REST API | Claude Sonnet 5.5 | Moderate code, must compile |
| 3 | React + Redux app with design system | Claude Opus 5.5 (main) | Largest/most complex step |
| 4 | Debug compose, debug Dockerfiles, scripts, VS Code configs | Claude Sonnet 5 | Config work, some gotchas |
| 5 | Nginx, prod Dockerfiles, Kubernetes manifests, deploy scripts | Claude Sonnet 5 | Config work, some gotchas |
| 6 | Build and runtime verification | Claude Haiku 5.5 (execution subagent) | Run commands, report output |
| 7 | Fix issues found in step 6 | Claude Opus 5.5 (main) | Diagnosis |

Steps 1–5 write to separate folders and depend only on the shared contract, so they can run in parallel. Step 6 runs only when the user explicitly asks for it.

### Step 1: Database (Haiku 5.5)
- `db/init/01_schema.sql`: create the 4 tables with FKs and indexes. Both init files start with `SET NAMES utf8mb4;`.
- `db/init/02_seed.sql`: about 5 rows per table. Generate the bcrypt hashes for user passwords inside a container (e.g. `docker run --rm httpd:alpine htpasswd -nbBC 10 x <pw>`), and document the plaintext dev passwords in `.env.example` comments.
- `.env`, `.env.example`, `.gitignore` (ignore `.env`, `node_modules`, `dist`, `*.log`, `.k8s-port-forward.pid`, `backups/`, `.DS_Store`, `__debug_bin*`), `.dockerignore`.

### Step 2: Go API (Sonnet 5.5)
- Go 1.22+ `net/http` with method/path patterns, plus `go-sql-driver/mysql` and `x/crypto/bcrypt`.
- Keep the file count low:
  - `main.go`: config from env, DB connect with retry, routes, CORS, server
  - `models.go`: structs
  - `db.go`: all SQL queries
  - `handlers.go`: JSON encode/decode and HTTP handlers
- Generate `go.sum` and verify with `go mod tidy && go build ./... && go vet ./...` inside `golang:1.23-alpine` via `docker run`.

### Step 3: React app (Opus 5.5) — design system first
- Vite + React + TypeScript, Redux Toolkit (`createSlice` + `createAsyncThunk`, one slice per table), and react-router-dom.
- 3a. Copy the complete `<style>` block of `design_system/uc-design8.html` verbatim into `src/styles/uc-design.css` (no trimming, no edits). No app-specific CSS classes; small adjustments use inline styles with the design tokens (`var(--…)`). Same Google Fonts and Font Awesome links in `index.html`.
- 3b. Components in `src/components/` reproduce the design file's HTML structure and class names exactly: `Layout` (site-header/bar/logo/hamburger/nav with dropdowns/header-search, site-footer), `Section`/`Container`/`Row`/`Col`, `Jumbotron`, `Panel`, `Tabs`, form controls (`FormGroup`, `Input`, `Select`, `Textarea`, `Choice`, `Switch`), `Button`, `DataTable` (table-toolbar, tbl striped hoverable, sortable headers, pagination), `Badge`, `Alert`, `Modal`, `Spinner`/`PageOverlay`, `StatCard`, `BarChart`, `Donut`.
- 3c. "Designsystem" menu with one page per section of the design file (Grid, Paneler, Farger, Typografi, Faner, Skjema, Knapper, Tabeller, Modaler, Spinner, Dashboard) at `/ds/<section>`, built from the components, for side-by-side comparison with `uc-design8.html`.
- 3d. Data pages built only from those components and the design file's page patterns (jumbotron page header, `section > container`, panels, table toolbar):
  - "Hjem": dashboard with stat cards showing counts per table and a bar chart of orders per status.
  - "Registrer" dropdown with forms for user, customer, client, and order. The order form uses customer/client selects.
  - "Oversikt" dropdown with list pages for the 4 tables, with edit and delete (confirm modal).
- `vite.config.ts`: proxy `/api` to `process.env.VITE_API_PROXY ?? http://localhost:8082`, use `server.host: 0.0.0.0`, enable `watch.usePolling` for Docker bind mounts, and turn on sourcemaps.
- Build check (`npm run build` inside the container) is part of Step 6 and only run when the user asks.

### Step 4: Debug setup (Sonnet 5)
- `docker-compose.debug.yml`:
  - `mysql:8.4`: uses `.env`, mounts `db/init` into `/docker-entrypoint-initdb.d`, has a healthcheck, and uses a named volume.
  - `api`: built from `api/Dockerfile.debug`. Mounts `./api/src:/app`, has no start command and is interactive (`stdin_open`/`tty`); you attach VS Code and run/debug the API inside it. Exposes 8080 (host 8082) and depends on a healthy mysql.
  - `web`: built from `web/Dockerfile.dev`. Mounts `./web:/app` with an anonymous volume for `/app/node_modules`, sets `VITE_API_PROXY=http://api:8080`, and exposes 5173.
- VS Code:
  - In-container `api/src/.vscode/`: "Debug API" (Go launch with Delve inside the container); tasks `api: build`, `api: vet`, `api: run`.
  - In-container `web/.vscode/`: "Debug React (Chrome)"; tasks `web: build`, `web: type-check`.
  - `.devcontainer/api` and `.devcontainer/web` install the needed extensions (Go) in the containers.
  - Host `.vscode/launch.json`: "Debug React (Chrome)" with `webRoot` `${workspaceFolder}/web`.
- `.vscode/tasks.json`: compose up and compose down tasks.
- Scripts:
  - `debug-up.sh` / `.bat`: `docker compose -f docker-compose.debug.yml up -d --build`
  - `debug-down.sh` / `.bat`: `down -v --remove-orphans --rmi local` (removes everything)

### Step 5: Nginx + Kubernetes (Sonnet 5)
- `nginx/nginx.conf`: serves the SPA with a `try_files` fallback to `index.html` and proxies `/api/` to `http://api:8080`.
- `nginx/Dockerfile`: Node build stage for `web/`, then `nginx:alpine`. Build context is the repo root.
- `api/Dockerfile`: multi-stage, cross-compiles for the target platform, static binary on distroless.
- Manifests in namespace `app` (numbered for apply order, no cluster-specific settings):
  - MySQL: a Secret generated from `.env` by the script, a ConfigMap generated from `db/init`, a PVC on the default StorageClass, a Deployment, and a ClusterIP Service.
  - API: a Deployment with readiness/liveness probes on `/api/health` and a ClusterIP Service.
  - Nginx: a Deployment and a LoadBalancer Service. This is the only externally reachable service.
  - NetworkPolicies: default-deny ingress for the namespace, then allow anyone -> nginx:80, nginx -> api:8080, api -> mysql:3306. Blocks other pods in the cluster from reaching the API or MySQL directly.
  - Backups (`50-mysql-backup.yaml`): PVC `mysql-backup-pvc` (1Gi), CronJob every 10 minutes (`mysqldump --all-databases | gzip`, temp name then rename, keep 3 newest), plus a NetworkPolicy allowing the job -> mysql:3306.
- `k8s-up.sh` / `.bat` (current kubectl context or `KUBE_CONTEXT`):
  1. Build multi-arch images with `buildx` (temporary builder, removed on exit) and push them to `REGISTRY` (default `docker.io/magneka`, i.e. Docker Hub).
  2. Run `kubectl create secret ... --from-env-file=.env` and `configmap --from-file=db/init`.
  3. Apply the manifests with the image names substituted.
  4. Wait for rollout and print the LoadBalancer address; if none appears, start a background port-forward on `LOCAL_PORT` (default 8083).
- `db-backup-pull.sh` / `.bat`: `--list` shows backups in the cluster and locally; without arguments, copies the newest backup to `./backups/` via a short-lived busybox pod and checks it with `gzip -t`.
- `k8s-down.sh` / `.bat`: stop the port-forward, delete namespace `app` (removes the PVCs and their data). Times out after 180s and prints how to clear a stuck LoadBalancer finalizer.
- `k8s-kill-all.sh` / `.bat`: after typing the context name to confirm, delete all deployments, statefulsets, daemonsets, replicasets, jobs, cronjobs and pods in every non-system namespace.

### Step 5b: Cloud deployment docs
- README section "Deploy to the cloud" with step-by-step instructions for OVHcloud (Managed Kubernetes), Azure (AKS + ACR) and AWS (EKS + ECR): cluster creation, registry, `REGISTRY`, storage driver (AWS needs the EBS CSI driver), NetworkPolicy enforcement, load balancer address and cleanup. No manifest changes.
- Not yet tested against real clusters.

### Step 6: Verification (Haiku 5.5, execution subagent)
**Only run when the user explicitly asks for it.** Never start it automatically after other steps or changes.
1. `docker run --rm -v $PWD/api/src:/src -w /src golang:1.23-alpine sh -c "go build ./... && go vet ./..."`
2. `docker run --rm -v $PWD/web:/src -w /src node:22-alpine sh -c "npm install && npm run build"` (or `docker build -f nginx/Dockerfile .`)
3. `scripts/debug-up.sh`, start the API inside its container ("Debug API", or `dlv debug` via `docker exec`), then run `curl localhost:8082/api/health`, `curl localhost:8082/api/orders`, `curl localhost:5173/api/customers`, and check Norwegian characters (e.g. `Østlandsposten`). Finish with `scripts/debug-down.sh`.
4. `scripts/k8s-up.sh`, then `curl` the printed address (`/` and `/api/customers`). Check that only the nginx Service is non-ClusterIP, then run `scripts/k8s-down.sh` and confirm the namespace and PVC are gone.
5. Report only failures and their relevant log lines.

### Step 7: Fix and re-verify (Opus 5.5)
Fix the issues from step 6. Re-run step 6 only when the user asks for it.
