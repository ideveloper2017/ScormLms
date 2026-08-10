[CmdletBinding()]
param(
    [string]$PostgresBin = $env:POSTGRES_BIN,
    [string]$DatabaseHost = 'localhost',
    [ValidateRange(1, 65535)][int]$DatabasePort = 5432,
    [string]$DatabaseUser = 'postgres',
    [string]$DatabasePassword = $env:PGPASSWORD,
    [string]$ReportPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
if ([string]::IsNullOrWhiteSpace($PostgresBin)) {
    $PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
}
$PostgresBin = (Resolve-Path -LiteralPath $PostgresBin).Path
$createdb = Join-Path $PostgresBin 'createdb.exe'
$dropdb = Join-Path $PostgresBin 'dropdb.exe'
if (-not (Test-Path -LiteralPath $createdb) -or -not (Test-Path -LiteralPath $dropdb)) {
    throw "createdb/dropdb topilmadi: $PostgresBin"
}

$databaseName = "scorm_lms_classifier_uat_{0}_{1}" -f (Get-Date -Format 'yyyyMMddHHmmss'), $PID
if ($databaseName -notmatch '^scorm_lms_classifier_uat_[0-9]{14}_[0-9]+$') {
    throw "Xavfsiz disposable baza nomi hosil bo'lmadi: $databaseName"
}
if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportPath = Join-Path $repoRoot 'docs\uat\geography-classifier-uat-latest.json'
}
$reportFullPath = [IO.Path]::GetFullPath($ReportPath)
$reportDirectory = Split-Path -Parent $reportFullPath
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null

$oldPgPassword = $env:PGPASSWORD
$oldUrl = $env:CLASSIFIER_UAT_DB_URL
$oldUser = $env:CLASSIFIER_UAT_DB_USERNAME
$oldPassword = $env:CLASSIFIER_UAT_DB_PASSWORD
$oldReport = $env:CLASSIFIER_UAT_REPORT_PATH
$created = $false
try {
    $env:PGPASSWORD = $DatabasePassword
    & $createdb -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -T template0 --encoding=UTF8 $databaseName
    if ($LASTEXITCODE -ne 0) { throw "Disposable PostgreSQL bazani yaratib bo'lmadi: $databaseName" }
    $created = $true

    $env:CLASSIFIER_UAT_DB_URL = "jdbc:postgresql://${DatabaseHost}:$DatabasePort/$databaseName"
    $env:CLASSIFIER_UAT_DB_USERNAME = $DatabaseUser
    $env:CLASSIFIER_UAT_DB_PASSWORD = $DatabasePassword
    $env:CLASSIFIER_UAT_REPORT_PATH = $reportFullPath

    & (Join-Path $repoRoot 'gradlew.bat') cleanTest test --tests 'uz.scorm.lms.app.v1.classifier.GeographyClassifierPostgresUatTest' --no-daemon
    if ($LASTEXITCODE -ne 0) { throw 'Geography classifier PostgreSQL UAT testi muvaffaqiyatsiz' }
    if (-not (Test-Path -LiteralPath $reportFullPath)) { throw "UAT hisoboti yaratilmagan: $reportFullPath" }

    $report = Get-Content -LiteralPath $reportFullPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($report.outcome -ne 'VERIFIED') { throw "UAT natijasi VERIFIED emas: $($report.outcome)" }
    $reportSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $reportFullPath).Hash
    $shaPath = "$reportFullPath.sha256"
    [IO.File]::WriteAllText($shaPath, "$reportSha256 *$([IO.Path]::GetFileName($reportFullPath))`n", [Text.UTF8Encoding]::new($false))
    Write-Output "VERIFIED report=$reportFullPath reportSha256=$reportSha256 manifest=$($report.dataset.manifestSha256) secondUnchanged=$($report.secondImport.unchangedCount)"
}
finally {
    if ($created) {
        & $dropdb -h $DatabaseHost -p $DatabasePort -U $DatabaseUser --if-exists --force $databaseName
    }
    $env:PGPASSWORD = $oldPgPassword
    $env:CLASSIFIER_UAT_DB_URL = $oldUrl
    $env:CLASSIFIER_UAT_DB_USERNAME = $oldUser
    $env:CLASSIFIER_UAT_DB_PASSWORD = $oldPassword
    $env:CLASSIFIER_UAT_REPORT_PATH = $oldReport
}
