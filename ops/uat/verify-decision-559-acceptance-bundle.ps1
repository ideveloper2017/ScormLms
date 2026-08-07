param(
    [Parameter(Mandatory)][string]$BundlePath,
    [string]$ExpectedSha256 = "",
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-Sha256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Test-SafeEntryName([string]$Name) {
    if ([string]::IsNullOrWhiteSpace($Name) -or $Name.StartsWith("/") -or $Name.Contains("\") -or $Name.Contains(":")) {
        return $false
    }
    $parts = @($Name.Split("/"))
    return -not ($parts | Where-Object { $_ -in @("", ".", "..") })
}

$bundleFile = (Resolve-Path -LiteralPath $BundlePath -ErrorAction Stop).Path
$bundleSha256 = Get-Sha256 $bundleFile
$errors = [Collections.Generic.List[string]]::new()
if (-not [string]::IsNullOrWhiteSpace($ExpectedSha256) -and
    $bundleSha256 -ne $ExpectedSha256.Trim().ToLowerInvariant()) {
    $errors.Add("Bundle SHA-256 X-Content-SHA256 qiymatiga mos emas")
}

$extractRoot = Join-Path ([IO.Path]::GetTempPath()) ("decision-559-bundle-" + [Guid]::NewGuid().ToString("N"))
$extractRoot = [IO.Path]::GetFullPath($extractRoot)
$tempPrefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
if (-not $extractRoot.StartsWith($tempPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Vaqtinchalik extraction yo'li tizim temp katalogidan tashqarida"
}
[IO.Directory]::CreateDirectory($extractRoot) | Out-Null
$archive = $null
$entryNames = [Collections.Generic.List[string]]::new()
$runtimeReport = $null
$manifest = $null
$totalUncompressedBytes = 0L

try {
    $archive = [IO.Compression.ZipFile]::OpenRead($bundleFile)
    if ($archive.Entries.Count -gt 273) { $errors.Add("Bundle 273 tadan ortiq ZIP entry saqlaydi") }
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $archive.Entries) {
        $name = "$($entry.FullName)"
        if (-not (Test-SafeEntryName $name)) {
            $errors.Add("Unsafe ZIP entry: $name")
            continue
        }
        if (-not $seen.Add($name)) {
            $errors.Add("Duplicate ZIP entry: $name")
            continue
        }
        $entryLimit = if ($name -in @("manifest.json", "SHA256SUMS")) { 5MB } else { 10MB }
        if ($entry.Length -lt 0 -or $entry.Length -gt $entryLimit) {
            $errors.Add("ZIP entry hajmi ruxsat etilgan chegaradan tashqarida: $name")
            continue
        }
        $totalUncompressedBytes += $entry.Length
        if ($totalUncompressedBytes -gt 300MB) {
            $errors.Add("Bundle umumiy ochilgan hajmi 300 MB chegaradan oshadi")
            continue
        }
        if ($entry.Length -gt 1MB -and $entry.CompressedLength -gt 0 -and
            ($entry.Length / $entry.CompressedLength) -gt 1000) {
            $errors.Add("ZIP entry shubhali compression ratio bilan rad etildi: $name")
            continue
        }
        $target = [IO.Path]::GetFullPath((Join-Path $extractRoot $name.Replace('/', [IO.Path]::DirectorySeparatorChar)))
        $extractPrefix = $extractRoot.TrimEnd('\') + '\'
        if (-not $target.StartsWith($extractPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            $errors.Add("ZIP entry extraction rootdan tashqariga chiqadi: $name")
            continue
        }
        [IO.Directory]::CreateDirectory((Split-Path -Parent $target)) | Out-Null
        $source = $entry.Open()
        try {
            $destination = [IO.File]::Open($target, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
            try { $source.CopyTo($destination) } finally { $destination.Dispose() }
        } finally {
            $source.Dispose()
        }
        $entryNames.Add($name)
    }
    $archive.Dispose()
    $archive = $null

    foreach ($required in @("manifest.json", "SHA256SUMS", "protocol/signed-protocol.pdf")) {
        if ($required -notin $entryNames) { $errors.Add("Required bundle entry missing: $required") }
    }

    $sumsPath = Join-Path $extractRoot "SHA256SUMS"
    $checksums = @{}
    if (Test-Path -LiteralPath $sumsPath -PathType Leaf) {
        foreach ($line in [IO.File]::ReadAllLines($sumsPath, [Text.Encoding]::UTF8)) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            if ($line -notmatch '^([a-f0-9]{64})  ([A-Za-z0-9._/-]+)$') {
                $errors.Add("Invalid SHA256SUMS line: $line")
                continue
            }
            $hash = $Matches[1]
            $name = $Matches[2]
            if (-not (Test-SafeEntryName $name) -or $name -eq "SHA256SUMS") {
                $errors.Add("Invalid SHA256SUMS path: $name")
                continue
            }
            if ($checksums.ContainsKey($name)) {
                $errors.Add("Duplicate SHA256SUMS path: $name")
                continue
            }
            $checksums[$name] = $hash
        }
    }

    $payloadEntries = @($entryNames | Where-Object { $_ -ne "SHA256SUMS" } | Sort-Object)
    foreach ($name in $payloadEntries) {
        if (-not $checksums.ContainsKey($name)) {
            $errors.Add("Bundle entry SHA256SUMSda yo'q: $name")
            continue
        }
        $actual = Get-Sha256 (Join-Path $extractRoot $name.Replace('/', [IO.Path]::DirectorySeparatorChar))
        if ($actual -ne $checksums[$name]) { $errors.Add("Bundle entry SHA-256 mos emas: $name") }
    }
    foreach ($name in @($checksums.Keys)) {
        if ($name -notin $payloadEntries) { $errors.Add("SHA256SUMSda mavjud bo'lmagan entry qayd etilgan: $name") }
    }

    $manifestPath = Join-Path $extractRoot "manifest.json"
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        $manifest = [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($manifestPath)) | ConvertFrom-Json
        $manifestExpected = if ($checksums.ContainsKey("manifest.json")) { $checksums["manifest.json"] } else { "" }
        $runtimeVerifier = Join-Path $PSScriptRoot "verify-decision-559-runtime-manifest.ps1"
        $runtimeReportPath = Join-Path $extractRoot "runtime-manifest-verification.json"
        $runtimeOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runtimeVerifier `
            -ManifestPath $manifestPath -ExpectedSha256 $manifestExpected -ReportPath $runtimeReportPath `
            -RequireReady -RequireApproved 2>&1 | Out-String
        $runtimeExit = $LASTEXITCODE
        if ($runtimeExit -ne 0) {
            $errors.Add("Runtime manifest verifier failed with exit $runtimeExit`: $($runtimeOutput.Trim())")
        } elseif (Test-Path -LiteralPath $runtimeReportPath) {
            $runtimeReport = Get-Content -LiteralPath $runtimeReportPath -Raw | ConvertFrom-Json
        }

        $expectedPayloads = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        [void]$expectedPayloads.Add("manifest.json")
        foreach ($item in @($manifest.requirements)) {
            $itemFiles = if ([int]$manifest.schemaVersion -eq 2) { @($item.file) } else { @($item.files) }
            foreach ($evidenceFile in $itemFiles) {
                if ([int]$manifest.schemaVersion -eq 2) {
                    $extension = switch ("$($evidenceFile.contentType)") {
                        "application/pdf" { ".pdf" }
                        "image/png" { ".png" }
                        "image/jpeg" { ".jpg" }
                        default { $errors.Add("Unknown evidence content type for $($item.id)"); "" }
                    }
                    $entryName = "evidence/$($item.id)/evidence$extension"
                } else {
                    $entryName = "$($evidenceFile.bundlePath)"
                }
                if ([string]::IsNullOrEmpty($entryName)) { continue }
                [void]$expectedPayloads.Add($entryName)
                if ($entryName -notin $payloadEntries) { $errors.Add("Manifest evidence file bundle ichida yo'q: $entryName") }
                elseif ($checksums[$entryName] -ne "$($evidenceFile.sha256)") { $errors.Add("Manifest/bundle evidence SHA mos emas: $entryName") }
            }
        }
        if ($manifest.protocol.signed -eq $true) {
            [void]$expectedPayloads.Add("protocol/signed-protocol.pdf")
            if ($checksums["protocol/signed-protocol.pdf"] -ne "$($manifest.protocol.sha256)") {
                $errors.Add("Manifest/bundle protocol SHA mos emas")
            }
        }
        foreach ($name in $payloadEntries) {
            if (-not $expectedPayloads.Contains($name)) { $errors.Add("Manifestda qayd etilmagan payload: $name") }
        }
    }
} catch {
    $errors.Add("Bundle o'qilmadi: $($_.Exception.Message)")
} finally {
    if ($null -ne $archive) { $archive.Dispose() }
}

$report = [ordered]@{
    schemaVersion = 1
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
    bundlePath = $bundleFile
    bundleSha256 = $bundleSha256
    entries = $entryNames.Count
    uncompressedBytes = $totalUncompressedBytes
    runId = if ($null -ne $manifest) { $manifest.runId } else { $null }
    evidenceSetSha256 = if ($null -ne $manifest) { "$($manifest.evidenceSetSha256)" } else { $null }
    ready = if ($null -ne $runtimeReport) { $runtimeReport.ready } else { $false }
    approved = if ($null -ne $runtimeReport) { $runtimeReport.approved } else { $false }
    valid = $errors.Count -eq 0
    errors = @($errors)
}
if (-not [string]::IsNullOrWhiteSpace($ReportPath)) {
    $reportFullPath = [IO.Path]::GetFullPath($ReportPath)
    $reportParent = Split-Path -Parent $reportFullPath
    if (-not [string]::IsNullOrWhiteSpace($reportParent)) { [IO.Directory]::CreateDirectory($reportParent) | Out-Null }
    [IO.File]::WriteAllText($reportFullPath, (($report | ConvertTo-Json -Depth 8) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
}
$report | ConvertTo-Json -Depth 8

if ($extractRoot.StartsWith($tempPrefix, [StringComparison]::OrdinalIgnoreCase) -and [IO.Directory]::Exists($extractRoot)) {
    [IO.Directory]::Delete($extractRoot, $true)
}
if ($errors.Count) { exit 2 }
