# Kubernetes del 2: solutions

This folder has three solutions. Each one can run with Docker (Compose) and on Kubernetes.
Every solution uses its own host ports, so you can run all of them at the same time.

| Solution | Docs |
|---|---|
| eurostack_office | [eurostack_office/README.md](eurostack_office/README.md) |
| fullstack_example | [fullstack_example/README.md](fullstack_example/README.md) |
| mini_jira | [mini_jira/ucjira/README.md](mini_jira/ucjira/README.md) |

## URLs and ports

### Docker (Compose)

| Solution | What | URL / address |
|---|---|---|
| eurostack_office | Nextcloud | <http://localhost:8080> |
| eurostack_office | Euro-Office (health check) | <http://localhost:8081/healthcheck> |
| fullstack_example | Web app (Vite) | <http://localhost:5173> |
| fullstack_example | API | <http://localhost:8082/api/health> |
| fullstack_example | MySQL | `localhost:3307` |
| mini_jira | UCJira | <http://localhost:9030> |
| mini_jira | MySQL | `localhost:3306` |

### Kubernetes (Docker Desktop)

| Solution | What | URL | How it is exposed |
|---|---|---|---|
| eurostack_office | Nextcloud | <http://cloud.localhost> | ingress-nginx on port 80 |
| eurostack_office | Euro-Office (health check) | <http://office.localhost/healthcheck> | ingress-nginx on port 80 |
| fullstack_example | Web app | <http://localhost:8083> | LoadBalancer Service (or port-forward fallback) |
| mini_jira | UCJira | <http://localhost:9029> | `kubectl port-forward` from `start.sh` |

Databases are only reachable inside the cluster in Kubernetes mode.

### Port overview

| Host port | Used by |
|---|---|
| 80 | eurostack_office, Kubernetes (ingress-nginx controller) |
| 3306 | mini_jira, Docker MySQL |
| 3307 | fullstack_example, Docker MySQL |
| 5173 | fullstack_example, Docker Vite dev server |
| 8080 | eurostack_office, Docker Nextcloud |
| 8081 | eurostack_office, Docker Euro-Office |
| 8082 | fullstack_example, Docker API |
| 8083 | fullstack_example, Kubernetes nginx |
| 9029 | mini_jira, Kubernetes port-forward |
| 9030 | mini_jira, Docker app |

If you have MySQL installed locally, it will also want port 3306, so stop it before starting mini_jira with Docker.
