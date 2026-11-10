<#
=============================================================================
 remove.ps1 - Remove Euro-Office + Nextcloud from the cluster, INCLUDING DATA
=============================================================================
 Deletes the whole "eurostack" namespace. Kubernetes then deletes everything
 inside it: Pods, Services, Secrets, the Ingress and all PersistentVolume
 Claims. All uploaded files and the database are lost.

 The ingress-nginx controller is NOT removed, because other projects may
 use it.

 Usage:
   .\remove.ps1          # asks for confirmation
   .\remove.ps1 -Force   # no question, for scripts
=============================================================================
#>
param(
    [switch]$Force
)
$ErrorActionPreference = 'Stop'

$Namespace = 'eurostack'

kubectl get namespace $Namespace *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Namespace '$Namespace' does not exist. Nothing to remove."
    exit 0
}

Write-Host ">>> Using cluster context: $(kubectl config current-context)"

if (-not $Force) {
    Write-Host "This deletes namespace '$Namespace' and ALL its data (files and database)."
    $answer = Read-Host "Type 'yes' to continue"
    if ($answer -ne 'yes') {
        Write-Host 'Aborted.'
        exit 1
    }
}

Write-Host ">>> Deleting namespace '$Namespace' (this can take a minute)..."
kubectl delete namespace $Namespace --wait=true
if ($LASTEXITCODE -ne 0) { throw 'kubectl delete namespace failed.' }

Write-Host '>>> Removed.'
