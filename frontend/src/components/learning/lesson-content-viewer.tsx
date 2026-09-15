import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RichTextContent } from '@/components/editor/rich-text-content';
import { teacherPortalApi, type CourseContentAsset } from '@/services/api/teacher-portal-api';

const PdfReader = lazy(() => import('./pdf-reader'));
type Lesson = { id: number; title: string; contentType?: string; contentBody?: string | null; contentUrl?: string | null; asset?: CourseContentAsset | null };

/** Allowlisted providers only. Never embed arbitrary sites in the LMS origin. */
export function videoSource(value: string): { kind: 'embed' | 'video'; url: string } | null {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v') || /^\/(?:embed|shorts)\/([^/]+)$/.exec(url.pathname)?.[1] || null;
    }
    if (id && /^[\w-]{11}$/.test(id)) {
      const target = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      target.searchParams.set('rel', '0');
      const start = url.searchParams.get('start') || url.searchParams.get('t');
      if (start && /^\d+s?$/.test(start)) target.searchParams.set('start', String(parseInt(start)));
      return { kind: 'embed', url: target.href };
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      const vimeoId = /^\/(?:video\/)?(\d+)$/.exec(url.pathname)?.[1];
      if (vimeoId) return { kind: 'embed', url: `https://player.vimeo.com/video/${vimeoId}` };
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { kind: 'video', url: url.href };
  } catch { /* Unsupported URL is handled in the reader. */ }
  return null;
}

export function LessonContentViewer({ courseId, content }: { courseId: string; content: Lesson }) {
  return <div className="min-w-0 space-y-4">
    {content.contentBody && <RichTextContent value={content.contentBody} contained className="rounded-md border bg-background p-4 leading-7" />}
    {content.asset ? <AssetReader key={`${courseId}:${content.id}:${content.asset.sha256}`} courseId={courseId} content={content} asset={content.asset} />
      : content.contentUrl ? <LinkedMedia key={content.contentUrl} title={content.title} value={content.contentUrl} /> : null}
  </div>;
}

function LinkedMedia({ title, value }: { title: string; value: string }) {
  const source = videoSource(value);
  if (!source) return <p role="status" className="rounded-md border p-4 text-sm text-muted-foreground">Bu materialni sayt ichida o‘qish uchun o‘qituvchi uning PDF, Word, HTML yoki video faylini yuklashi kerak.</p>;
  return source.kind === 'video' ? <VideoPlayer title={title} url={source.url} />
    : <iframe title={title} src={source.url} className="aspect-video w-full rounded-lg border-0 bg-black"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" />;
}

function VideoPlayer({ title, url }: { title: string; url: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const player = video.current;
    // StrictMode replays effects during development; restore the source after cleanup.
    if (player) player.src = url;
    return () => {
      if (!player) return;
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [url]);
  return <div className="space-y-2">
    <video ref={video} controls playsInline preload="metadata" src={url} aria-label={title}
      onError={() => setFailed(true)} className="max-h-[70vh] w-full rounded-lg bg-black" />
    <label className="flex items-center gap-2 text-sm">Ijro tezligi
      <select className="rounded border bg-background p-1" defaultValue="1" onChange={e => { if (video.current) video.current.playbackRate = Number(e.target.value); }}>
        {[.5, .75, 1, 1.25, 1.5, 2].map(speed => <option key={speed} value={speed}>{speed}×</option>)}
      </select>
    </label>
    {failed && <p role="alert">Video ijro etilmadi. MP4 (H.264) yoki WebM faylini tekshiring.</p>}
  </div>;
}

function AssetReader({ courseId, content, asset }: { courseId: string; content: Lesson; asset: CourseContentAsset }) {
  const extension = asset.originalFileName.split('.').pop()?.toLowerCase();
  const legacy = extension === 'doc';
  const isDocx = extension === 'docx';
  const isPresentation = extension === 'ppt' || extension === 'pptx';
  const isText = ['txt', 'csv', 'html', 'htm'].includes(extension || '');
  const supported = legacy || isDocx || isPresentation || isText || asset.mediaType.startsWith('video/') || asset.mediaType.startsWith('image/') || asset.mediaType === 'application/pdf';
  const query = useQuery({
    queryKey: ['lesson-file', courseId, content.id, asset.sha256],
    enabled: supported, gcTime: 0, staleTime: Infinity, retry: 1,
    queryFn: async () => {
      if (isPresentation) return { blob: await teacherPortalApi.previewPresentation(courseId, content.id) };
      if (legacy) return { text: await teacherPortalApi.previewLegacyWord(courseId, content.id), html: false };
      const blob = await teacherPortalApi.downloadContentFile(courseId, content.id);
      if (isDocx) {
        const { convertToHtml } = await import('mammoth');
        const result = await convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        return { text: result.value, html: true };
      }
      if (isText) return { text: await blob.text(), html: ['html', 'htm'].includes(extension!) };
      return { blob };
    },
  });
  const [objectUrl, setObjectUrl] = useState<string>();
  useEffect(() => {
    if (!query.data?.blob) return;
    const url = URL.createObjectURL(query.data.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [query.data]);
  if (!supported) return <p className="rounded-md border p-4 text-sm">Bu fayl uchun o‘qish nusxasini PDF yoki HTML formatida yuklang. ZIP arxivlar yuklab olish uchun mo‘ljallangan.</p>;
  if (query.isError) return <div role="alert"><p>Material ochilmadi.</p><Button variant="outline" onClick={() => void query.refetch()}>Qayta urinish</Button></div>;
  if (query.data?.text !== undefined) return <div className="space-y-2">
    {legacy && <p className="text-xs text-muted-foreground">DOC hujjatining matnli ko‘rinishi. Asl sahifa maketi uchun PDF nusxasini yuklang.</p>}
    <RichTextContent value={query.data.text} plainText={!query.data.html} contained className="max-h-[70vh] overflow-auto rounded-md border bg-background p-5 leading-7" />
  </div>;
  if (!objectUrl) return <p role="status">{isPresentation ? 'Slaydlar tayyorlanmoqda…' : 'Material yuklanmoqda…'}</p>;
  if (asset.mediaType.startsWith('video/')) return <VideoPlayer title={content.title} url={objectUrl} />;
  if (asset.mediaType.startsWith('image/')) return <img src={objectUrl} alt={content.title} className="mx-auto max-h-[70vh] max-w-full rounded-md object-contain" />;
  return <Suspense fallback={<p>Ko‘rish oynasi yuklanmoqda…</p>}><PdfReader url={objectUrl} presentation={isPresentation} /></Suspense>;
}
