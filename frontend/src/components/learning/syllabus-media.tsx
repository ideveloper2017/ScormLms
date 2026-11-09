import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { LinkedMedia, VideoPlayer } from '@/components/learning/lesson-content-viewer';

/** Avtorizatsiya bilan olinadigan faylni (blob) brauzer manziliga aylantiradi; almashganda eski manzil bo'shatiladi */
function useBlobUrl(queryKey: unknown[], load: () => Promise<Blob>, enabled: boolean) {
  const query = useQuery({ queryKey, queryFn: load, enabled, staleTime: Infinity, retry: false });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data) { setUrl(null); return; }
    const next = URL.createObjectURL(query.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [query.data]);
  return { url, loading: query.isLoading && enabled, failed: query.isError };
}

/** Dastur muqova rasmi */
export function SyllabusCover({ queryKey, load, available, alt, className = '' }: {
  queryKey: unknown[]; load: () => Promise<Blob>; available: boolean; alt: string; className?: string;
}) {
  const { url } = useBlobUrl(queryKey, load, available);
  if (!available || !url) return null;
  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}

/** Tanishtiruv videosi: yuklangan fayl (blob) yoki havola (YouTube, Vimeo, MP4) */
export function SyllabusIntroVideo({ queryKey, load, uploaded, link, title }: {
  queryKey: unknown[]; load: () => Promise<Blob>; uploaded: boolean; link?: string | null; title: string;
}) {
  const { url, loading, failed } = useBlobUrl(queryKey, load, uploaded);
  if (uploaded) {
    if (loading) return <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Video yuklanmoqda...</div>;
    if (url) return <VideoPlayer title={title} url={url} />;
    if (failed && !link) return <p role="alert" className="text-sm text-destructive">Video ochilmadi.</p>;
  }
  return link ? <LinkedMedia title={title} value={link} /> : null;
}
