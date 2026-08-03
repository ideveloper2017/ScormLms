import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { qk } from '@/lib/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicSelect } from '@/components/admin/academic-select';
import {
  archiveStudent,
  createStudent,
  getStudent,
  graduateStudent,
  listStudents,
  promoteStudent,
  reinstateStudent,
  updateStudent,
} from '@/lib/student-api';
import type { Gender, StudentDto, StudentSummaryDto } from '@/types/student.types';
import { Loader2, ArrowUpCircle, GraduationCap, Archive, UserCheck, Edit, Upload, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  pinfl: '',
  studentNumber: '',
  birthDate: '',
  gender: 'MALE' as Gender,
  email: '',
  groupId: '',
  facultyId: '',
  programId: '',
  course: '1',
  language: 'uz',
});

export function StudentManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: students = [], isLoading } = useQuery({
    queryKey: qk.students(),
    queryFn: listStudents,
  });
  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.students() });
  const optionalId = (value: string) => value ? Number(value) : null;

  const closeDialog = () => {
    setIsAdding(false);
    setEditingStudent(null);
    setFormData(emptyForm());
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.pinfl.trim()
      || !formData.studentNumber.trim() || !formData.birthDate) {
      toast({
        title: 'Majburiy maydonlar',
        description: "Ism, familiya, JSHSHIR, talaba raqami va tug'ilgan sanani kiriting",
        variant: 'destructive',
      });
      return;
    }

    const commonPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || null,
      facultyId: optionalId(formData.facultyId),
      programId: optionalId(formData.programId),
      groupId: optionalId(formData.groupId),
      courseNumber: Number(formData.course),
      educationLanguage: formData.language,
    };

    try {
      if (editingStudent?.id != null) {
        await updateStudent(editingStudent.id, commonPayload);
        toast({ title: 'Muvaffaqiyatli', description: "Talaba ma'lumotlari yangilandi" });
      } else {
        await createStudent({
          ...commonPayload,
          pinfl: formData.pinfl.trim(),
          studentNumber: formData.studentNumber.trim(),
          birthDate: formData.birthDate,
          gender: formData.gender,
          citizenship: 'UZBEKISTAN',
        });
        toast({ title: 'Muvaffaqiyatli', description: "Yangi talaba qo'shildi" });
      }
      closeDialog();
      await invalidate();
    } catch {
      toast({ title: 'Xatolik', description: "Amalni bajarib bo'lmadi", variant: 'destructive' });
    }
  };

  const handleEditClick = async (summary: StudentSummaryDto) => {
    if (summary.id == null) return;
    try {
      const student = await getStudent(summary.id);
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        pinfl: student.pinfl || '',
        studentNumber: student.studentNumber || '',
        birthDate: student.birthDate || '',
        gender: student.gender || 'MALE',
        email: student.email || '',
        groupId: student.groupId == null ? '' : String(student.groupId),
        facultyId: student.facultyId == null ? '' : String(student.facultyId),
        programId: student.programId == null ? '' : String(student.programId),
        course: String(student.courseNumber || 1),
        language: student.educationLanguage || 'uz',
      });
    } catch {
      toast({ title: 'Xatolik', description: "Talaba ma'lumotlarini yuklab bo'lmadi", variant: 'destructive' });
    }
  };

  const runStudentAction = async (studentId: number | null, action: (id: number) => Promise<StudentDto>) => {
    if (studentId == null) return;
    try {
      await action(studentId);
      await invalidate();
    } catch {
      toast({ title: 'Xatolik', description: "Amalni bajarib bo'lmadi", variant: 'destructive' });
    }
  };

  const columns: ColumnDef<StudentSummaryDto>[] = [
    {
      accessorKey: 'fullName',
      header: 'Ism',
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    { accessorKey: 'studentNumber', header: 'Talaba raqami' },
    { accessorKey: 'pinfl', header: 'JSHSHIR' },
    { accessorKey: 'groupId', header: 'Guruh ID' },
    {
      accessorKey: 'courseNumber',
      header: 'Kurs',
      cell: ({ row }) => row.original.courseNumber ?? '—',
    },
    {
      accessorKey: 'studentStatus',
      header: 'Holat',
      cell: ({ row }) => <Badge variant="secondary">{row.original.studentStatus ?? '—'}</Badge>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Amallar</div>,
      enableSorting: false,
      cell: ({ row: { original: student } }) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleEditClick(student)} title="Tahrirlash">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => runStudentAction(student.id, promoteStudent)} title="Kursdan o'tkazish">
            <ArrowUpCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => runStudentAction(student.id, graduateStudent)} title="Bitiruvchi">
            <GraduationCap className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => runStudentAction(student.id, archiveStudent)} title="Arxivlash">
            <Archive className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => runStudentAction(student.id, reinstateStudent)} title="Qayta tiklash">
            <UserCheck className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Talabalar boshqaruvi</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled title="Excel import keyingi bosqichda ulanadi">
            <Upload className="h-4 w-4" /> Excel Import
          </Button>
          <Button className="gap-2" onClick={() => { setFormData(emptyForm()); setIsAdding(true); }}>
            <UserPlus className="h-4 w-4" /> Yangi talaba
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Barcha talabalar</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Ism, talaba raqami yoki JSHSHIR bo'yicha qidirish..."
            showColumnToggle
            emptyText="Talabalar topilmadi"
          />
        </CardContent>
      </Card>

      <Dialog open={isAdding || !!editingStudent} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Talabani tahrirlash' : "Yangi talaba qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Familiya *</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>JSHSHIR *</Label>
              <Input value={formData.pinfl} onChange={(e) => setFormData({...formData, pinfl: e.target.value})} disabled={!!editingStudent} />
            </div>
            <div className="space-y-2">
              <Label>Talaba raqami *</Label>
              <Input value={formData.studentNumber} onChange={(e) => setFormData({...formData, studentNumber: e.target.value})} disabled={!!editingStudent} />
            </div>
            <div className="space-y-2">
              <Label>Tug'ilgan sana *</Label>
              <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} disabled={!!editingStudent} />
            </div>
            <div className="space-y-2">
              <Label>Jinsi *</Label>
              <Select value={formData.gender} onValueChange={(value: Gender) => setFormData({...formData, gender: value})} disabled={!!editingStudent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Erkak</SelectItem>
                  <SelectItem value="FEMALE">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Fakultet</Label>
              <AcademicSelect kind="faculty" valueMode="id" value={formData.facultyId} onChange={(value) => setFormData({...formData, facultyId: value})} />
            </div>
            <div className="space-y-2">
              <Label>Yo'nalish</Label>
              <AcademicSelect kind="program" valueMode="id" value={formData.programId} onChange={(value) => setFormData({...formData, programId: value})} />
            </div>
            <div className="space-y-2">
              <Label>Guruh</Label>
              <AcademicSelect kind="group" valueMode="id" value={formData.groupId} onChange={(value) => setFormData({...formData, groupId: value})} />
            </div>
            <div className="space-y-2">
              <Label>Ta'lim tili</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbek</SelectItem>
                  <SelectItem value="ru">Rus</SelectItem>
                  <SelectItem value="en">Ingliz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kurs</Label>
              <Input type="number" min="1" max="6" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Bekor qilish</Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
