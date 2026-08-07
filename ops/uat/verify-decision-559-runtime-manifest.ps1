param(
    [Parameter(Mandatory)][string]$ManifestPath,
    [string]$ExpectedSha256 = "",
    [string]$ReportPath = "",
    [switch]$RequireReady,
    [switch]$RequireApproved
)

$ErrorActionPreference = "Stop"
$manifestFile = (Resolve-Path -LiteralPath $ManifestPath -ErrorAction Stop).Path
$manifestBytes = [IO.File]::ReadAllBytes($manifestFile)
$manifestSha256 = ([Security.Cryptography.SHA256]::Create().ComputeHash($manifestBytes) |
    ForEach-Object { $_.ToString("x2") }) -join ""
if (-not [string]::IsNullOrWhiteSpace($ExpectedSha256) -and
    $manifestSha256 -ne $ExpectedSha256.Trim().ToLowerInvariant()) {
    throw "Manifest SHA-256 X-Content-SHA256 qiymatiga mos emas"
}
$manifest = [Text.Encoding]::UTF8.GetString($manifestBytes) | ConvertFrom-Json
$errors = [Collections.Generic.List[string]]::new()
$expectedSourceSha = "A1E6CF0E05640B962550A7B9B95851404F7B50DF590BBA943846E1CEA5FCC2D3"
$expectedBands = @(@(3) + @(8..33))
$finalOutcomes = @("AUTOMATED_PASS", "MANUAL_PASS", "NOT_APPLICABLE")
$allowedOutcomes = @($finalOutcomes + @("PARTIAL", "BLOCKED_EXTERNAL"))
$allowedReviews = @("PENDING", "ACCEPTED", "REJECTED")

$schemaVersion = [int]$manifest.schemaVersion
if ($schemaVersion -notin @(2, 3, 4)) { $errors.Add("schemaVersion must be 2, 3 or 4") }
if ($manifest.decisionNumber -ne 559) { $errors.Add("decisionNumber must be 559") }
if ("$($manifest.source.sha256)" -ne $expectedSourceSha) { $errors.Add("source SHA-256 is not the approved 559 PDF") }
if ("$($manifest.evidenceSetSha256)" -notmatch '^[a-f0-9]{64}$') { $errors.Add("evidenceSetSha256 is invalid") }

$requirements = @($manifest.requirements)
$bands = @($requirements | ForEach-Object { [int]$_.band } | Sort-Object -Unique)
$missing = @($expectedBands | Where-Object { $_ -notin $bands })
$unexpected = @($bands | Where-Object { $_ -notin $expectedBands })
if ($requirements.Count -ne 27) { $errors.Add("requirements count must be 27") }
if ($missing.Count) { $errors.Add("Missing bands: $($missing -join ', ')") }
if ($unexpected.Count) { $errors.Add("Unexpected bands: $($unexpected -join ', ')") }
if (@($requirements | Group-Object band | Where-Object Count -gt 1).Count) { $errors.Add("Duplicate bands exist") }
if (@($requirements | Group-Object id | Where-Object Count -gt 1).Count) { $errors.Add("Duplicate requirement IDs exist") }

function Add-HashValue($hash, [AllowNull()][object]$value) {
    $text = if ($null -eq $value) { "" } else { [string]$value }
    $bytes = [Text.Encoding]::UTF8.GetBytes($text)
    $hash.AppendData([Text.Encoding]::ASCII.GetBytes("$($bytes.Length):"))
    $hash.AppendData($bytes)
    $hash.AppendData([byte[]]@(0))
}

