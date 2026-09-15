import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LessonContentViewer } from '@/components/learning/lesson-content-viewer';
import { RichTextContent } from '@/components/editor/rich-text-content';
import { type TeacherCourse, type CourseModule, type CourseContent } from '@/services/api/teacher-portal-api';

interface Props {
  mode: 'overview' | 'player';
  course: TeacherCourse;
  modules: CourseModule[];
  contents: CourseContent[];
  onClose: () => void;
  onDownload: (content: CourseContent) => void;
  downloadingId: number | null;
  initialContentId?: number;
}

export function CoursePreview({ mode, course, modules, contents, onClose, onDownload, downloadingId, initialContentId }: Props) {
  const lessons = [...modules].sort((a, b) => a.position - b.position)
    .flatMap(module => contents.filter(item => item.moduleId === module.id).sort((a, b) => a.position - b.position));
  const [selectedId, setSelectedId] = useState<number | undefined>(initialContentId ?? lessons[0]?.id);
  const index = Math.max(0, lessons.findIndex(item => item.id === selectedId));
  const selected = lessons[index];

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{mode === 'overview' ? "Kurs ko'rinishi" : 'Kurs playeri'}: {course.title}</DialogTitle>
        <DialogDescription>O'qituvchi uchun ko'rish rejimi. Qoralamalar ham ko'rsatiladi; talaba bahosi va davomati yozilmaydi.</DialogDescription>
      </DialogHeader>
      {mode === 'overview' ? <div className="space-y-5">
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{course.subjectName || 'Fan belgilanmagan'}</Badge><Badge variant="outline">{course.language || 'Til belgilanmagan'}</Badge><Badge variant="outline">{lessons.length} ta dars</Badge></div>
        {course.description && <RichTextContent value={course.description} />}
        {modules.length === 0 && <p>Hali section qo'shilmagan.</p>}
        {[...modules].sort((a, b) => a.position - b.position).map(module => <section key={module.id} className="rounded-lg border p-4">
          <h2 className="font-semibold">{module.title} <Badge variant="outline">{module.status === 'published' ? 'Nashrda' : 'Qoralama'}</Badge></h2>
          <ul className="mt-3 space-y-2">{lessons.filter(item => item.moduleId === module.id).map(item => <li key={item.id}>{item.title} <span className="text-muted-foreground">· {item.durationMinutes ?? 0} daqiqa · {item.status === 'published' ? 'Nashrda' : 'Qoralama'}</span></li>)}</ul>
        </section>)}
      </div> : <div className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Kurs darslari" className="max-h-52 space-y-2 overflow-y-auto md:max-h-[65vh]">
          {lessons.map(item => <Button key={item.id} variant={selected?.id === item.id ? 'secondary' : 'ghost'} className="h-auto w-full justify-start whitespace-normal text-left" aria-current={selected?.id === item.id ? 'step' : undefined} onClick={() => setSelectedId(item.id)}>{item.title}</Button>)}
        </nav>
        {selected ? <section className="min-w-0 space-y-4">
          <h2 className="text-lg font-semibold">{selected.title}</h2>
          <p className="text-muted-foreground">{selected.moduleTitle} · {selected.status === 'published' ? 'Nashrda' : 'Qoralama'}</p>
          <LessonContentViewer courseId={course.id} content={selected} />
          <div className="flex flex-wrap gap-2">
            {selected.asset && <Button variant="outline" disabled={downloadingId === selected.id} onClick={() => onDownload(selected)}><Download className="mr-2 size-4" />{selected.asset.originalFileName}</Button>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button variant="outline" disabled={index === 0} onClick={() => setSelectedId(lessons[index - 1].id)}><ChevronLeft />Oldingi dars</Button>
            <span>{index + 1} / {lessons.length}</span>
            <Button variant="outline" disabled={index === lessons.length - 1} onClick={() => setSelectedId(lessons[index + 1].id)}>Keyingi dars<ChevronRight /></Button>
          </div>
        </section> : <p>Hali dars qo'shilmagan.</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}
