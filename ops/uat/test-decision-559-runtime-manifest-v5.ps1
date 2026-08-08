param()

$ErrorActionPreference = "Stop"
$verifier = Join-Path $PSScriptRoot "verify-decision-559-runtime-manifest.ps1"
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ("decision-559-runtime-v5-" + [Guid]::NewGuid().ToString("N"))
[IO.Directory]::CreateDirectory($testRoot) | Out-Null

function Add-HashValue($hash, [AllowNull()][object]$value) {
    $text = if ($null -eq $value) { "" } else { [string]$value }
    $bytes = [Text.Encoding]::UTF8.GetBytes($text)
    $hash.AppendData([Text.Encoding]::ASCII.GetBytes("$($bytes.Length):"))
    $hash.AppendData($bytes)
    $hash.AppendData([byte[]]@(0))
}

function Get-Schema5EvidenceHash($items) {
    $hash = [Security.Cryptography.IncrementalHash]::CreateHash(
        [Security.Cryptography.HashAlgorithmName]::SHA256
    )
    foreach ($item in @($items | Sort-Object band)) {
        $coverage = [Collections.Generic.List[string]]::new()
        foreach ($coverageItem in $item.manualEvidenceCoverage) {
            if ($null -ne $coverageItem) { $coverage.Add([string]$coverageItem) }
        }
        $files = [Collections.Generic.List[object]]::new()
        foreach ($file in $item.files) { if ($null -ne $file) { $files.Add($file) } }
        foreach ($value in @(
            $item.id, [string]$item.band, $item.outcome, $item.owner, $item.summary,
            $item.evidenceReference, [string]$coverage.Count
        )) { Add-HashValue $hash $value }
        foreach ($coverageItem in $coverage) { Add-HashValue $hash $coverageItem }
        foreach ($value in @(
            $item.submittedById, $item.submittedAt, $item.reviewStatus, $item.reviewNotes,
            $item.reviewedById, $item.reviewedAt, [string]$files.Count
        )) { Add-HashValue $hash $value }
        foreach ($file in @($files | Sort-Object id)) {
            foreach ($value in @(
                $file.id, $file.originalName, $file.contentType, $file.sizeBytes,
                $file.sha256, $file.uploadedById, $file.uploadedAt
            )) { Add-HashValue $hash $value }
        }
    }
    $result = ($hash.GetHashAndReset() | ForEach-Object { $_.ToString("x2") }) -join ""
    $hash.Dispose()
    return $result
}