$incremental = [Security.Cryptography.IncrementalHash]::CreateHash(
    [Security.Cryptography.HashAlgorithmName]::SHA256
)
foreach ($item in @($requirements | Sort-Object band)) {
    if ("$($item.id)" -ne "UAT-559-$(([int]$item.band).ToString('00'))") { $errors.Add("Band $($item.band) ID mismatch") }
    if ("$($item.outcome)" -notin $allowedOutcomes) { $errors.Add("$($item.id) outcome is invalid") }
    if ("$($item.reviewStatus)" -notin $allowedReviews) { $errors.Add("$($item.id) reviewStatus is invalid") }
    if ([string]::IsNullOrWhiteSpace("$($item.owner)")) { $errors.Add("$($item.id) owner is empty") }
    if ("$($item.summary)".Trim().Length -lt 10) { $errors.Add("$($item.id) summary is too short") }
    if ($item.outcome -eq "AUTOMATED_PASS" -and [string]::IsNullOrWhiteSpace("$($item.evidenceReference)")) {
        $errors.Add("$($item.id) AUTOMATED_PASS requires evidenceReference")
    }
    if ($item.outcome -eq "NOT_APPLICABLE" -and
        ([string]::IsNullOrWhiteSpace("$($item.evidenceReference)") -or "$($item.summary)".Trim().Length -lt 20)) {
        $errors.Add("$($item.id) NOT_APPLICABLE requires rationale and reference")
    }
    $itemFiles = if ($schemaVersion -eq 2) { @($item.file) } else { @($item.files) }
    if ($item.outcome -eq "MANUAL_PASS" -and $itemFiles.Count -eq 0) {
        $errors.Add("$($item.id) MANUAL_PASS requires a private evidence file")
    }
    if ($schemaVersion -ge 3 -and $itemFiles.Count -gt 10) { $errors.Add("$($item.id) has more than 10 files") }
    if ($schemaVersion -ge 3 -and @($itemFiles | Group-Object id | Where-Object Count -gt 1).Count) {
        $errors.Add("$($item.id) has duplicate file IDs")
    }
    if ($schemaVersion -ge 3 -and @($itemFiles | Group-Object sha256 | Where-Object Count -gt 1).Count) {
        $errors.Add("$($item.id) has duplicate file hashes")
    }
    foreach ($evidenceFile in $itemFiles) {
        if ("$($evidenceFile.sha256)" -notmatch '^[a-f0-9]{64}$') { $errors.Add("$($item.id) file SHA-256 is invalid") }
        if ([long]$evidenceFile.sizeBytes -lt 1 -or [long]$evidenceFile.sizeBytes -gt 10485760) { $errors.Add("$($item.id) file size is invalid") }
        if ("$($evidenceFile.contentType)" -notin @("application/pdf", "image/png", "image/jpeg")) { $errors.Add("$($item.id) file type is invalid") }
        if ([string]::IsNullOrWhiteSpace("$($evidenceFile.originalName)")) { $errors.Add("$($item.id) file name is empty") }
        if ($schemaVersion -ge 3) {
            $extension = switch ("$($evidenceFile.contentType)") {
                "application/pdf" { ".pdf" }
                "image/png" { ".png" }
                "image/jpeg" { ".jpg" }
            }
            $expectedBundlePath = "evidence/$($item.id)/attachment-$($evidenceFile.id)$extension"
            if ([long]$evidenceFile.id -lt 1 -or "$($evidenceFile.bundlePath)" -ne $expectedBundlePath) {
                $errors.Add("$($item.id) file bundle path/ID is invalid")
            }
            if ([long]$evidenceFile.uploadedById -lt 1 -or [string]::IsNullOrWhiteSpace("$($evidenceFile.uploadedAt)")) {
                $errors.Add("$($item.id) file upload audit is incomplete")
            }
        }
    }
    if ([long]$item.submittedById -lt 1 -or [string]::IsNullOrWhiteSpace("$($item.submittedAt)")) {
        $errors.Add("$($item.id) submitter audit is incomplete")
    }
    if ($item.reviewStatus -ne "PENDING" -and
        ([long]$item.reviewedById -lt 1 -or [string]::IsNullOrWhiteSpace("$($item.reviewedAt)") -or "$($item.reviewNotes)".Trim().Length -lt 5)) {
        $errors.Add("$($item.id) reviewer audit is incomplete")
    }
    if ($item.reviewStatus -eq "ACCEPTED" -and [long]$item.submittedById -eq [long]$item.reviewedById) {
        $errors.Add("$($item.id) was self-reviewed")
    }

    if ($schemaVersion -eq 2) {
        foreach ($value in @(
            $item.id, [string]$item.band, $item.outcome, $item.owner, $item.summary,
            $item.evidenceReference, $item.file.originalName, $item.file.contentType,
            $item.file.sizeBytes, $item.file.sha256, $item.submittedById, $item.submittedAt,
            $item.reviewStatus, $item.reviewNotes, $item.reviewedById, $item.reviewedAt
        )) { Add-HashValue $incremental $value }
    } else {
        foreach ($value in @(
            $item.id, [string]$item.band, $item.outcome, $item.owner, $item.summary,
            $item.evidenceReference, $item.submittedById, $item.submittedAt,
            $item.reviewStatus, $item.reviewNotes, $item.reviewedById, $item.reviewedAt,
            [string]$itemFiles.Count
        )) { Add-HashValue $incremental $value }
        foreach ($evidenceFile in @($itemFiles | Sort-Object id)) {
            foreach ($value in @(
                $evidenceFile.id, $evidenceFile.originalName, $evidenceFile.contentType,
                $evidenceFile.sizeBytes, $evidenceFile.sha256, $evidenceFile.uploadedById,
                $evidenceFile.uploadedAt
            )) { Add-HashValue $incremental $value }
        }
    }
}
$calculatedEvidenceSetSha = ($incremental.GetHashAndReset() | ForEach-Object { $_.ToString("x2") }) -join ""
$incremental.Dispose()
if ($calculatedEvidenceSetSha -ne "$($manifest.evidenceSetSha256)") {
    $errors.Add("evidenceSetSha256 does not match requirement contents")
}

