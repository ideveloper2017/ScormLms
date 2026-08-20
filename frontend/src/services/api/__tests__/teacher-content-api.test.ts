import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { teacherPortalApi, type CourseContentPayload, type CourseContentReview, type CourseContentRevision } from '../teacher-portal-api';

vi.mock('@/lib/api');

describe('teacherPortalApi content provenance', () => {
  beforeEach(() => vi.clearAllMocks());

  const payload: CourseContentPayload = {
    title: 'Algoritmlar videosi',
    description: 'Kirish darsi',
    contentType: 'VIDEO',
    contentUrl: 'https://lms.example/video',
    languageCode: 'uz',
    authorName: "Test O'qituvchi",
    contentVersion: '2.0.0',
    sourceName: 'Universitet media markazi',
    sourceUrl: 'https://university.example/source',
    validFrom: '2026-08-01',
    validUntil: '2027-07-31',
  };
  const compatibility = {
    compatible: true,
    courseLanguage: 'uz',
    contentLanguage: 'uz',
    subjectId: 12,
    subjectName: 'Algoritmlar',
    programId: 4,
    programName: 'Dasturiy injiniring',
    programLanguage: 'uz',
    issues: [],
  };

  it("kursni katalogdagi fan va dastur tiliga bog'lab yaratadi", async () => {
    const course = { id: 3, title: 'Algoritmlar', subjectId: 12, programId: 4, language: 'uz' };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: course } });

    await teacherPortalApi.createCourse({ title: 'Algoritmlar', subjectId: 12, language: 'uz' });
    expect(api.post).toHaveBeenCalledWith('/courses', { title: 'Algoritmlar', subjectId: 12, language: 'uz' });
  });

  it('kontent metadata va amal qilish davrini create endpointiga yuboradi', async () => {
    const content = { id: 9, ...payload, compatibility };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: content } });

    await expect(teacherPortalApi.createContent('3', 5, payload)).resolves.toEqual(content);
    expect(api.post).toHaveBeenCalledWith('/courses/3/modules/5/contents', payload);
  });

  it('private kurs faylini multipart orqali yuklaydi', async () => {
    const file = new File(['%PDF-test'], 'mavzu.pdf', { type: 'application/pdf' });
    const asset = { id: 44, courseId: 3, originalFileName: file.name, mediaType: file.type, sizeBytes: file.size, sha256: 'abc' };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: asset } });

    await expect(teacherPortalApi.uploadContentAsset('3', file)).resolves.toEqual(asset);
    const [url, body, config] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe('/courses/3/assets');
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180_000 });
  });

  it('himoyalangan kontent faylini blob sifatida yuklaydi', async () => {
    const blob = new Blob(['lesson']);
    vi.mocked(api.get).mockResolvedValue({ data: blob });

    await expect(teacherPortalApi.downloadContentFile('3', 9)).resolves.toBe(blob);
    expect(api.get).toHaveBeenCalledWith('/courses/3/contents/9/file', { responseType: 'blob', timeout: 180_000 });
  });

  it('yangi versiyani update endpointiga yuboradi', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: { id: 9, ...payload } } });

    await teacherPortalApi.updateContent('3', 9, payload);
    expect(api.put).toHaveBeenCalledWith('/courses/3/contents/9', payload);
  });

  it("kontentning o'zgarmas versiyalar tarixini yuklaydi", async () => {
    const revision: CourseContentRevision = {
      id: 21,
      contentId: 9,
      revisionNumber: 2,
      title: payload.title,
      description: payload.description,
      contentType: 'video',
      contentUrl: payload.contentUrl,
      languageCode: payload.languageCode,
      authorName: payload.authorName,
      contentVersion: payload.contentVersion,
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl,
      validFrom: payload.validFrom,
      validUntil: payload.validUntil,
      changedAt: '2026-08-06T08:00:00Z',
      changedBy: 4,
    };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [revision] } });

    await expect(teacherPortalApi.getContentRevisions('3', 9)).resolves.toEqual([revision]);
    expect(api.get).toHaveBeenCalledWith('/courses/3/contents/9/revisions');
  });

  const review: CourseContentReview = {
    id: 31,
    courseId: 3,
    courseTitle: 'Algoritmlar',
    moduleId: 5,
    moduleTitle: 'Kirish',
    contentId: 9,
    contentTitle: payload.title,
    description: payload.description,
    contentType: 'video',
    contentUrl: payload.contentUrl,
    languageCode: payload.languageCode,
    authorName: payload.authorName,
    sourceName: payload.sourceName,
    sourceUrl: payload.sourceUrl,
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
    revisionNumber: 2,
    contentVersion: payload.contentVersion,
    status: 'pending',
    submittedAt: '2026-08-06T08:00:00Z',
    submittedBy: 4,
    compatibility,
  };

  it("kontent bilan birga server hisoblagan til va dastur mosligini oladi", async () => {
    const content = { id: 9, ...payload, compatibility };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [content] } });

    await expect(teacherPortalApi.getContents('3')).resolves.toEqual([content]);
    expect(api.get).toHaveBeenCalledWith('/courses/3/contents');
  });

  it("joriy revisionni ekspertizaga yuboradi va tarixini oladi", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: review } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [review] } });

    await expect(teacherPortalApi.submitContentReview('3', 9)).resolves.toEqual(review);
    await expect(teacherPortalApi.getContentReviews('3', 9)).resolves.toEqual([review]);
    expect(api.post).toHaveBeenCalledWith('/courses/3/contents/9/submit-review');
    expect(api.get).toHaveBeenCalledWith('/courses/3/contents/9/reviews');
  });

  it("metodist navbatni oladi va asosli tuzatish qarorini yuboradi", async () => {
    const decided = { ...review, status: 'changes_requested' as const, decisionComment: 'Manbani aniqlashtiring' };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [review] } });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: decided } });

    await expect(teacherPortalApi.getPendingContentReviews()).resolves.toEqual([review]);
    await expect(teacherPortalApi.decideContentReview(31, 'CHANGES_REQUESTED', '  Manbani aniqlashtiring  ')).resolves.toEqual(decided);
    expect(api.get).toHaveBeenCalledWith('/content-reviews/pending');
    expect(api.post).toHaveBeenCalledWith('/content-reviews/31/decision', {
      decision: 'CHANGES_REQUESTED',
      comment: 'Manbani aniqlashtiring',
    });
  });
});
