<#
=============================================================================
 start.ps1 - Deploy (or restart) Euro-Office + Nextcloud on Kubernetes
=============================================================================
 What it does:
   1. Checks that kubectl can reach a cluster.
   2. Warns if no "nginx" Ingress controller is installed.
   3. Applies every manifest in k8s\ (in numbered order).
   4. Scales the workloads to 1 replica. This is needed after stop.ps1:
      "kubectl apply" does NOT undo a manual "kubectl scale".
   5. Waits until everything is running.

 Usage:
   .\start.ps1
=============================================================================
#>
$ErrorActionPreference = 'Stop'

$Namespace = 'eurostack'
$Timeout   = '15m'   # First start can take several minutes.

# Stop the script if a kubectl command fails.
function Invoke-Kubectl {
    & kubectl @args
    if ($LASTEXITCODE -ne 0) { throw "kubectl $($args -join ' ') failed." }
}

# --- 1. Check the cluster connection -----------------------------------------
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    throw 'kubectl was not found in PATH.'
}
kubectl cluster-info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'kubectl cannot reach a cluster. Is Kubernetes running?'
}
Write-Host ">>> Using cluster context: $(kubectl config current-context)"

# --- 2. Check for an Ingress controller ---------------------------------------
kubectl get ingressclass nginx *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "No 'nginx' IngressClass found. The browser URLs will not work."
    Write-Warning 'Install ingress-nginx first (see README.md, Step 1).'
}

# --- 3. Apply all manifests ---------------------------------------------------
Write-Host '>>> Applying manifests from k8s\'
Invoke-Kubectl apply -f (Join-Path $PSScriptRoot 'k8s')

# --- 4. Make sure every workload has 1 replica -------------------------------
Write-Host '>>> Scaling workloads to 1 replica'
Invoke-Kubectl scale -n $Namespace statefulset/postgres --replicas=1
Invoke-Kubectl scale -n $Namespace deployment/euro-office deployment/nextcloud --replicas=1

# --- 5. Wait until everything is ready ---------------------------------------
Write-Host ">>> Waiting for the workloads to become ready (up to $Timeout)..."
Invoke-Kubectl rollout status -n $Namespace statefulset/postgres   --timeout=$Timeout
Invoke-Kubectl rollout status -n $Namespace deployment/euro-office --timeout=$Timeout
Invoke-Kubectl rollout status -n $Namespace deployment/nextcloud   --timeout=$Timeout

Write-Host ''
Invoke-Kubectl get pods -n $Namespace
Write-Host ''
Write-Host '>>> Ready.'
Write-Host '    Nextcloud:   http://cloud.localhost'
Write-Host '    Euro-Office: http://office.localhost/healthcheck'
