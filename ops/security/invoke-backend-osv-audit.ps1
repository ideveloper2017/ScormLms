param(
    [string]$ReportPath = "",
    [ValidateSet("Critical", "High", "Moderate", "Low")]
    [string]$FailOnSeverity = "Critical"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$gradle = Join-Path $repoRoot "gradlew.bat"

$gradleOutput = @(& $gradle -q runtimeDependencyInventory 2>&1)
if ($LASTEXITCODE -ne 0) {
    throw "Gradle runtime dependency inventory failed: $($gradleOutput -join [Environment]::NewLine)"
}

$coordinates = @(
    $gradleOutput |
        ForEach-Object { $_.ToString().Trim() } |
        Where-Object { $_ -match '^[^:\s]+:[^:\s]+:[^:\s]+$' } |
        Sort-Object -Unique
)
if ($coordinates.Count -eq 0) {
    throw "No resolved Maven coordinates were returned by Gradle."
}

$packages = @(
    foreach ($coordinate in $coordinates) {
        $parts = $coordinate.Split(':', 3)
        [ordered]@{
            name = "$($parts[0]):$($parts[1])"
            version = $parts[2]
        }
    }
)

$findings = [System.Collections.Generic.List[object]]::new()
$vulnerabilityDetails = @{}
$batchSize = 500
for ($offset = 0; $offset -lt $packages.Count; $offset += $batchSize) {
    $last = [Math]::Min($offset + $batchSize - 1, $packages.Count - 1)
    $batch = @($packages[$offset..$last])
    $queries = @(
        foreach ($package in $batch) {
            [ordered]@{
                package = [ordered]@{ ecosystem = "Maven"; name = $package.name }
                version = $package.version
            }
        }
    )
    $body = @{ queries = $queries } | ConvertTo-Json -Depth 6
    $request = @{
        Method = "Post"
        Uri = "https://api.osv.dev/v1/querybatch"
        ContentType = "application/json"
        Body = $body
    }
    $response = Invoke-RestMethod @request

    for ($index = 0; $index -lt $batch.Count; $index++) {
        $vulnerabilities = @($response.results[$index].vulns) | Where-Object { $null -ne $_ }
        foreach ($vulnerability in $vulnerabilities) {
            if (-not $vulnerabilityDetails.ContainsKey($vulnerability.id)) {
                $encodedId = [Uri]::EscapeDataString($vulnerability.id)
                $vulnerabilityDetails[$vulnerability.id] = Invoke-RestMethod -Method Get -Uri "https://api.osv.dev/v1/vulns/$encodedId"
            }
            $details = $vulnerabilityDetails[$vulnerability.id]
            $severity = "$($details.database_specific.severity)".ToUpperInvariant()
            if ($severity -notin @("CRITICAL", "HIGH", "MODERATE", "LOW")) {
                $severity = "UNKNOWN"
            }
            $advisoryUrl = @($details.references | Where-Object { $_.type -eq "ADVISORY" } | Select-Object -First 1).url
            $findings.Add([ordered]@{
                package = $batch[$index].name
                version = $batch[$index].version
                id = $vulnerability.id
                severity = $severity
                summary = $details.summary
                advisory = $advisoryUrl
            })
        }
    }
}

$totals = [ordered]@{
    critical = @($findings | Where-Object severity -eq "CRITICAL").Count
    high = @($findings | Where-Object severity -eq "HIGH").Count
    moderate = @($findings | Where-Object severity -eq "MODERATE").Count
    low = @($findings | Where-Object severity -eq "LOW").Count
    unknown = @($findings | Where-Object severity -eq "UNKNOWN").Count
}
$report = [ordered]@{
    schemaVersion = 1
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    source = "https://osv.dev"
    ecosystem = "Maven"
    inventoryCount = $packages.Count
    findingCount = $findings.Count
    totals = $totals
    findings = @($findings)
}

if ($ReportPath) {
    $resolvedReportPath = if ([IO.Path]::IsPathRooted($ReportPath)) {
        [IO.Path]::GetFullPath($ReportPath)
    } else {
        [IO.Path]::GetFullPath((Join-Path $repoRoot $ReportPath))
    }
    $reportDirectory = Split-Path -Parent $resolvedReportPath
    [IO.Directory]::CreateDirectory($reportDirectory) | Out-Null
    [IO.File]::WriteAllText(
        $resolvedReportPath,
        ($report | ConvertTo-Json -Depth 8),
        [Text.UTF8Encoding]::new($false)
    )
    Write-Host "OSV report: $resolvedReportPath"
}

Write-Host "OSV Maven audit: $($packages.Count) dependency; critical=$($totals.critical), high=$($totals.high), moderate=$($totals.moderate), low=$($totals.low), unknown=$($totals.unknown)"
foreach ($finding in $findings) {
    Write-Host "[$($finding.severity)] $($finding.package):$($finding.version) - $($finding.id)"
}

$rank = @{ LOW = 1; MODERATE = 2; HIGH = 3; CRITICAL = 4; UNKNOWN = 4 }
$threshold = $rank[$FailOnSeverity.ToUpperInvariant()]
$blocking = @($findings | Where-Object { $rank[$_.severity] -ge $threshold })
if ($blocking.Count -gt 0) {
    exit 2
}
