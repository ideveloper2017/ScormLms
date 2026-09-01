import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, Bell, BookOpen, CheckCircle2, CreditCard, Edit, GraduationCap,
  Loader2, Lock, MapPin, Phone, RefreshCw, Save, Shield, User,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats, useRecentActivity } from '@/hooks/dashboard/useDashboard';
import { useToast } from '@/hooks/use-toast';
import { listDistricts, listRegions } from '@/lib/classifier-api';
import { qk } from '@/lib/query-keys';
import { changeMyPassword, getMyProfile, updateMyProfile } from '@/lib/student-portal-api';
import type { UpdateStudentProfileRequest } from '@/types/student.types';

const GENDER_LABEL: Record<string, string> = { MALE: 'Erkak', FEMALE: 'Ayol' };
const DEGREE_LABEL: Record<string, string> = { BACHELOR: 'Bakalavr', MASTER: 'Magistr', PHD: 'Doktorantura', ASSOCIATE: 'Texnikum' };
const EFORM_LABEL: Record<string, string> = { FULL_TIME: 'Kunduzgi', PART_TIME: 'Sirtqi', DISTANCE: 'Masofaviy', EVENING: 'Kechki' };
const PAYMENT_LABEL: Record<string, string> = { CONTRACT: 'Kontrakt', GRANT: 'Grant' };
const STATUS_LABEL: Record<string, string> = { REGISTERED: 'Ro‘yxatga olingan', ACTIVE: 'Faol', SUSPENDED: 'To‘xtatilgan', EXPELLED: 'Chetlatilgan', GRADUATED: 'Bitirgan' };

type Preferences = { emailNotifications: boolean; pushNotifications: boolean; autoplay: boolean; subtitles: boolean };
const PREFS_KEY = 'student-cabinet-preferences';
const defaultPreferences: Preferences = { emailNotifications: true, pushNotifications: true, autoplay: false, subtitles: true };

function loadPreferences(): Preferences {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return defaultPreferences;
  }
}

function errorMessage(error: unknown, fallback: string) {
  const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return responseMessage || (error instanceof Error ? error.message : fallback);
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="flex items-start justify-between gap-4 py-1.5"><span className="text-sm text-muted-foreground">{label}</span><span className="text-right text-sm font-medium">{value ?? '—'}</span></div>;
}

