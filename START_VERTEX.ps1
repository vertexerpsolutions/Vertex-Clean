$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = Get-Location }
Set-Location -LiteralPath $ScriptDir

Write-Host '==========================================' -ForegroundColor Cyan
Write-Host '   VERTEX ERP - Desktop Production Mode    ' -ForegroundColor Yellow
Write-Host '==========================================' -ForegroundColor Cyan
Write-Host "App Directory: $ScriptDir" -ForegroundColor Gray

& "$ScriptDir\START_VERTEX.bat"
