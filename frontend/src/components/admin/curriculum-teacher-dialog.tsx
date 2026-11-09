import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { listTeachers } from "@/lib/teacher-api";
import { curriculumApi, type CurriculumSubject } from "@/services/api/curriculum-api";

/**
 * Reja fanining semestr qatoriga mas'ul o'qituvchi: avvalo shu fanni o'qitadiganlar (o'qituvchi kartasidagi fanlar),
 * istasa — barcha faol o'qituvchilar.
 */
export function CurriculumTeacherDialog({ curriculumId, subject, onClose, onSaved }: {
  curriculumId: number; subject: CurriculumSubject; onClose: () => void; onSaved: () => unknown;
}) {
  const { toast } = useToast();
  const teachers = useQuery({ queryKey: ["teachers", "all"], queryFn: () => listTeachers() });
  const active = (teachers.data ?? []).filter((t) => t.active);
  const teachesSubject = active.filter((t) => t.subjects.some((s) => s.id === subject.subjectId));
  const [onlySubject, setOnlySubject] = useState<boolean | null>(null);
  const filtered = onlySubject ?? teachesSubject.length > 0;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(subject.teacherId ?? null);
  const needle = query.trim().toLowerCase();
  const list = (filtered ? teachesSubject : active)
    .filter((t) => !needle || t.fullName.toLowerCase().includes(needle) || (t.departmentName ?? "").toLowerCase().includes(needle))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (teacherId: number | null) => teacherId
      ? curriculumApi.assignTeacher(curriculumId, subject.id, teacherId)
      : curriculumApi.removeTeacher(curriculumId, subject.id),
    onSuccess: async (_, teacherId) => {
      toast({ title: teacherId ? "O'qituvchi biriktirildi" : "O'qituvchi olib tashlandi" });
      await onSaved();
      onClose();
    },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>O'qituvchini biriktirish</DialogTitle>
        <DialogDescription>{subject.subjectName} · {subject.semester}-semestr{subject.teacherName ? ` · hozir: ${subject.teacherName}` : ""}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" aria-label="O'qituvchi qidirish" placeholder="F.I.Sh. yoki kafedra" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={filtered} onChange={(e) => setOnlySubject(e.target.checked)} />
          Faqat shu fanni o'qitadiganlar ({teachesSubject.length})
        </label>
        {teachers.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div role="radiogroup" aria-label="O'qituvchilar" className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {list.map((t) => <label key={t.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="teacher" className="mt-1" checked={selected === t.id} onChange={() => setSelected(t.id)} />
              <span><span className="font-medium">{t.fullName}</span>
                <span className="block text-xs text-muted-foreground">{[t.position, t.departmentName].filter(Boolean).join(" · ") || "—"}</span></span>
            </label>)}
            {list.length === 0 && <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
              {filtered ? "Bu fanni o'qitadigan o'qituvchi topilmadi — belgini olib, barchasidan tanlang." : "O'qituvchi topilmadi"}</p>}
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" disabled={!subject.teacherId || save.isPending} onClick={() => save.mutate(null)}>Olib tashlash</Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>Yopish</Button>
          <Button disabled={!selected || selected === subject.teacherId || save.isPending} onClick={() => save.mutate(selected)}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Biriktirish</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
