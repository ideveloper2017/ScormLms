[CmdletBinding()]
param(
    [string]$DatabaseUrl = $env:DB_URL,
    [string]$DatabaseUser = $env:DB_USERNAME,
    [string]$DatabasePassword = $env:DB_PASSWORD,
    [string]$PostgresBin = $env:POSTGRES_BIN,
    [string]$WorkRoot,
    [string]$ReportPath,
    [switch]$KeepArtifacts
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'Backup.Common.ps1')

if ([string]::IsNullOrWhiteSpace($DatabaseUrl) -or [string]::IsNullOrWhiteSpace($DatabaseUser)) {
    throw 'DB_URL va DB_USERNAME majburiy'
}
$source = ConvertFrom-PostgresJdbcUrl $DatabaseUrl
$runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$targetDatabase = "scorm_lms_restore_drill_$($runId.Replace('-', '_').ToLowerInvariant())"
$root = if ([string]::IsNullOrWhiteSpace($WorkRoot)) {
    Join-Path ([IO.Path]::GetTempPath()) "scorm-lms-restore-drill-$runId"
} else {
    Join-Path ([IO.Path]::GetFullPath($WorkRoot)) $runId
}
$backupRoot = Join-Path $root 'backups'
$fixtureRoot = Join-Path $root 'source-storage'
$restoredStorage = Join-Path $root 'restored-storage'
$startedAt = (Get-Date).ToUniversalTime()
$targetUrl = "jdbc:postgresql://$($source.Host):$($source.Port)/$targetDatabase"
$dropdb = Resolve-PostgresTool 'dropdb' $PostgresBin
$psql = Resolve-PostgresTool 'psql' $PostgresBin

