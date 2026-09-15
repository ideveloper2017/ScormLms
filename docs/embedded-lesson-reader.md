# Sayt ichidagi dars oynasi

Talabaning kurs darsi va o‘qituvchining kurs playeri bir xil `LessonContentViewer` komponentidan foydalanadi. Dars ro‘yxatidagi **Shu yerda ochish** tanlangan materialni playerda ochadi.

| Format | Saytdagi ko‘rinishi |
| --- | --- |
| MP4, WebM | Play/pause, vaqt bo‘yicha yurish, ovoz, fullscreen va 0.5–2× tezlik; dars yopilganda ijro to‘xtaydi |
| PDF | Mahalliy PDF.js worker, sahifalar, kattalashtirish, matnni tanlash |
| DOCX | Brauzerda Mammoth orqali sarlavha, matn, rasm va jadvallar; Word sahifa maketining aynan nusxasi emas |
| DOC (Word 97–2003) | Serverdagi Apache POI yordamida matnli ko‘rinish; 20 MB gacha, ko‘pi bilan 1 million belgi |
| PPT, PPTX | Serverda slaydlar rasmli PDF ko‘rinishiga tayyorlanadi; oldingi/keyingi slayd, kattalashtirish va to‘liq ekran. 20 MB, 1–50 slayd. Animatsiya, interaktiv obyekt va slayd ichidagi video ijro etilmaydi; maxsus shrift/diagramma ko‘rinishi farq qilishi mumkin |
| TXT, CSV | Oddiy matn; HTML kod bajarilmaydi |
| HTML, HTM | Tozalangan dars matni va jadvallar; skript, forma, iframe va tashqi navigatsiya olib tashlanadi |
| JPG, PNG | Ichki rasm ko‘rinishi |
| LaTeX / MathML | Kasr, ildiz, daraja va boshqa formulalar; `\\(...\\)`, `\\[...\\]`, `$$...$$` |

YouTube va Vimeo yozuvlari yangi oynaga o‘tmasdan rasmiy embedded playerda ochiladi. Ularning ishlashi video egasining embed ruxsati va tarmoqqa bog‘liq. Tashqi servisga bog‘liq bo‘lmagan video uchun o‘z MP4/WebM faylini yuklash kerak. Video nusxalari YouTube’dan avtomatik ko‘chirib olinmaydi.

DOCX, PDF, PowerPoint va formula kutubxonalari ilova bilan birga tarqatiladi; Google/Office hujjat ko‘ruvchisiga fayl yuborilmaydi. ZIP yuklab olinadigan paket bo‘lib qoladi; XLS kabi boshqa fayllarning o‘qish nusxasi PDF/HTML shaklida yuklanadi. Parol bilan himoyalangan PDF uchun parolsiz nusxa kerak.

PowerPoint uchun `/api/v1/courses/{courseId}/contents/{contentId}/presentation` autentifikatsiyali fayl ruxsatlarini tekshirib PDF qaytaradi (`no-store`). Bir vaqtda ikki prezentatsiya render qilinadi. Vaqtinchalik rasm va PDFlar tashqi servisga yuborilmaydi va saqlash katalogiga yozilmaydi. `PresentationPreviewTest` eski/yangi format, slayd tartibi, tasvirlar, o‘lchamlar, chegaralar va ruxsat tekshiruvlarini qamrab oladi.

CKEditor kaliti bo‘lmasa, mahalliy matn/HTML muharriri ishlaydi: sarlavha, qalin/kursiv, ro‘yxat, jadval, kod, LaTeX formula va ko‘rinishni tekshirish vositalari mavjud.

Fayllar mavjud autentifikatsiyali endpoint orqali olinadi. DOC matni uchun `/api/v1/courses/{courseId}/contents/{contentId}/document-text` aynan shu kursga kirish, nashr, ekspertiza, amal muddati va asset scope tekshiruvlarini bajaradi. Blob URLlar dars yopilganda bekor qilinadi. Katta video hozir to‘liq yuklangach ijroga tayyor bo‘ladi; amaldagi upload limiti saqlanadi.

Kutubxonalar: [React-PDF](https://github.com/wojtekmaj/react-pdf), [Mammoth](https://github.com/mwilliamson/mammoth.js), [KaTeX](https://katex.org/docs/security), [Apache POI](https://poi.apache.org/text-extraction.html).

Tekshiruvlar: frontend reader/navigation/editor testlari; backend `LegacyWordPreviewTest`; lokal API orqali DOC matni, anonim (401) va kursga yozilmagan talaba uchun rad etish (400); brauzerda ikki sahifali PDF, DOCX, DOC, HTML/formula va MP4. `ResourceEnrollmentIntegrationTest` Docker mavjud bo‘lmagani uchun ishga tushmadi.
