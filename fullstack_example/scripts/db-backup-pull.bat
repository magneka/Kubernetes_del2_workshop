@echo off
rem Copy the newest MySQL backup from the cluster (PVC mysql-backup-pvc) to a local folder.
rem Usage: db-backup-pull.bat          copy the newest backup to the local folder
rem        db-backup-pull.bat --list   list backups in the cluster and in the local folder
rem Optional: BACKUP_DIR (default backups), KUBE_CONTEXT.
setlocal enableextensions
cd /d "%~dp0\.."
if "%KUBE_CONTEXT%"=="" for /f "delims=" %%i in ('kubectl config current-context') do set KUBE_CONTEXT=%%i
if "%BACKUP_DIR%"=="" set BACKUP_DIR=backups
set POD=backup-pull-%RANDOM%
set K=kubectl --context %KUBE_CONTEXT% -n app
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo Context: %KUBE_CONTEXT%

rem Short-lived pod that only mounts the backup volume read-only so we can read from it.
(
echo apiVersion: v1
echo kind: Pod
echo metadata:
echo   name: %POD%
echo spec:
echo   restartPolicy: Never
echo   containers:
echo     - name: pull
echo       image: busybox:1.36
echo       command: ["sleep", "300"]
echo       volumeMounts:
echo         - name: backup
echo           mountPath: /backup
echo           readOnly: true
echo   volumes:
echo     - name: backup
echo       persistentVolumeClaim:
echo         claimName: mysql-backup-pvc
echo         readOnly: true
) | %K% apply -f - >nul
if errorlevel 1 exit /b 1
%K% wait --for=condition=Ready pod/%POD% --timeout=120s >nul
if errorlevel 1 goto :fail

if /i "%~1"=="--list" (
  echo In cluster ^(mysql-backup-pvc, times are UTC^):
  %K% exec %POD% -- sh -c "ls -lh /backup/db-*.sql.gz 2>/dev/null || echo '  (none)'"
  echo Local ^(%BACKUP_DIR%\^):
  dir /b "%BACKUP_DIR%\db-*.sql.gz" 2>nul || echo   ^(none^)
  goto :cleanup
)

set LATEST=
for /f "delims=" %%i in ('%K% exec %POD% -- sh -c "ls -1t /backup/db-*.sql.gz 2>/dev/null | head -n 1"') do set LATEST=%%i
if "%LATEST%"=="" (
  echo error: no backups found on mysql-backup-pvc 1>&2
  goto :fail
)
for %%f in ("%LATEST%") do set NAME=%%~nxf

if exist "%BACKUP_DIR%\%NAME%" (
  echo Already up to date: %BACKUP_DIR%\%NAME%
  goto :cleanup
)

rem kubectl cp is used because cmd redirection would corrupt binary output.
%K% cp %POD%:%LATEST% "%BACKUP_DIR%\%NAME%.part" >nul
if errorlevel 1 goto :fail
move /y "%BACKUP_DIR%\%NAME%.part" "%BACKUP_DIR%\%NAME%" >nul
echo Saved %BACKUP_DIR%\%NAME%
goto :cleanup

:fail
%K% delete pod %POD% --ignore-not-found --wait=false >nul 2>&1
exit /b 1

:cleanup
%K% delete pod %POD% --ignore-not-found --wait=false >nul 2>&1
endlocal
