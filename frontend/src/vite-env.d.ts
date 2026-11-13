/// <reference types="vite/client" />

/** package.json dagi versiya (vite.config.ts `define`) */
declare const __APP_VERSION__: string;
/** Build qilingan vaqt, ISO formatda (vite.config.ts `define`) */
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  /** API manzili. Nisbiy (`/api/v1`) bo'lsa frontend bilan bir xil manzildan (dev proxy / nginx) olinadi. */
  readonly VITE_API_BASE_URL?: string;
  /** WebSocket manzili. Nisbiy (`/ws`) bo'lsa joriy sahifa manzilidan ws:// yoki wss:// yasaladi. */
  readonly VITE_WS_URL?: string;
  readonly VITE_SCORM_CONTENT_ORIGIN?: string;
  readonly VITE_CKEDITOR_LICENSE_KEY?: string;
  readonly VITE_MATHTYPE_ENABLED?: string;
}
