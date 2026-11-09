# face-api.js modellari

Brauzerda yuzni aniqlash uchun [face-api.js](https://github.com/justadudewhohacks/face-api.js) modellari.
Bu papkada **faqat kod yuklaydigan** modellar turadi (jami ~13 MB):

| Model | Qayerda ishlatiladi |
| --- | --- |
| `tiny_face_detector` | yuz rasmini o'rnatish, proktoring signallari |
| `ssd_mobilenetv1` | yuz rasmini o'rnatish |
| `face_landmark_68` | yuz rasmini o'rnatish |
| `face_recognition` | yuz rasmini o'rnatish |
| `face_landmark_68_tiny` | proktoring signallari |

Har bir model `*-weights_manifest.json` va unda ko'rsatilgan `*-shard*` fayllardan iborat.

Boshqa modellar (`tiny_yolov2`, `mtcnn`, `age_gender`, `face_expression`, `*.weights`, `*.pbtxt`) kodda
ishlatilmagani uchun olib tashlangan: ular har bir build va deployga ~200 MB qo'shardi. Yangi model kerak
bo'lsa, faqat manifest va shard fayllarini qo'shing va `faceapi.nets.<model>.loadFromUri("/models")` chaqiring.
