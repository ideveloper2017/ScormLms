import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, RefreshCw, RotateCcw, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  changeReReadingApplicationStatus, createReReadingApplication, createReReadingPlan,
  deleteReReadingApplication, deleteReReadingPlan, listReReadingApplications, listReReadingPlans,
  listReReadingRecoveryResults, listReReadingStudentReport, listReReadingStudents,
  listReReadingTeacherReport, updateReReadingApplication, updateReReadingPlan,
  type ReReadingApplication, type ReReadingApplicationStatus, type ReReadingPlan,
  type ReReadingRecovery, type ReReadingStudentReport, type ReReadingTeacherReport,
  type SaveReReadingApplicationRequest, type SaveReReadingPlanRequest,
} from "@/services/api/re-reading-api";

const date = (value?: string | null, time = false) => value ? new Date(time ? value : `${value}T00:00:00`).toLocaleString("uz-Latn", time ? undefined : { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";
const money = (value: number) => value.toLocaleString("uz-Latn", { maximumFractionDigits: 2 });
const statusLabel: Record<ReReadingApplicationStatus, string> = { DRAFT: "Qoralama", SUBMITTED: "Topshirilgan", APPROVED: "Tasdiqlangan", REJECTED: "Rad etilgan" };
const statusVariant = (status: ReReadingApplicationStatus) => status === "APPROVED" ? "default" as const : status === "REJECTED" ? "destructive" as const : "secondary" as const;

function Header({ title, description }: { title: string; description: string }) {
  return <div><h1 className="flex items-center gap-2 text-2xl font-bold"><RotateCcw className="h-6 w-6" />{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>;
}
function State({ query }: { query: { isLoading: boolean; error: unknown; refetch: () => unknown } }) {
  if (query.isLoading) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</CardContent></Card>;
  if (query.error) return <Card><CardContent className="space-y-3 p-10 text-center text-destructive">Ma'lumot yuklanmadi<Button variant="outline" onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card>;
  return null;
}

const blankPlan = (): SaveReReadingPlanRequest => ({ title: "", applicationDeadline: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10), description: "", status: "OPEN" });

export function ReReadingPlans() {
  const { user } = useAuth(); const data = useCrudData<ReReadingPlan>(["re-reading-plans"], listReReadingPlans);
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Qayta o'qish rejalari" description="Ariza muddati, tavsifi va ochiq/yopiq holati alohida boshqariladi." />
    <CrudSection<ReReadingPlan, SaveReReadingPlanRequest> title="Rejalar" items={data.items} loading={data.loading} error={data.error} onReload={data.reload} canWrite={hasAuthority(user, "ACADEMIC_WRITE")}
      getId={(item) => item.id} getName={(item) => item.title} search={(item) => `${item.title} ${item.description} ${item.status}`}
      columns={[{ header: "Holat", cell: (item) => <Badge variant={item.status === "OPEN" ? "default" : "secondary"}>{item.status === "OPEN" ? "Ochiq" : item.status === "PLANNED" ? "Rejalashtirilgan" : "Yopiq"}</Badge> }, { header: "Ariza muddati", cell: (item) => date(item.applicationDeadline) }, { header: "Tavsif", cell: (item) => item.description || "—" }, { header: "Yaratilgan", cell: (item) => date(item.createdAt, true) }, { header: "Yangilangan", cell: (item) => date(item.updatedAt, true) }]}
      blankForm={blankPlan} toForm={(item) => ({ title: item.title, applicationDeadline: item.applicationDeadline, description: item.description, status: item.status })}
      validate={(form) => form.title.trim().length < 3 ? "Reja nomi kamida 3 belgi" : !form.applicationDeadline ? "Ariza muddati majburiy" : null}
      onCreate={(form) => createReReadingPlan(form).then(() => undefined)} onUpdate={(id, form) => updateReReadingPlan(id, form).then(() => undefined)} onDelete={deleteReReadingPlan}
      renderForm={(form, set) => <div className="grid gap-4"><div className="space-y-1.5"><Label>Reja nomi *</Label><Input value={form.title} onChange={(event) => set({ title: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Ariza muddati *</Label><Input type="date" value={form.applicationDeadline} onChange={(event) => set({ applicationDeadline: event.target.value })} /></div><div className="space-y-1.5"><Label>Holati</Label><Select value={form.status} onValueChange={(status) => set({ status: status as SaveReReadingPlanRequest["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PLANNED">Rejalashtirilgan</SelectItem><SelectItem value="OPEN">Ochiq</SelectItem><SelectItem value="CLOSED">Yopiq</SelectItem></SelectContent></Select></div></div><div className="space-y-1.5"><Label>Tavsif</Label><Textarea value={form.description} onChange={(event) => set({ description: event.target.value })} /></div></div>}
    />
  </div>;
}

const blankApplication = (): SaveReReadingApplicationRequest => ({ planId: 0, studentId: 0, contractNumber: "", totalCredits: 0, totalAmount: 0, paidAmount: 0 });

export function ReReadingApplications() {
  const { user } = useAuth(); const { toast } = useToast(); const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const data = useCrudData<ReReadingApplication>(["re-reading-applications"], listReReadingApplications);
  const plans = useQuery({ queryKey: ["re-reading-plans"], queryFn: listReReadingPlans, staleTime: 30_000 });
  const students = useQuery({ queryKey: ["re-reading-students"], queryFn: listReReadingStudents, staleTime: 60_000 });
  const [working, setWorking] = useState<number | null>(null);
  async function change(id: number, status: ReReadingApplicationStatus) { setWorking(id); try { await changeReReadingApplicationStatus(id, status); toast({ title: `Holat: ${statusLabel[status]}` }); await data.reload(); } catch (error) { toast({ variant: "destructive", title: "Xatolik", description: error instanceof Error ? error.message : "Holat o'zgarmadi" }); } finally { setWorking(null); } }
  const actions = (item: ReReadingApplication) => item.status === "DRAFT" ? <Button size="sm" variant="outline" disabled={working === item.id} onClick={() => void change(item.id, "SUBMITTED")}><Send className="mr-1 h-3 w-3" />Topshirish</Button> : item.status === "SUBMITTED" ? <div className="flex gap-1"><Button size="sm" disabled={working === item.id} onClick={() => void change(item.id, "APPROVED")}><Check className="mr-1 h-3 w-3" />Tasdiq</Button><Button size="sm" variant="destructive" disabled={working === item.id} onClick={() => void change(item.id, "REJECTED")}><X className="h-3 w-3" /></Button></div> : item.status === "REJECTED" ? <Button size="sm" variant="outline" disabled={working === item.id} onClick={() => void change(item.id, "DRAFT")}>Qoralamaga</Button> : null;
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Qayta o'qish" description="Talaba arizasi, shartnoma raqami, kredit, to'lov, qarzdorlik va tasdiqlash oqimi." />
    <CrudSection<ReReadingApplication, SaveReReadingApplicationRequest> title="Qayta o'qish arizalari" items={data.items} loading={data.loading} error={data.error} onReload={data.reload} canWrite={canWrite}
      getId={(item) => item.id} getName={(item) => item.contractNumber} search={(item) => `${item.fullName} ${item.studentNumber} ${item.group} ${item.contractNumber} ${item.planTitle}`}
      canEditItem={(item) => item.status === "DRAFT"} canDeleteItem={(item) => item.status === "DRAFT" || item.status === "REJECTED"}
      columns={[{ header: "F.I.O.", cell: (item) => <div><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.studentNumber} · {item.group || "Guruhsiz"}</div></div> }, { header: "Reja", cell: (item) => item.planTitle }, { header: "Shartnoma", cell: (item) => item.contractNumber }, { header: "Kredit", cell: (item) => item.totalCredits }, { header: "Jami", cell: (item) => money(item.totalAmount) }, { header: "To'langan / qarz", cell: (item) => <div><div>{money(item.paidAmount)}</div><div className="text-xs text-destructive">{money(item.debtAmount)}</div></div> }, { header: "Topshirilgan", cell: (item) => date(item.submittedAt, true) }, { header: "Holat", cell: (item) => <Badge variant={statusVariant(item.status)}>{statusLabel[item.status]}</Badge> }, { header: "Amal", cell: actions }]}
      blankForm={blankApplication} toForm={(item) => ({ planId: item.planId, studentId: item.studentId, contractNumber: item.contractNumber, totalCredits: item.totalCredits, totalAmount: item.totalAmount, paidAmount: item.paidAmount })}
      validate={(form) => !form.planId ? "Rejani tanlang" : !form.studentId ? "Talabani tanlang" : form.totalAmount < 0 || form.paidAmount < 0 ? "Summa manfiy bo'lmaydi" : form.paidAmount > form.totalAmount ? "To'langan summa jamidan oshmaydi" : null}
      onCreate={(form) => createReReadingApplication({ ...form, contractNumber: form.contractNumber?.trim() || null }).then(() => undefined)} onUpdate={(id, form) => updateReReadingApplication(id, form).then(() => undefined)} onDelete={deleteReReadingApplication}
      renderForm={(form, set) => <div className="grid gap-4"><div className="space-y-1.5"><Label>Qayta o'qish rejasi *</Label><Select value={form.planId ? String(form.planId) : ""} onValueChange={(value) => set({ planId: Number(value) })}><SelectTrigger><SelectValue placeholder="Rejani tanlang" /></SelectTrigger><SelectContent>{(plans.data ?? []).filter((plan) => plan.status === "OPEN" || plan.id === form.planId).map((plan) => <SelectItem key={plan.id} value={String(plan.id)}>{plan.title} — {date(plan.applicationDeadline)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Talaba *</Label><Select value={form.studentId ? String(form.studentId) : ""} onValueChange={(value) => set({ studentId: Number(value) })}><SelectTrigger><SelectValue placeholder="Talabani tanlang" /></SelectTrigger><SelectContent>{(students.data ?? []).map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.fullName} — {student.studentNumber}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Shartnoma raqami (bo'sh qoldirilsa avtomatik)</Label><Input value={form.contractNumber ?? ""} onChange={(event) => set({ contractNumber: event.target.value })} /></div><div className="grid grid-cols-3 gap-3"><div className="space-y-1.5"><Label>Kredit (0 = avtomatik)</Label><Input type="number" min={0} value={form.totalCredits} onChange={(event) => set({ totalCredits: Number(event.target.value) })} /></div><div className="space-y-1.5"><Label>Jami summa</Label><Input type="number" min={0} value={form.totalAmount} onChange={(event) => set({ totalAmount: Number(event.target.value) })} /></div><div className="space-y-1.5"><Label>To'langan</Label><Input type="number" min={0} value={form.paidAmount} onChange={(event) => set({ paidAmount: Number(event.target.value) })} /></div></div></div>}
    />
  </div>;
}

interface RecoveryRow { applicationId: number; fullName: string; studentNumber: string; group: string; contractNumber: string; subject: string; semester?: number; credits?: number; totalScore?: number | null; mark?: number | null; passed?: boolean; assessed: boolean }
export function ReReadingRecoveryResults() {
  const query = useQuery({ queryKey: ["re-reading-recovery-results"], queryFn: listReReadingRecoveryResults, staleTime: 30_000 });
  const rows: RecoveryRow[] = (query.data ?? []).flatMap<RecoveryRow>((application: ReReadingRecovery) => application.results.length ? application.results.map((result) => ({ applicationId: application.applicationId, fullName: application.fullName, studentNumber: application.studentNumber, group: application.group, contractNumber: application.contractNumber, subject: result.subject, semester: result.semester, credits: result.credits, totalScore: result.totalScore, mark: result.mark, passed: result.passed, assessed: result.assessed })) : [{ applicationId: application.applicationId, fullName: application.fullName, studentNumber: application.studentNumber, group: application.group, contractNumber: application.contractNumber, subject: "Baholash kutilmoqda", semester: undefined, credits: undefined, totalScore: undefined, mark: undefined, passed: undefined, assessed: false }]);
  const columns: ColumnDef<RecoveryRow>[] = [{ accessorKey: "fullName", header: "F.I.O." }, { accessorKey: "group", header: "Guruh" }, { accessorKey: "contractNumber", header: "Shartnoma" }, { accessorKey: "subject", header: "Fan" }, { accessorKey: "semester", header: "Semestr" }, { accessorKey: "credits", header: "Kredit" }, { id: "score", header: "Jami ball", cell: ({ row }) => row.original.totalScore ?? "—" }, { id: "mark", header: "Baho", cell: ({ row }) => row.original.mark ?? "—" }, { id: "status", header: "Holat", cell: ({ row }) => <Badge variant={!row.original.assessed ? "secondary" : row.original.passed ? "default" : "destructive"}>{!row.original.assessed ? "Kutilmoqda" : row.original.passed ? "O'tdi" : "Qarzdor"}</Badge> }];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Qayta o'qishga tiklanganlarni baholash" description="Tasdiqlangan qayta o'qish arizalari mavjud imtihon, test va topshiriq natijalari bilan bitta reyestrda." /><State query={query} />{!query.isLoading && !query.error && <DataTable columns={columns} data={rows} searchPlaceholder="Talaba yoki fan bo'yicha qidirish..." emptyText="Tasdiqlangan ariza mavjud emas" />}</div>;
}

export function TeacherReReadingReport() {
  const query = useQuery({ queryKey: ["re-reading-teacher-report"], queryFn: listReReadingTeacherReport, staleTime: 30_000 });
  const columns: ColumnDef<ReReadingTeacherReport>[] = [{ accessorKey: "teacherName", header: "O'qituvchi" }, { id: "subjects", header: "Fanlar", cell: ({ row }) => row.original.subjects.join(", ") || "—" }, { accessorKey: "studentCount", header: "Talabalar" }, { accessorKey: "totalCredits", header: "Jami kredit" }];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Qayta o'qish ma'lumotlari" description="O'qituvchi va fanlar kesimida tasdiqlangan qayta o'qish yuklamasi." /><State query={query} />{!query.isLoading && !query.error && <DataTable columns={columns} data={query.data ?? []} searchPlaceholder="O'qituvchi yoki fan..." emptyText="Ma'lumot mavjud emas" />}</div>;
}

export function StudentReReadingReport() {
  const query = useQuery({ queryKey: ["re-reading-student-report"], queryFn: listReReadingStudentReport, staleTime: 30_000 });
  const columns: ColumnDef<ReReadingStudentReport>[] = [{ id: "student", header: "F.I.O.", cell: ({ row }) => <div><div className="font-medium">{row.original.application.fullName}</div><div className="text-xs text-muted-foreground">{row.original.application.studentNumber}</div></div> }, { id: "group", header: "Guruh", cell: ({ row }) => row.original.application.group || "—" }, { id: "contract", header: "Shartnoma", cell: ({ row }) => row.original.application.contractNumber }, { id: "payment", header: "To'lov / qarz", cell: ({ row }) => `${money(row.original.application.paidAmount)} / ${money(row.original.application.debtAmount)}` }, { accessorKey: "assessedSubjects", header: "Baholangan" }, { accessorKey: "passedSubjects", header: "O'tgan" }, { accessorKey: "debtSubjects", header: "Qarzdor" }, { id: "average", header: "O'rtacha", cell: ({ row }) => row.original.averageScore ?? "—" }, { id: "status", header: "Holat", cell: ({ row }) => <Badge variant={statusVariant(row.original.application.status)}>{statusLabel[row.original.application.status]}</Badge> }];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Qayta o'qiyotgan talabalar" description="Talaba, shartnoma/to'lov va akademik natijalar bo'yicha yig'ma hisobot." /><State query={query} />{!query.isLoading && !query.error && <DataTable columns={columns} data={query.data ?? []} searchPlaceholder="Talaba yoki shartnoma..." emptyText="Ma'lumot mavjud emas" />}</div>;
}
