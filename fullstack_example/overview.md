# Overview of What i want

I want to create a setup that have the following elements
 - A MySql database
 - A Golang rest api
 - A React application using the rest api
 - A Nginx front serving the react application
 Organize this neatly in folders:
 ```
 db/init/        schema + seed SQL
 api/            Dockerfile, Dockerfile.debug; Go code in api/src/
 web/            React app (Vite), Dockerfile.dev
 nginx/          nginx.conf + Dockerfile (builds web, serves it, proxies /api)
 k8s/            numbered manifests
 scripts/        .sh and .bat start/stop/backup scripts
 .devcontainer/  one devcontainer.json per service (api, web)
 .env / .env.example
 ```

## General
- No compilation on the host: all go/npm builds, installs and hash generation run in containers
- UI text is in Norwegian
- Verification (builds, starting/stopping compose or Kubernetes, curl checks) is only run when I explicitly ask for it
- Simple steps may be implemented with cheaper models

 ## How to debug this
I want a docker compose file for debugging with vscode
 - the Go application
 - the React application
The database must be seeded
I want to attacht to container for debugging applications
There must be configurations available for React and Go
React and Go run in separate containers
The docker compose file must map source folders for React and Go into containers
It should have scripts/bat files for starting and stopping compose
on stop it should remove
- The Go container is interactive (no start command, `stdin_open`/`tty` in compose); attach VS Code to it and run/debug the API with Delve inside the container
- React runs on the Vite dev server (port 5173, proxies /api to the Go container) and is debugged with a Chrome launch config
- Each container has its own .vscode (launch/tasks) and needed extensions (Go) are installed in the container via .devcontainer
- The host-side .vscode has a Chrome launch config for React and compose up/down tasks
- On the host, MySQL is on port 3307 (3306 is used by mini_jira); API 8082 (8080 is used by eurostack_office)
- Stop removes containers, volumes and locally built images

### Database
Should hava a table for users with hash for passwords
Should hava a table for customers
Should hava a table for clients
Should hava a table for orders
Should be inialized in all tables
Should have a env file with secrets
- Passwords are stored as bcrypt hashes
- Seed users: admin / Admin123!, others / User123! (dev only, documented in .env.example)
- .env is git-ignored; .env.example is committed
- Text is UTF-8 (utf8mb4), so Norwegian characters (æøå) are stored correctly
- MySQL 8.4, seeded with about 5 rows per table. Tables:
  - users: id, username (unique), email (unique), password_hash, role (admin/user), created_at
  - customers: id, name, email, phone, address, created_at
  - clients: id, name, company, contact_person, email, phone, created_at
  - orders: id, customer_id (FK customers), client_id (FK clients, optional), order_date, status (pending/processing/shipped/cancelled), total_amount, description, created_at

### Go application
Should have sourcecode in a subfolder
Separate different concerns in separate files (eg, serving json, database queries)
But keep number of files low
Compilation and building should happen inside the container
Vscode should be configured to build an to debug when open a vcode attached to the container.
- Dockerfiles are in api/, source code in api/src/ (main.go, models.go, db.go, handlers.go)
- Go 1.23 standard library HTTP server, MySQL driver, bcrypt
- REST API (JSON) under /api: GET /api/health, and for users, customers, clients, orders: list, get by id, create, update, delete
- Users accept a password on create/update, it is stored as a bcrypt hash and never returned
- Errors are returned as {"error": "..."} with proper status codes; only parameterized SQL

### React application 
Should have forms for forementioned tables
Should use layout as in uc-design8.html design system. Work design-system first:
 1. Copy the design system's CSS verbatim (no trimming, no own variants of its classes)
 2. Break the design system into React components with the same HTML structure and class names (layout/header/footer, jumbotron, grid, panels, tabs, form controls, buttons, tables with filter/sort/paging, badges, alerts, modals, spinner/overlay, dashboard stat cards and charts)
 3. A "Designsystem" menu with one page per section of uc-design8.html (Grid, Paneler, Farger, Typografi, Faner, Skjema, Knapper, Tabeller, Modaler, Spinner, Dashboard), each rendering that section with the components, so it can be compared side by side with uc-design8.html
 4. Then the data pages, built only from those components and the page patterns of the design system (jumbotron header, sections, panels, table toolbar)
Should use redux (Redux Toolkit, one slice per table)
Should have a menu for input and pages listing table contents:
 - Hjem: dashboard with counts per table and orders per status
 - Registrer: forms for new user, customer, client and order (order form picks customer/client from lists)
 - Oversikt: list pages for the four tables, with edit and delete (confirm dialog)
 - Designsystem: the reference pages above
Vite + TypeScript + react-router
Compilation and building should happen inside the container
Vscode should be configured to build an to debug (launch, tasks)

## Kubernetes variant
I want generic Kubernetes files that deploy to any cluster (not tied to my machine)
 - Manifests are numbered for apply order (00-namespace, 10-mysql, 20-api, 30-nginx, 40-networkpolicy, 50-mysql-backup)
 - Images are built for multiple architectures (amd64 + arm64) and pushed to a registry (default Docker Hub `docker.io/magneka`; override with REGISTRY)
 - Scripts k8s-up / k8s-down (.sh and .bat) deploy to the current kubectl context
 - Stop deletes the namespace, which removes the database volume (persistent data)
 - Nginx in front; only Nginx is reachable from outside (LoadBalancer service on port 8083, because port 80 is used by the ingress controller for eurostack_office). Nginx serves the React build and forwards /api to the Go API
 - NetworkPolicies in namespace app only allow anyone -> nginx:80, nginx -> api:8080 and api -> mysql:3306 (needs a CNI that enforces NetworkPolicy, e.g. kindnet on Docker Desktop)
 - The cluster must provide a LoadBalancer, a default StorageClass, and pull access to the images
 - If the cluster has no LoadBalancer address, k8s-up starts a background port-forward to nginx on localhost:8083 (LOCAL_PORT); k8s-down stops it
 - The temporary buildx builder used for multi-arch builds is removed when k8s-up ends
 - Script k8s-kill-all (.sh and .bat) removes all workloads in every non-system namespace (asks for confirmation)

### Backups (Kubernetes)
 - A separate PVC (mysql-backup-pvc) holds the backups, so losing the database volume does not lose them
 - A CronJob runs every 10 minutes: mysqldump --all-databases, gzipped, written to a temp name and renamed only on success, keeping the 3 newest files
 - An extra NetworkPolicy lets the backup job reach mysql:3306
 - Scripts db-backup-pull (.sh and .bat) list backups (--list) and copy the newest one to ./backups/ (git-ignored), verified with gzip -t
 - Manual restore is documented in the README

### Cloud deployment
 - The README documents step by step how to deploy to OVHcloud (Managed Kubernetes), Azure (AKS + ACR) and AWS (EKS + ECR)
 - The manifests stay unchanged; only the cluster, the registry (REGISTRY) and the cloud-specific prerequisites differ (storage driver, NetworkPolicy enforcement, image pull access)

