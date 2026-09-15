import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export default function PdfReader({ url, presentation = false }: { url: string; presentation?: boolean }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(600);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(240, entries[0].contentRect.width - 24)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="min-w-0 space-y-3 bg-background p-1">
    {presentation && <p className="text-xs text-muted-foreground">Slaydlar ko‘rinishi. Animatsiya va slayd ichidagi video ijro etilmaydi.</p>}
    <div className="flex flex-wrap items-center gap-2" aria-label={presentation ? 'Slayd boshqaruvi' : 'PDF boshqaruvi'}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{presentation ? 'Oldingi slayd' : 'Oldingi sahifa'}</Button>
      <span aria-live="polite">{page} / {pages || '…'}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{presentation ? 'Keyingi slayd' : 'Keyingi sahifa'}</Button>
      <Button variant="outline" size="sm" aria-label="Kichraytirish" disabled={zoom <= .5} onClick={() => setZoom(z => Math.max(.5, z - .25))}>−</Button>
      <span>{Math.round(zoom * 100)}%</span>
      <Button variant="outline" size="sm" aria-label="Kattalashtirish" disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2, z + .25))}>+</Button>
      {presentation && <Button variant="outline" size="sm" onClick={async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await container.current?.requestFullscreen();
        } catch { setFullscreenError(true); }
      }}>To‘liq ekran</Button>}
    </div>
    {fullscreenError && <p role="status">Brauzer to‘liq ekran rejimini ocholmadi.</p>}
    <div className="max-h-[70vh] overflow-auto rounded-md border bg-slate-100 p-3 text-black">
      {passwordProtected && <p role="alert">PDF parol bilan himoyalangan. O‘qituvchi parolsiz nusxasini yuklashi kerak.</p>}
      <Document file={url} onLoadSuccess={({ numPages }) => { setPages(numPages); setPage(1); }}
        loading="PDF yuklanmoqda…" error={<p role="alert">PDF ochilmadi. Fayl buzilgan yoki parol bilan himoyalangan bo‘lishi mumkin.</p>}
        onPassword={() => setPasswordProtected(true)}>
        <Page pageNumber={page} width={Math.min(width, 1000)} scale={zoom} renderAnnotationLayer={false}
          loading="Sahifa yuklanmoqda…" error={<p role="alert">Sahifa ochilmadi.</p>} />
      </Document>
    </div>
  </div>;
}
