param(
    [Parameter(Mandatory)][string]$BundlePath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$source = (Resolve-Path -LiteralPath $BundlePath -ErrorAction Stop).Path
$verifier = Join-Path $PSScriptRoot "verify-decision-559-acceptance-bundle.ps1"
$systemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
$testRoot = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) ("decision-559-bundle-test-" + [Guid]::NewGuid().ToString("N"))))
if (-not $testRoot.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Verifier regression katalogi tizim temp katalogidan tashqarida"
}
[IO.Directory]::CreateDirectory($testRoot) | Out-Null

function Invoke-ExpectedRejection([string]$Path, [string]$CaseName) {
    $sha = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier `
        -BundlePath $Path -ExpectedSha256 $sha 2>&1 | Out-String
    if ($LASTEXITCODE -ne 2) {
        throw "$CaseName verifier tomonidan exit 2 bilan rad etilmadi (exit=$LASTEXITCODE): $output"
    }
}

try {
    $tampered = Join-Path $testRoot "tampered-payload.zip"
    [IO.File]::Copy($source, $tampered, $false)
    $archive = [IO.Compression.ZipFile]::Open($tampered, [IO.Compression.ZipArchiveMode]::Update)
    try {
        $entry = @($archive.Entries | Where-Object { $_.FullName -like "evidence/*" }) | Select-Object -First 1
        if ($null -eq $entry) { throw "Regression fixtureda evidence entry topilmadi" }
        $stream = $entry.Open()
        try {
            $stream.SetLength(0)
            $bytes = [Text.Encoding]::UTF8.GetBytes("%PDF-1.4 tampered payload")
            $stream.Write($bytes, 0, $bytes.Length)
        } finally {
            $stream.Dispose()
        }
    } finally {
        $archive.Dispose()
    }
    Invoke-ExpectedRejection $tampered "Ichki dalili buzilgan bundle"

    $unboundProtocol = Join-Path $testRoot "protocol-evidence-binding-tampered.zip"
    [IO.File]::Copy($source, $unboundProtocol, $false)
    $archive = [IO.Compression.ZipFile]::Open($unboundProtocol, [IO.Compression.ZipArchiveMode]::Update)
    try {
        $manifestEntry = $archive.GetEntry("manifest.json")
        $sumsEntry = $archive.GetEntry("SHA256SUMS")
        if ($null -eq $manifestEntry -or $null -eq $sumsEntry) {
            throw "Regression fixtureda manifest yoki SHA256SUMS topilmadi"
        }
        $reader = [IO.StreamReader]::new($manifestEntry.Open(), [Text.Encoding]::UTF8)
        try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
        if ([int]$manifest.schemaVersion -lt 4) { throw "Protocol binding regression fixture schema-v4 emas" }
        $currentBinding = "$($manifest.protocol.evidenceSetSha256)"
        $manifest.protocol.evidenceSetSha256 = if ($currentBinding.StartsWith("0")) {
            "1" + $currentBinding.Substring(1)
        } else {
            "0" + $currentBinding.Substring(1)
        }
        $manifestBytes = [Text.Encoding]::UTF8.GetBytes(($manifest | ConvertTo-Json -Depth 20 -Compress))
        $manifestHash = ([Security.Cryptography.SHA256]::Create().ComputeHash($manifestBytes) |
            ForEach-Object { $_.ToString("x2") }) -join ""
        $reader = [IO.StreamReader]::new($sumsEntry.Open(), [Text.Encoding]::UTF8)
        try { $sumsText = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $updatedSums = $sumsText -replace '(?m)^[a-f0-9]{64}  manifest\.json\r?$', "$manifestHash  manifest.json"
        if ($updatedSums -eq $sumsText) { throw "Manifest checksum satri yangilanmadi" }
        $manifestEntry.Delete()
        $sumsEntry.Delete()
        $newManifestEntry = $archive.CreateEntry("manifest.json", [IO.Compression.CompressionLevel]::Optimal)
        $stream = $newManifestEntry.Open()
        try { $stream.Write($manifestBytes, 0, $manifestBytes.Length) } finally { $stream.Dispose() }
        $sumsBytes = [Text.Encoding]::UTF8.GetBytes($updatedSums)
        $newSumsEntry = $archive.CreateEntry("SHA256SUMS", [IO.Compression.CompressionLevel]::Optimal)
        $stream = $newSumsEntry.Open()
        try { $stream.Write($sumsBytes, 0, $sumsBytes.Length) } finally { $stream.Dispose() }
    } finally {
        $archive.Dispose()
    }
    Invoke-ExpectedRejection $unboundProtocol "Boshqa evidence snapshotiga bog'langan protokolli bundle"

    $unsafe = Join-Path $testRoot "unsafe-path.zip"
    $archive = [IO.Compression.ZipFile]::Open($unsafe, [IO.Compression.ZipArchiveMode]::Create)
    try {
        $entry = $archive.CreateEntry("../escape.txt")
        $stream = $entry.Open()
        try {
            $bytes = [Text.Encoding]::UTF8.GetBytes("must not escape")
            $stream.Write($bytes, 0, $bytes.Length)
        } finally {
            $stream.Dispose()
        }
    } finally {
        $archive.Dispose()
    }
    Invoke-ExpectedRejection $unsafe "Path traversal entryli bundle"

    $validSha = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    $wrongSha = if ($validSha.StartsWith("0")) { "1" + $validSha.Substring(1) } else { "0" + $validSha.Substring(1) }
    $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier `
        -BundlePath $source -ExpectedSha256 $wrongSha 2>&1 | Out-String
    if ($LASTEXITCODE -ne 2) {
        throw "Noto'g'ri detached SHA exit 2 bilan rad etilmadi (exit=$LASTEXITCODE): $output"
    }

    [pscustomobject]@{
        validBundle = $source
        tamperedPayloadRejected = $true
        protocolEvidenceBindingTamperRejected = $true
        unsafePathRejected = $true
        wrongDetachedShaRejected = $true
    } | ConvertTo-Json
} finally {
    if ($testRoot.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase) -and [IO.Directory]::Exists($testRoot)) {
        [IO.Directory]::Delete($testRoot, $true)
    }
}
