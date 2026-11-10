@echo off
rem Deletes all workloads (and so all their containers) in every non-system namespace
rem of the current kubectl context (or KUBE_CONTEXT). Services, PVCs, secrets and namespaces are kept.
rem System namespaces are skipped so the cluster itself keeps running.
setlocal enableextensions enabledelayedexpansion

where kubectl >nul 2>&1 || (echo error: kubectl not found in PATH & exit /b 1)
if "%KUBE_CONTEXT%"=="" for /f "delims=" %%i in ('kubectl config current-context') do set KUBE_CONTEXT=%%i
if "%KUBE_CONTEXT%"=="" (echo error: no kubectl context set & exit /b 1)

set SYSTEM_NS=kube-system kube-public kube-node-lease local-path-storage

echo This deletes ALL deployments, statefulsets, daemonsets, replicasets, jobs, cronjobs and pods
echo in every namespace except: %SYSTEM_NS%
echo Context: %KUBE_CONTEXT%
set /p CONFIRM=Type the context name to confirm: 
if not "!CONFIRM!"=="%KUBE_CONTEXT%" (
  echo Aborted.
  exit /b 1
)

for /f "delims=" %%n in ('kubectl --context %KUBE_CONTEXT% get ns -o custom-columns^=NAME:.metadata.name --no-headers') do (
  set SKIP=
  for %%s in (%SYSTEM_NS%) do if "%%n"=="%%s" set SKIP=1
  if not defined SKIP (
    echo --- %%n
    kubectl --context %KUBE_CONTEXT% -n %%n delete deployments,statefulsets,daemonsets,replicasets,jobs,cronjobs,pods --all --wait=false
  )
)

echo Done.
endlocal
