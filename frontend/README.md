# ScormLms frontend

React, TypeScript va Vite asosidagi LMS klienti.

## Environment

`.env.example` dan lokal `.env` yarating:

- `VITE_API_BASE_URL` — REST API, `/api/v1` bilan;
- `VITE_WS_URL` — bildirishnomalar WebSocket manzili;
- `VITE_SCORM_CONTENT_ORIGIN` — import qilingan SCORM kontenti uchun alohida origin.

`VITE_*` qiymatlari build vaqtida bundle ichiga yoziladi, shu sabab ularda secret saqlamang. Productionda HTTPS/WSS ishlating va SCORM originini asosiy frontend originidan ajrating.

## Buyruqlar

```powershell
npm install
npm run dev
npm run build
npm run test:run
npm audit
```

Node.js talabi: 20.19+ yoki 22.12+.
