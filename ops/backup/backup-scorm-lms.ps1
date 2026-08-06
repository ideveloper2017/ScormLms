[CmdletBinding()]
param(
    [string]$DatabaseUrl = $env:DB_URL,
    [string]$DatabaseUser = $env:DB_USERNAME,
    [string]$DatabasePassword = $env:DB_PASSWORD,
    [string]$OutputRoot = $env:BACKUP_OUTPUT_DIR,
    [string]$UploadPath = $env:FILE_UPLOAD_DIR,
    [string]$ScormPath = $env:SCORM_STORAGE_DIR,
    [string]$AssignmentPath = $env:ASSIGNMENT_STORAGE_DIR,
    [string]$PostgresBin = $env:POSTGRES_BIN
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'Backup.Common.ps1')

foreach ($required in @{
    DB_URL = $DatabaseUrl; DB_USERNAME = $DatabaseUser; BACKUP_OUTPUT_DIR = $OutputRoot;
    FILE_UPLOAD_DIR = $UploadPath; SCORM_STORAGE_DIR = $ScormPath; ASSIGNMENT_STORAGE_DIR = $AssignmentPath
}.GetEnumerator()) {
    if ([string]::IsNullOrWhiteSpace([string]$required.Value)) { throw "$($required.Key) majburiy" }
}

$connection = ConvertFrom-PostgresJdbcUrl $DatabaseUrl
$pgDump = Resolve-PostgresTool 'pg_dump' $PostgresBin
$pgRestore = Resolve-PostgresTool 'pg_restore' $PostgresBin
$psql = Resolve-PostgresTool 'psql' $PostgresBin
$tar = (Get-Command tar -ErrorAction Stop).Source
$resolvedOutput = [IO.Path]::GetFullPath($OutputRoot)
$storageDefinitions = @(
    @{ label = 'uploads'; path = (Resolve-Path -LiteralPath $UploadPath -ErrorAction Stop).Path },
    @{ label = 'scorm'; path = (Resolve-Path -LiteralPath $ScormPath -ErrorAction Stop).Path },
    @{ label = 'assignments'; path = (Resolve-Path -LiteralPath $AssignmentPath -ErrorAction Stop).Path }
)
foreach ($item in $storageDefinitions) {
    if (-not (Test-Path -LiteralPath $item.path -PathType Container)) { throw "Persistent katalog topilmadi: $($item.path)" }
    $storagePrefix = $item.path.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if ($resolvedOutput -eq $item.path -or $resolvedOutput.StartsWith($storagePrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "BACKUP_OUTPUT_DIR persistent katalog ichida bolishi mumkin emas: $($item.label)"
    }
    Assert-NoStorageLinks $item.path
}
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupName = "scorm-lms-$stamp-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$staging = Join-Path $resolvedOutput "$backupName.partial"
$final = Join-Path $resolvedOutput $backupName
$startedAt = (Get-Date).ToUniversalTime()

try {
    New-Item -ItemType Directory -Path $staging | Out-Null
    Use-PostgresPassword $DatabasePassword {
        $tableCount = [long](Invoke-PsqlScalar $psql $connection $DatabaseUser "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
        $flywayVersion = Invoke-PsqlScalar $psql $connection $DatabaseUser "SELECT COALESCE(max(installed_rank)::text, '') FROM flyway_schema_history WHERE success;"
        $dumpPath = Join-Path $staging 'database.dump'
        Invoke-NativeChecked $pgDump @(
            '--host', $connection.Host, '--port', [string]$connection.Port,
            '--username', $DatabaseUser, '--dbname', $connection.Database,
            '--no-password', '--format=custom', '--compress=9', '--file', $dumpPath
        )
        Invoke-NativeChecked $pgRestore @('--list', $dumpPath) | Out-Null

        $storage = foreach ($item in $storageDefinitions) {
            $source = $item.path
            $archiveName = "storage-$($item.label).tar.gz"
            $archivePath = Join-Path $staging $archiveName
            Invoke-NativeChecked $tar @('-czf', $archivePath, '-C', $source, '.')
            [pscustomobject]@{
                label = $item.label
                sourcePath = $source
                archive = $archiveName
                inventory = @(Get-StorageInventory $source)
            }
        }

        $payloadFiles = @('database.dump') + @($storage | ForEach-Object { $_.archive })
        $files = foreach ($name in $payloadFiles) {
            $file = Get-Item -LiteralPath (Join-Path $staging $name)
            [pscustomobject]@{
                name = $name
                size = $file.Length
                sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        }
        $manifest = [ordered]@{
            schemaVersion = 1
            application = 'ScormLms'
            startedAt = $startedAt.ToString('o')
            completedAt = (Get-Date).ToUniversalTime().ToString('o')
            database = [ordered]@{
                host = $connection.Host
                port = $connection.Port
                name = $connection.Database
                tableCount = $tableCount
                flywayInstalledRank = $flywayVersion
                dump = 'database.dump'
            }
            storage = @($storage)
            files = @($files)
        }
        $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $staging 'manifest.json') -Encoding UTF8
        $manifestHash = (Get-FileHash -LiteralPath (Join-Path $staging 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant()
        "$manifestHash  manifest.json" | Set-Content -LiteralPath (Join-Path $staging 'MANIFEST.sha256') -Encoding ascii
    }
    Move-Item -LiteralPath $staging -Destination $final
    Write-Output $final
}
catch {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
    throw
}
