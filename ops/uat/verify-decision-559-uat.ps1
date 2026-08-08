param(
    [string]$ManifestPath = "docs\uat\decision-559-uat-evidence.json",
    [string]$ReportPath = "",
    [switch]$RequireReady
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$repoPrefix = $repoRoot.TrimEnd('\') + '\'

function Resolve-RepoFile([string]$relativePath) {
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
        throw "Evidence path must not be empty."
    }
    $fullPath = [IO.Path]::GetFullPath((Join-Path $repoRoot $relativePath))
    if (-not $fullPath.StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Evidence path leaves repository root: $relativePath"
    }
    return $fullPath
}

$manifestFile = Resolve-RepoFile $ManifestPath
if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) {
    throw "UAT manifest not found: $manifestFile"
}
$manifest = Get-Content -Raw -LiteralPath $manifestFile | ConvertFrom-Json

$errors = [System.Collections.Generic.List[string]]::new()
$allowedStatuses = @(
    "AUTOMATED_PASS",
    "MANUAL_PASS",
    "NOT_APPLICABLE",
    "MANUAL_PENDING",
    "PARTIAL",
    "BLOCKED_EXTERNAL",
    "NOT_IMPLEMENTED"
)

if ($manifest.schemaVersion -ne 2) { $errors.Add("schemaVersion must be 2") }
if ($manifest.decisionNumber -ne 559) { $errors.Add("decisionNumber must be 559") }

$requirements = @($manifest.requirements)
if ($requirements.Count -eq 0) { $errors.Add("requirements must not be empty") }

$duplicateIds = @($requirements | Group-Object id | Where-Object Count -gt 1 | ForEach-Object Name)
if ($duplicateIds.Count -gt 0) { $errors.Add("Duplicate requirement IDs: $($duplicateIds -join ', ')") }

$duplicateBands = @($requirements | Group-Object band | Where-Object Count -gt 1 | ForEach-Object Name)
if ($duplicateBands.Count -gt 0) { $errors.Add("Each band must have one manifest record. Duplicate bands: $($duplicateBands -join ', ')") }

$actualBands = @($requirements | ForEach-Object { [int]$_.band } | Sort-Object -Unique)
$expectedBands = @(@(3) + @(8..33))
$missingBands = @($expectedBands | Where-Object { $_ -notin $actualBands })
$unexpectedBands = @($actualBands | Where-Object { $_ -notin $expectedBands })
if ($missingBands.Count -gt 0) { $errors.Add("Missing bands: $($missingBands -join ', ')") }
if ($unexpectedBands.Count -gt 0) { $errors.Add("Unexpected bands: $($unexpectedBands -join ', ')") }

foreach ($requirement in $requirements) {
    if ([string]::IsNullOrWhiteSpace("$($requirement.id)")) {
        $errors.Add("Band $($requirement.band) has no ID")
    }
    $manualEvidence = @($requirement.manualEvidence | Where-Object { $null -ne $_ })
    if ($requirement.status -eq "PARTIAL" -and $manualEvidence.Count -eq 0) {
        $errors.Add("PARTIAL band $($requirement.band) must list manualEvidence")
    }
    if ($requirement.status -ne "PARTIAL" -and $manualEvidence.Count -gt 0) {
        $errors.Add("Non-PARTIAL band $($requirement.band) must not list manualEvidence")
    }
    if (@($manualEvidence | Where-Object { [string]::IsNullOrWhiteSpace("$_") }).Count -gt 0) {
        $errors.Add("Band $($requirement.band) contains blank manualEvidence")
    }
    if ("$($requirement.status)" -notin $allowedStatuses) {
        $errors.Add("$($requirement.id) has unsupported status '$($requirement.status)'")
    }
    if ([string]::IsNullOrWhiteSpace("$($requirement.owner)")) {
        $errors.Add("$($requirement.id) has no owner")
    }
    if ([string]::IsNullOrWhiteSpace("$($requirement.note)")) {
        $errors.Add("$($requirement.id) has no note/rationale")
    }

    $evidence = @($requirement.evidence) | Where-Object { -not [string]::IsNullOrWhiteSpace("$_") }
    if ($requirement.status -in @("AUTOMATED_PASS", "MANUAL_PASS", "NOT_APPLICABLE") -and $evidence.Count -eq 0) {
        $errors.Add("$($requirement.id) status $($requirement.status) requires archived evidence")
    }
    foreach ($relativePath in $evidence) {
        try {
            $fullPath = Resolve-RepoFile "$relativePath"
            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $errors.Add("$($requirement.id) evidence file is missing: $relativePath")
            }
        } catch {
            $errors.Add("$($requirement.id) invalid evidence path '$relativePath': $($_.Exception.Message)")
        }
    }
}

