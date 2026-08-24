import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  listDepartments,
  listFaculties,
  listPrograms,
  listSubjects,
} from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { academicPeriodApi } from "@/services/api/academic-period-api";
import { listRatingSystems } from "@/services/api/academic-results-api";
import {
  canApproveCurriculum,
  curriculumApi,
  curriculumInputError,
  type CurriculumEducationForm,
  type CurriculumStatus,
  type CurriculumSubject,
  type CurriculumVersion,
  type SaveCurriculumVersionInput,
} from "@/services/api/curriculum-api";

const EMPTY = "__empty__";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Amalni bajarib bo'lmadi";

const yearDates = (academicYear: string) => {
  const parts = academicYear.split("-");
  return {
    validFrom: parts[0] ? parts[0] + "-09-01" : "",
    validUntil: parts[1] ? parts[1] + "-08-31" : "",
  };
};

const fallbackYear = () => {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return String(start) + "-" + String(start + 1);
};

const newVersionCode = (academicYear: string) =>
  "CUR-" +
  academicYear.substring(0, 4) +
  "-" +
  Date.now().toString(36).slice(-6).toUpperCase();

const emptyForm = (): SaveCurriculumVersionInput => {
  const academicYear = fallbackYear();
  return {
    programId: 0,
    versionCode: newVersionCode(academicYear),
    academicYear,
    name: "",
    active: true,
    educationLanguage: "uz-Latn",
    passingScore: 60,
    baseCreditAmount: 0,
    educationForm: "DISTANCE",
    ratingSystemId: 0,
    semesterCount: 8,
    credentialType: "STATE_DIPLOMA",
    normativeBasisType: "STATE_EDUCATION_STANDARD",
    standardReference: "",
    qualificationRequirementsReference: "",
    ...yearDates(academicYear),
  };
};

const editForm = (item: CurriculumVersion): SaveCurriculumVersionInput => ({
  programId: item.programId,
  versionCode: item.versionCode,
  academicYear: item.academicYear,
  name: item.name,
  active: item.active,
  educationLanguage: item.educationLanguage,
  passingScore: item.passingScore,
  baseCreditAmount: item.baseCreditAmount,
  educationForm: item.educationForm,
  ratingSystemId: item.ratingSystemId,
  semesterCount: item.semesterCount,
  credentialType: item.credentialType,
  normativeBasisType: item.normativeBasisType,
  standardReference: item.standardReference,
  qualificationRequirementsReference: item.qualificationRequirementsReference,
  validFrom: item.validFrom,
  validUntil: item.validUntil,
});

const statusText: Record<CurriculumStatus, string> = {
  DRAFT: "Qoralama",
  APPROVED: "Tasdiqlangan",
  ARCHIVED: "Arxivlangan",
};

const languageOptions = [
  { value: "uz-Latn", label: "O'zbekcha" },
  { value: "uz-Cyrl", label: "Ўзбекча" },
  { value: "kaa", label: "Qaraqalpaqsha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const educationFormOptions: Array<{ value: CurriculumEducationForm; label: string }> = [
  { value: "FULL_TIME", label: "Kunduzgi" },
  { value: "DISTANCE", label: "Masofaviy" },
  { value: "PART_TIME", label: "Sirtqi" },
  { value: "EVENING", label: "Kechki" },
];

function CurriculumStatusBadge({ status }: { status: CurriculumStatus }) {
  if (status === "APPROVED") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Tasdiqlangan</Badge>;
  }
  if (status === "ARCHIVED") return <Badge variant="outline">Arxivlangan</Badge>;
  return <Badge variant="secondary">Qoralama</Badge>;
}

