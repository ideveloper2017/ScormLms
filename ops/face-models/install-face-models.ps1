# Yuz tanish modellarini (OpenCV Zoo: YuNet + SFace) FACE_MODEL_DIR ga o'rnatadi va SHA-256 bilan tekshiradi.
# Backend (SFaceRecognizer) aynan shu hash'larni talab qiladi; mos kelmasa yuz tekshiruvi fail-closed.
#
#   .\ops\face-models\install-face-models.ps1                       # standart: .\private\face-models
#   .\ops\face-models\install-face-models.ps1 -ModelDir D:\lms\face-models
param(
    [string]$ModelDir = $(if ($env:FACE_MODEL_DIR) { $env:FACE_MODEL_DIR } else { Join-Path $PSScriptRoot '..\..\private\face-models' })
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$base = 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models'
$models = @(
    @{ Name = 'face_detection_yunet_2023mar.onnx'; Url = "$base/face_detection_yunet/face_detection_yunet_2023mar.onnx"; Sha256 = '8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4' },
    @{ Name = 'face_recognition_sface_2021dec.onnx'; Url = "$base/face_recognition_sface/face_recognition_sface_2021dec.onnx"; Sha256 = '0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79' }
)

New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null
$ModelDir = (Resolve-Path $ModelDir).Path
foreach ($model in $models) {
    $target = Join-Path $ModelDir $model.Name
    if ((Test-Path $target) -and ((Get-FileHash $target -Algorithm SHA256).Hash.ToLower() -eq $model.Sha256)) {
        Write-Host "OK (mavjud): $($model.Name)"
        continue
    }
    $tmp = "$target.download"
    Write-Host "Yuklanmoqda: $($model.Name)"
    Invoke-WebRequest -Uri $model.Url -OutFile $tmp
    if ((Get-FileHash $tmp -Algorithm SHA256).Hash.ToLower() -ne $model.Sha256) {
        Remove-Item $tmp -Force
        throw "$($model.Name) SHA-256 mos emas - fayl o'rnatilmadi"
    }
    Move-Item -Force $tmp $target
    Write-Host "OK: $($model.Name)"
}
Write-Host "Yuz tanish modellari tayyor: $ModelDir"
