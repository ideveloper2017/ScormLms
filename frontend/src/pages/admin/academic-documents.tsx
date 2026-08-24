import { useState } from "react";
import { CheckCircle2, Download, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  confirmCallLetter, createCallLetter, createTranscript, deleteCallLetter, deleteTranscript,
  generateCallLetterPdf, generateTranscriptPdf, listCallLetters, listDocumentStudents, listTranscripts,
  updateCallLetter, updateTranscript,
  type CallLetterRecord, type DocumentStudent, type SaveCallLetterRequest,
  type SaveTranscriptRequest, type TranscriptRecord,
} from "@/services/api/academic-documents-api";

const day = (offset = 0) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
};
const showDate = (value?: string | null, withTime = false) => value
  ? new Date(withTime ? value : `${value}T00:00:00`).toLocaleString("uz-Latn", withTime ? undefined : { year: "numeric", month: "2-digit", day: "2-digit" })
  : "—";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>;
}

function StudentSelect({ students, value, onChange }: { students: DocumentStudent[]; value: number; onChange: (id: number) => void }) {
  return <div className="space-y-1.5"><Label>Talaba *</Label><Select value={value > 0 ? String(value) : ""} onValueChange={(id) => onChange(Number(id))}>
    <SelectTrigger><SelectValue placeholder="Talabani tanlang" /></SelectTrigger>
    <SelectContent>{students.map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.fullName} — {student.studentNumber}{student.group ? `, ${student.group}` : ""}</SelectItem>)}</SelectContent>
  </Select></div>;
}

const callLetterBlank = (): SaveCallLetterRequest => ({ studentId: 0, semester: 1, orderNumber: "", orderDate: day(), startDate: day(), endDate: day(7) });