export function AdminStudyPlanEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);
  const creating = !Number.isInteger(id) || id <= 0;
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const initializedId = useRef<number | null>(null);
  const defaultsApplied = useRef(false);
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState<SaveCurriculumVersionInput>(emptyForm);
  const [facultyId, setFacultyId] = useState(0);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [subjectId, setSubjectId] = useState(0);
  const [semester, setSemester] = useState(1);
  const [planItemType, setPlanItemType] = useState<"REQUIRED" | "ELECTIVE">("REQUIRED");
  const [subjectToRemove, setSubjectToRemove] = useState<CurriculumSubject | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [approvalOrderNumber, setApprovalOrderNumber] = useState("");
  const [approvalOrderDate, setApprovalOrderDate] = useState("");

  const detail = useQuery({
    queryKey: ["curricula", id],
    queryFn: () => curriculumApi.get(id),
    enabled: !creating,
  });
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => listPrograms() });
  const faculties = useQuery({ queryKey: ["faculties"], queryFn: listFaculties });
  const departments = useQuery({ queryKey: ["departments"], queryFn: () => listDepartments() });
  const ratings = useQuery({ queryKey: ["rating-systems"], queryFn: listRatingSystems });
  const academicYears = useQuery({
    queryKey: ["academic-periods", "years"],
    queryFn: () => academicPeriodApi.listYears(false),
  });
  const semesterDefinitions = useQuery({
    queryKey: ["academic-periods", "semesters"],
    queryFn: () => academicPeriodApi.listSemesters(false),
  });
  const item = detail.data;
  const subjects = useQuery({
    queryKey: ["subjects", form.programId],
    queryFn: () => listSubjects(form.programId),
    enabled: !creating && form.programId > 0,
  });

  const departmentFaculty = useMemo(
    () => new Map((departments.data ?? []).map((department) => [department.id, department.facultyId ?? 0])),
    [departments.data],
  );
  const visiblePrograms = useMemo(
    () =>
      (programs.data ?? []).filter((program) => {
        if (!program.active && program.id !== form.programId) return false;
        if (!facultyId) return true;
        return Boolean(program.departmentId) &&
          departmentFaculty.get(program.departmentId as number) === facultyId;
      }),
    [departmentFaculty, facultyId, form.programId, programs.data],
  );

  useEffect(() => {
    if (!creating || defaultsApplied.current) return;
    if (!academicYears.data?.length || !ratings.data?.length) return;
    const year =
      academicYears.data.find((value) => value.current) ??
      academicYears.data.find((value) => value.active) ??
      academicYears.data[0];
    const rating = ratings.data.find((value) => value.active) ?? ratings.data[0];
    defaultsApplied.current = true;
    setForm((current) => ({
      ...current,
      academicYear: year.code,
      versionCode: newVersionCode(year.code),
      ratingSystemId: rating.id,
      passingScore: rating.passScore,
      ...yearDates(year.code),
    }));
  }, [academicYears.data, creating, ratings.data]);

  useEffect(() => {
    if (!item || initializedId.current === item.id) return;
    initializedId.current = item.id;
    setForm(editForm(item));
    setFacultyId(item.facultyId ?? 0);
  }, [item]);

  useEffect(() => {
    if (!item || item.facultyId || facultyId || !programs.data || !departments.data) return;
    const program = programs.data.find((value) => value.id === item.programId);
    if (program?.departmentId) {
      setFacultyId(departmentFaculty.get(program.departmentId) ?? 0);
    }
  }, [departmentFaculty, departments.data, facultyId, item, programs.data]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["curricula"] }),
      creating
        ? Promise.resolve()
        : queryClient.invalidateQueries({ queryKey: ["curricula", id] }),
    ]);
  };

  const create = useMutation({
    mutationFn: () => curriculumApi.create(form),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["curricula"] });
      toast({ title: "O'quv reja yaratildi", description: "Endi fanlarni biriktirishingiz mumkin." });
      setTab("subjects");
      navigate("/edu-process/curriculum/" + created.id, { replace: true });
    },
    onError: (error) =>
      toast({ title: "Reja yaratilmadi", description: errorMessage(error), variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: () => curriculumApi.update(id, form),
    onSuccess: async () => {
      await refresh();
      toast({ title: "O'quv reja saqlandi" });
    },
    onError: (error) =>
      toast({ title: "Reja saqlanmadi", description: errorMessage(error), variant: "destructive" }),
  });
  const addSubject = useMutation({
    mutationFn: () => curriculumApi.addSubject(id, { subjectId, semester, planItemType }),
    onSuccess: async () => {
      setSubjectId(0);
      await refresh();
      toast({ title: "Fan o'quv rejaga qo'shildi" });
    },
    onError: (error) =>
      toast({ title: "Fan qo'shilmadi", description: errorMessage(error), variant: "destructive" }),
  });
  const removeSubject = useMutation({
    mutationFn: (curriculumSubjectId: number) =>
      curriculumApi.removeSubject(id, curriculumSubjectId),
    onSuccess: async () => {
      setSubjectToRemove(null);
      await refresh();
      toast({ title: "Fan rejadan olib tashlandi" });
    },
    onError: (error) =>
      toast({ title: "Fanni olib tashlab bo'lmadi", description: errorMessage(error), variant: "destructive" }),
  });
  const approve = useMutation({
    mutationFn: () => curriculumApi.approve(id, { approvalOrderNumber, approvalOrderDate }),
    onSuccess: async () => {
      setApprovalOpen(false);
      await refresh();
      toast({ title: "O'quv reja tasdiqlandi" });
    },
    onError: (error) =>
      toast({ title: "Reja tasdiqlanmadi", description: errorMessage(error), variant: "destructive" }),
  });
  const archive = useMutation({
    mutationFn: () => curriculumApi.archive(id),
    onSuccess: async () => {
      setArchiveOpen(false);
      await refresh();
      toast({ title: "O'quv reja arxivlandi" });
    },
    onError: (error) =>
      toast({ title: "Reja arxivlanmadi", description: errorMessage(error), variant: "destructive" }),
  });

  const formError = curriculumInputError(form);
  const editable = creating || item?.status === "DRAFT";
  const busy = create.isPending || update.isPending;
  const availableSubjects = (subjects.data ?? []).filter(
    (subject) =>
      subject.active &&
      !item?.subjects.some((assigned) => assigned.subjectId === subject.id),
  );
  const semesterOptions = (semesterDefinitions.data ?? [])
    .filter((definition) => definition.active && definition.semesterNumber <= form.semesterCount)
    .sort((a, b) => a.semesterNumber - b.semesterNumber);

  const selectYear = (academicYear: string) =>
    setForm((current) => ({ ...current, academicYear, ...yearDates(academicYear) }));

  const selectFaculty = (value: string) => {
    const nextFaculty = Number(value);
    setFacultyId(nextFaculty);
    const selectedProgram = (programs.data ?? []).find((program) => program.id === form.programId);
    const selectedFaculty = selectedProgram?.departmentId
      ? departmentFaculty.get(selectedProgram.departmentId)
      : 0;
    if (selectedFaculty !== nextFaculty) {
      setForm((current) => ({ ...current, programId: 0 }));
    }
  };

  const selectProgram = (value: string) => {
    const programId = Number(value);
    const program = (programs.data ?? []).find((entry) => entry.id === programId);
    setForm((current) => ({
      ...current,
      programId,
      educationLanguage:
        program?.educationLanguage === "uz"
          ? "uz-Latn"
          : program?.educationLanguage || current.educationLanguage,
      educationForm: program?.distanceEnabled ? "DISTANCE" : current.educationForm,
      name:
        current.name.trim() || !program
          ? current.name
          : program.name +
            " (" +
            current.academicYear.substring(0, 4) +
            "_" +
            (program.educationLanguage === "uz" ? "uzb" : program.educationLanguage) +
            ")",
    }));
  };

  const submit = () => {
    setSaveAttempted(true);
    if (formError) return;
    if (creating) create.mutate();
    else update.mutate();
  };

  if (!creating && detail.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!creating && (detail.isError || !item)) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" onClick={() => navigate("/edu-process/curriculum")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          O'quv rejalar
        </Button>
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-destructive">O'quv reja topilmadi yoki uni yuklab bo'lmadi.</p>
            <Button variant="outline" onClick={() => detail.refetch()}>
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl space-y-5 p-3 pb-24 sm:p-6 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/edu-process/curriculum")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            O'quv rejalar ro'yxati
          </Button>
          <div className="flex items-center gap-2">
            {item && <CurriculumStatusBadge status={item.status} />}
            {item && (
              <Button
                variant="outline"
                onClick={() =>
                  navigate("/edu-process/attached-students?curriculumId=" + item.id)
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Talabalarni biriktirish
              </Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
          {!creating && (
            <TabsList className="mx-auto grid h-auto w-full max-w-xl grid-cols-3">
              <TabsTrigger value="details">Reja ma'lumotlari</TabsTrigger>
              <TabsTrigger value="subjects">Fanlar ({item?.subjectCount ?? 0})</TabsTrigger>
              <TabsTrigger value="approval">Tasdiqlash</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="details">
            <div className="mx-auto max-w-3xl">
              <Card className="border-0 shadow-none">
                <CardHeader className="items-center pb-4 text-center">
                  <CardTitle className="text-xl">
                    {creating ? "O'quv reja yaratish" : "O'quv rejani tahrirlash"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="inline-flex overflow-hidden rounded-md border">
                      <Button
                        type="button"
                        className="rounded-none"
                        variant={form.active ? "default" : "ghost"}
                        disabled={!editable || !canWrite}
                        onClick={() => setForm((current) => ({ ...current, active: true }))}
                      >
                        Faol
                      </Button>
                      <Button
                        type="button"
                        className="rounded-none border-l"
                        variant={!form.active ? "default" : "ghost"}
                        disabled={!editable || !canWrite}
                        onClick={() => setForm((current) => ({ ...current, active: false }))}
                      >
                        Faol emas
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-name">
                      <span className="text-destructive">*</span> Nomi
                    </Label>
                    <Input
                      id="plan-name"
                      disabled={!editable || !canWrite}
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="O'quv reja nomini kiriting"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        <span className="text-destructive">*</span> O'quv reja tili
                      </Label>
                      <Select
                        disabled={!editable || !canWrite}
                        value={form.educationLanguage}
                        onValueChange={(educationLanguage) =>
                          setForm((current) => ({ ...current, educationLanguage }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {languageOptions.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passing-score">
                        <span className="text-destructive">*</span> O'tish bali
                      </Label>
                      <Input
                        id="passing-score"
                        type="number"
                        min={0}
                        max={100}
                        disabled={!editable || !canWrite}
                        value={form.passingScore}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            passingScore: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base-credit">
                      <span className="text-destructive">*</span> Bazaviy kredit summasi
                    </Label>
                    <Input
                      id="base-credit"
                      type="number"
                      min={0}
                      step={1000}
                      disabled={!editable || !canWrite}
                      value={form.baseCreditAmount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          baseCreditAmount: Number(event.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <span className="text-destructive">*</span> Fakultet
                    </Label>
                    <Select
                      disabled={!editable || !canWrite}
                      value={facultyId ? String(facultyId) : EMPTY}
                      onValueChange={selectFaculty}
                    >
                      <SelectTrigger><SelectValue placeholder="Fakultetni tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY} disabled>Fakultetni tanlang</SelectItem>
                        {(faculties.data ?? [])
                          .filter((faculty) => faculty.active || faculty.id === facultyId)
                          .map((faculty) => (
                            <SelectItem key={faculty.id} value={String(faculty.id)}>
                              {faculty.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <span className="text-destructive">*</span> Mutaxassislik
                    </Label>
                    <Select
                      disabled={!editable || !canWrite || !facultyId}
                      value={form.programId ? String(form.programId) : EMPTY}
                      onValueChange={selectProgram}
                    >
                      <SelectTrigger><SelectValue placeholder="Mutaxassislikni tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY} disabled>Mutaxassislikni tanlang</SelectItem>
                        {visiblePrograms.map((program) => (
                          <SelectItem key={program.id} value={String(program.id)}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item?.subjectCount && item.status === "DRAFT" ? (
                      <p className="text-xs text-muted-foreground">
                        Mutaxassislik almashtirilsa, mavjud fanlar yangi mutaxassislikka mos bo'lishi kerak.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        <span className="text-destructive">*</span> Ta'lim shakli
                      </Label>
                      <Select
                        disabled={!editable || !canWrite}
                        value={form.educationForm}
                        onValueChange={(educationForm: CurriculumEducationForm) =>
                          setForm((current) => ({ ...current, educationForm }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {educationFormOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <span className="text-destructive">*</span> Kredit baholash tizimi
                      </Label>
                      <Select
                        disabled={!editable || !canWrite}
                        value={form.ratingSystemId ? String(form.ratingSystemId) : EMPTY}
                        onValueChange={(value) => {
                          const ratingSystemId = Number(value);
                          const rating = (ratings.data ?? []).find((entry) => entry.id === ratingSystemId);
                          setForm((current) => ({
                            ...current,
                            ratingSystemId,
                            passingScore: rating?.passScore ?? current.passingScore,
                          }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Baholash tizimini tanlang" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY} disabled>Baholash tizimini tanlang</SelectItem>
                          {(ratings.data ?? [])
                            .filter((rating) => rating.active || rating.id === form.ratingSystemId)
                            .map((rating) => (
                              <SelectItem key={rating.id} value={String(rating.id)}>
                                {rating.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="semester-count">
                        <span className="text-destructive">*</span> Semestr soni (Maksimum 15)
                      </Label>
                      <Input
                        id="semester-count"
                        type="number"
                        min={1}
                        max={15}
                        disabled={!editable || !canWrite}
                        value={form.semesterCount}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            semesterCount: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <span className="text-destructive">*</span> O'quv yilini boshlash
                      </Label>
                      <Select
                        disabled={!editable || !canWrite}
                        value={form.academicYear}
                        onValueChange={selectYear}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(academicYears.data ?? []).map((year) => (
                            <SelectItem key={year.id} value={year.code}>
                              {year.code.substring(0, 4)}{year.current ? " · joriy" : ""}
                            </SelectItem>
                          ))}
                          {!academicYears.data?.some((year) => year.code === form.academicYear) && (
                            <SelectItem value={form.academicYear}>
                              {form.academicYear.substring(0, 4)}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {saveAttempted && formError && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                      {formError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {!creating && item && (
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5" />
                    Fanlarni biriktirish
                  </CardTitle>
                  <CardDescription>
                    {item.subjectCount} ta fan · jami {item.totalCredits} kredit · {item.semesterCount} semestr
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {item.status === "DRAFT" && canWrite && (
                    <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] md:items-end">
                      <div className="space-y-2">
                        <Label>Fan</Label>
                        <Select
                          value={subjectId ? String(subjectId) : EMPTY}
                          onValueChange={(value) => setSubjectId(Number(value))}
                        >
                          <SelectTrigger><SelectValue placeholder="Fanni tanlang" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY} disabled>Fanni tanlang</SelectItem>
                            {availableSubjects.map((subject) => (
                              <SelectItem key={subject.id} value={String(subject.id)}>
                                {subject.name} · {subject.credits ?? 0} kredit
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Semestr</Label>
                        <Select
                          value={String(semester)}
                          onValueChange={(value) => setSemester(Number(value))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(semesterOptions.length
                              ? semesterOptions.map((definition) => definition.semesterNumber)
                              : Array.from(
                                  { length: Math.min(form.semesterCount, 12) },
                                  (_, index) => index + 1,
                                )
                            ).map((value) => (
                              <SelectItem key={value} value={String(value)}>
                                {value}-semestr
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fan turi</Label>
                        <Select
                          value={planItemType}
                          onValueChange={(value: "REQUIRED" | "ELECTIVE") =>
                            setPlanItemType(value)
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REQUIRED">Majburiy</SelectItem>
                            <SelectItem value="ELECTIVE">Tanlov</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        disabled={!subjectId || addSubject.isPending}
                        onClick={() => addSubject.mutate()}
                      >
                        {addSubject.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Qo'shish
                      </Button>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fan</TableHead>
                          <TableHead>Semestr</TableHead>
                          <TableHead>Turi</TableHead>
                          <TableHead>Kredit</TableHead>
                          {item.status === "DRAFT" && canWrite && <TableHead />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell>
                              <p className="font-medium">{subject.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                            </TableCell>
                            <TableCell>{subject.semester}-semestr</TableCell>
                            <TableCell>
                              {subject.planItemType === "REQUIRED" ? "Majburiy" : "Tanlov"}
                            </TableCell>
                            <TableCell>{subject.credits}</TableCell>
                            {item.status === "DRAFT" && canWrite && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Fanni olib tashlash"
                                  onClick={() => setSubjectToRemove(subject)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {item.subjects.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={item.status === "DRAFT" && canWrite ? 5 : 4}
                              className="h-24 text-center text-muted-foreground"
                            >
                              Rejaga hali fan biriktirilmagan.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!creating && item && (
            <TabsContent value="approval" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Huquqiy asos
                  </CardTitle>
                  <CardDescription>
                    Mahalliy tizimning normativ va audit talablari etalon formadan alohida saqlanadi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bitiruv hujjati *</Label>
                      <Select
                        disabled={!editable || !canWrite}
                        value={form.credentialType}
                        onValueChange={(credentialType: "STATE_DIPLOMA" | "NON_STATE_CREDENTIAL") =>
                          setForm((current) => ({
                            ...current,
                            credentialType,
                            normativeBasisType:
                              credentialType === "STATE_DIPLOMA"
                                ? "STATE_EDUCATION_STANDARD"
                                : "PROFESSIONAL_STANDARD",
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STATE_DIPLOMA">Davlat diplomi</SelectItem>
                          <SelectItem value="NON_STATE_CREDENTIAL">Nodavlat hujjat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Normativ asos</Label>
                      <Input
                        readOnly
                        value={
                          form.normativeBasisType === "STATE_EDUCATION_STANDARD"
                            ? "Davlat ta'lim standarti"
                            : "Kasbiy standart"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="standard-reference">Standart rekviziti *</Label>
                      <Input
                        id="standard-reference"
                        disabled={!editable || !canWrite}
                        value={form.standardReference}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            standardReference: event.target.value,
                          }))
                        }
                        placeholder="Standart raqami va sanasi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualification-reference">Malaka talablari rekviziti *</Label>
                      <Input
                        id="qualification-reference"
                        disabled={!editable || !canWrite}
                        value={form.qualificationRequirementsReference}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            qualificationRequirementsReference: event.target.value,
                          }))
                        }
                        placeholder="Hujjat raqami va sanasi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valid-from">Amal qilish boshlanishi *</Label>
                      <Input
                        id="valid-from"
                        type="date"
                        disabled={!editable || !canWrite}
                        value={form.validFrom}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, validFrom: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valid-until">Amal qilish tugashi *</Label>
                      <Input
                        id="valid-until"
                        type="date"
                        disabled={!editable || !canWrite}
                        value={form.validUntil}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, validUntil: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  {editable && canWrite && (
                    <div className="flex justify-end border-t pt-5">
                      <Button onClick={submit} disabled={busy}>
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Huquqiy ma'lumotlarni saqlash
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5" />
                    Ko'rib chiqish va tasdiqlash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {item.status === "DRAFT" && (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          { text: "Reja faol va asosiy maydonlar to'liq", done: item.active && !curriculumInputError(editForm(item)) },
                          { text: "Kamida bitta fan biriktirilgan", done: item.subjectCount > 0 },
                          {
                            text: "Standart va malaka rekvizitlari kiritilgan",
                            done:
                              Boolean(item.standardReference.trim()) &&
                              Boolean(item.qualificationRequirementsReference.trim()),
                          },
                        ].map((check) => (
                          <div key={check.text} className="flex items-center gap-3 rounded-md border p-3">
                            <CheckCircle2
                              className={
                                "h-5 w-5 shrink-0 " +
                                (check.done ? "text-emerald-600" : "text-muted-foreground/40")
                              }
                            />
                            <span className="text-sm">{check.text}</span>
                          </div>
                        ))}
                      </div>
                      {canWrite && (
                        <div className="flex justify-end border-t pt-5">
                          <Button
                            disabled={!canApproveCurriculum(item)}
                            onClick={() => setApprovalOpen(true)}
                          >
                            <FileCheck2 className="mr-2 h-4 w-4" />
                            Rejani tasdiqlash
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {item.status === "APPROVED" && (
                    <div className="space-y-4">
                      <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Buyruq raqami</p>
                          <p className="font-medium">{item.approvalOrderNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Buyruq sanasi</p>
                          <p className="font-medium">{item.approvalOrderDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tasdiqlagan</p>
                          <p className="font-medium">{item.approvedByName ?? "—"}</p>
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => setArchiveOpen(true)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Arxivlash
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === "ARCHIVED" && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                      <Archive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Reja arxivlangan</p>
                        <p className="text-sm text-muted-foreground">
                          Bu reja faqat ko'rish uchun ochiq.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {tab === "details" && editable && canWrite && (
        <div className="sticky bottom-0 z-20 border-t bg-muted/90 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl justify-center gap-5">
            <Button
              className="w-44"
              variant="secondary"
              onClick={() => navigate("/edu-process/curriculum")}
            >
              Bekor qilish
            </Button>
            <Button className="w-44" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </div>
      )}

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O'quv rejani tasdiqlash</DialogTitle>
            <DialogDescription>
              Tasdiqlangandan keyin reja ma'lumotlari va fanlar ro'yxati tahrirlanmaydi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="approval-number">Buyruq raqami *</Label>
              <Input
                id="approval-number"
                value={approvalOrderNumber}
                onChange={(event) => setApprovalOrderNumber(event.target.value)}
                placeholder="Masalan: 123-son"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-date">Buyruq sanasi *</Label>
              <Input
                id="approval-date"
                type="date"
                value={approvalOrderDate}
                onChange={(event) => setApprovalOrderDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={!approvalOrderNumber.trim() || !approvalOrderDate || approve.isPending}
              onClick={() => approve.mutate()}
            >
              {approve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(subjectToRemove)}
        onOpenChange={(open) => !open && setSubjectToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fanni rejadan olib tashlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {subjectToRemove?.subjectName} o'quv reja tarkibidan olib tashlanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => subjectToRemove && removeSubject.mutate(subjectToRemove.id)}
            >
              Olib tashlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'quv rejani arxivlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Arxivlangan reja tahrirlanmaydi, lekin tarixda saqlanib qoladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => archive.mutate()}>
              Arxivlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
