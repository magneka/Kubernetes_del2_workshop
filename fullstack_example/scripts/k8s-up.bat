@echo off
rem Deploy to the current kubectl context (or KUBE_CONTEXT): build multi-arch images, push, apply.
rem Usage: scripts\k8s-up.bat   (after `docker login`; pushes to Docker Hub user "magneka" by default)
rem Optional: REGISTRY (default docker.io/magneka), TAG, PLATFORMS (default linux/amd64,linux/arm64), KUBE_CONTEXT.
rem Without a LoadBalancer address, a background port-forward to nginx is started on LOCAL_PORT (default 8083).
setlocal enableextensions
cd /d "%~dp0\.."

if "%REGISTRY%"=="" set REGISTRY=docker.io/magneka
where kubectl >nul 2>&1 || (echo error: kubectl not found in PATH & exit /b 1)
where docker >nul 2>&1 || (echo error: docker not found in PATH & exit /b 1)
if not exist .env (
  echo error: .env not found in repo root
  exit /b 1
)

if "%TAG%"=="" for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddHHmmss"') do set TAG=%%i
if "%KUBE_CONTEXT%"=="" for /f "delims=" %%i in ('kubectl config current-context') do set KUBE_CONTEXT=%%i
if "%PLATFORMS%"=="" set PLATFORMS=linux/amd64,linux/arm64
set BUILDER=k8sexp-builder
set API_IMAGE=%REGISTRY%/k8sexp-api:%TAG%
set NGINX_IMAGE=%REGISTRY%/k8sexp-nginx:%TAG%
echo Context: %KUBE_CONTEXT% ^| images: %API_IMAGE%, %NGINX_IMAGE% (%PLATFORMS%)

docker buildx inspect %BUILDER% >nul 2>&1 || docker buildx create --name %BUILDER% --driver docker-container
docker buildx build --builder %BUILDER% --platform %PLATFORMS% -t %API_IMAGE% --push api
if errorlevel 1 (
  docker buildx rm %BUILDER% >nul 2>&1
  exit /b 1
)
docker buildx build --builder %BUILDER% --platform %PLATFORMS% -t %NGINX_IMAGE% -f nginx\Dockerfile --push .
set BUILD_RC=%errorlevel%
rem The images are in the registry now; remove the builder container (and its cache).
docker buildx rm %BUILDER% >nul 2>&1
if not "%BUILD_RC%"=="0" exit /b 1

kubectl --context %KUBE_CONTEXT% apply -f k8s\00-namespace.yaml
if errorlevel 1 exit /b 1
kubectl --context %KUBE_CONTEXT% create secret generic app-secrets --namespace=app --from-env-file=.env --dry-run=client -o yaml | kubectl --context %KUBE_CONTEXT% apply -f -
kubectl --context %KUBE_CONTEXT% create configmap db-init --namespace=app --from-file=db\init --dry-run=client -o yaml | kubectl --context %KUBE_CONTEXT% apply -f -

powershell -NoProfile -Command "Get-ChildItem k8s\[0-9]*.yaml | Sort-Object Name | ForEach-Object { Get-Content $_.FullName; '---' } | ForEach-Object { $_ -replace '^(.*image: )k8sexp-api$', ('${1}' + $env:API_IMAGE) -replace '^(.*image: )k8sexp-nginx$', ('${1}' + $env:NGINX_IMAGE) }" | kubectl --context %KUBE_CONTEXT% apply -f -
if errorlevel 1 exit /b 1

kubectl --context %KUBE_CONTEXT% -n app rollout status deployment/mysql --timeout=300s
if errorlevel 1 exit /b 1
kubectl --context %KUBE_CONTEXT% -n app rollout status deployment/api --timeout=300s
if errorlevel 1 exit /b 1
kubectl --context %KUBE_CONTEXT% -n app rollout status deployment/nginx --timeout=300s
if errorlevel 1 exit /b 1

echo Waiting for external address of service/nginx ...
set /a TRIES=0
:waitlb
set ADDR=
for /f "delims=" %%i in ('kubectl --context %KUBE_CONTEXT% -n app get svc nginx -o "jsonpath={.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}"') do set ADDR=%%i
if not "%ADDR%"=="" (
  echo App ready at http://%ADDR%:8083
  exit /b 0
)
set /a TRIES+=1
if %TRIES% GEQ 12 goto portforward
timeout /t 5 /nobreak >nul
goto waitlb

:portforward
rem No LoadBalancer provider: fall back to a background port-forward (stopped by k8s-down).
if "%LOCAL_PORT%"=="" set LOCAL_PORT=8083
echo No external address (cluster may lack a LoadBalancer provider). Starting port-forward on localhost:%LOCAL_PORT% ...
if exist .k8s-port-forward.pid (
  for /f %%p in (.k8s-port-forward.pid) do taskkill /PID %%p /T /F >nul 2>&1
  del .k8s-port-forward.pid
)
powershell -NoProfile -Command "$p = Start-Process kubectl -ArgumentList '--context',$env:KUBE_CONTEXT,'-n','app','port-forward','svc/nginx',($env:LOCAL_PORT + ':8083') -WindowStyle Hidden -PassThru -RedirectStandardOutput .k8s-port-forward.log -RedirectStandardError .k8s-port-forward.err.log; $p.Id | Set-Content .k8s-port-forward.pid"
timeout /t 3 /nobreak >nul
set PFPID=
for /f %%p in (.k8s-port-forward.pid) do set PFPID=%%p
tasklist /FI "PID eq %PFPID%" 2>nul | find "%PFPID%" >nul
if errorlevel 1 (
  del .k8s-port-forward.pid
  echo error: port-forward failed ^(port %LOCAL_PORT% in use?^). See .k8s-port-forward.err.log. Retry with set LOCAL_PORT=^<port^>.
  exit /b 1
)
echo App ready at http://localhost:%LOCAL_PORT%  (port-forward pid %PFPID%; stopped by k8s-down)
exit /b 0
