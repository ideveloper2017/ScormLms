import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LessonContentViewer, videoSource } from '../learning/lesson-content-viewer';
import { RichTextContent } from '../editor/rich-text-content';
import { teacherPortalApi, type CourseContentAsset } from '@/services/api/teacher-portal-api';

vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { downloadContentFile: vi.fn(), previewLegacyWord: vi.fn(), previewPresentation: vi.fn() } }));
vi.mock('mammoth', () => ({ convertToHtml: vi.fn().mockResolvedValue({ value: '<h2>Word sarlavha</h2><script>bad()</script><table><tr><td>Katak</td></tr></table>' }) }));
vi.mock('../learning/pdf-reader', () => ({ default: ({ url }: { url: string }) => <div data-testid="pdf-reader">{url}</div> }));
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const asset = (name: string, media: string) => ({ id: 1, originalFileName: name, mediaType: media, sha256: name } as CourseContentAsset);
function viewFile(file: CourseContentAsset) {
  return render(<StrictMode><QueryClientProvider client={client()}><LessonContentViewer courseId="5" content={{ id: 9, title: 'Dars', asset: file }} /></QueryClientProvider></StrictMode>);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:lesson');
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('contained lesson reader', () => {
  it('embeds YouTube, preserves the starting time and rejects executable or lookalike URLs', () => {
    expect(videoSource('https://youtu.be/GoXwIVyNvX0?t=123s')?.url).toContain('start=123');
    expect(videoSource('https://youtube.com.evil.test/watch?v=GoXwIVyNvX0')).toBeNull();
    expect(videoSource('javascript:alert(1)')).toBeNull();
    expect(videoSource('https://user:secret@youtube.com/watch?v=GoXwIVyNvX0')).toBeNull();
    const view = render(<LessonContentViewer courseId="5" content={{ id: 1, title: 'Video', contentUrl: 'https://youtu.be/GoXwIVyNvX0' }} />);
    expect(screen.getByTitle('Video')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/GoXwIVyNvX0?rel=0');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    view.rerender(<LessonContentViewer courseId="5" content={{ id: 2, title: 'Matn', contentBody: 'Keyingi dars' }} />);
    expect(screen.queryByTitle('Video')).not.toBeInTheDocument();
  });
  it('sanitizes uploaded HTML and displays formulas without running scripts or opening links', () => {
    const { container } = render(<RichTextContent contained value={'<h2>Formula</h2><p>\\(x^2\\)</p><script>alert(1)</script><a href="https://example.com">Manba</a><img onerror="bad()"><p style="position:fixed">Matn</p>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('[href]')).toBeNull();
    expect(container.querySelector('[style="position:fixed"]')).toBeNull();
    expect(container.querySelector('.katex')).not.toBeNull();
  });
  it('keeps code examples and literal text intact', () => {
    const view = render(<RichTextContent value={'<pre>\\(x^2\\)</pre>'} />);
    expect(view.container.querySelector('.katex')).toBeNull();
    view.rerender(<RichTextContent plainText value="<h1>This is source code</h1>" />);
    expect(view.container.querySelector('h1')).toBeNull();
    expect(screen.getByText('<h1>This is source code</h1>')).toBeInTheDocument();
  });
  it('plays authenticated MP4 files, changes speed, and releases the URL on unmount', async () => {
    vi.mocked(teacherPortalApi.downloadContentFile).mockResolvedValue(new Blob(['video'], { type: 'video/mp4' }));
    const view = viewFile(asset('lesson.mp4', 'video/mp4'));
    const video = await screen.findByLabelText('Dars') as HTMLVideoElement;
    expect(video).toHaveAttribute('src', 'blob:lesson');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.5' } });
    expect(video.playbackRate).toBe(1.5);
    expect(teacherPortalApi.downloadContentFile).toHaveBeenCalledWith('5', 9);
    view.unmount();
    expect(video.pause).toHaveBeenCalled();
    expect(video).not.toHaveAttribute('src');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:lesson');
  });
  it('uses the local PDF reader', async () => {
    vi.mocked(teacherPortalApi.downloadContentFile).mockResolvedValue(new Blob(['pdf']));
    viewFile(asset('lesson.pdf', 'application/pdf'));
    expect(await screen.findByTestId('pdf-reader')).toHaveTextContent('blob:lesson');
  });
  it.each(['ppt', 'pptx'])('reads %s presentations through the local protected preview API', async extension => {
    vi.mocked(teacherPortalApi.previewPresentation).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    viewFile(asset(`lesson.${extension}`, 'application/vnd.ms-powerpoint'));
    expect(await screen.findByTestId('pdf-reader')).toHaveTextContent('blob:lesson');
    expect(teacherPortalApi.previewPresentation).toHaveBeenCalledWith('5', 9);
    expect(teacherPortalApi.downloadContentFile).not.toHaveBeenCalled();
  });
  it('reads DOC through the authenticated API as text, never as executable HTML', async () => {
    vi.mocked(teacherPortalApi.previewLegacyWord).mockResolvedValue('<h1>Word matni</h1>');
    const view = viewFile(asset('lesson.doc', 'application/msword'));
    expect(await screen.findByText('<h1>Word matni</h1>')).toBeInTheDocument();
    expect(view.container.querySelector('h1')).toBeNull();
    expect(teacherPortalApi.downloadContentFile).not.toHaveBeenCalled();
  });
  it('provides a retry when a protected file cannot be loaded', async () => {
    vi.mocked(teacherPortalApi.previewLegacyWord).mockRejectedValue(new Error('Forbidden'));
    viewFile(asset('lesson.doc', 'application/msword'));
    expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent('Material ochilmadi');
    vi.mocked(teacherPortalApi.previewLegacyWord).mockResolvedValue('Qayta ochildi');
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
    await waitFor(() => expect(screen.getByText('Qayta ochildi')).toBeInTheDocument());
  });
});
