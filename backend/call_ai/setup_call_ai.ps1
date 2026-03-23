param(
    [string]$ProjectRoot = "C:\opt\ai-hospital-receptionist"
)

$backendRoot = Join-Path $ProjectRoot "backend"
if (-not (Test-Path $backendRoot)) {
    Write-Error "Backend root not found: $backendRoot"
    exit 1
}

Write-Host "This script prepares files only. Asterisk deployment must run on Linux host."

$agiFile = Join-Path $backendRoot "call_ai\agi_entry.sh"
if (-not (Test-Path $agiFile)) {
    Write-Error "AGI launcher not found at: $agiFile"
    exit 1
}

Write-Host "AGI launcher located: $agiFile"
Write-Host "Copy these files to your Linux Asterisk server:"
Write-Host "- $backendRoot\call_ai\asterisk\extensions_call_ai.conf"
Write-Host "- $backendRoot\call_ai\asterisk\pjsip_call_ai.conf"
Write-Host "- $backendRoot\call_ai\agi_entry.sh"
