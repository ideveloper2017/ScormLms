import { describe, expect, it } from 'vitest';
import { buildSubjectModules, linesOf, typeStats, upcomingDeadlines } from '@/lib/student-subject';
import type { LearningContent } from '@/services/api/study-plan-api';
import type { SubjectSyllabus } from '@/services/api/syllabus-api';
import type { Test } from '@/types/test.types';

const syllabus = {
  id: 40, topics: [
    { id: 1, type: 'THEORETICAL', sortOrder: 1, title: 'Kuch va massa', moduleId: 5, lessonOrder: 1, hours: 2 },
    { id: 2, type: 'THEORETICAL', sortOrder: 2, title: 'Birinchi qonun', moduleId: 5, lessonOrder: 2 },
    { id: 3, type: 'LABORATORY', sortOrder: 1, title: 'Ishqalanish', moduleId: 5, lessonOrder: 3 },
  ],
  modules: [{ id: 5, sortOrder: 1, name: 'Dinamika', lessons: [] }],
} as unknown as SubjectSyllabus;
syllabus.modules![0].lessons = syllabus.topics!;
const content = (id: number, topicId: number | null, moduleId: number, extra: Partial<LearningContent> = {}) =>
  ({ id, syllabusTopicId: topicId, moduleId, moduleTitle: `Dars ${moduleId}`, contentType: 'text', title: `M${id}`, ...extra }) as LearningContent;
const test = (id: string, lessonId: string, status: Test['status'], date = '2026-11-20') =>
  ({ id, title: `Test ${id}`, lessonId, status, date: new Date(date) }) as Test;

describe('buildSubjectModules', () => {
  it('dastur darsiga materiallar, testlar va holat bog\'lanadi; birinchi tugallanmagan — joriy', () => {
    const modules = buildSubjectModules(syllabus, [content(10, 1, 101), content(11, 2, 102), content(12, 2, 102), content(20, null, 200, { unitTitle: 'Qo\'shimcha' })],
      [10, 11], [test('t1', '102', 'upcoming')]);

    expect(modules.map((m) => m.title)).toEqual(['Dinamika', 'Qo\'shimcha']);
    const [first, second, third] = modules[0].lessons;
    expect([first.status, first.hours]).toEqual(['done', 2]);
    // 2-dars: 1 material va test qolgan — joriy, ochilganda bajarilmagan material
    expect([second.status, second.openContentId, second.tests.map((t) => t.id)]).toEqual(['current', 12, ['t1']]);
    expect(third.status).toBe('empty');
    expect(modules[0].status).toBe('current');
    expect(modules[1].lessons[0]).toMatchObject({ title: 'Dars 200', status: 'todo' });
    expect(typeStats(modules)).toEqual([{ type: 'THEORETICAL', total: 2, done: 1 }, { type: 'LABORATORY', total: 1, done: 0 }]);
  });

  it('dastursiz — kurs modullari bo\'yicha, mashg\'ulot turi kursdan', () => {
    const modules = buildSubjectModules(undefined, [content(1, null, 7, { unitTitle: 'Kirish', topicType: 'PRACTICAL' })], [1], []);
    expect(modules[0]).toMatchObject({ title: 'Kirish', status: 'done' });
    expect(modules[0].lessons[0].type).toBe('PRACTICAL');
  });
});

it('talablar qatorlari va yaqin muddatlar', () => {
  expect(linesOf('- Vektorlar\n2) Hosila\n\n• Xavfsizlik')).toEqual(['Vektorlar', 'Hosila', 'Xavfsizlik']);
  const now = new Date('2026-11-10');
  expect(upcomingDeadlines([test('a', '1', 'upcoming', '2026-11-30'), test('b', '1', 'completed'), test('c', '1', 'upcoming', '2026-11-01'), test('d', '1', 'upcoming', '2026-11-15')], now)
    .map((t) => t.id)).toEqual(['d', 'a']);
});
