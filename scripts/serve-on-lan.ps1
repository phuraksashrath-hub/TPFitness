<#
.SYNOPSIS
  Runs TP Fitness so a phone on the same Wi-Fi can open it (production build of the web app + the API).

.DESCRIPTION
  A phone cannot reach "localhost" on this PC, so this script:
    1. finds this PC's LAN address,
    2. builds the web app with the API address set to that LAN address (NEXT_PUBLIC_* values are compiled in),
    3. starts the API on all interfaces with CORS allowing the web app's LAN origin,
    4. starts the web app on all interfaces.
  It uses the demo data and the demo-login panel, so it is for trying the site on a phone - not for the internet.
  Real deployments: see "Going live" in README.md.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\serve-on-lan.ps1
#>
param(
  [int]$WebPort = 3000,
  [int]$ApiPort = 5080
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# The adapter that owns the default gateway is the one the router (and so the phone) can see.
$config = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
if (-not $config) { throw 'No active network connection with a default gateway was found. Connect to Wi-Fi first.' }
$ip = $config.IPv4Address.IPAddress
$web = "http://${ip}:$WebPort"
$api = "http://${ip}:$ApiPort"

foreach ($port in @($WebPort, $ApiPort)) {
  $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($busy) { throw "Port $port is already in use (process $($busy.OwningProcess | Select-Object -First 1)). Stop it first." }
}

Write-Host "LAN address: $ip" -ForegroundColor Cyan

Write-Host "Building the web app against $api ..." -ForegroundColor Cyan
Push-Location (Join-Path $root 'frontend')
try {
  $env:NEXT_PUBLIC_API_BASE_URL = $api
  $env:NEXT_PUBLIC_DEMO_LOGIN = 'true'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'The web build failed.' }
} finally { Pop-Location }

Write-Host 'Building the API ...' -ForegroundColor Cyan
$apiDir = Join-Path $root 'backend\FitnessCenter.Api'
dotnet build $apiDir --nologo -v q
if ($LASTEXITCODE -ne 0) { throw 'The API build failed.' }

$env:ASPNETCORE_ENVIRONMENT = 'Development'   # demo data, dev signing key and the relaxed sign-in limit
$env:Cors__AllowedOrigins__0 = $web
$env:Cors__AllowedOrigins__1 = "http://localhost:$WebPort"
Start-Process -FilePath 'dotnet' -WorkingDirectory $apiDir -WindowStyle Minimized `
  -ArgumentList 'run', '--no-build', '--urls', "http://0.0.0.0:$ApiPort"

Start-Process -FilePath 'npm.cmd' -WorkingDirectory (Join-Path $root 'frontend') -WindowStyle Minimized `
  -ArgumentList 'run', 'start', '--', '-H', '0.0.0.0', '-p', $WebPort

Write-Host ''
Write-Host "Open on the phone (same Wi-Fi):  $web" -ForegroundColor Green
Write-Host "API health check:                $api/health"
Write-Host ''
$category = (Get-NetConnectionProfile -InterfaceIndex $config.NetAdapter.InterfaceIndex -ErrorAction SilentlyContinue).NetworkCategory
if (-not $category) { $category = 'Private' }
Write-Host "If the phone opens the page but no data loads (or it cannot connect at all), Windows Firewall is blocking it." -ForegroundColor Yellow
Write-Host "This Wi-Fi is currently marked: $category. In an ADMINISTRATOR PowerShell run:"
Write-Host "  New-NetFirewallRule -DisplayName 'TP Fitness LAN test' -Direction Inbound -Protocol TCP -LocalPort $WebPort,$ApiPort -Action Allow -Profile $category"
Write-Host "and remove it afterwards:  Remove-NetFirewallRule -DisplayName 'TP Fitness LAN test'"
if ($category -eq 'Public') {
  Write-Host "Tip: 'Public' is the strictest profile. Only open these ports on a network you trust (home Wi-Fi), never on shared or public Wi-Fi." -ForegroundColor DarkYellow
}
Write-Host ''
Write-Host 'Stop everything by closing the two minimized windows, or:'
Write-Host "  Get-NetTCPConnection -LocalPort $WebPort,$ApiPort -State Listen | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force }"
