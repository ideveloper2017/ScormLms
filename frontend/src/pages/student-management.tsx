import { useEffect, useState, type ReactNode } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AcademicSelect } from '@/components/admin/academic-select';
import { HemisImportDialog } from '@/components/admin/HemisImportDialog';
import { listGroups, listPrograms } from '@/lib/academic-api';
import { listCountries, listDistricts, listRegions } from '@/lib/classifier-api';
import {
  academicYearOptions,
  courseNumberFromSemester,
  filterAdmissionGroups,
  filterAdmissionPrograms,
  programDegreeLevel,
  semesterOptionsForDegree,
} from '@/lib/student-admission-cascade';
import {
  admitStudent,
  bulkTransferStudents,
  changeStudentAccountAccess,
  createStudent,
  exportStudentRegistry,
  getStudent,
  listStudentLifecycle,
  listStudents,
  promoteStudent,
  setupStudentCredentials,
  transitionStudent,
  updateStudentPersonalProfile,
} from '@/lib/student-api';
import type {
  DegreeLevel,
  Citizenship,
  EducationForm,
  Gender,
  PassportType,
  PaymentType,
  StudentDto,
  StudentLifecycleEventType,
  StudentLifecycleRequest,
  StudentStatus,
  StudentSummaryDto,
} from '@/types/student.types';
import { Loader2, Download, UserPlus, RefreshCcw, ArrowRightLeft, MoreHorizontal, DatabaseZap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { hasAuthority } from '@/lib/rbac-api';

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
  firstName: '', lastName: '', middleName: '', pinfl: '', studentNumber: '', birthDate: '', gender: 'MALE' as Gender,
  citizenship: 'UZBEKISTAN' as Citizenship, phoneNumber: '', email: '', photoUrl: '',
  citizenshipCountryId: '',
  passportType: 'NONE' as PassportType | 'NONE', passportSeries: '', passportNumber: '',
  passportIssuedDate: '', passportExpiryDate: '', passportIssuedBy: '',
  permanentRegion: '', permanentRegionId: '', permanentDistrict: '', permanentDistrictId: '', permanentAddress: '',
  currentRegion: '', currentRegionId: '', currentDistrict: '', currentDistrictId: '', currentAddress: '',
});
const emptyAdmissionForm = () => ({
  groupId: '', programId: '', semester: '', language: 'uz', academicYear: '',
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

interface StudentManagementProps {
  initialStatus?: StudentStatus | 'ALL';
  title?: string;
  description?: string;
  allowCreate?: boolean;
}

export function StudentManagement({
  initialStatus = 'ALL',
  title = 'Talabalar',
  description = "Talaba ma'lumoti, o'qishga biriktirish va akkauntni bir joydan boshqaring.",
  allowCreate = true,
}: StudentManagementProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManagePersonal = hasAuthority(user, 'USER_MANAGE');
  const canReadAcademic = hasAuthority(user, 'ACADEMIC_READ') || hasAuthority(user, 'ACADEMIC_WRITE');
  const canManageAcademic = hasAuthority(user, 'ACADEMIC_WRITE');
  const canManageAccounts = hasAuthority(user, 'USER_MANAGE');
  const canExport = hasAuthority(user, 'USER_READ') && hasAuthority(user, 'REPORT_READ');
  const canImportHemis = hasAuthority(user, 'INTEGRATION_WRITE');
  const [registrySearch, setRegistrySearch] = useState('');
  const [debouncedRegistrySearch, setDebouncedRegistrySearch] = useState('');
  const [registryStatus, setRegistryStatus] = useState<StudentStatus | 'ALL'>(initialStatus);
  const [registryPage, setRegistryPage] = useState(0);
  const [registryPageSize, setRegistryPageSize] = useState(20);
  const [exportingRegistry, setExportingRegistry] = useState(false);
  const [hemisImportOpen, setHemisImportOpen] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedRegistrySearch(registrySearch.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [registrySearch]);
  useEffect(() => {
    setRegistryStatus(initialStatus);
    setRegistryPage(0);
  }, [initialStatus]);
  const { data: registry, isLoading } = useQuery({
    queryKey: [...qk.students(), debouncedRegistrySearch, registryStatus, registryPage, registryPageSize],
    queryFn: () => listStudents({
      search: debouncedRegistrySearch || undefined,
      status: registryStatus === 'ALL' ? undefined : registryStatus,
      page: registryPage,
      size: registryPageSize,
    }),
  });
  const students = registry?.items ?? [];
  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(emptyPersonalForm);
  const [admissionStudent, setAdmissionStudent] = useState<StudentSummaryDto | null>(null);
  const [admissionForm, setAdmissionForm] = useState(emptyAdmissionForm);
  const [lifecycleTarget, setLifecycleTarget] = useState<{ student: StudentSummaryDto; action: LifecycleAction } | null>(null);
  const [lifecycleForm, setLifecycleForm] = useState(emptyLifecycle);
  const [historyStudent, setHistoryStudent] = useState<StudentSummaryDto | null>(null);
  const [accountTarget, setAccountTarget] = useState<{ student: StudentSummaryDto; enabled: boolean } | null>(null);
  const [accountReason, setAccountReason] = useState('');
  const [credentialTarget, setCredentialTarget] = useState<StudentSummaryDto | null>(null);
  const [credentialPassword, setCredentialPassword] = useState('');
  const [credentialConfirmation, setCredentialConfirmation] = useState('');
  const [selectedAcademicIds, setSelectedAcademicIds] = useState<number[]>([]);
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [bulkTransferForm, setBulkTransferForm] = useState(emptyLifecycle);
  const [saving, setSaving] = useState(false);
  const admissionPrograms = useQuery({
    queryKey: [...qk.programs(), 'admission'],
    queryFn: () => listPrograms(),
    staleTime: 60_000,
  });
  const countriesQuery = useQuery({ queryKey: ['classifiers', 'countries'], queryFn: listCountries, staleTime: 300_000 });
  const regionsQuery = useQuery({ queryKey: ['classifiers', 'regions'], queryFn: listRegions, staleTime: 300_000 });
  const permanentDistrictsQuery = useQuery({
    queryKey: ['classifiers', 'districts', formData.permanentRegionId],
    queryFn: () => listDistricts(Number(formData.permanentRegionId)), enabled: !!formData.permanentRegionId, staleTime: 300_000,
  });
  const currentDistrictsQuery = useQuery({
    queryKey: ['classifiers', 'districts', formData.currentRegionId],
    queryFn: () => listDistricts(Number(formData.currentRegionId)), enabled: !!formData.currentRegionId, staleTime: 300_000,
  });
  useEffect(() => {
    if (isAdding && !formData.citizenshipCountryId) {
      const uz = countriesQuery.data?.find(item => item.code === 'UZ');
      if (uz) setFormData(value => ({ ...value, citizenshipCountryId: String(uz.id), citizenship: 'UZBEKISTAN' }));
    }
  }, [countriesQuery.data, isAdding, formData.citizenshipCountryId]);
  const admissionYearGroups = useQuery({
    queryKey: [...qk.groups(), 'admission-years'],
    queryFn: () => listGroups(),
    staleTime: 60_000,
  });
  const admissionProgramGroups = useQuery({
    queryKey: [...qk.groups(), 'admission-program', admissionForm.programId],
    queryFn: () => listGroups(Number(admissionForm.programId)),
    enabled: !!admissionForm.programId,
    staleTime: 60_000,
  });
  const bulkTransferGroups = useQuery({
    queryKey: [...qk.groups(), 'bulk-transfer-program', bulkTransferForm.targetProgramId],
    queryFn: () => listGroups(Number(bulkTransferForm.targetProgramId)),
    enabled: !!bulkTransferForm.targetProgramId,
    staleTime: 60_000,
  });
  const availableAcademicYears = academicYearOptions(admissionYearGroups.data ?? []);
  const availablePrograms = filterAdmissionPrograms(
    admissionPrograms.data ?? [], admissionYearGroups.data ?? [], admissionForm.academicYear,
  );
  const selectedAdmissionProgram = availablePrograms.find((program) => String(program.id) === admissionForm.programId);
  const availableSemesters = semesterOptionsForDegree(admissionForm.degreeLevel);
  const availableAdmissionGroups = filterAdmissionGroups(
    admissionProgramGroups.data ?? [], admissionForm.academicYear, admissionForm.language,
  );
  const availableBulkPrograms = filterAdmissionPrograms(
    admissionPrograms.data ?? [], admissionYearGroups.data ?? [], bulkTransferForm.academicYear,
  );
  const availableBulkGroups = (bulkTransferGroups.data ?? []).filter(group => group.active
    && group.educationYear?.trim() === bulkTransferForm.academicYear);
  const history = useQuery({
    queryKey: ['student-lifecycle', historyStudent?.id],
    queryFn: () => listStudentLifecycle(historyStudent!.id!),
    enabled: historyStudent?.id != null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.students() });
  const optionalId = (value: string) => value ? Number(value) : null;
  const optionalText = (value: string) => value.trim() || null;
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
    if (!/^\d{14}$/.test(formData.pinfl.trim())) {
      toast({ title: "JSHSHIR noto'g'ri", description: "JSHSHIR 14 ta raqamdan iborat bo'lishi kerak", variant: 'destructive' });
      return;
    }
    const hasPassport = formData.passportType !== 'NONE' || !!formData.passportSeries.trim()
      || !!formData.passportNumber.trim() || !!formData.passportIssuedDate || !!formData.passportExpiryDate;
    if (hasPassport && (formData.passportType === 'NONE' || formData.passportNumber.trim().length < 5)) {
      toast({ title: "Pasport ma'lumoti to'liq emas", description: "Pasport turi va kamida 5 belgili raqamini kiriting", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const personalPayload = {
        firstName: formData.firstName.trim(), lastName: formData.lastName.trim(),
        middleName: optionalText(formData.middleName), phoneNumber: optionalText(formData.phoneNumber),
        email: optionalText(formData.email), photoUrl: optionalText(formData.photoUrl),
        passportType: formData.passportType === 'NONE' ? null : formData.passportType,
        passportSeries: optionalText(formData.passportSeries), passportNumber: optionalText(formData.passportNumber),
        passportIssuedDate: formData.passportIssuedDate || null, passportExpiryDate: formData.passportExpiryDate || null,
        passportIssuedBy: optionalText(formData.passportIssuedBy),
        permanentRegion: optionalText(formData.permanentRegion), permanentRegionId: optionalId(formData.permanentRegionId),
        permanentDistrict: optionalText(formData.permanentDistrict), permanentDistrictId: optionalId(formData.permanentDistrictId),
        permanentAddress: optionalText(formData.permanentAddress), currentRegion: optionalText(formData.currentRegion),
        currentRegionId: optionalId(formData.currentRegionId), currentDistrict: optionalText(formData.currentDistrict),
        currentDistrictId: optionalId(formData.currentDistrictId), currentAddress: optionalText(formData.currentAddress),
      };
      if (editingStudent?.id != null) {
        await updateStudentPersonalProfile(editingStudent.id, personalPayload);
        toast({ title: 'Muvaffaqiyatli', description: "Talabaning shaxsiy ma'lumotlari yangilandi" });
      } else {
        await createStudent({
          ...personalPayload,
          pinfl: formData.pinfl.trim(), studentNumber: formData.studentNumber.trim(), birthDate: formData.birthDate,
          gender: formData.gender, citizenship: formData.citizenship,
          citizenshipCountryId: optionalId(formData.citizenshipCountryId),
        });
        toast({ title: "Talaba yaratildi", description: "Parol berish va o'qishga biriktirish amallari ro'yxatdagi menyuda mavjud" });
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
        firstName: student.firstName || '', lastName: student.lastName || '', middleName: student.middleName || '', pinfl: student.pinfl || '',
        studentNumber: student.studentNumber || '', birthDate: student.birthDate || '', gender: student.gender || 'MALE',
        citizenship: student.citizenship || 'UZBEKISTAN', citizenshipCountryId: student.citizenshipCountryId ? String(student.citizenshipCountryId) : '', phoneNumber: student.phoneNumber || '', email: student.email || '',
        photoUrl: student.photoUrl || '', passportType: student.passportType || 'NONE',
        passportSeries: student.passportSeries || '', passportNumber: student.passportNumber || '',
        passportIssuedDate: student.passportIssuedDate || '', passportExpiryDate: student.passportExpiryDate || '',
        passportIssuedBy: student.passportIssuedBy || '', permanentRegion: student.permanentRegion || '', permanentRegionId: student.permanentRegionId ? String(student.permanentRegionId) : '',
        permanentDistrict: student.permanentDistrict || '', permanentDistrictId: student.permanentDistrictId ? String(student.permanentDistrictId) : '', permanentAddress: student.permanentAddress || '',
        currentRegion: student.currentRegion || '', currentRegionId: student.currentRegionId ? String(student.currentRegionId) : '', currentDistrict: student.currentDistrict || '', currentDistrictId: student.currentDistrictId ? String(student.currentDistrictId) : '', currentAddress: student.currentAddress || '',
      });
    } catch (error) { showError(error); }
  };

  const openAdmission = (student: StudentSummaryDto) => {
    setAdmissionStudent(student);
    setAdmissionForm({ ...emptyAdmissionForm(), academicYear: availableAcademicYears[0] ?? '' });
  };
  const exportRegistry = async () => {
    setExportingRegistry(true);
    try {
      const file = await exportStudentRegistry({
        search: debouncedRegistrySearch || undefined,
        status: registryStatus === 'ALL' ? undefined : registryStatus,
      });
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = file.filename; anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Excel eksport tayyor', description: "JSHSHIR, telefon va email maskalangan" });
    } catch (error) { showError(error); } finally { setExportingRegistry(false); }
  };
  const submitAdmission = async () => {
    if (admissionStudent?.id == null) return;
    if (!admissionForm.academicYear || !admissionForm.programId || !admissionForm.semester || !admissionForm.groupId) {
      toast({ title: "Akademik joylashuv to'liq emas", description: "O'quv yili, ta'lim dasturi, semestr va guruhni ketma-ket tanlang", variant: 'destructive' });
      return;
    }
    const semesterNumber = Number(admissionForm.semester);
    setSaving(true);
    try {
      await admitStudent(admissionStudent.id, {
        programId: Number(admissionForm.programId),
        groupId: optionalId(admissionForm.groupId), academicYear: admissionForm.academicYear.trim() || null,
        degreeLevel: admissionForm.degreeLevel, educationForm: admissionForm.educationForm,
        educationLanguage: admissionForm.language, semesterNumber,
        courseNumber: courseNumberFromSemester(semesterNumber),
        paymentType: admissionForm.paymentType, contractNumber: admissionForm.contractNumber.trim() || null,
        contractAmount: admissionForm.contractAmount ? Number(admissionForm.contractAmount) : null,
        orderNumber: admissionForm.orderNumber, orderDate: admissionForm.orderDate,
        effectiveDate: admissionForm.effectiveDate, legalBasis: admissionForm.legalBasis, reason: admissionForm.reason,
      });
      toast({
        title: "Talaba o'qishga biriktirildi",
        description: admissionStudent.credentialsInitialized
          ? "Akademik ma'lumot va qabul buyrug'i saqlandi; akkaunt foydalanishga tayyor"
          : "Talaba o'qishga biriktirildi; akkauntni ishlatish uchun parol berish kerak",
      });
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

  const submitBulkTransfer = async () => {
    if (selectedAcademicIds.length < 2) {
      toast({ title: 'Kamida 2 ta talaba tanlang', variant: 'destructive' });
      return;
    }
    if (!bulkTransferForm.academicYear || !bulkTransferForm.targetProgramId) {
      toast({ title: "O'quv yili va yangi dastur majburiy", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await bulkTransferStudents({
        studentIds: selectedAcademicIds,
        targetProgramId: Number(bulkTransferForm.targetProgramId),
        targetGroupId: optionalId(bulkTransferForm.targetGroupId),
        academicYear: bulkTransferForm.academicYear,
        orderNumber: bulkTransferForm.orderNumber,
        orderDate: bulkTransferForm.orderDate,
        effectiveDate: bulkTransferForm.effectiveDate,
        legalBasis: bulkTransferForm.legalBasis,
        reason: bulkTransferForm.reason,
      });
      toast({ title: `${result.processedCount} ta talaba ko'chirildi`, description: `${result.orderNumber} buyrug'i atomar qo'llandi` });
      setBulkTransferOpen(false); setBulkTransferForm(emptyLifecycle()); setSelectedAcademicIds([]); await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const submitAccountAccess = async () => {
    if (accountTarget?.student.id == null) return;
    setSaving(true);
    try {
      await changeStudentAccountAccess(accountTarget.student.id, { enabled: accountTarget.enabled, reason: accountReason });
      toast({
        title: accountTarget.enabled ? 'Akkaunt qayta yoqildi' : 'Akkaunt bloklandi',
        description: 'Sabab va amal audit jurnaliga yozildi',
      });
      setAccountTarget(null); setAccountReason(''); await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const submitCredentials = async () => {
    if (credentialTarget?.id == null) return;
    if (credentialPassword.length < 12 || credentialPassword.length > 128) {
      toast({ title: 'Parol noto\'g\'ri', description: "Parol 12 dan 128 tagacha belgidan iborat bo'lishi kerak", variant: 'destructive' });
      return;
    }
    if (credentialPassword !== credentialConfirmation) {
      toast({ title: 'Parollar mos emas', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await setupStudentCredentials(credentialTarget.id, { newPassword: credentialPassword });
      toast({ title: "Parol o'rnatildi", description: credentialTarget.studentStatus === 'ACTIVE' ? 'Akkaunt foydalanishga tayyor' : "Talabani o'qishga biriktirish mumkin" });
      setCredentialTarget(null); setCredentialPassword(''); setCredentialConfirmation(''); await invalidate();
    } catch (error) { showError(error); } finally { setSaving(false); }
  };

  const commonColumns: ColumnDef<StudentSummaryDto>[] = [
    { accessorKey: 'fullName', header: 'Ism', cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span> },
    { accessorKey: 'studentNumber', header: 'Talaba raqami' },
  ];
  const statusColumn: ColumnDef<StudentSummaryDto> = { accessorKey: 'studentStatus', header: 'Akademik holat', cell: ({ row }) => {
    const status = row.original.studentStatus;
    return <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>{status ? statusLabel[status] : '—'}</Badge>;
  } };
  const eligiblePageIds = students
    .filter(student => student.studentStatus === 'ACTIVE' || student.studentStatus === 'SUSPENDED')
    .map(student => student.id)
    .filter((id): id is number => id != null);
  const allEligiblePageSelected = eligiblePageIds.length > 0 && eligiblePageIds.every(id => selectedAcademicIds.includes(id));
  const someEligiblePageSelected = eligiblePageIds.some(id => selectedAcademicIds.includes(id));
  const selectionColumn: ColumnDef<StudentSummaryDto> = {
    id: 'bulk-select', enableSorting: false, enableHiding: false,
    header: () => <Checkbox
      aria-label="Sahifadagi ko'chiriladigan talabalarni tanlash"
      checked={allEligiblePageSelected ? true : someEligiblePageSelected ? 'indeterminate' : false}
      disabled={eligiblePageIds.length === 0}
      onCheckedChange={checked => setSelectedAcademicIds(current => {
        if (!checked) return current.filter(id => !eligiblePageIds.includes(id));
        const combined = [...new Set([...current, ...eligiblePageIds])];
        if (combined.length > 200) {
          toast({ title: "Bir paketda ko'pi bilan 200 ta talaba", variant: 'destructive' });
          return current;
        }
        return combined;
      })}
    />,
    cell: ({ row: { original: student } }) => {
      const id = student.id;
      const eligible = student.studentStatus === 'ACTIVE' || student.studentStatus === 'SUSPENDED';
      return <Checkbox
        aria-label={`${student.fullName}ni ommaviy ko'chirishga tanlash`}
        checked={id != null && selectedAcademicIds.includes(id)} disabled={!eligible || id == null}
        onCheckedChange={checked => id != null && setSelectedAcademicIds(current => {
          if (!checked) return current.filter(value => value !== id);
          if (current.includes(id)) return current;
          if (current.length >= 200) {
            toast({ title: "Bir paketda ko'pi bilan 200 ta talaba", variant: 'destructive' });
            return current;
          }
          return [...current, id];
        })}
      />;
    },
  };
  const registryColumns: ColumnDef<StudentSummaryDto>[] = [
    ...(canManageAcademic ? [selectionColumn] : []),
    ...commonColumns,
    ...(canReadAcademic ? [
      { accessorKey: 'groupId', header: 'Guruh ID', cell: ({ row }) => row.original.groupId ?? '—' },
      { accessorKey: 'courseNumber', header: 'Kurs', cell: ({ row }) => row.original.courseNumber ?? '—' },
    ] satisfies ColumnDef<StudentSummaryDto>[] : []),
    statusColumn,
    ...(canManageAccounts ? [{ accessorKey: 'accountStatus', header: 'Akkaunt', cell: ({ row }) => <Badge variant={row.original.accountEnabled ? 'default' : 'secondary'}>{row.original.credentialsInitialized ? row.original.accountStatus : 'Parol berilmagan'}</Badge> } satisfies ColumnDef<StudentSummaryDto>] : []),
    { id: 'actions', header: () => <div className="text-right">Amallar</div>, enableSorting: false, cell: ({ row: { original: student } }) => {
      const status = student.studentStatus ?? 'REGISTERED';
      const shouldEnable = !student.accountEnabled;
      const enableAllowed = student.studentStatus === 'ACTIVE';
      return <div className="text-right"><DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`${student.fullName} amallari`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {canManagePersonal && <DropdownMenuItem onSelect={() => handleEditClick(student)}>Shaxsiy ma'lumotlarni tahrirlash</DropdownMenuItem>}
          {canManageAccounts && !student.credentialsInitialized && <DropdownMenuItem onSelect={() => { setCredentialTarget(student); setCredentialPassword(''); setCredentialConfirmation(''); }}>Parol berish</DropdownMenuItem>}
          {canManageAcademic && status === 'REGISTERED' && <DropdownMenuItem onSelect={() => openAdmission(student)}>O'qishga biriktirish</DropdownMenuItem>}
          {canManageAcademic && status === 'ACTIVE' && <DropdownMenuItem onSelect={() => runPromotion(student.id)}>Kursdan o'tkazish</DropdownMenuItem>}
          {canReadAcademic && <DropdownMenuItem onSelect={() => setHistoryStudent(student)}>Harakatlar tarixi</DropdownMenuItem>}
          {canManageAcademic && availableActions[status].map(action => <DropdownMenuItem key={action} onSelect={() => openLifecycle(student, action)}>{actionLabel[action]}</DropdownMenuItem>)}
          {canManageAccounts && student.credentialsInitialized && <DropdownMenuItem
            disabled={shouldEnable && !enableAllowed}
            onSelect={() => { setAccountTarget({ student, enabled: shouldEnable }); setAccountReason(''); }}
          >{shouldEnable ? 'Akkauntni qayta yoqish' : 'Akkauntni bloklash'}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu></div>;
    } },
  ];

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return <div className="space-y-6 p-3 sm:p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>
      <div className="flex flex-wrap gap-2">
        {allowCreate && canImportHemis && <Button variant="outline" className="gap-2" onClick={() => setHemisImportOpen(true)}><DatabaseZap className="h-4 w-4" />HEMISdan import</Button>}
        {allowCreate && canManagePersonal && <Button className="gap-2" onClick={() => { setFormData(emptyPersonalForm()); setIsAdding(true); }}><UserPlus className="h-4 w-4" />Talaba qo'shish</Button>}
      </div>
    </div>
    <Card><CardHeader><CardTitle>Talabalar reyestri</CardTitle></CardHeader><CardContent><DataTable
      columns={registryColumns} data={students} searchPlaceholder="Ism, talaba raqami yoki JSHSHIR..." showColumnToggle emptyText="Talabalar topilmadi"
      serverSearch={{ value: registrySearch, onChange: value => { setRegistrySearch(value); setRegistryPage(0); } }}
      serverPagination={{
        pageIndex: registry?.page ?? registryPage, pageSize: registry?.size ?? registryPageSize,
        pageCount: registry?.totalPages ?? 0, totalElements: registry?.totalElements ?? 0,
        onPageChange: setRegistryPage,
        onPageSizeChange: size => { setRegistryPageSize(size); setRegistryPage(0); },
      }}
      toolbar={<div className="flex flex-wrap items-center gap-2">
        <Select value={registryStatus} onValueChange={(value: StudentStatus | 'ALL') => { setRegistryStatus(value); setRegistryPage(0); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Barcha holatlar</SelectItem><SelectItem value="REGISTERED">Qabul qilinmagan</SelectItem><SelectItem value="ACTIVE">Faol</SelectItem><SelectItem value="SUSPENDED">To'xtatilgan</SelectItem><SelectItem value="EXPELLED">Chetlashtirilgan</SelectItem><SelectItem value="GRADUATED">Bitirgan</SelectItem></SelectContent></Select>
        {canManageAcademic && <Button variant="outline" disabled={selectedAcademicIds.length < 2} onClick={() => {
          setBulkTransferForm({ ...emptyLifecycle(), academicYear: availableAcademicYears[0] ?? '' }); setBulkTransferOpen(true);
        }}><ArrowRightLeft className="mr-2 h-4 w-4" />Ommaviy ko'chirish ({selectedAcademicIds.length})</Button>}
        {canExport && <Button variant="outline" disabled={exportingRegistry} onClick={exportRegistry}>{exportingRegistry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Excel eksport</Button>}
      </div>}
    /></CardContent></Card>

    <HemisImportDialog
      open={hemisImportOpen}
      onOpenChange={setHemisImportOpen}
      onImported={() => void invalidate()}
    />

    <Dialog open={isAdding || !!editingStudent} onOpenChange={open => { if (!open) closeStudentDialog(); }}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-6xl"><DialogHeader><DialogTitle>{editingStudent ? "Shaxsiy ma'lumotlarni tahrirlash" : "Talabaning shaxsiy kartochkasi"}</DialogTitle></DialogHeader>
        {!editingStudent && <p className="text-sm text-muted-foreground">Avval asosiy ma'lumotlarni kiriting. Qolgan amallar talaba ro'yxatidagi menyuda bo'ladi.</p>}
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <h3 className="border-b pb-2 font-semibold sm:col-span-2">Asosiy ma'lumotlar</h3>
          <Field label="Ism *"><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></Field>
          <Field label="Familiya *"><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></Field>
          <Field label="Otasining ismi"><Input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} /></Field>
          <Field label="JSHSHIR *"><Input value={formData.pinfl} disabled={!!editingStudent} onChange={e => setFormData({...formData, pinfl: e.target.value})} /></Field>
          <Field label="Talaba raqami *"><Input value={formData.studentNumber} disabled={!!editingStudent} onChange={e => setFormData({...formData, studentNumber: e.target.value})} /></Field>
          <Field label="Tug'ilgan sana *"><Input type="date" value={formData.birthDate} disabled={!!editingStudent} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></Field>
          <Field label="Jinsi *"><Select value={formData.gender} disabled={!!editingStudent} onValueChange={(value: Gender) => setFormData({...formData, gender: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">Erkak</SelectItem><SelectItem value="FEMALE">Ayol</SelectItem></SelectContent></Select></Field>
          <Field label="Fuqarolik mamlakati *"><Select value={formData.citizenshipCountryId} disabled={!!editingStudent || countriesQuery.isLoading} onValueChange={value => { const country = countriesQuery.data?.find(item => String(item.id) === value); setFormData({...formData, citizenshipCountryId: value, citizenship: country?.code === 'UZ' ? 'UZBEKISTAN' : 'OTHER'}); }}><SelectTrigger><SelectValue placeholder="Mamlakatni tanlang" /></SelectTrigger><SelectContent>{(countriesQuery.data ?? []).map(country => <SelectItem key={country.id} value={String(country.id)}>{country.name} ({country.code})</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Telefon"><Input type="tel" placeholder="+998 90 123 45 67" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></Field>
          <Field label="Email"><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></Field>
          <Field label="Foto URL"><Input type="url" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} /></Field>

          <h3 className="border-b pb-2 pt-2 font-semibold sm:col-span-2">Pasport ma'lumotlari</h3>
          <Field label="Hujjat turi"><Select value={formData.passportType} onValueChange={(value: PassportType | 'NONE') => setFormData({...formData, passportType: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Kiritilmagan</SelectItem><SelectItem value="ID_CARD">ID karta</SelectItem><SelectItem value="BIOMETRIC_PASSPORT">Biometrik pasport</SelectItem><SelectItem value="PASSPORT">Pasport</SelectItem><SelectItem value="BIRTH_CERTIFICATE">Tug'ilganlik guvohnomasi</SelectItem></SelectContent></Select></Field>
          <Field label="Seriya"><Input maxLength={10} value={formData.passportSeries} onChange={e => setFormData({...formData, passportSeries: e.target.value.toUpperCase()})} /></Field>
          <Field label="Raqam"><Input maxLength={20} value={formData.passportNumber} onChange={e => setFormData({...formData, passportNumber: e.target.value.toUpperCase()})} /></Field>
          <Field label="Berilgan sana"><Input type="date" max={today()} value={formData.passportIssuedDate} onChange={e => setFormData({...formData, passportIssuedDate: e.target.value})} /></Field>
          <Field label="Amal qilish sanasi"><Input type="date" min={formData.passportIssuedDate || undefined} value={formData.passportExpiryDate} onChange={e => setFormData({...formData, passportExpiryDate: e.target.value})} /></Field>
          <Field label="Kim tomonidan berilgan"><Input value={formData.passportIssuedBy} onChange={e => setFormData({...formData, passportIssuedBy: e.target.value})} /></Field>

          <h3 className="border-b pb-2 pt-2 font-semibold sm:col-span-2">Doimiy yashash manzili</h3>
          <Field label="Hudud"><Select value={formData.permanentRegionId} onValueChange={value => setFormData({...formData, permanentRegionId: value, permanentDistrictId: ''})}><SelectTrigger><SelectValue placeholder={formData.permanentRegion || "Hududni tanlang"} /></SelectTrigger><SelectContent>{(regionsQuery.data ?? []).map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Tuman yoki shahar"><Select value={formData.permanentDistrictId} disabled={!formData.permanentRegionId || permanentDistrictsQuery.isLoading} onValueChange={value => setFormData({...formData, permanentDistrictId: value})}><SelectTrigger><SelectValue placeholder={formData.permanentDistrict || "Avval hududni tanlang"} /></SelectTrigger><SelectContent>{(permanentDistrictsQuery.data ?? []).map(district => <SelectItem key={district.id} value={String(district.id)}>{district.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="space-y-2 sm:col-span-2"><Label>Manzil</Label><Textarea value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} /></div>

          <h3 className="border-b pb-2 pt-2 font-semibold sm:col-span-2">Hozirgi yashash manzili</h3>
          <Field label="Hudud"><Select value={formData.currentRegionId} onValueChange={value => setFormData({...formData, currentRegionId: value, currentDistrictId: ''})}><SelectTrigger><SelectValue placeholder={formData.currentRegion || "Hududni tanlang"} /></SelectTrigger><SelectContent>{(regionsQuery.data ?? []).map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Tuman yoki shahar"><Select value={formData.currentDistrictId} disabled={!formData.currentRegionId || currentDistrictsQuery.isLoading} onValueChange={value => setFormData({...formData, currentDistrictId: value})}><SelectTrigger><SelectValue placeholder={formData.currentDistrict || "Avval hududni tanlang"} /></SelectTrigger><SelectContent>{(currentDistrictsQuery.data ?? []).map(district => <SelectItem key={district.id} value={String(district.id)}>{district.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="space-y-2 sm:col-span-2"><Label>Manzil</Label><Textarea value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})} /></div>
        </div><DialogFooter><Button variant="outline" onClick={closeStudentDialog}>Bekor qilish</Button><Button disabled={saving} onClick={handleSave}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!admissionStudent} onOpenChange={open => { if (!open) setAdmissionStudent(null); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{admissionStudent?.fullName}: o'qishga biriktirish</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Akademik joylashuvni o'quv yili, dastur, semestr va guruh tartibida tanlang.</p>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <h3 className="border-b pb-2 font-semibold sm:col-span-2">Akademik joylashuv</h3>
          <Field label="1. O'quv yili *"><Select value={admissionForm.academicYear} onValueChange={value => setAdmissionForm({...admissionForm, academicYear: value, programId: '', semester: '', groupId: ''})}><SelectTrigger><SelectValue placeholder="O'quv yilini tanlang" /></SelectTrigger><SelectContent>{availableAcademicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="2. Ta'lim dasturi *"><Select value={admissionForm.programId} disabled={!admissionForm.academicYear || admissionPrograms.isLoading} onValueChange={value => { const program = availablePrograms.find(item => String(item.id) === value); setAdmissionForm({...admissionForm, programId: value, degreeLevel: programDegreeLevel(program), language: program?.educationLanguage?.trim() || 'uz', semester: '', groupId: ''}); }}><SelectTrigger><SelectValue placeholder="Dastur tanlang" /></SelectTrigger><SelectContent>{availablePrograms.map(program => <SelectItem key={program.id} value={String(program.id)}>{program.name}</SelectItem>)}</SelectContent></Select></Field>
          {!!admissionForm.academicYear && !admissionPrograms.isLoading && !admissionYearGroups.isLoading && availablePrograms.length === 0 && <p className="text-sm text-destructive sm:col-span-2">Bu o'quv yilida faol guruhi mavjud ta'lim dasturi topilmadi.</p>}
          <Field label="3. Semestr *"><Select value={admissionForm.semester} disabled={!selectedAdmissionProgram} onValueChange={value => setAdmissionForm({...admissionForm, semester: value, groupId: ''})}><SelectTrigger><SelectValue placeholder="Semestr tanlang" /></SelectTrigger><SelectContent>{availableSemesters.map(semester => <SelectItem key={semester} value={String(semester)}>{semester}-semestr ({courseNumberFromSemester(semester)}-kurs)</SelectItem>)}</SelectContent></Select></Field>
          <Field label="4. Guruh *"><Select value={admissionForm.groupId} disabled={!admissionForm.semester || admissionProgramGroups.isLoading} onValueChange={value => setAdmissionForm({...admissionForm, groupId: value})}><SelectTrigger><SelectValue placeholder="Mos guruhni tanlang" /></SelectTrigger><SelectContent>{availableAdmissionGroups.map(group => <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>)}</SelectContent></Select></Field>
          {!!admissionForm.semester && !admissionProgramGroups.isLoading && availableAdmissionGroups.length === 0 && <p className="text-sm text-destructive sm:col-span-2">Tanlangan o'quv yili, dastur va tilga mos faol guruh topilmadi. Avval “Asosiy guruhlar” bo'limida mos guruh yarating.</p>}
          <h3 className="border-b pb-2 pt-2 font-semibold sm:col-span-2">Ta'lim parametrlari</h3>
          <Field label="Ta'lim darajasi"><Input value={admissionForm.degreeLevel} disabled /></Field>
          <Field label="Ta'lim shakli"><Select value={admissionForm.educationForm} onValueChange={(value: EducationForm) => setAdmissionForm({...admissionForm, educationForm: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL_TIME">Kunduzgi</SelectItem><SelectItem value="DISTANCE">Masofaviy</SelectItem><SelectItem value="PART_TIME">Sirtqi</SelectItem><SelectItem value="EVENING">Kechki</SelectItem></SelectContent></Select></Field>
          <Field label="Ta'lim tili"><Select value={admissionForm.language} onValueChange={value => setAdmissionForm({...admissionForm, language: value, groupId: ''})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uz">O'zbek</SelectItem><SelectItem value="ru">Rus</SelectItem><SelectItem value="en">Ingliz</SelectItem></SelectContent></Select></Field>
          <Field label="Kurs"><Input value={admissionForm.semester ? `${courseNumberFromSemester(Number(admissionForm.semester))}-kurs` : ''} disabled /></Field>
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

    <Dialog open={bulkTransferOpen} onOpenChange={open => { setBulkTransferOpen(open); if (!open) setBulkTransferForm(emptyLifecycle()); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{selectedAcademicIds.length} ta talabani ommaviy ko'chirish</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Barcha talabalar avval tekshiriladi. Bittasi mos kelmasa, paketdagi hech bir yozuv o'zgarmaydi.</p>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Field label="1. Yangi o'quv yili *"><Select value={bulkTransferForm.academicYear} onValueChange={value => setBulkTransferForm({...bulkTransferForm, academicYear: value, targetProgramId: '', targetGroupId: ''})}><SelectTrigger><SelectValue placeholder="O'quv yilini tanlang" /></SelectTrigger><SelectContent>{availableAcademicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="2. Yangi ta'lim dasturi *"><Select value={bulkTransferForm.targetProgramId} disabled={!bulkTransferForm.academicYear} onValueChange={value => setBulkTransferForm({...bulkTransferForm, targetProgramId: value, targetGroupId: ''})}><SelectTrigger><SelectValue placeholder="Dastur tanlang" /></SelectTrigger><SelectContent>{availableBulkPrograms.map(program => <SelectItem key={program.id} value={String(program.id)}>{program.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="3. Yangi guruh"><Select value={bulkTransferForm.targetGroupId || 'NONE'} disabled={!bulkTransferForm.targetProgramId || bulkTransferGroups.isLoading} onValueChange={value => setBulkTransferForm({...bulkTransferForm, targetGroupId: value === 'NONE' ? '' : value})}><SelectTrigger><SelectValue placeholder="Guruh tanlang" /></SelectTrigger><SelectContent><SelectItem value="NONE">Guruhsiz</SelectItem>{availableBulkGroups.map(group => <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="flex items-end"><Badge variant="secondary">Tanlangan: {selectedAcademicIds.length} / 200</Badge></div>
          {!!bulkTransferForm.academicYear && !admissionPrograms.isLoading && availableBulkPrograms.length === 0 && <p className="text-sm text-destructive sm:col-span-2">Bu o'quv yilida faol guruhi mavjud dastur topilmadi.</p>}
          <EvidenceFields value={bulkTransferForm} onChange={patch => setBulkTransferForm({...bulkTransferForm, ...patch})} />
        </div>
        <DialogFooter><Button variant="outline" onClick={() => { setBulkTransferOpen(false); setBulkTransferForm(emptyLifecycle()); }}>Bekor qilish</Button><Button disabled={saving || selectedAcademicIds.length < 2 || !bulkTransferForm.targetProgramId || !bulkTransferForm.academicYear} onClick={submitBulkTransfer}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hammasini ko'chirish</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!historyStudent} onOpenChange={open => { if (!open) setHistoryStudent(null); }}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{historyStudent?.fullName}: lifecycle tarixi</DialogTitle></DialogHeader>
      {history.isLoading ? <Loader2 className="mx-auto animate-spin" /> : <div className="space-y-3">{(history.data ?? []).map(event => <Card key={event.id}><CardContent className="space-y-2 pt-4"><div className="flex flex-wrap justify-between gap-2"><Badge>{event.eventType}</Badge><span className="text-sm font-medium">{event.fromStatus ?? '—'} → {event.toStatus}</span></div><p className="text-sm"><b>Buyruq:</b> {event.orderNumber} / {event.orderDate}; <b>amal:</b> {event.effectiveDate}</p>{event.eventType === 'TRANSFER' && <p className="text-sm"><b>Dastur:</b> {event.fromProgramName ?? '—'} → {event.toProgramName ?? '—'}; <b>guruh:</b> {event.fromGroupId ?? '—'} → {event.toGroupId ?? '—'}</p>}<p className="text-sm"><b>Asos:</b> {event.legalBasis}</p><p className="text-sm"><b>Sabab:</b> {event.reason}</p><p className="text-xs text-muted-foreground">{event.recordedByName} · {new Date(event.recordedAt).toLocaleString('uz-Latn')}</p></CardContent></Card>)}{history.data?.length === 0 && <p className="py-8 text-center text-muted-foreground">Lifecycle yozuvi mavjud emas.</p>}</div>}
      <DialogFooter><Button variant="outline" onClick={() => history.refetch()}><RefreshCcw className="mr-2 h-4 w-4" />Yangilash</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog open={!!accountTarget} onOpenChange={open => { if (!open) { setAccountTarget(null); setAccountReason(''); } }}>
      <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{accountTarget?.student.fullName}: {accountTarget?.enabled ? 'akkauntni qayta yoqish' : 'akkauntni bloklash'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-3">
          <p className="text-sm text-muted-foreground">Login: <b>{accountTarget?.student.username}</b>. Amal va sabab audit jurnalida saqlanadi.</p>
          <Field label="Sabab *"><Textarea maxLength={500} value={accountReason} placeholder="Kamida 5 belgi" onChange={event => setAccountReason(event.target.value)} /></Field>
          {accountTarget?.enabled && <p className="text-sm text-muted-foreground">Qayta yoqish faqat akademik holati ACTIVE bo'lgan talaba uchun ruxsat etiladi.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => { setAccountTarget(null); setAccountReason(''); }}>Bekor qilish</Button><Button variant={accountTarget?.enabled ? 'default' : 'destructive'} disabled={saving || accountReason.trim().length < 5} onClick={submitAccountAccess}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{accountTarget?.enabled ? 'Qayta yoqish' : 'Bloklash'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!credentialTarget} onOpenChange={open => { if (!open) { setCredentialTarget(null); setCredentialPassword(''); setCredentialConfirmation(''); } }}>
      <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{credentialTarget?.fullName}: dastlabki parolni berish</DialogTitle></DialogHeader>
        <div className="space-y-4 py-3">
          <p className="text-sm text-muted-foreground">Login: <b>{credentialTarget?.username}</b>. Kartochka parolsiz yaratilgan; parol faqat shu alohida amalda o'rnatiladi.</p>
          <Field label="Yangi parol *"><Input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={credentialPassword} onChange={event => setCredentialPassword(event.target.value)} /></Field>
          <Field label="Parolni takrorlang *"><Input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={credentialConfirmation} onChange={event => setCredentialConfirmation(event.target.value)} /></Field>
          <p className="text-xs text-muted-foreground">12-128 belgi. Parol login nomini o'z ichiga olmasligi kerak.</p>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => { setCredentialTarget(null); setCredentialPassword(''); setCredentialConfirmation(''); }}>Bekor qilish</Button><Button disabled={saving || credentialPassword.length < 12 || credentialPassword !== credentialConfirmation} onClick={submitCredentials}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Parolni o'rnatish</Button></DialogFooter>
      </DialogContent>
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
