[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$BackupDirectory,
    [string]$TargetDatabaseUrl = $env:RESTORE_DB_URL,
    [string]$TargetDatabaseUser = $env:RESTORE_DB_USERNAME,
    [string]$TargetDatabasePassword = $env:RESTORE_DB_PASSWORD,
    [Parameter(Mandatory)][string]$TargetStorageRoot,
    [string]$PostgresBin = $env:POSTGRES_BIN,
    [switch]$ConfirmRestore
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'Backup.Common.ps1')

if (-not $ConfirmRestore) { throw 'Restore uchun -ConfirmRestore majburiy' }
if ([string]::IsNullOrWhiteSpace($TargetDatabaseUrl)) { throw 'RESTORE_DB_URL majburiy' }
if ([string]::IsNullOrWhiteSpace($TargetDatabaseUser)) { throw 'RESTORE_DB_USERNAME majburiy' }
$backup = (Resolve-Path -LiteralPath $BackupDirectory).Path
$manifestPath = Join-Path $backup 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'manifest.json topilmadi' }
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.schemaVersion -ne 1 -or $manifest.application -ne 'ScormLms') { throw 'Backup manifest versiyasi yoki application qiymati yaroqsiz' }

$expectedManifestHash = ((Get-Content -LiteralPath (Join-Path $backup 'MANIFEST.sha256') -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
$actualManifestHash = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($expectedManifestHash -ne $actualManifestHash) { throw 'manifest.json checksum mos emas' }
foreach ($file in @($manifest.files)) {
    $path = Join-Path $backup $file.name
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Backup fayli topilmadi: $($file.name)" }
    $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $file.sha256 -or (Get-Item -LiteralPath $path).Length -ne [long]$file.size) {
        throw "Backup fayli yaxlitligi buzilgan: $($file.name)"
    }
}

$target = ConvertFrom-PostgresJdbcUrl $TargetDatabaseUrl
if ($target.Host -eq $manifest.database.host -and $target.Port -eq $manifest.database.port -and $target.Database -eq $manifest.database.name) {
    throw 'Manba bazaning o‘ziga restore qilish bloklandi'
}
$targetRoot = [IO.Path]::GetFullPath($TargetStorageRoot)
if (Test-Path -LiteralPath $targetRoot) {
    if ((Get-ChildItem -LiteralPath $targetRoot -Force | Measure-Object).Count -gt 0) { throw 'TargetStorageRoot bo‘sh bo‘lishi kerak' }
} else {
    New-Item -ItemType Directory -Path $targetRoot | Out-Null
}

$pgRestore = Resolve-PostgresTool 'pg_restore' $PostgresBin
$psql = Resolve-PostgresTool 'psql' $PostgresBin
$createdb = Resolve-PostgresTool 'createdb' $PostgresBin
$dropdb = Resolve-PostgresTool 'dropdb' $PostgresBin
$tar = (Get-Command tar -ErrorAction Stop).Source
$databaseCreated = $false

Use-PostgresPassword $TargetDatabasePassword {
    try {
        $databaseLiteral = ConvertTo-SqlLiteral $target.Database
        $exists = Invoke-PsqlScalar $psql $target $TargetDatabaseUser "SELECT 1 FROM pg_database WHERE datname=$databaseLiteral;" 'postgres'
        if (-not [string]::IsNullOrWhiteSpace($exists)) { throw "Target database allaqachon mavjud: $($target.Database)" }
        Invoke-NativeChecked $createdb @(
            '--host', $target.Host, '--port', [string]$target.Port, '--username', $TargetDatabaseUser,
            '--no-password', '--encoding=UTF8', $target.Database
        )
        $databaseCreated = $true
        Invoke-NativeChecked $pgRestore @(
            '--host', $target.Host, '--port', [string]$target.Port, '--username', $TargetDatabaseUser,
            '--dbname', $target.Database, '--no-password', '--exit-on-error', '--no-owner', '--no-privileges',
            (Join-Path $backup $manifest.database.dump)
        )
        $tableCount = [long](Invoke-PsqlScalar $psql $target $TargetDatabaseUser "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
        if ($tableCount -ne [long]$manifest.database.tableCount) { throw "Restore table count mos emas: $tableCount" }
        $flywayVersion = Invoke-PsqlScalar $psql $target $TargetDatabaseUser "SELECT COALESCE(max(installed_rank)::text, '') FROM flyway_schema_history WHERE success;"
        if ($flywayVersion -ne [string]$manifest.database.flywayInstalledRank) { throw "Restore Flyway holati mos emas: $flywayVersion" }

        foreach ($storage in @($manifest.storage)) {
            $archive = Join-Path $backup $storage.archive
            Assert-SafeArchiveEntries $tar $archive
            $destination = Join-Path $targetRoot $storage.label
            New-Item -ItemType Directory -Path $destination | Out-Null
            Invoke-NativeChecked $tar @('-xzf', $archive, '-C', $destination)
            $actualInventory = @(Get-StorageInventory $destination)
            $expectedInventory = @($storage.inventory)
            if (($actualInventory | ConvertTo-Json -Depth 5 -Compress) -ne ($expectedInventory | ConvertTo-Json -Depth 5 -Compress)) {
                throw "Restore storage inventory mos emas: $($storage.label)"
            }
        }
        [pscustomobject]@{
            restoredAt = (Get-Date).ToUniversalTime().ToString('o')
            database = $target.Database
            tableCount = $tableCount
            flywayInstalledRank = $flywayVersion
            storageRoot = $targetRoot
            status = 'VERIFIED'
        } | ConvertTo-Json -Compress | Write-Output
    }
    catch {
        if ($databaseCreated) {
            Invoke-NativeChecked $dropdb @(
                '--host', $target.Host, '--port', [string]$target.Port, '--username', $TargetDatabaseUser,
                '--no-password', '--if-exists', $target.Database
            )
        }
        throw
    }
}