$status = 'FAILED'
$tableFingerprints = New-Object 'System.Collections.Generic.List[object]'
try {
    New-Item -ItemType Directory -Path $backupRoot, $fixtureRoot | Out-Null
    foreach ($label in @('uploads', 'scorm', 'assignments', 'uat-559')) {
        $directory = Join-Path $fixtureRoot $label
        New-Item -ItemType Directory -Path $directory | Out-Null
        "restore-drill-$label-$runId" | Set-Content -LiteralPath (Join-Path $directory 'integrity.txt') -Encoding UTF8
    }

    $nestedOutputBlocked = $false
    try {
        & (Join-Path $PSScriptRoot 'backup-scorm-lms.ps1') `
            -DatabaseUrl $DatabaseUrl -DatabaseUser $DatabaseUser -DatabasePassword $DatabasePassword `
            -OutputRoot (Join-Path $fixtureRoot 'uploads/backups') -UploadPath (Join-Path $fixtureRoot 'uploads') `
            -ScormPath (Join-Path $fixtureRoot 'scorm') -AssignmentPath (Join-Path $fixtureRoot 'assignments') `
            -UatEvidencePath (Join-Path $fixtureRoot 'uat-559') `
            -PostgresBin $PostgresBin | Out-Null
    } catch {
        if ($_.Exception.Message -like '*persistent katalog ichida*') { $nestedOutputBlocked = $true } else { throw }
    }
    if (-not $nestedOutputBlocked) { throw 'Storage ichidagi backup output bloklanmadi' }

    $backupDirectory = & (Join-Path $PSScriptRoot 'backup-scorm-lms.ps1') `
        -DatabaseUrl $DatabaseUrl -DatabaseUser $DatabaseUser -DatabasePassword $DatabasePassword `
        -OutputRoot $backupRoot -UploadPath (Join-Path $fixtureRoot 'uploads') `
        -ScormPath (Join-Path $fixtureRoot 'scorm') -AssignmentPath (Join-Path $fixtureRoot 'assignments') `
        -UatEvidencePath (Join-Path $fixtureRoot 'uat-559') `
        -PostgresBin $PostgresBin

    $sameSourceBlocked = $false
    try {
        & (Join-Path $PSScriptRoot 'restore-scorm-lms.ps1') `
            -BackupDirectory $backupDirectory -TargetDatabaseUrl $DatabaseUrl -TargetDatabaseUser $DatabaseUser `
            -TargetDatabasePassword $DatabasePassword -TargetStorageRoot (Join-Path $root 'rejected-source-storage') `
            -PostgresBin $PostgresBin -ConfirmRestore | Out-Null
    } catch {
        if ($_.Exception.Message -like '*Manba bazaning*') { $sameSourceBlocked = $true } else { throw }
    }
    if (-not $sameSourceBlocked) { throw 'Manba bazaning ustiga restore bloklanmadi' }

    $manifestChecksumPath = Join-Path $backupDirectory 'MANIFEST.sha256'
    $originalManifestChecksum = Get-Content -LiteralPath $manifestChecksumPath -Raw
    $tamperedBackupBlocked = $false
    try {
        ('0' * 64) + '  manifest.json' | Set-Content -LiteralPath $manifestChecksumPath -Encoding ASCII
        & (Join-Path $PSScriptRoot 'restore-scorm-lms.ps1') `
            -BackupDirectory $backupDirectory -TargetDatabaseUrl $targetUrl -TargetDatabaseUser $DatabaseUser `
            -TargetDatabasePassword $DatabasePassword -TargetStorageRoot (Join-Path $root 'rejected-checksum-storage') `
            -PostgresBin $PostgresBin -ConfirmRestore | Out-Null
    } catch {
        if ($_.Exception.Message -like '*checksum mos emas*') { $tamperedBackupBlocked = $true } else { throw }
    } finally {
        $originalManifestChecksum | Set-Content -LiteralPath $manifestChecksumPath -Encoding ASCII -NoNewline
    }
    if (-not $tamperedBackupBlocked) { throw 'Buzilgan manifest checksum bloklanmadi' }

    $restoreJson = & (Join-Path $PSScriptRoot 'restore-scorm-lms.ps1') `
        -BackupDirectory $backupDirectory -TargetDatabaseUrl $targetUrl -TargetDatabaseUser $DatabaseUser `
        -TargetDatabasePassword $DatabasePassword -TargetStorageRoot $restoredStorage `
        -PostgresBin $PostgresBin -ConfirmRestore
    $restore = $restoreJson | ConvertFrom-Json

    Use-PostgresPassword $DatabasePassword {
        $tables = @(Invoke-PsqlScalar $psql $source $DatabaseUser "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;") -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        foreach ($table in $tables) {
            $identifier = ConvertTo-SqlIdentifier $table
            $sql = "SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY md5(row_to_json(t)::text)), '')) FROM public.$identifier t;"
            $sourceFingerprint = Invoke-PsqlScalar $psql $source $DatabaseUser $sql
            $targetFingerprint = Invoke-PsqlScalar $psql (ConvertFrom-PostgresJdbcUrl $targetUrl) $DatabaseUser $sql
            if ($sourceFingerprint -ne $targetFingerprint) { throw "Table fingerprint mos emas: $table" }
            $tableFingerprints.Add([pscustomobject]@{ table = $table; fingerprint = $sourceFingerprint }) | Out-Null
        }
    }
    $status = 'VERIFIED'
    $completedAt = (Get-Date).ToUniversalTime()
    $report = [ordered]@{
        runId = $runId
        status = $status
        startedAt = $startedAt.ToString('o')
        completedAt = $completedAt.ToString('o')
        durationSeconds = [math]::Round(($completedAt - $startedAt).TotalSeconds, 2)
        sourceDatabase = $source.Database
        disposableTargetDatabase = $targetDatabase
        restoredTableCount = $restore.tableCount
        verifiedTableFingerprints = $tableFingerprints.Count
        storageSetsVerified = 4
        safetyChecksVerified = 3
    }
    $json = $report | ConvertTo-Json -Depth 5
    if (-not [string]::IsNullOrWhiteSpace($ReportPath)) {
        $reportFullPath = [IO.Path]::GetFullPath($ReportPath)
        New-Item -ItemType Directory -Path (Split-Path $reportFullPath -Parent) -Force | Out-Null
        $json | Set-Content -LiteralPath $reportFullPath -Encoding UTF8
    }
    Write-Output $json
}
finally {
    Use-PostgresPassword $DatabasePassword {
        if ($targetDatabase.StartsWith('scorm_lms_restore_drill_', [StringComparison]::Ordinal)) {
            Invoke-NativeChecked $dropdb @(
                '--host', $source.Host, '--port', [string]$source.Port, '--username', $DatabaseUser,
                '--no-password', '--if-exists', $targetDatabase
            )
        }
    }
    if (-not $KeepArtifacts -and (Test-Path -LiteralPath $root)) {
        $resolvedRoot = (Resolve-Path -LiteralPath $root).Path
        $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
        $explicitWorkRoot = if ([string]::IsNullOrWhiteSpace($WorkRoot)) { $null } else { [IO.Path]::GetFullPath($WorkRoot) }
        if ($resolvedRoot.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or
            ($null -ne $explicitWorkRoot -and $resolvedRoot.StartsWith($explicitWorkRoot, [StringComparison]::OrdinalIgnoreCase))) {
            Remove-Item -LiteralPath $resolvedRoot -Recurse -Force
        } else {
            throw "Drill katalogini xavfsiz tozalash mumkin emas: $resolvedRoot"
        }
    }
}
