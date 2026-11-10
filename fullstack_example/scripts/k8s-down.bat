@echo off
rem Remove the app from the current kubectl context (or KUBE_CONTEXT).
rem Deleting the namespace also deletes the MySQL PVC, and with it the persistent data.
setlocal enableextensions
cd /d "%~dp0\.."
if exist .k8s-port-forward.pid (
  for /f %%p in (.k8s-port-forward.pid) do taskkill /PID %%p /T /F >nul 2>&1
  del .k8s-port-forward.pid
  del .k8s-port-forward.log .k8s-port-forward.err.log 2>nul
  echo Stopped port-forward
)
if "%KUBE_CONTEXT%"=="" for /f "delims=" %%i in ('kubectl config current-context') do set KUBE_CONTEXT=%%i
echo Context: %KUBE_CONTEXT%
kubectl --context %KUBE_CONTEXT% delete namespace app --ignore-not-found --wait=false

rem Without a LoadBalancer controller nobody removes the cleanup finalizer, which would block deletion forever.
set LBADDR=
for /f "delims=" %%i in ('kubectl --context %KUBE_CONTEXT% -n app get svc nginx -o "jsonpath={.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}" 2^>nul') do set LBADDR=%%i
if "%LBADDR%"=="" kubectl --context %KUBE_CONTEXT% -n app patch svc nginx --type=merge -p "{\"metadata\":{\"finalizers\":null}}" >nul 2>&1

kubectl --context %KUBE_CONTEXT% wait --for=delete namespace/app --timeout=180s
if errorlevel 1 (
  echo Namespace app is still terminating. Check: kubectl --context %KUBE_CONTEXT% get ns app -o yaml
  exit /b 1
)
endlocal
