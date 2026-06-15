import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listStudents, graduateStudent, archiveStudent, reinstateStudent, promoteStudent, editStudent, createStudent } from '@/lib/student-api';
import { StudentDto } from '@/types/student.types';
import { AcademicSelect } from '@/components/admin/academic-select';
import { Loader2, ArrowUpCircle, GraduationCap, Archive, UserCheck, Edit, Upload, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StudentManagement() {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: qk.students(),
    queryFn: listStudents,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.students() });

  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentIdNumber: '',
    email: '',
    groupName: '',
    faculty: '',
    educationPath: '',
    course: '1',
    semester: '1',
    language: 'uz'
  });

  const { toast } = useToast();


  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', studentIdNumber: '', email: '',
      groupName: '', faculty: '', educationPath: '', course: '1', semester: '1', language: 'uz'
    });
  };

  const handleSave = async () => {
    try {
      const payload: StudentDto = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        thirdName: formData.lastName,
        studentIdNumber: formData.studentIdNumber,
        email: formData.email,
        group: { name: formData.groupName, educationLang: { code: formData.language } },
        level: { code: formData.course },
        semester: { code: formData.semester },
        faculty: { name: formData.faculty },
        specialty: { name: formData.educationPath }
      };

      if (editingStudent?.username) {
        await editStudent(editingStudent.username, payload);
        toast({ title: "Muvaffaqiyatli", description: "Talaba ma'lumotlari yangilandi" });
      } else {
        await createStudent(payload);
        toast({ title: "Muvaffaqiyatli", description: "Yangi talaba qo'shildi" });
      }

      setEditingStudent(null);
      setIsAdding(false);
      resetForm();
      await invalidate();
    } catch (e) {
      toast({ title: "Xatolik", description: "Amalni bajarib bo'lmadi", variant: "destructive" });
    }
  };

  const handleEditClick = (s: StudentDto) => {
    setEditingStudent(s);
    setFormData({
      firstName: s.firstName || '',
      lastName: s.thirdName || '',
      studentIdNumber: s.studentIdNumber || '',
      email: s.email || '',
      groupName: s.group?.name || '',
      faculty: s.faculty?.name || '',
      educationPath: s.specialty?.name || '',
      course: s.level?.code || '1',
      semester: s.semester?.code || '1',
      language: s.group?.educationLang?.code || 'uz'
    });
  };

  const columns = useMemo<ColumnDef<StudentDto>[]>(() => [
    {
      accessorKey: 'fullName',
      header: 'Ism',
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    {
      accessorKey: 'studentIdNumber',
      header: 'ID / JSHSHIR',
    },
    {
      accessorFn: (s) => s.group?.name ?? '',
      id: 'group',
      header: 'Guruh',
    },
    {
      id: 'kurs',
      header: 'Kurs/Semestr',
      enableSorting: false,
      cell: ({ row: { original: s } }) => `${s.level?.code ?? '—'}/${s.semester?.code ?? '—'}`,
    },
    {
      accessorFn: (s) => s.studentStatus?.code ?? '',
      id: 'status',
      header: 'Holat',
      cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Amallar</div>,
      enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleEditClick(s)} title="Tahrirlash">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => s.username && promoteStudent(s.username).then(invalidate)} title="Kursdan o'tkazish">
            <ArrowUpCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => s.username && graduateStudent(s.username).then(invalidate)} title="Bitiruvchi">
            <GraduationCap className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => s.username && archiveStudent(s.username).then(invalidate)} title="Arxivlash">
            <Archive className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => s.username && reinstateStudent(s.username).then(invalidate)} title="Qayta tiklash">
            <UserCheck className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Talabalar Boshqaruvi</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Excel Import</Button>
          <Button className="gap-2" onClick={() => { resetForm(); setIsAdding(true); }}>
            <UserPlus className="h-4 w-4" /> Yangi Talaba
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Barcha Talabalar</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Ism, ID yoki guruh bo'yicha qidirish..."
            showColumnToggle
            emptyText="Talabalar topilmadi"
          />
        </CardContent>
      </Card>

      <Dialog open={isAdding || !!editingStudent} onOpenChange={(o) => !o && (setIsAdding(false), setEditingStudent(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Ism</Label>
              <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ism" />
            </div>
            <div className="space-y-2">
              <Label>Familiya</Label>
              <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Familiya" />
            </div>
            <div className="space-y-2">
              <Label>JSHSHIR / ID</Label>
              <Input value={formData.studentIdNumber} onChange={e => setFormData({...formData, studentIdNumber: e.target.value})} placeholder="JSHSHIR" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
            </div>
            <div className="space-y-2">
              <Label>Fakultet</Label>
              <AcademicSelect kind="faculty" value={formData.faculty} onChange={v => setFormData({...formData, faculty: v})} />
            </div>
            <div className="space-y-2">
              <Label>Yo'nalish</Label>
              <AcademicSelect kind="program" value={formData.educationPath} onChange={v => setFormData({...formData, educationPath: v})} />
            </div>
            <div className="space-y-2">
              <Label>Guruh</Label>
              <AcademicSelect kind="group" value={formData.groupName} onChange={v => setFormData({...formData, groupName: v})} />
            </div>
            <div className="space-y-2">
              <Label>Ta'lim tili</Label>
              <Select value={formData.language} onValueChange={v => setFormData({...formData, language: v})}>
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
              <Input type="number" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} min="1" max="6" />
            </div>
            <div className="space-y-2">
              <Label>Semestr</Label>
              <Input type="number" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} min="1" max="12" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setIsAdding(false), setEditingStudent(null))}>Bekor qilish</Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}