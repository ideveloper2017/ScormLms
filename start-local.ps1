param(
    [int]$BackendPort = 8081,
    [int]$FrontendPort = 5174,
    [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$runDirectory = Join-Path $projectRoot "tmp\local-run"
$logDirectory = Join-Path $projectRoot "logs"

New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Test-ListeningPort([int]$Port) {
    return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Wait-ForPort([int]$Port, [int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        if (Test-ListeningPort $Port) { return $true }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)
    return $false
}

if (-not (Get-Command java.exe -ErrorAction SilentlyContinue)) {
    throw "Java topilmadi. Java 21 yoki undan yangi versiyani o'rnating."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "Node.js/npm topilmadi. Node.js 20.19+ yoki 22.12+ o'rnating."
}
if (-not (Test-ListeningPort 5432)) {
    throw "PostgreSQL 5432-portda ishlamayapti. PostgreSQL servisni ishga tushiring."
}

# Ayrim Windows/JDK 21 kombinatsiyalarida Gradle selector yaratishi uzun temp
# yo'lida xato beradi. Qisqa tizim temp katalogi bu muammoni bartaraf etadi.
$windowsTemp = Join-Path $env:WINDIR "Temp"
if ($env:OS -eq "Windows_NT" -and (Test-Path -LiteralPath $windowsTemp)) {
    $unixSocketOption = "-Djdk.net.unixdomain.tmpdir=$windowsTemp"
    if ($env:JAVA_TOOL_OPTIONS -notlike "*jdk.net.unixdomain.tmpdir*") {
        $env:JAVA_TOOL_OPTIONS = "$($env:JAVA_TOOL_OPTIONS) $unixSocketOption".Trim()
    }
}

$env:SERVER_PORT = $BackendPort.ToString()
$env:APP_DEMO_DATA_ENABLED = "true"
if ([string]::IsNullOrWhiteSpace($env:APP_SEED_TEACHER_PASSWORD)) {
    $env:APP_SEED_TEACHER_PASSWORD = "Physics#Teach2026"
}
if ([string]::IsNullOrWhiteSpace($env:APP_SEED_STUDENT_PASSWORD)) {
    $env:APP_SEED_STUDENT_PASSWORD = "Physics#Study2026"
}
if ([string]::IsNullOrWhiteSpace($env:APP_SEED_DEMO_STAFF_PASSWORD)) {
    $env:APP_SEED_DEMO_STAFF_PASSWORD = "Physics#Staff2026"
}

if (-not (Test-ListeningPort $BackendPort)) {
    $backendStart = @{
        FilePath = Join-Path $projectRoot "gradlew.bat"
        ArgumentList = @("bootRun", "--no-daemon", "--args=--server.port=$BackendPort")
        WorkingDirectory = $projectRoot
        RedirectStandardOutput = Join-Path $logDirectory "scorm-local-backend.out.log"
        RedirectStandardError = Join-Path $logDirectory "scorm-local-backend.err.log"
        WindowStyle = "Hidden"
        PassThru = $true
    }
    $backendLauncher = Start-Process @backendStart
    Set-Content -LiteralPath (Join-Path $runDirectory "backend-launcher.pid") -Value $backendLauncher.Id
    Write-Host "Backend ishga tushmoqda..."
}

if (-not (Wait-ForPort $BackendPort 120)) {
    throw "Backend ishga tushmadi. Log: $logDirectory\scorm-local-backend.out.log"
}
$backendPid = (Get-NetTCPConnection -LocalPort $BackendPort -State Listen | Select-Object -First 1).OwningProcess
Set-Content -LiteralPath (Join-Path $runDirectory "backend.pid") -Value $backendPid

$health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/actuator/health" -TimeoutSec 30
if ($health.status -ne "UP") {
    throw "Backend health holati UP emas."
}

if (-not $NoFrontend) {
    $env:VITE_API_BASE_URL = "http://localhost:$BackendPort/api/v1"
    $env:VITE_WS_URL = "ws://localhost:$BackendPort/ws"
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "frontend\node_modules"))) {
        Push-Location (Join-Path $projectRoot "frontend")
        try { & npm.cmd install } finally { Pop-Location }
    }

    if (-not (Test-ListeningPort $FrontendPort)) {
        $frontendStart = @{
            FilePath = "npm.cmd"
            ArgumentList = @("run", "dev", "--", "--host", "127.0.0.1", "--port", $FrontendPort.ToString())
            WorkingDirectory = Join-Path $projectRoot "frontend"
            RedirectStandardOutput = Join-Path $logDirectory "scorm-local-frontend.out.log"
            RedirectStandardError = Join-Path $logDirectory "scorm-local-frontend.err.log"
            WindowStyle = "Hidden"
            PassThru = $true
        }
        $frontendLauncher = Start-Process @frontendStart
        Set-Content -LiteralPath (Join-Path $runDirectory "frontend-launcher.pid") -Value $frontendLauncher.Id
        Write-Host "Frontend ishga tushmoqda..."
    }
    if (-not (Wait-ForPort $FrontendPort 60)) {
        throw "Frontend ishga tushmadi. Log: $logDirectory\scorm-local-frontend.out.log"
    }
    $frontendPid = (Get-NetTCPConnection -LocalPort $FrontendPort -State Listen | Select-Object -First 1).OwningProcess
    Set-Content -LiteralPath (Join-Path $runDirectory "frontend.pid") -Value $frontendPid
}

Write-Host ""
Write-Host "SCORM LMS ishga tushdi" -ForegroundColor Green
if (-not $NoFrontend) { Write-Host "Frontend: http://localhost:$FrontendPort" }
Write-Host "Backend:  http://localhost:$BackendPort"
Write-Host "Student:  demo_student / Physics#Study2026"
Write-Host "Teacher:  demo_teacher / Physics#Teach2026"
Write-Host "Staff:    demo_admin, demo_metodist, demo_proctor, demo_monitoring / Physics#Staff2026"
Write-Host "To'xtatish: .\stop-local.ps1"
