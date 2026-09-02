$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$runDirectory = Join-Path $projectRoot "tmp\local-run"

if (-not (Test-Path -LiteralPath $runDirectory)) {
    Write-Host "Lokal SCORM LMS jarayonlari topilmadi."
    exit 0
}

$pidFiles = @("frontend.pid", "frontend-launcher.pid", "backend.pid", "backend-launcher.pid")
foreach ($pidFile in $pidFiles) {
    $path = Join-Path $runDirectory $pidFile
    if (-not (Test-Path -LiteralPath $path)) { continue }

    $processId = [int](Get-Content -LiteralPath $path -Raw).Trim()
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if ($null -ne $process) {
        $commandLine = [string]$process.CommandLine
        $isProjectProcess = $commandLine -match [regex]::Escape($projectRoot)
        if ($pidFile -eq "backend.pid") {
            $isProjectProcess = $commandLine -match "uz\.scorm\.lms\.app\.ScromLmsProjectsApplicationKt"
        }
        if (-not $isProjectProcess) {
            Write-Warning "PID $processId boshqa jarayonga tegishli; to'xtatilmadi."
            continue
        }
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
}

Write-Host "SCORM LMS lokal jarayonlari to'xtatildi." -ForegroundColor Green