try {
    $catalogPath = Join-Path $PSScriptRoot "..\..\docs\uat\decision-559-uat-evidence.json"
    $catalog = [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $catalogPath).Path)) |
        ConvertFrom-Json
    $manualByBand = @{}
    foreach ($catalogItem in @($catalog.requirements | Where-Object status -eq "PARTIAL")) {
        $manualByBand[[int]$catalogItem.band] = @($catalogItem.manualEvidence)
    }
    $timestamp = "2026-08-07T06:00:00Z"
    $requirements = @(@(3) + @(8..33)) | ForEach-Object {
        $band = [int]$_
        $id = "UAT-559-$($band.ToString('00'))"
        $expectedCoverage = if ($manualByBand.ContainsKey($band)) { @($manualByBand[$band]) } else { @() }
        $manualCount = $expectedCoverage.Count
        $coverage = [Collections.Generic.List[object]]::new()
        if ($manualCount -gt 0) {
            $expectedCoverage | ForEach-Object { $coverage.Add($_) }
        }
        $files = [Collections.Generic.List[object]]::new()
        if ($manualCount -gt 0) {
            $files.Add([ordered]@{
                id = 100 + $band
                bundlePath = "evidence/$id/attachment-$(100 + $band).pdf"
                originalName = "band-$band.pdf"
                contentType = "application/pdf"
                sizeBytes = 128
                sha256 = ([char](97 + ($band % 6))).ToString() * 64
                uploadedById = 1
                uploadedByName = "Dalil muallifi"
                uploadedAt = $timestamp
            })
        }
        [ordered]@{
            id = $id
            band = $band
            outcome = if ($manualCount -gt 0) { "MANUAL_PASS" } else { "AUTOMATED_PASS" }
            owner = "V51 verifier egasi"
            summary = "$band-band mustaqil verifier uchun yetarli xulosa"
            evidenceReference = "V51-REPORT-$band"
            manualEvidenceCoverage = $coverage
            file = $null
            files = $files
            submittedById = 1
            submittedByName = "Dalil muallifi"
            submittedAt = $timestamp
            reviewStatus = "ACCEPTED"
            reviewNotes = "Mustaqil tekshirildi"
            reviewedById = 2
            reviewedByName = "Mustaqil reviewer"
            reviewedAt = $timestamp
        }
    }

    $manifest = [ordered]@{
        schemaVersion = 5
        decisionNumber = 559
        runId = 51
        title = "V51 runtime verifier regression"
        snapshotAt = $timestamp
        source = [ordered]@{
            fileName = "559-son qaror.pdf"
            pageCount = 10
            sha256 = "A1E6CF0E05640B962550A7B9B95851404F7B50DF590BBA943846E1CEA5FCC2D3"
        }
        status = "DRAFT"
        evidenceSetSha256 = "0" * 64
        readyToSubmit = $false
        manualEvidenceRequiredCount = 43
        manualEvidenceCoveredCount = 43
        manualEvidenceAcceptedCount = 43
        protocol = [ordered]@{
            signed = $false; number = $null; signedDate = $null; signatories = @()
            originalName = $null; contentType = $null; sizeBytes = $null; sha256 = $null
            evidenceSetSha256 = $null; uploadedByName = $null; uploadedAt = $null
        }
        requirements = $requirements
        submittedByName = $null
        submittedAt = $null
        approvedByName = $null
        approvedAt = $null
    }
    $roundTrip = ($manifest | ConvertTo-Json -Depth 20) | ConvertFrom-Json
    $manifest.evidenceSetSha256 = Get-Schema5EvidenceHash $roundTrip.requirements
    $validPath = Join-Path $testRoot "valid-v5.json"
    [IO.File]::WriteAllText($validPath, (($manifest | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $validOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier -ManifestPath $validPath 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "To'liq schema-v5 manifest rad etildi: $validOutput" }
    $validReport = $validOutput | ConvertFrom-Json
    if (-not $validReport.structurallyValid -or -not $validReport.requirementsReady -or $validReport.manualEvidenceCoverage -ne 43) {
        throw "Schema-v5 verifier 27/43 invariantini tasdiqlamadi"
    }

    $partialManifest = ($manifest | ConvertTo-Json -Depth 20) | ConvertFrom-Json
    $partialManifest.requirements[1].outcome = "PARTIAL"
    $partialManifest.requirements[1].manualEvidenceCoverage = @($partialManifest.requirements[1].manualEvidenceCoverage | Select-Object -First 2)
    $partialManifest.requirements[1].reviewStatus = "PENDING"
    $partialManifest.requirements[1].reviewNotes = $null
    $partialManifest.requirements[1].reviewedById = $null
    $partialManifest.requirements[1].reviewedByName = $null
    $partialManifest.requirements[1].reviewedAt = $null
    $partialManifest.manualEvidenceCoveredCount = 40
    $partialManifest.manualEvidenceAcceptedCount = 38
    $partialManifest.evidenceSetSha256 = Get-Schema5EvidenceHash $partialManifest.requirements
    $partialPath = Join-Path $testRoot "progressive-partial-v5.json"
    [IO.File]::WriteAllText($partialPath, (($partialManifest | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $partialOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier -ManifestPath $partialPath 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "Qisman checklist progressli schema-v5 manifest rad etildi: $partialOutput" }
    $partialReport = $partialOutput | ConvertFrom-Json
    if (-not $partialReport.structurallyValid -or $partialReport.requirementsReady -or
        $partialReport.manualEvidenceCoverage -ne 40 -or $partialReport.manualEvidenceAccepted -ne 38) {
        throw "Qisman schema-v5 progress summary noto'g'ri"
    }

    $wrongTextManifest = ($manifest | ConvertTo-Json -Depth 20) | ConvertFrom-Json
    $wrongTextManifest.requirements[1].manualEvidenceCoverage[0] = "Tasdiqlangan katalogda mavjud bo'lmagan soxta checklist"
    $wrongTextManifest.evidenceSetSha256 = Get-Schema5EvidenceHash $wrongTextManifest.requirements
    $wrongTextPath = Join-Path $testRoot "wrong-catalog-text-v5.json"
    [IO.File]::WriteAllText($wrongTextPath, (($wrongTextManifest | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $wrongTextOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier -ManifestPath $wrongTextPath 2>&1 | Out-String
    if ($LASTEXITCODE -ne 2) { throw "Hashi qayta hisoblangan soxta checklist matni exit 2 bilan rad etilmadi: $wrongTextOutput" }

    $manifest.requirements[1].manualEvidenceCoverage = @($manifest.requirements[1].manualEvidenceCoverage | Select-Object -Skip 1)
    $tamperedPath = Join-Path $testRoot "missing-coverage-v5.json"
    [IO.File]::WriteAllText($tamperedPath, (($manifest | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $tamperedOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier -ManifestPath $tamperedPath 2>&1 | Out-String
    if ($LASTEXITCODE -ne 2) { throw "Checklisti kamaytirilgan schema-v5 manifest exit 2 bilan rad etilmadi: $tamperedOutput" }

    [pscustomobject]@{
        schemaVersion = 5
        requirements = 27
        manualEvidenceCoverage = 43
        validAccepted = $true
        progressivePartialAccepted = $true
        catalogTextTamperRejected = $true
        missingCoverageRejected = $true
        evidenceHashTamperRejected = $true
    } | ConvertTo-Json
} finally {
    if ([IO.Directory]::Exists($testRoot)) { [IO.Directory]::Delete($testRoot, $true) }
}
