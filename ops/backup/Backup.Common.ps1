Set-StrictMode -Version Latest

function ConvertFrom-PostgresJdbcUrl {
    param([Parameter(Mandatory)][string]$Url)

    $raw = if ($Url.StartsWith('jdbc:', [StringComparison]::OrdinalIgnoreCase)) { $Url.Substring(5) } else { $Url }
    $uri = [Uri]$raw
    if ($uri.Scheme -notin @('postgresql', 'postgres')) {
        throw "Faqat PostgreSQL URL qo'llanadi: $($uri.Scheme)"
    }
    $database = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($database)) { throw 'PostgreSQL URL ichida database nomi yoq' }
    [pscustomobject]@{
        Host = $uri.Host
        Port = if ($uri.IsDefaultPort) { 5432 } else { $uri.Port }
        Database = $database
    }
}

function Resolve-PostgresTool {
    param(
        [Parameter(Mandatory)][string]$Name,
        [string]$PostgresBin
    )

    if (-not [string]::IsNullOrWhiteSpace($PostgresBin)) {
        foreach ($candidate in @((Join-Path $PostgresBin $Name), (Join-Path $PostgresBin "$Name.exe"))) {
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { return (Resolve-Path -LiteralPath $candidate).Path }
        }
        throw "$Name utilitasi POSTGRES_BIN ichida topilmadi: $PostgresBin"
    }
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) { throw "$Name PATH ichida topilmadi; POSTGRES_BIN ni sozlang" }
    $command.Source
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory)][string]$Executable,
        [Parameter(Mandatory)][string[]]$Arguments,
        [switch]$Capture
    )

    if ($Capture) {
        $output = & $Executable @Arguments 2>&1
        if ($LASTEXITCODE -ne 0) { throw "$Executable exit code $LASTEXITCODE`: $($output -join [Environment]::NewLine)" }
        return @($output | ForEach-Object { $_.ToString() })
    }
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Executable exit code $LASTEXITCODE" }
}

function Invoke-PsqlScalar {
    param(
        [Parameter(Mandatory)][string]$Psql,
        [Parameter(Mandatory)]$Connection,
        [Parameter(Mandatory)][string]$Username,
        [Parameter(Mandatory)][string]$Sql,
        [string]$Database
    )

    $db = if ([string]::IsNullOrWhiteSpace($Database)) { $Connection.Database } else { $Database }
    $result = Invoke-NativeChecked -Executable $Psql -Capture -Arguments @(
        '--host', $Connection.Host, '--port', [string]$Connection.Port,
        '--username', $Username, '--dbname', $db, '--no-password',
        '--no-align', '--tuples-only', '--set', 'ON_ERROR_STOP=1', '--command', $Sql
    )
    ($result -join "`n").Trim()
}

function Use-PostgresPassword {
    param(
        [string]$Password,
        [Parameter(Mandatory)][scriptblock]$Action
    )

    $hadPassword = Test-Path Env:PGPASSWORD
    $previousPassword = $env:PGPASSWORD
    if (-not [string]::IsNullOrWhiteSpace($Password)) { $env:PGPASSWORD = $Password }
    if (-not (Test-Path Env:PGPASSWORD) -or [string]::IsNullOrWhiteSpace($env:PGPASSWORD)) {
        throw 'DB_PASSWORD yoki PGPASSWORD env qiymati majburiy'
    }
    try { & $Action }
    finally {
        if ($hadPassword) { $env:PGPASSWORD = $previousPassword } else { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    }
}

function Get-StorageInventory {
    param([Parameter(Mandatory)][string]$Root)

    $resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
    $rootWithSeparator = $resolvedRoot.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $rootUri = [Uri]$rootWithSeparator
    @(
        Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File | Sort-Object FullName | ForEach-Object {
            [pscustomobject]@{
                path = [Uri]::UnescapeDataString($rootUri.MakeRelativeUri([Uri]$_.FullName).ToString()).Replace('\', '/')
                size = $_.Length
                sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        }
    )
}

function Assert-NoStorageLinks {
    param([Parameter(Mandatory)][string]$Root)

    $links = @(Get-ChildItem -LiteralPath $Root -Recurse -Force | Where-Object {
        ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or
        ($_.PSObject.Properties.Name -contains 'LinkType' -and -not [string]::IsNullOrWhiteSpace([string]$_.LinkType))
    })
    if ($links.Count -gt 0) { throw "Persistent katalogda symbolic link/reparse point bloklandi: $($links[0].FullName)" }
}

function Assert-SafeArchiveEntries {
    param(
        [Parameter(Mandatory)][string]$Tar,
        [Parameter(Mandatory)][string]$Archive
    )

    $entries = Invoke-NativeChecked -Executable $Tar -Capture -Arguments @('-tzf', $Archive)
    foreach ($entry in $entries) {
        $normalized = $entry.Replace('\', '/').Trim()
        if ($normalized.StartsWith('/') -or $normalized -match '^[A-Za-z]:' -or $normalized -match '(^|/)\.\.(/|$)') {
            throw "Arxivda xavfli yol topildi: $entry"
        }
    }
}

function ConvertTo-SqlLiteral {
    param([Parameter(Mandatory)][string]$Value)
    "'" + $Value.Replace("'", "''") + "'"
}

function ConvertTo-SqlIdentifier {
    param([Parameter(Mandatory)][string]$Value)
    '"' + $Value.Replace('"', '""') + '"'
}
