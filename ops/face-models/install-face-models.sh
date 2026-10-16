#!/usr/bin/env bash
# Yuz tanish modellarini (OpenCV Zoo: YuNet + SFace) FACE_MODEL_DIR ga o'rnatadi va SHA-256 bilan tekshiradi.
# Backend (SFaceRecognizer) aynan shu hash'larni talab qiladi; mos kelmasa yuz tekshiruvi fail-closed.
#
#   FACE_MODEL_DIR=/var/lib/scorm-lms/face-models ./ops/face-models/install-face-models.sh
set -euo pipefail

DIR="${FACE_MODEL_DIR:-/var/lib/scorm-lms/face-models}"
BASE="https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models"

declare -A URLS=(
  [face_detection_yunet_2023mar.onnx]="$BASE/face_detection_yunet/face_detection_yunet_2023mar.onnx"
  [face_recognition_sface_2021dec.onnx]="$BASE/face_recognition_sface/face_recognition_sface_2021dec.onnx"
)
declare -A SHA256=(
  [face_detection_yunet_2023mar.onnx]="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4"
  [face_recognition_sface_2021dec.onnx]="0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79"
)

mkdir -p "$DIR"
for name in "${!URLS[@]}"; do
  target="$DIR/$name"
  if [[ -f "$target" ]] && echo "${SHA256[$name]}  $target" | sha256sum -c --status; then
    echo "OK (mavjud): $name"
    continue
  fi
  tmp="$(mktemp "$DIR/.${name}.XXXXXX")"
  echo "Yuklanmoqda: $name"
  curl -fsSL --retry 3 -o "$tmp" "${URLS[$name]}"
  if ! echo "${SHA256[$name]}  $tmp" | sha256sum -c --status; then
    rm -f "$tmp"
    echo "XATO: $name SHA-256 mos emas — fayl o'rnatilmadi" >&2
    exit 1
  fi
  chmod 0644 "$tmp"
  mv -f "$tmp" "$target"
  echo "OK: $name"
done
echo "Yuz tanish modellari tayyor: $DIR"