export function StudentCabinet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateStudentProfileRequest>({});
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  const profileQuery = useQuery({ queryKey: qk.studentProfile(), queryFn: getMyProfile, staleTime: 30_000 });
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity();
  const regionsQuery = useQuery({ queryKey: ['classifiers', 'regions'], queryFn: listRegions, staleTime: 300_000 });
  const districtsQuery = useQuery({
    queryKey: ['classifiers', 'districts', editForm.currentRegionId],
    queryFn: () => listDistricts(Number(editForm.currentRegionId)),
    enabled: isEditing && !!editForm.currentRegionId,
    staleTime: 300_000,
  });

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: data => {
      queryClient.setQueryData(qk.studentProfile(), data);
      setIsEditing(false);
      toast({ title: 'Profil yangilandi' });
    },
    onError: error => toast({ title: 'Profilni saqlab bo‘lmadi', description: errorMessage(error, 'Noma’lum xatolik'), variant: 'destructive' }),
  });
  const passwordMutation = useMutation({
    mutationFn: () => changeMyPassword(passwords.current, passwords.next),
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      toast({ title: 'Parol yangilandi', description: 'Keyingi kirishda yangi paroldan foydalaning.' });
    },
    onError: error => toast({ title: 'Parolni yangilab bo‘lmadi', description: errorMessage(error, 'Noma’lum xatolik'), variant: 'destructive' }),
  });

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const fullName = profile?.fullName || profile?.username || 'Talaba';
  const initials = fullName.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const filledFields = [profile?.pinfl, profile?.lastName, profile?.firstName, profile?.birthDate, profile?.gender, profile?.passportNumber, profile?.phoneNumber, profile?.email, profile?.permanentAddress, profile?.currentAddress, profile?.studentNumber, profile?.facultyId, profile?.groupId].filter(Boolean).length;
  const completion = Math.round(filledFields / 13 * 100);

  const startEdit = () => {
    setEditForm({ phoneNumber: profile?.phoneNumber ?? '', email: profile?.email ?? '', currentRegion: profile?.currentRegion ?? '', currentRegionId: profile?.currentRegionId, currentDistrict: profile?.currentDistrict ?? '', currentDistrictId: profile?.currentDistrictId, currentAddress: profile?.currentAddress ?? '', photoUrl: profile?.photoUrl ?? '' });
    setIsEditing(true);
  };

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    toast({ title: 'Sozlama saqlandi' });
  };

  const submitPassword = () => {
    if (!passwords.current) return toast({ title: 'Joriy parolni kiriting', variant: 'destructive' });
    if (passwords.next.length < 12) return toast({ title: 'Yangi parol kamida 12 belgidan iborat bo‘lsin', variant: 'destructive' });
    if (passwords.next !== passwords.confirm) return toast({ title: 'Yangi parollar mos kelmadi', variant: 'destructive' });
    passwordMutation.mutate();
  };

  if (profileQuery.isLoading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (profileQuery.isError) return <div className="p-4 md:p-6"><Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertTriangle className="h-10 w-10 text-destructive" /><div><p className="font-medium">Profilni yuklab bo‘lmadi</p><p className="text-sm text-muted-foreground">Talaba profilingiz yaratilganini va server ishlayotganini tekshiring.</p></div><Button onClick={() => profileQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card></div>;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4"><Avatar className="h-20 w-20">{profile?.photoUrl ? <img src={profile.photoUrl} alt={fullName} className="h-full w-full rounded-full object-cover" /> : <AvatarFallback className="text-xl">{initials}</AvatarFallback>}</Avatar><div><h1 className="text-2xl font-bold">{fullName}</h1><p className="text-sm text-muted-foreground">{profile?.studentNumber} · {profile?.username}</p><div className="mt-2 flex flex-wrap gap-2"><Badge>{STATUS_LABEL[profile?.studentStatus ?? ''] ?? profile?.studentStatus}</Badge>{profile?.degreeLevel && <Badge variant="outline">{DEGREE_LABEL[profile.degreeLevel] ?? profile.degreeLevel}</Badge>}{profile?.courseNumber && <Badge variant="secondary">{profile.courseNumber}-kurs</Badge>}</div></div></div>
        <div className="flex gap-2">{isEditing && <Button variant="outline" onClick={() => setIsEditing(false)}>Bekor qilish</Button>}<Button onClick={isEditing ? () => updateMutation.mutate(editForm) : startEdit} disabled={updateMutation.isPending}>{isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}{isEditing ? 'Saqlash' : 'Tahrirlash'}</Button></div>
      </div>

      <Card className="bg-primary/5"><CardContent className="p-5"><div className="mb-2 flex justify-between"><div><p className="font-medium">Profil to‘ldirilishi</p><p className="text-xs text-muted-foreground">Yetishmayotgan rasmiy ma’lumotlarni administrator kiritadi.</p></div><span className="font-semibold">{completion}%</span></div><Progress value={completion} /></CardContent></Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4"><TabsTrigger value="profile">Profil</TabsTrigger><TabsTrigger value="academic">Akademik</TabsTrigger><TabsTrigger value="activity">Faoliyat</TabsTrigger><TabsTrigger value="settings">Sozlamalar</TabsTrigger></TabsList>

        <TabsContent value="profile" className="grid gap-5 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" />Shaxsiy ma’lumotlar</CardTitle></CardHeader><CardContent><InfoRow label="Familiya" value={profile?.lastName} /><InfoRow label="Ism" value={profile?.firstName} /><InfoRow label="Otasining ismi" value={profile?.middleName} /><Separator className="my-2" /><InfoRow label="PINFL" value={profile?.pinfl} /><InfoRow label="Tug‘ilgan sana" value={profile?.birthDate} /><InfoRow label="Jinsi" value={profile?.gender ? GENDER_LABEL[profile.gender] ?? profile.gender : null} /><InfoRow label="Fuqarolik" value={profile?.citizenship === 'UZBEKISTAN' ? 'O‘zbekiston' : profile?.citizenship} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />Pasport ma’lumotlari</CardTitle></CardHeader><CardContent><InfoRow label="Hujjat turi" value={profile?.passportType?.replace(/_/g, ' ')} /><InfoRow label="Seriya" value={profile?.passportSeries} /><InfoRow label="Raqam" value={profile?.passportNumber} /><Separator className="my-2" /><InfoRow label="Berilgan sana" value={profile?.passportIssuedDate} /><InfoRow label="Amal qilish muddati" value={profile?.passportExpiryDate} /><InfoRow label="Bergan organ" value={profile?.passportIssuedBy} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Phone className="h-4 w-4" />Aloqa ma’lumotlari</CardTitle><CardDescription>Bu maydonlarni talaba o‘zi yangilashi mumkin.</CardDescription></CardHeader><CardContent className="space-y-3"><div><Label>Telefon</Label><Input disabled={!isEditing} value={isEditing ? editForm.phoneNumber ?? '' : profile?.phoneNumber ?? ''} onChange={event => setEditForm(form => ({ ...form, phoneNumber: event.target.value }))} placeholder="+998901234567" /></div><div><Label>Email</Label><Input type="email" disabled={!isEditing} value={isEditing ? editForm.email ?? '' : profile?.email ?? ''} onChange={event => setEditForm(form => ({ ...form, email: event.target.value }))} placeholder="talaba@example.com" /></div><div><Label>Rasm URL manzili</Label><Input disabled={!isEditing} value={isEditing ? editForm.photoUrl ?? '' : profile?.photoUrl ?? ''} onChange={event => setEditForm(form => ({ ...form, photoUrl: event.target.value }))} placeholder="https://..." /></div></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" />Xavfsizlik</CardTitle><CardDescription>Parol almashtirilgach, barcha yangilash sessiyalari bekor qilinadi.</CardDescription></CardHeader><CardContent className="space-y-3"><div><Label>Joriy parol</Label><Input type="password" autoComplete="current-password" value={passwords.current} onChange={event => setPasswords(value => ({ ...value, current: event.target.value }))} /></div><div><Label>Yangi parol</Label><Input type="password" autoComplete="new-password" value={passwords.next} onChange={event => setPasswords(value => ({ ...value, next: event.target.value }))} /></div><div><Label>Yangi parolni tasdiqlang</Label><Input type="password" autoComplete="new-password" value={passwords.confirm} onChange={event => setPasswords(value => ({ ...value, confirm: event.target.value }))} /></div><Button className="w-full" onClick={submitPassword} disabled={passwordMutation.isPending}><Lock className="mr-2 h-4 w-4" />Parolni yangilash</Button></CardContent></Card>
        </TabsContent>

        <TabsContent value="academic" className="grid gap-5 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4" />Ta’lim ma’lumotlari</CardTitle></CardHeader><CardContent><InfoRow label="Talaba raqami" value={profile?.studentNumber} /><InfoRow label="Daraja" value={profile?.degreeLevel ? DEGREE_LABEL[profile.degreeLevel] ?? profile.degreeLevel : null} /><InfoRow label="Ta’lim shakli" value={profile?.educationForm ? EFORM_LABEL[profile.educationForm] ?? profile.educationForm : null} /><InfoRow label="Ta’lim tili" value={profile?.educationLanguage?.toUpperCase()} /><InfoRow label="Kurs / semestr" value={profile?.courseNumber ? `${profile.courseNumber}-kurs${profile.semesterNumber ? `, ${profile.semesterNumber}-semestr` : ''}` : null} /><InfoRow label="Akademik yil" value={profile?.academicYear} /><InfoRow label="Fakultet ID" value={profile?.facultyId} /><InfoRow label="Kafedra ID" value={profile?.departmentId} /><InfoRow label="Yo‘nalish ID" value={profile?.programId} /><InfoRow label="Guruh ID" value={profile?.groupId} /><InfoRow label="Qabul sanasi" value={profile?.admissionDate} /><InfoRow label="Qabul buyrug‘i" value={profile?.admissionOrderNumber} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />To‘lov ma’lumotlari</CardTitle></CardHeader><CardContent><InfoRow label="To‘lov turi" value={profile?.paymentType ? PAYMENT_LABEL[profile.paymentType] ?? profile.paymentType : null} /><InfoRow label="Kontrakt raqami" value={profile?.contractNumber} /><InfoRow label="Kontrakt summasi" value={profile?.contractAmount != null ? new Intl.NumberFormat('uz-UZ').format(profile.contractAmount) + ' so‘m' : null} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Doimiy manzil</CardTitle></CardHeader><CardContent><InfoRow label="Viloyat" value={profile?.permanentRegion} /><InfoRow label="Tuman" value={profile?.permanentDistrict} /><InfoRow label="Manzil" value={profile?.permanentAddress} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Hozirgi manzil</CardTitle><CardDescription>Bu ma’lumotni talaba yangilashi mumkin.</CardDescription></CardHeader><CardContent className="space-y-3">{isEditing ? <><div><Label>Viloyat</Label><Select value={editForm.currentRegionId ? String(editForm.currentRegionId) : ''} onValueChange={value => setEditForm(form => ({ ...form, currentRegionId: Number(value), currentDistrictId: null }))}><SelectTrigger><SelectValue placeholder="Viloyatni tanlang" /></SelectTrigger><SelectContent>{(regionsQuery.data ?? []).map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Tuman</Label><Select value={editForm.currentDistrictId ? String(editForm.currentDistrictId) : ''} disabled={!editForm.currentRegionId || districtsQuery.isLoading} onValueChange={value => setEditForm(form => ({ ...form, currentDistrictId: Number(value) }))}><SelectTrigger><SelectValue placeholder="Tumanni tanlang" /></SelectTrigger><SelectContent>{(districtsQuery.data ?? []).map(district => <SelectItem key={district.id} value={String(district.id)}>{district.name}</SelectItem>)}</SelectContent></Select></div><div><Label>To‘liq manzil</Label><Input value={editForm.currentAddress ?? ''} onChange={event => setEditForm(form => ({ ...form, currentAddress: event.target.value }))} /></div></> : <><InfoRow label="Viloyat" value={profile?.currentRegion} /><InfoRow label="Tuman" value={profile?.currentDistrict} /><InfoRow label="Manzil" value={profile?.currentAddress} /></>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats?.activeCourses ?? 0}</p><p className="text-sm text-muted-foreground">Faol kurs</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats?.completedCourses ?? 0}</p><p className="text-sm text-muted-foreground">Yakunlangan</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats?.pendingAssignments ?? 0}</p><p className="text-sm text-muted-foreground">Topshiriq</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{Math.round(stats?.attendancePercentage ?? 0)}%</p><p className="text-sm text-muted-foreground">Davomat</p></CardContent></Card></div>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />So‘nggi faoliyat</CardTitle></CardHeader><CardContent>{activityQuery.isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : activityQuery.isError ? <p className="py-8 text-center text-sm text-destructive">Faoliyat ma’lumotlarini yuklab bo‘lmadi.</p> : (activityQuery.data ?? []).length === 0 ? <div className="py-10 text-center"><BookOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><p className="text-sm text-muted-foreground">Hozircha tizimda faoliyat qaydi yo‘q.</p></div> : <div className="space-y-3">{activityQuery.data?.map(item => <div key={item.id} className="flex gap-3 rounded-lg border p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString('uz-UZ')}</p></div></div>)}</div>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="settings"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Kabinet sozlamalari</CardTitle><CardDescription>Ushbu tanlovlar shu brauzerda saqlanadi.</CardDescription></CardHeader><CardContent className="space-y-5">{([
          ['emailNotifications', 'Email bildirishnomalar', 'Yangi dars va topshiriqlar haqida email olish'],
          ['pushNotifications', 'Brauzer bildirishnomalari', 'Brauzer orqali tezkor xabar olish'],
          ['autoplay', 'Avtomatik ijro', 'Keyingi video darsni avtomatik boshlash'],
          ['subtitles', 'Subtitrlar', 'Video darslarda subtitrlarni ko‘rsatish'],
        ] as const).map(([key, title, description]) => <div key={key} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div><Switch checked={preferences[key]} onCheckedChange={value => updatePreference(key, value)} /></div>)}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
