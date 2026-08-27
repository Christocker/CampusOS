# Creates two Windows Scheduled Tasks so CampusOS + its Cloudflare Tunnel
# start automatically at logon (and restart on failure). Run once from PowerShell:
#   powershell -ExecutionPolicy Bypass -File deploy\windows\install-tasks.ps1
# Then start them now with:  schtasks /Run /TN CampusOS.Server ; schtasks /Run /TN CampusOS.Tunnel
# Remove later with:        schtasks /Delete /TN CampusOS.Server /F ; schtasks /Delete /TN CampusOS.Tunnel /F

$ErrorActionPreference = "Stop"

# Project root = parent of deploy/windows
$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$project   = Resolve-Path (Join-Path $deployDir ".." "..")
$logDir    = Join-Path $project "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$tunnelName = "campusos"

function Register-CampusTask {
  param(
    [string]$Name,
    [string]$Command,
    [string]$Arguments,
    [string]$WorkingDir
  )

  $action = New-ScheduledTaskAction -Execute $Command -Argument $Arguments -WorkingDirectory $WorkingDir
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit 0 `
    -StartWhenAvailable

  # Highest privileges so Docker Desktop can be reached; run for any user that logs on.
  Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger `
    -Settings $settings -Force | Out-Null
  Write-Host "✓ Task '$Name' registered."
}

# 1) App + local Postgres (Docker Compose, detached)
Register-CampusTask `
  -Name "CampusOS.Server" `
  -Command "cmd.exe" `
  -Arguments "/c ""cd /d $project && docker compose up""" `
  -WorkingDir $project

# 2) Public tunnel (named tunnel — create once with: cloudflared tunnel create $tunnelName)
Register-CampusTask `
  -Name "CampusOS.Tunnel" `
  -Command "cloudflared.exe" `
  -Arguments "tunnel run $tunnelName" `
  -WorkingDir $project

Write-Host ""
Write-Host "Done. Make sure Docker Desktop is set to 'Start at login'."
Write-Host "Set AUTH_URL in .env to your tunnel URL before the tasks start."
Write-Host "Start now:  schtasks /Run /TN CampusOS.Server ; schtasks /Run /TN CampusOS.Tunnel"