$protocol = $manifest.protocol
$protocolSigned = $protocol.signed -eq $true
if ($protocolSigned) {
    if ([string]::IsNullOrWhiteSpace("$($protocol.number)") -or [string]::IsNullOrWhiteSpace("$($protocol.signedDate)")) {
        $errors.Add("Signed protocol number/date is incomplete")
    }
    $uniqueSignatories = @($protocol.signatories | ForEach-Object { "$($_)".Trim().ToLowerInvariant() } |
        Where-Object { $_.Length -ge 2 } | Sort-Object -Unique)
    if ($uniqueSignatories.Count -lt 3) { $errors.Add("Signed protocol requires at least three distinct signatories") }
    if ("$($protocol.contentType)" -ne "application/pdf" -or "$($protocol.sha256)" -notmatch '^[a-f0-9]{64}$') {
        $errors.Add("Signed protocol PDF metadata is invalid")
    }
    if ([long]$protocol.sizeBytes -lt 1 -or [long]$protocol.sizeBytes -gt 10485760) { $errors.Add("Signed protocol size is invalid") }
}
$protocolBound = $schemaVersion -lt 4 -or "$($protocol.evidenceSetSha256)" -eq "$($manifest.evidenceSetSha256)"
if ($schemaVersion -ge 4 -and $protocolSigned -and -not $protocolBound) {
    $errors.Add("Signed protocol evidenceSetSha256 does not match the manifest evidence snapshot")
}

$requirementsReady = $requirements.Count -eq 27 -and @(
    $requirements | Where-Object { $_.outcome -notin $finalOutcomes -or $_.reviewStatus -ne "ACCEPTED" }
).Count -eq 0 -and @($requirements | Where-Object {
    $_.outcome -eq "MANUAL_PASS" -and
        (($schemaVersion -eq 2 -and $null -eq $_.file) -or ($schemaVersion -ge 3 -and @($_.files).Count -eq 0))
}).Count -eq 0
$ready = $requirementsReady -and $protocolSigned -and $protocolBound
if (($manifest.readyToSubmit -eq $true) -ne $ready) { $errors.Add("readyToSubmit does not match evidence/protocol state") }
if ($manifest.status -in @("IN_REVIEW", "APPROVED") -and
    ([string]::IsNullOrWhiteSpace("$($manifest.submittedByName)") -or [string]::IsNullOrWhiteSpace("$($manifest.submittedAt)"))) {
    $errors.Add("Submitted run audit is incomplete")
}
if ($manifest.status -eq "APPROVED" -and
    (-not $ready -or [string]::IsNullOrWhiteSpace("$($manifest.approvedByName)") -or [string]::IsNullOrWhiteSpace("$($manifest.approvedAt)"))) {
    $errors.Add("Approved run audit/readiness is incomplete")
}

$report = [ordered]@{
    schemaVersion = $schemaVersion
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
    manifestPath = $manifestFile
    manifestSha256 = $manifestSha256
    evidenceSetSha256 = "$($manifest.evidenceSetSha256)"
    requirements = $requirements.Count
    requirementsReady = $requirementsReady
    protocolSigned = $protocolSigned
    protocolEvidenceSetBound = $protocolBound
    runStatus = "$($manifest.status)"
    ready = $ready
    approved = $manifest.status -eq "APPROVED"
    structurallyValid = $errors.Count -eq 0
    errors = @($errors)
}
if (-not [string]::IsNullOrWhiteSpace($ReportPath)) {
    $reportFullPath = [IO.Path]::GetFullPath($ReportPath)
    [IO.Directory]::CreateDirectory((Split-Path -Parent $reportFullPath)) | Out-Null
    [IO.File]::WriteAllText($reportFullPath, (($report | ConvertTo-Json -Depth 6) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
}
$report | ConvertTo-Json -Depth 6
if ($errors.Count) { exit 2 }
if ($RequireReady -and -not $ready) { exit 3 }
if ($RequireApproved -and $manifest.status -ne "APPROVED") { exit 4 }