export function FinalExamCallLetters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const data = useCrudData<CallLetterRecord>(["academic-call-letters"], listCallLetters);
  const studentsQuery = useQuery({ queryKey: ["academic-document-students"], queryFn: listDocumentStudents, staleTime: 60_000 });
  const [working, setWorking] = useState<string | null>(null);

  async function perform(key: string, action: () => Promise<void>, success: string) {
    setWorking(key);
    try { await action(); toast({ title: success }); await data.reload(); }
    catch (error) { toast({ variant: "destructive", title: "Xatolik", description: error instanceof Error ? error.message : "Amal bajarilmadi" }); }
    finally { setWorking(null); }
  }

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Yakuniy nazoratga chaqiruv qog'ozi" description="Talaba, semestr va buyruq asosida chaqiruv hujjatini yarating, PDF oling va tasdiqlang." />
    <CrudSection<CallLetterRecord, SaveCallLetterRequest>
      title="Chaqiruv qog'ozlari" items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.documentNumber}
      search={(item) => `${item.fullName} ${item.studentNumber} ${item.documentNumber} ${item.orderNumber}`}
      columns={[
        { header: "F.I.O.", cell: (item) => <div><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.studentNumber}</div></div> },
        { header: "Semestr", cell: (item) => item.semester },
        { header: "Buyruq", cell: (item) => <div><div>{item.orderNumber}</div><div className="text-xs text-muted-foreground">{showDate(item.orderDate)}</div></div> },
        { header: "Davri", cell: (item) => `${showDate(item.startDate)} — ${showDate(item.endDate)}` },
        { header: "Yaratilgan", cell: (item) => showDate(item.createdAt, true) },
        { header: "Tasdiq", cell: (item) => <div className="flex items-center gap-2"><Badge variant={item.status === "CONFIRMED" ? "default" : "secondary"}>{item.status === "DRAFT" ? "Qoralama" : item.status === "GENERATED" ? "Shakllangan" : "Tasdiqlangan"}</Badge>{canWrite && item.status === "GENERATED" && <Button size="sm" variant="outline" disabled={working === `confirm-${item.id}`} onClick={() => void perform(`confirm-${item.id}`, () => confirmCallLetter(item.id).then(() => undefined), "Chaqiruv qog'ozi tasdiqlandi")}>{working === `confirm-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}</Button>}</div> },
        { header: "Fayl", cell: (item) => <Button size="sm" variant="outline" disabled={!canWrite || working === `pdf-${item.id}`} onClick={() => void perform(`pdf-${item.id}`, async () => download(await generateCallLetterPdf(item.id), `${item.documentNumber}.pdf`), "PDF fayl yuklandi")}>{working === `pdf-${item.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button> },
      ]}
      blankForm={callLetterBlank}
      toForm={(item) => ({ studentId: item.studentId, semester: item.semester, orderNumber: item.orderNumber, orderDate: item.orderDate, startDate: item.startDate, endDate: item.endDate })}
      validate={(form) => !form.studentId ? "Talabani tanlang" : !form.orderNumber.trim() ? "Buyruq raqami majburiy" : form.semester < 1 || form.semester > 20 ? "Semestr 1-20 oralig'ida bo'lishi kerak" : form.endDate < form.startDate ? "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi" : null}
      onCreate={(form) => createCallLetter(form).then(() => undefined)} onUpdate={(id, form) => updateCallLetter(id, form).then(() => undefined)} onDelete={deleteCallLetter}
      renderForm={(form, set) => <div className="grid gap-4">
        <StudentSelect students={studentsQuery.data ?? []} value={form.studentId} onChange={(studentId) => set({ studentId, semester: studentsQuery.data?.find((student) => student.id === studentId)?.semester ?? form.semester })} />
        {studentsQuery.error && <p className="text-sm text-destructive">Talabalar ro'yxati yuklanmadi.</p>}
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Semestr *</Label><Input type="number" min={1} max={20} value={form.semester} onChange={(event) => set({ semester: Number(event.target.value) })} /></div><div className="space-y-1.5"><Label>Buyruq raqami *</Label><Input value={form.orderNumber} onChange={(event) => set({ orderNumber: event.target.value })} /></div></div>
        <div className="space-y-1.5"><Label>Buyruq sanasi *</Label><Input type="date" value={form.orderDate} onChange={(event) => set({ orderDate: event.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Boshlanish sanasi *</Label><Input type="date" value={form.startDate} onChange={(event) => set({ startDate: event.target.value })} /></div><div className="space-y-1.5"><Label>Tugash sanasi *</Label><Input type="date" value={form.endDate} onChange={(event) => set({ endDate: event.target.value })} /></div></div>
      </div>}
    />
  </div>;
}

const transcriptBlank = (): SaveTranscriptRequest => ({ studentId: 0, documentNumber: "", academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, semester: 1 });

export function StudentTranscripts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const data = useCrudData<TranscriptRecord>(["academic-transcripts"], listTranscripts);
  const studentsQuery = useQuery({ queryKey: ["academic-document-students"], queryFn: listDocumentStudents, staleTime: 60_000 });
  const [working, setWorking] = useState<number | null>(null);

  async function generate(item: TranscriptRecord) {
    setWorking(item.id);
    try { download(await generateTranscriptPdf(item.id), `${item.documentNumber}.pdf`); toast({ title: "Transkript PDF fayli yuklandi" }); await data.reload(); }
    catch (error) { toast({ variant: "destructive", title: "Xatolik", description: error instanceof Error ? error.message : "PDF yaratilmadi" }); }
    finally { setWorking(null); }
  }

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Talabalar transkripti" description="Talabaning mavjud nazorat natijalari va kreditlaridan akademik transkriptni avtomatik shakllantirish." />
    <CrudSection<TranscriptRecord, SaveTranscriptRequest>
      title="Transkriptlar" items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.documentNumber}
      search={(item) => `${item.fullName} ${item.studentNumber} ${item.program} ${item.group} ${item.documentNumber}`}
      columns={[
        { header: "F.I.O.", cell: (item) => <div><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.studentNumber}</div></div> },
        { header: "Ta'lim shakli", cell: (item) => item.educationForm },
        { header: "Mutaxassislik", cell: (item) => item.program || "—" },
        { header: "Guruh", cell: (item) => item.group || "—" },
        { header: "Raqami", cell: (item) => <Badge variant="outline"><FileText className="mr-1 h-3 w-3" />{item.documentNumber}</Badge> },
        { header: "Yil / semestr", cell: (item) => `${item.academicYear} / ${item.semester}` },
        { header: "Ko'rish / yuklash", cell: (item) => <Button size="sm" variant="outline" disabled={!canWrite || working === item.id} onClick={() => void generate(item)}>{working === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button> },
      ]}
      blankForm={transcriptBlank}
      toForm={(item) => ({ studentId: item.studentId, documentNumber: item.documentNumber, academicYear: item.academicYear, semester: item.semester })}
      validate={(form) => !form.studentId ? "Talabani tanlang" : !/^\d{4}[- ]\d{4}$/.test(form.academicYear.trim()) ? "O'quv yili 2025-2026 ko'rinishida bo'lishi kerak" : form.semester < 1 || form.semester > 20 ? "Semestr 1-20 oralig'ida bo'lishi kerak" : null}
      onCreate={(form) => createTranscript({ ...form, documentNumber: form.documentNumber?.trim() || null }).then(() => undefined)}
      onUpdate={(id, form) => updateTranscript(id, { ...form, documentNumber: form.documentNumber?.trim() || null }).then(() => undefined)} onDelete={deleteTranscript}
      renderForm={(form, set, context) => <div className="grid gap-4">
        <StudentSelect students={studentsQuery.data ?? []} value={form.studentId} onChange={(studentId) => { const student = studentsQuery.data?.find((row) => row.id === studentId); set({ studentId, academicYear: student?.academicYear ?? form.academicYear, semester: student?.semester ?? form.semester }); }} />
        {studentsQuery.error && <p className="text-sm text-destructive">Talabalar ro'yxati yuklanmadi.</p>}
        <div className="space-y-1.5"><Label>Transkript raqami {context.isEdit ? "*" : "(bo'sh qoldirilsa avtomatik)"}</Label><Input value={form.documentNumber ?? ""} onChange={(event) => set({ documentNumber: event.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>O'quv yili *</Label><Input placeholder="2025-2026" value={form.academicYear} onChange={(event) => set({ academicYear: event.target.value })} /></div><div className="space-y-1.5"><Label>Semestrgacha *</Label><Input type="number" min={1} max={20} value={form.semester} onChange={(event) => set({ semester: Number(event.target.value) })} /></div></div>
      </div>}
    />
  </div>;
}