try {
    $protocolTemplate = Resolve-RepoFile "$($manifest.protocol.templatePath)"
    if (-not (Test-Path -LiteralPath $protocolTemplate -PathType Leaf)) {
        $errors.Add("Protocol template is missing: $($manifest.protocol.templatePath)")
    }
} catch {
    $errors.Add("Invalid protocol template path: $($_.Exception.Message)")
}

if ($manifest.protocol.signed -eq $true) {
    if ([string]::IsNullOrWhiteSpace("$($manifest.protocol.signedEvidencePath)")) {
        $errors.Add("Signed protocol flag requires signedEvidencePath")
    } else {
        try {
            $signedProtocol = Resolve-RepoFile "$($manifest.protocol.signedEvidencePath)"
            if (-not (Test-Path -LiteralPath $signedProtocol -PathType Leaf)) {
                $errors.Add("Signed protocol evidence is missing: $($manifest.protocol.signedEvidencePath)")
            }
        } catch {
            $errors.Add("Invalid signed protocol path: $($_.Exception.Message)")
        }
    }
    $signatories = @($manifest.protocol.signatories)
    if ($signatories.Count -lt 3) {
        $errors.Add("Signed protocol requires at least three signatories")
    }
    foreach ($signatory in $signatories) {
        if ([string]::IsNullOrWhiteSpace("$($signatory.name)") -or
            [string]::IsNullOrWhiteSpace("$($signatory.role)") -or
            [string]::IsNullOrWhiteSpace("$($signatory.signedAt)")) {
            $errors.Add("Every signatory requires name, role and signedAt")
        }
    }
}

$statusCounts = [ordered]@{}
foreach ($status in $allowedStatuses) {
    $statusCounts[$status] = @($requirements | Where-Object status -eq $status).Count
}
$readyStatuses = @("AUTOMATED_PASS", "MANUAL_PASS", "NOT_APPLICABLE")
$blockers = @(
    $requirements |
        Where-Object { $_.status -notin $readyStatuses } |
        ForEach-Object {
            [ordered]@{
                id = $_.id
                band = $_.band
                status = $_.status
                owner = $_.owner
                note = $_.note
            }
        }
)
$structurallyValid = $errors.Count -eq 0
$requirementsReady = $blockers.Count -eq 0
$manualEvidenceItemCount = @($requirements | ForEach-Object { $_.manualEvidence } | Where-Object { $null -ne $_ }).Count
$protocolSigned = $manifest.protocol.signed -eq $true
$readyForAcceptance = $structurallyValid -and $requirementsReady -and $protocolSigned

$report = [ordered]@{
    schemaVersion = 1
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    manifestPath = $ManifestPath.Replace('\', '/')
    bandCoverage = [ordered]@{ from = 3; to = 33; requiredBands = $expectedBands; count = $requirements.Count }
    statusCounts = $statusCounts
    structurallyValid = $structurallyValid
    requirementsReady = $requirementsReady
    manualEvidenceItemCount = $manualEvidenceItemCount
    protocolSigned = $protocolSigned
    readyForAcceptance = $readyForAcceptance
    errors = @($errors)
    blockers = $blockers
}

if (-not [string]::IsNullOrWhiteSpace($ReportPath)) {
    $resolvedReport = Resolve-RepoFile $ReportPath
    [IO.Directory]::CreateDirectory((Split-Path -Parent $resolvedReport)) | Out-Null
    [IO.File]::WriteAllText(
        $resolvedReport,
        (($report | ConvertTo-Json -Depth 8) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
    )
    Write-Host "UAT readiness report: $resolvedReport"
}

Write-Host "UAT-559: bands=$($requirements.Count), structural=$structurallyValid, requirementsReady=$requirementsReady, protocolSigned=$protocolSigned, ready=$readyForAcceptance"
Write-Host "MANUAL_EVIDENCE_ITEMS=$manualEvidenceItemCount"
foreach ($status in $allowedStatuses) {
    Write-Host "$status=$($statusCounts[$status])"
}

if (-not $structurallyValid) { exit 2 }
if ($RequireReady -and -not $readyForAcceptance) { exit 3 }
