import path from 'path';
import { readFileSync } from 'fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

/**
 * Backend ga yo'naltiriladigan yo'llar. Dev serverda (va `vite preview` da) shu yo'llar
 * VITE_PROXY_TARGET (standart: http://localhost:8080) ga uzatiladi, shuning uchun frontend va API
 * bitta manzilda ishlaydi: CORS kerak emas, kirish cookie'si (LMS_REFRESH) oddiy saqlanadi,
 * production'dagi nginx sozlamasi bilan bir xil holat.
 */
const BACKEND_PATHS = [
  '/api',            // REST API (/api/v1/...)
  '/ws',             // STOMP WebSocket (bildirishnomalar)
  '/scorm-content',  // SCORM paketi fayllari
  '/uploads',        // yuklangan rasmlar, fayllar
  '/oauth2',         // HEMIS OAuth kirishni boshlash
  '/login/oauth2',   // HEMIS OAuth qaytish manzili
  '/actuator',       // health/info (deploy tekshiruvi)
];

function buildProxy(target: string): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {};
  for (const prefix of BACKEND_PATHS) {
    proxy[prefix] = {
      target,
      changeOrigin: true,
      secure: false,            // o'z-o'zidan imzolangan HTTPS backend ham bo'ladi
      ws: prefix === '/ws',     // WebSocket ulanishi ham proxy orqali
      // Backend "Secure" cookie bersa (HTTPS backend), HTTP dev serverda brauzer uni saqlamaydi: belgini olib tashlaymiz
      cookieDomainRewrite: '',
      configure: (server) => {
        server.on('proxyRes', (proxyRes) => {
          const cookies = proxyRes.headers['set-cookie'];
          if (cookies && target.startsWith('http://')) {
            proxyRes.headers['set-cookie'] = cookies.map((c) => c.replace(/;\s*Secure/gi, ''));
          }
        });
        server.on('error', (err: NodeJS.ErrnoException) => {
          const reason = err.code || err.message || 'ulanib bo\'lmadi';
          console.warn(`[proxy] ${prefix} -> ${target}: ${reason}. Backend (${target}) ishga tushganmi?`);
        });
      },
    };
  }
  return proxy;
}

/**
 * Har sahifada kerak bo'ladigan asosiy kutubxonalar alohida fayllarga: brauzer ularni bir marta keshlaydi,
 * ilova kodi yangilanganda qayta yuklamaydi. Faqat ayrim sahifalarda ishlatiladigan og'ir kutubxonalar
 * (muharrir, PDF, yuz tanish, grafiklar) bu ro'yxatda ATAYLAB yo'q: sahifalar lazy yuklanadi va ular o'zi
 * alohida chunk bo'ladi; majburan ajratilsa kirish sahifasiga ham yuklanib qolardi.
 */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
  if (id.includes('@tanstack')) return 'vendor-query';
  if (id.includes('radix-ui') || id.includes('@radix-ui')) return 'vendor-ui';
  return undefined;
}

export default defineConfig(({ mode }) => {
  // VITE_ bilan boshlanmagan o'zgaruvchilar brauzerga tushmaydi, lekin shu yerda o'qiladi
  const env = loadEnv(mode, process.cwd(), '');
  const backend = (env.VITE_PROXY_TARGET || 'http://localhost:8080').replace(/\/+$/, '');
  const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version?: string };
  const proxy = buildProxy(backend);

  return {
    plugins: [tailwindcss(), react()],

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
      // Bir xil kutubxona ikki nusxada yuklanib qolmasin (hook xatolari)
      dedupe: ['react', 'react-dom'],
    },

    // Kodda ishlatish: __APP_VERSION__, __BUILD_TIME__ (src/vite-env.d.ts da e'lon qilingan)
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version ?? '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: false,          // band bo'lsa keyingi portni oladi
      host: env.VITE_HOST === 'true', // true: tarmoqdagi boshqa qurilmalardan (telefon) ochish mumkin
      open: env.VITE_OPEN === 'true',
      proxy,
    },

    // `vite preview` (build natijasini ko'rish) ham backend bilan ishlaydi
    preview: {
      port: Number(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_HOST === 'true',
      proxy,
    },

    css: {
      devSourcemap: true,
    },

    build: {
      target: 'es2020',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      chunkSizeWarningLimit: 1200,
      reportCompressedSize: false, // build tezroq; hajmni kerak bo'lganda alohida o'lchaymiz
      rollupOptions: {
        output: {
          manualChunks: vendorChunk,
        },
      },
    },

    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
