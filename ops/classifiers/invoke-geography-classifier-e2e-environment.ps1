[CmdletBinding()]
param(
    [ValidateSet('Start', 'Stop')][string]$Action = 'Start',
    [string]$PostgresBin = $env:POSTGRES_BIN,
    [string]$DatabaseHost = 'localhost',
    [ValidateRange(1, 65535)][int]$DatabasePort = 5432,
    [string]$DatabaseUser = 'postgres',
    [string]$DatabasePassword = $env:PGPASSWORD,
    [ValidateRange(1, 65535)][int]$BackendPort = 18080,
    [ValidateRange(1, 65535)][int]$FrontendPort = 15173,
    [string]$AdminPassword = 'ClassifierE2E-2026-Aa1',
    [string]$TeacherPassword = 'ClassifierE2E-2026-Tt1'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$stateDirectory = Join-Path $repoRoot 'build\classifier-e2e'
$statePath = Join-Path $stateDirectory 'environment-state.json'

if ([string]::IsNullOrWhiteSpace($PostgresBin)) {
    $PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
}
$PostgresBin = (Resolve-Path -LiteralPath $PostgresBin).Path
$createdb = Join-Path $PostgresBin 'createdb.exe'
$dropdb = Join-Path $PostgresBin 'dropdb.exe'
if (-not (Test-Path -LiteralPath $createdb) -or -not (Test-Path -LiteralPath $dropdb)) {
    throw "createdb/dropdb topilmadi: $PostgresBin"
}

function Assert-DisposableDatabaseName([string]$Name) {
    if ($Name -notmatch '^scorm_lms_classifier_e2e_[0-9]{14}_[0-9]+$') {
        throw "Disposable E2E baza nomi xavfsiz emas: $Name"
    }
}

function Stop-OwnedProcess([Nullable[int]]$ProcessId) {
    if ($null -eq $ProcessId) { return }
    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($null -ne $process) {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Wait-Process -Id $ProcessId -Timeout 10 -ErrorAction SilentlyContinue
    }
}

function Get-ListenerProcessId([int]$Port) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -eq $listener) { return $null }
    return [int]$listener.OwningProcess
}

function Wait-Listener([int]$Port, [int]$TimeoutSeconds = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $processId = Get-ListenerProcessId $Port
        if ($null -ne $processId) { return $processId }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    throw "Port belgilangan vaqtda ishga tushmadi: $Port"
}

if ($Action -eq 'Stop') {
    if (-not (Test-Path -LiteralPath $statePath)) {
        Write-Output 'E2E muhiti allaqachon tozalangan.'
        exit 0
    }
    $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert-DisposableDatabaseName $state.databaseName
    $frontendOwnerPid = if ($state.PSObject.Properties.Name -contains 'frontendOwnerPid') { $state.frontendOwnerPid } else { Get-ListenerProcessId $state.frontendPort }
    $backendOwnerPid = if ($state.PSObject.Properties.Name -contains 'backendOwnerPid') { $state.backendOwnerPid } else { Get-ListenerProcessId $state.backendPort }
    Stop-OwnedProcess $frontendOwnerPid
    Stop-OwnedProcess $backendOwnerPid
    Stop-OwnedProcess $state.frontendPid
    Stop-OwnedProcess $state.backendPid
    $env:PGPASSWORD = $DatabasePassword
    & $dropdb -h $state.databaseHost -p $state.databasePort -U $state.databaseUser --if-exists --force $state.databaseName
    if ($LASTEXITCODE -ne 0) { throw "Disposable E2E bazani o'chirib bo'lmadi: $($state.databaseName)" }
    Remove-Item -LiteralPath $statePath -Force
    Write-Output "CLEANED database=$($state.databaseName) backendPid=$($state.backendPid) frontendPid=$($state.frontendPid)"
    exit 0
}

