import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { qk } from '@/lib/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicSelect } from '@/components/admin/academic-select';
import {
  admitStudent,
  createStudent,
  getStudent,
  listStudentLifecycle,
  listStudents,
  promoteStudent,
  transitionStudent,
  updateStudent,
} from '@/lib/student-api';
import type {
  DegreeLevel,
  EducationForm,
  Gender,
  PaymentType,
  StudentDto,
  StudentLifecycleEventType,
  StudentLifecycleRequest,
  StudentStatus,
  StudentSummaryDto,
} from '@/types/student.types';
import { Loader2, ArrowUpCircle, Edit, History, UserPlus, RefreshCcw, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type LifecycleAction = Exclude<StudentLifecycleEventType, 'ADMISSION'>;

const today = () => new Date().toISOString().slice(0, 10);
const emptyEvidence = () => ({
  orderNumber: '',
  orderDate: today(),
  effectiveDate: today(),
  legalBasis: "559-son qaror 12-bandi va tashkilotning talabalar harakati reglamenti",
  reason: '',
});
const emptyPersonalForm = () => ({
  firstName: '', lastName: '', pinfl: '', studentNumber: '', birthDate: '', gender: 'MALE' as Gender,
  email: '',
});
const emptyAdmissionForm = () => ({
  groupId: '', facultyId: '', programId: '', course: '1', language: 'uz', academicYear: '',
  degreeLevel: 'BACHELOR' as DegreeLevel, educationForm: 'FULL_TIME' as EducationForm,
  paymentType: 'CONTRACT' as PaymentType, contractNumber: '', contractAmount: '',
  ...emptyEvidence(),
});
const emptyLifecycle = () => ({ ...emptyEvidence(), targetProgramId: '', targetGroupId: '', academicYear: '' });

const actionLabel: Record<LifecycleAction, string> = {
  SUSPENSION: "O'qishni to'xtatish",
  REINSTATEMENT: 'Qayta tiklash',
  TRANSFER: "Ko'chirish",
  EXPULSION: 'Chetlashtirish',
  GRADUATION: 'Bitiruvchi qilish',
};
const statusLabel: Record<StudentStatus, string> = {
  REGISTERED: 'Qabul qilinmagan', ACTIVE: 'Faol', SUSPENDED: "To'xtatilgan", EXPELLED: 'Chetlashtirilgan', GRADUATED: 'Bitirgan',
};
const availableActions: Record<StudentStatus, LifecycleAction[]> = {
  REGISTERED: [],
  ACTIVE: ['SUSPENSION', 'TRANSFER', 'EXPULSION', 'GRADUATION'],
  SUSPENDED: ['REINSTATEMENT', 'TRANSFER', 'EXPULSION'],
  EXPELLED: ['REINSTATEMENT'],
  GRADUATED: [],
};

export function StudentManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: students = [], isLoading } = useQuery({ queryKey: qk.students(), queryFn: listStudents });
  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(emptyPersonalForm);
  const [admissionStudent, setAdmissionStudent] = useState<StudentSummaryDto | null>(null);
  const [admissionForm, setAdmissionForm] = useState(emptyAdmissionForm);
  const [lifecycleTarget, setLifecycleTarget] = useState<{ student: StudentSummaryDto; action: LifecycleAction } | null>(null);
  const [lifecycleForm, setLifecycleForm] = useState(emptyLifecycle);
  const [historyStudent, setHistoryStudent] = useState<StudentSummaryDto | null>(null);
  const [saving, setSaving] = useState(false);
  const history = useQuery({
    queryKey: ['student-lifecycle', historyStudent?.id],
    queryFn: () => listStudentLifecycle(historyStudent!.id!),
    enabled: historyStudent?.id != null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.students() });
  const optionalId = (value: string) => value ? Number(value) : null;
  const closeStudentDialog = () => { setIsAdding(false); setEditingStudent(null); setFormData(emptyPersonalForm()); };
  const showError = (error: unknown) => toast({
    title: 'Amal rad etildi',
    description: error instanceof Error ? error.message : "Server lifecycle qoidasini qabul qilmadi",
    variant: 'destructive',
  });

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.pinfl.trim()
      || !formData.studentNumber.trim() || !formData.birthDate) {
      toast({ title: 'Majburiy maydonlar', description: "Ism, familiya, JSHSHIR, talaba raqami va tug'ilgan sanani kiriting", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const personalPayload = {
        firstName: formData.firstName.trim(), lastName: formData.lastName.trim(),
        email: formData.email.trim() || null,
      };
      if (editingStudent?.id != null) {
        await updateStudent(editingStudent.id, personalPayload);
        toast({ title: 'Muvaffaqiyatli', description: "Talabaning shaxsiy ma'lumotlari yangilandi" });
      } else {
        await createStudent({
          ...personalPayload,
          pinfl: formData.pinfl.trim(), studentNumber: formData.studentNumber.trim(), birthDate: formData.birthDate,
          gender: formData.gender, citizenship: 'UZBEKISTAN',
        });
        toast({ title: "Kartochka yaratildi", description: "Endi talabani alohida o'qishga biriktirish mumkin" });
      }
      closeStudentDialog();
      await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const handleEditClick = async (summary: StudentSummaryDto) => {
    if (summary.id == null) return;
    try {
      const student = await getStudent(summary.id);
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName || '', lastName: student.lastName || '', pinfl: student.pinfl || '',
        studentNumber: student.studentNumber || '', birthDate: student.birthDate || '', gender: student.gender || 'MALE',
        email: student.email || '',
      });
    } catch (error) { showError(error); }
  };

  const openAdmission = (student: StudentSummaryDto) => {
    setAdmissionStudent(student);
    setAdmissionForm(emptyAdmissionForm());
  };
  const submitAdmission = async () => {
    if (admissionStudent?.id == null) return;
    if (!admissionForm.programId) {
      toast({ title: "Ta'lim dasturi majburiy", description: "Talabani qabul qilishdan oldin ta'lim dasturini tanlang", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await admitStudent(admissionStudent.id, {
        facultyId: optionalId(admissionForm.facultyId), programId: Number(admissionForm.programId),
        groupId: optionalId(admissionForm.groupId), academicYear: admissionForm.academicYear.trim() || null,
        degreeLevel: admissionForm.degreeLevel, educationForm: admissionForm.educationForm,
        educationLanguage: admissionForm.language, courseNumber: Number(admissionForm.course),
        paymentType: admissionForm.paymentType, contractNumber: admissionForm.contractNumber.trim() || null,
        contractAmount: admissionForm.contractAmount ? Number(admissionForm.contractAmount) : null,
        orderNumber: admissionForm.orderNumber, orderDate: admissionForm.orderDate,
        effectiveDate: admissionForm.effectiveDate, legalBasis: admissionForm.legalBasis, reason: admissionForm.reason,
      });
      toast({ title: "O'qishga biriktirildi", description: "Akademik ma'lumot va qabul buyrug'i saqlandi" });
      setAdmissionStudent(null); setAdmissionForm(emptyAdmissionForm()); await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const runPromotion = async (studentId: number | null) => {
    if (studentId == null) return;
    try { await promoteStudent(studentId); await invalidate(); }
    catch (error) { showError(error); }
  };

  const openLifecycle = (student: StudentSummaryDto, action: LifecycleAction) => {
    setLifecycleTarget({ student, action }); setLifecycleForm(emptyLifecycle());
  };
  const submitLifecycle = async () => {
    if (!lifecycleTarget?.student.id) return;
    setSaving(true);
    try {
      const request: StudentLifecycleRequest = {
        eventType: lifecycleTarget.action,
        orderNumber: lifecycleForm.orderNumber, orderDate: lifecycleForm.orderDate,
        effectiveDate: lifecycleForm.effectiveDate, legalBasis: lifecycleForm.legalBasis, reason: lifecycleForm.reason,
        targetProgramId: lifecycleTarget.action === 'TRANSFER' ? optionalId(lifecycleForm.targetProgramId) : null,
        targetGroupId: lifecycleTarget.action === 'TRANSFER' ? optionalId(lifecycleForm.targetGroupId) : null,
        academicYear: lifecycleTarget.action === 'TRANSFER' ? lifecycleForm.academicYear.trim() || null : null,
      };
      await transitionStudent(lifecycleTarget.student.id, request);
      toast({ title: actionLabel[lifecycleTarget.action], description: 'Buyruq va lifecycle hodisasi saqlandi' });
      setLifecycleTarget(null); setLifecycleForm(emptyLifecycle()); await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const columns: ColumnDef<StudentSummaryDto>[] = [
    { accessorKey: 'fullName', header: 'Ism', cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span> },
    { accessorKey: 'studentNumber', header: 'Talaba raqami' },
    { accessorKey: 'pinfl', header: 'JSHSHIR' },
    { accessorKey: 'groupId', header: 'Guruh ID', cell: ({ row }) => row.original.groupId ?? '—' },
    { accessorKey: 'courseNumber', header: 'Kurs', cell: ({ row }) => row.original.courseNumber ?? '—' },
    { accessorKey: 'studentStatus', header: 'Holat', cell: ({ row }) => {
      const status = row.original.studentStatus;
      return <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>{status ? statusLabel[status] : '—'}</Badge>;
    } },
    { id: 'actions', header: () => <div className="text-right">Amallar</div>, enableSorting: false, cell: ({ row: { original: student } }) => {
      const status = student.studentStatus ?? 'REGISTERED';
      return <div className="flex flex-wrap justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEditClick(student)} title="Shaxsiy ma'lumot"><Edit className="h-4 w-4" /></Button>
        {status === 'REGISTERED' && <Button size="sm" variant="default" onClick={() => openAdmission(student)}><GraduationCap className="mr-1 h-4 w-4" />O'qishga biriktirish</Button>}
        {status === 'ACTIVE' && <Button size="sm" variant="ghost" onClick={() => runPromotion(student.id)} title="Kursdan o'tkazish"><ArrowUpCircle className="h-4 w-4" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setHistoryStudent(student)} title="Lifecycle tarixi"><History className="h-4 w-4" /></Button>
        {availableActions[status].map(action => <Button key={action} size="sm" variant="outline" onClick={() => openLifecycle(student, action)}>{actionLabel[action]}</Button>)}
      </div>;
    } },
  ];

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return <div className="space-y-6 p-3 sm:p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Talabalar</h1><p className="text-sm text-muted-foreground">Avval shaxsiy kartochka yaratiladi, keyin talaba o'qishga alohida biriktiriladi.</p></div>
      <Button className="gap-2" onClick={() => { setFormData(emptyPersonalForm()); setIsAdding(true); }}><UserPlus className="h-4 w-4" />Talaba qo'shish</Button>
    </div>
    <Card><CardHeader><CardTitle>Barcha talabalar</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={students} searchPlaceholder="Ism, talaba raqami yoki JSHSHIR..." showColumnToggle emptyText="Talabalar topilmadi" /></CardContent></Card>

    <Dialog open={isAdding || !!editingStudent} onOpenChange={open => { if (!open) closeStudentDialog(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editingStudent ? "Shaxsiy ma'lumotlarni tahrirlash" : "Talabaning shaxsiy kartochkasi"}</DialogTitle></DialogHeader>
        {!editingStudent && <p className="text-sm text-muted-foreground">Bu yerda faqat shaxsiy ma'lumotlar saqlanadi. O'qishga biriktirish keyingi alohida amalda bajariladi.</p>}
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Field label="Ism *"><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></Field>
          <Field label="Familiya *"><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></Field>
          <Field label="JSHSHIR *"><Input value={formData.pinfl} disabled={!!editingStudent} onChange={e => setFormData({...formData, pinfl: e.target.value})} /></Field>
          <Field label="Talaba raqami *"><Input value={formData.studentNumber} disabled={!!editingStudent} onChange={e => setFormData({...formData, studentNumber: e.target.value})} /></Field>
          <Field label="Tug'ilgan sana *"><Input type="date" value={formData.birthDate} disabled={!!editingStudent} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></Field>
          <Field label="Jinsi *"><Select value={formData.gender} disabled={!!editingStudent} onValueChange={(value: Gender) => setFormData({...formData, gender: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">Erkak</SelectItem><SelectItem value="FEMALE">Ayol</SelectItem></SelectContent></Select></Field>
          <Field label="Email"><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></Field>
        </div><DialogFooter><Button variant="outline" onClick={closeStudentDialog}>Bekor qilish</Button><Button disabled={saving} onClick={handleSave}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!admissionStudent} onOpenChange={open => { if (!open) setAdmissionStudent(null); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{admissionStudent?.fullName}: o'qishga biriktirish</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Bu bosqichda ta'lim dasturi, guruh, kontrakt va qabul buyrug'i kiritiladi.</p>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Field label="Fakultet"><AcademicSelect kind="faculty" valueMode="id" value={admissionForm.facultyId} onChange={value => setAdmissionForm({...admissionForm, facultyId: value})} /></Field>
          <Field label="Ta'lim dasturi"><AcademicSelect kind="program" valueMode="id" value={admissionForm.programId} onChange={value => setAdmissionForm({...admissionForm, programId: value, groupId: ''})} /></Field>
          <Field label="Guruh"><AcademicSelect kind="group" valueMode="id" value={admissionForm.groupId} onChange={value => setAdmissionForm({...admissionForm, groupId: value})} /></Field>
          <Field label="O'quv yili"><Input value={admissionForm.academicYear} placeholder="2026-2027" onChange={e => setAdmissionForm({...admissionForm, academicYear: e.target.value})} /></Field>
          <Field label="Ta'lim darajasi"><Select value={admissionForm.degreeLevel} onValueChange={(value: DegreeLevel) => setAdmissionForm({...admissionForm, degreeLevel: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BACHELOR">Bakalavriat</SelectItem><SelectItem value="MASTER">Magistratura</SelectItem><SelectItem value="PHD">PhD</SelectItem><SelectItem value="ASSOCIATE">Associate</SelectItem></SelectContent></Select></Field>
          <Field label="Ta'lim shakli"><Select value={admissionForm.educationForm} onValueChange={(value: EducationForm) => setAdmissionForm({...admissionForm, educationForm: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL_TIME">Kunduzgi</SelectItem><SelectItem value="DISTANCE">Masofaviy</SelectItem><SelectItem value="PART_TIME">Sirtqi</SelectItem><SelectItem value="EVENING">Kechki</SelectItem></SelectContent></Select></Field>
          <Field label="Ta'lim tili"><Select value={admissionForm.language} onValueChange={value => setAdmissionForm({...admissionForm, language: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uz">O'zbek</SelectItem><SelectItem value="ru">Rus</SelectItem><SelectItem value="en">Ingliz</SelectItem></SelectContent></Select></Field>
          <Field label="Kurs"><Input type="number" min="1" max="6" value={admissionForm.course} onChange={e => setAdmissionForm({...admissionForm, course: e.target.value})} /></Field>
          <Field label="To'lov turi"><Select value={admissionForm.paymentType} onValueChange={(value: PaymentType) => setAdmissionForm({...admissionForm, paymentType: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CONTRACT">Kontrakt</SelectItem><SelectItem value="GRANT">Grant</SelectItem></SelectContent></Select></Field>
          <Field label="Kontrakt raqami"><Input value={admissionForm.contractNumber} onChange={e => setAdmissionForm({...admissionForm, contractNumber: e.target.value})} /></Field>
          <Field label="Kontrakt summasi"><Input type="number" min="0" value={admissionForm.contractAmount} onChange={e => setAdmissionForm({...admissionForm, contractAmount: e.target.value})} /></Field>
          <EvidenceFields value={admissionForm} onChange={patch => setAdmissionForm({...admissionForm, ...patch})} />
        </div><DialogFooter><Button variant="outline" onClick={() => setAdmissionStudent(null)}>Bekor qilish</Button><Button disabled={saving} onClick={submitAdmission}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}O'qishga biriktirish</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!lifecycleTarget} onOpenChange={open => { if (!open) setLifecycleTarget(null); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{lifecycleTarget && `${lifecycleTarget.student.fullName}: ${actionLabel[lifecycleTarget.action]}`}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
        {lifecycleTarget?.action === 'TRANSFER' && <><Field label="Yangi ta'lim dasturi *"><AcademicSelect kind="program" valueMode="id" value={lifecycleForm.targetProgramId} onChange={value => setLifecycleForm({...lifecycleForm, targetProgramId: value, targetGroupId: ''})} /></Field><Field label="Yangi guruh"><AcademicSelect kind="group" valueMode="id" value={lifecycleForm.targetGroupId} onChange={value => setLifecycleForm({...lifecycleForm, targetGroupId: value})} /></Field><Field label="O'quv yili"><Input value={lifecycleForm.academicYear} placeholder="2026-2027" onChange={e => setLifecycleForm({...lifecycleForm, academicYear: e.target.value})} /></Field></>}
        <EvidenceFields value={lifecycleForm} onChange={patch => setLifecycleForm({...lifecycleForm, ...patch})} />
      </div><DialogFooter><Button variant="outline" onClick={() => setLifecycleTarget(null)}>Bekor qilish</Button><Button disabled={saving} onClick={submitLifecycle}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Buyruqni qo'llash</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog open={!!historyStudent} onOpenChange={open => { if (!open) setHistoryStudent(null); }}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{historyStudent?.fullName}: lifecycle tarixi</DialogTitle></DialogHeader>
      {history.isLoading ? <Loader2 className="mx-auto animate-spin" /> : <div className="space-y-3">{(history.data ?? []).map(event => <Card key={event.id}><CardContent className="space-y-2 pt-4"><div className="flex flex-wrap justify-between gap-2"><Badge>{event.eventType}</Badge><span className="text-sm font-medium">{event.fromStatus ?? '—'} → {event.toStatus}</span></div><p className="text-sm"><b>Buyruq:</b> {event.orderNumber} / {event.orderDate}; <b>amal:</b> {event.effectiveDate}</p>{event.eventType === 'TRANSFER' && <p className="text-sm"><b>Dastur:</b> {event.fromProgramName ?? '—'} → {event.toProgramName ?? '—'}; <b>guruh:</b> {event.fromGroupId ?? '—'} → {event.toGroupId ?? '—'}</p>}<p className="text-sm"><b>Asos:</b> {event.legalBasis}</p><p className="text-sm"><b>Sabab:</b> {event.reason}</p><p className="text-xs text-muted-foreground">{event.recordedByName} · {new Date(event.recordedAt).toLocaleString('uz-Latn')}</p></CardContent></Card>)}{history.data?.length === 0 && <p className="py-8 text-center text-muted-foreground">Lifecycle yozuvi mavjud emas.</p>}</div>}
      <DialogFooter><Button variant="outline" onClick={() => history.refetch()}><RefreshCcw className="mr-2 h-4 w-4" />Yangilash</Button></DialogFooter></DialogContent>
    </Dialog>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function EvidenceFields({ value, onChange }: {
  value: ReturnType<typeof emptyEvidence>;
  onChange: (patch: Partial<ReturnType<typeof emptyEvidence>>) => void;
}) {
  return <>
    <Field label="Buyruq raqami *"><Input value={value.orderNumber} onChange={e => onChange({orderNumber: e.target.value})} /></Field>
    <Field label="Buyruq sanasi *"><Input type="date" max={today()} value={value.orderDate} onChange={e => onChange({orderDate: e.target.value})} /></Field>
    <Field label="Amal sanasi *"><Input type="date" min={value.orderDate} max={today()} value={value.effectiveDate} onChange={e => onChange({effectiveDate: e.target.value})} /></Field>
    <div className="space-y-2 sm:col-span-2"><Label>Huquqiy asos *</Label><Textarea value={value.legalBasis} onChange={e => onChange({legalBasis: e.target.value})} /></div>
    <div className="space-y-2 sm:col-span-2"><Label>Sabab *</Label><Textarea value={value.reason} onChange={e => onChange({reason: e.target.value})} /></div>
  </>;
}
