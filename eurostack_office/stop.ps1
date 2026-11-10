<#
=============================================================================
 stop.ps1 - Stop Euro-Office + Nextcloud but KEEP all data
=============================================================================
 Scales every workload down to 0 replicas. The Pods are removed, but the
 namespace, Secrets, Services and, most importantly, the PersistentVolume
 Claims (your files and database) stay. Run .\start.ps1 to bring it back.

 Usage:
   .\stop.ps1
=============================================================================
#>
$ErrorActionPreference = 'Stop'

$Namespace = 'eurostack'

function Invoke-Kubectl {
    & kubectl @args
    if ($LASTEXITCODE -ne 0) { throw "kubectl $($args -join ' ') failed." }
}

kubectl get namespace $Namespace *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Namespace '$Namespace' does not exist. Nothing to stop."
    exit 0
}

Write-Host ">>> Using cluster context: $(kubectl config current-context)"

# Stop the apps first, then the database they depend on.
Write-Host '>>> Scaling Nextcloud and Euro-Office to 0'
Invoke-Kubectl scale -n $Namespace deployment/nextcloud deployment/euro-office --replicas=0

Write-Host '>>> Scaling PostgreSQL to 0'
Invoke-Kubectl scale -n $Namespace statefulset/postgres --replicas=0

Write-Host '>>> Waiting for the Pods to shut down...'
kubectl wait -n $Namespace --for=delete pod --all --timeout=180s
# A timeout here is not fatal: the Pods are already on their way out.

Write-Host ''
Write-Host '>>> Stopped. Data is kept on these volumes:'
Invoke-Kubectl get pvc -n $Namespace