if (Test-Path -LiteralPath $statePath) {
    throw "Avvalgi E2E state mavjud. Avval -Action Stop bajaring: $statePath"
}
if (Get-NetTCPConnection -State Listen -LocalPort $BackendPort -ErrorAction SilentlyContinue) {
    throw "Backend port band: $BackendPort"
}
if (Get-NetTCPConnection -State Listen -LocalPort $FrontendPort -ErrorAction SilentlyContinue) {
    throw "Frontend port band: $FrontendPort"
}

New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
$databaseName = "scorm_lms_classifier_e2e_{0}_{1}" -f (Get-Date -Format 'yyyyMMddHHmmss'), $PID
Assert-DisposableDatabaseName $databaseName
$backend = $null
$frontend = $null
$databaseCreated = $false
$oldPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $DatabasePassword
    & $createdb -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -T template0 --encoding=UTF8 $databaseName
    if ($LASTEXITCODE -ne 0) { throw "Disposable E2E bazani yaratib bo'lmadi: $databaseName" }
    $databaseCreated = $true

    $env:DB_URL = "jdbc:postgresql://${DatabaseHost}:$DatabasePort/$databaseName"
    $env:DB_USERNAME = $DatabaseUser
    $env:DB_PASSWORD = $DatabasePassword
    $env:APP_SEED_ADMIN_PASSWORD = $AdminPassword
    $env:APP_SEED_TEACHER_PASSWORD = $TeacherPassword
    $env:CORS_ALLOWED_ORIGINS = "http://127.0.0.1:$FrontendPort,http://localhost:$FrontendPort"
    $env:SPRING_DEVTOOLS_RESTART_ENABLED = 'false'
    $backend = Start-Process -FilePath (Join-Path $repoRoot 'gradlew.bat') `
        -ArgumentList @('bootRun', '--no-daemon', "--args=--server.port=$BackendPort") `
        -WorkingDirectory $repoRoot `
        -RedirectStandardOutput (Join-Path $stateDirectory 'backend.out.log') `
        -RedirectStandardError (Join-Path $stateDirectory 'backend.err.log') `
        -WindowStyle Hidden -PassThru

    $env:VITE_API_BASE_URL = "http://localhost:$BackendPort/api/v1"
    $frontend = Start-Process -FilePath 'npm.cmd' `
        -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', $FrontendPort, '--strictPort') `
        -WorkingDirectory (Join-Path $repoRoot 'frontend') `
        -RedirectStandardOutput (Join-Path $stateDirectory 'frontend.out.log') `
        -RedirectStandardError (Join-Path $stateDirectory 'frontend.err.log') `
        -WindowStyle Hidden -PassThru

    $frontendOwnerPid = Wait-Listener $FrontendPort
    $backendOwnerPid = Wait-Listener $BackendPort

    $state = [ordered]@{
        databaseName = $databaseName
        databaseHost = $DatabaseHost
        databasePort = $DatabasePort
        databaseUser = $DatabaseUser
        backendPort = $BackendPort
        frontendPort = $FrontendPort
        backendPid = $backend.Id
        frontendPid = $frontend.Id
        backendOwnerPid = $backendOwnerPid
        frontendOwnerPid = $frontendOwnerPid
        startedAt = (Get-Date).ToUniversalTime().ToString('o')
    }
    $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    Write-Output "STARTED database=$databaseName backendPid=$($backend.Id) frontendPid=$($frontend.Id) backend=http://localhost:$BackendPort frontend=http://127.0.0.1:$FrontendPort"
}
catch {
    Stop-OwnedProcess (Get-ListenerProcessId $FrontendPort)
    Stop-OwnedProcess (Get-ListenerProcessId $BackendPort)
    Stop-OwnedProcess $frontend.Id
    Stop-OwnedProcess $backend.Id
    if ($databaseCreated) {
        $env:PGPASSWORD = $DatabasePassword
        & $dropdb -h $DatabaseHost -p $DatabasePort -U $DatabaseUser --if-exists --force $databaseName
    }
    throw
}
finally {
    $env:PGPASSWORD = $oldPgPassword
}
