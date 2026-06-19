import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, Calendar, MapPin, Edit, Shield,
  Award, BookOpen, Clock, Target, Activity, Bell, Lock,
  Eye, Download, Star, TrendingUp, CheckCircle, GraduationCap,
  FileText, Video, BarChart3, Plus, CreditCard, Home, Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { getMyProfile, updateMyProfile } from '@/lib/student-portal-api';
import { qk } from '@/lib/query-keys';
import type { UpdateStudentProfileRequest } from '@/types/student.types';

// ── Static (kelajakda backenddan keladi) ──────────────────────────────────────
const STATIC = {
  profileCompletion: 85,
  learningStats: { totalHours: 120, thisWeekHours: 15, avgSessionTime: 45, streakDays: 12 },
  notifications:    { email: true,  push: true, sms: false },
  privacy:          { profileVisible: true, showProgress: true, showAchievements: true },
  learning:         { autoplay: true, subtitles: true, playbackSpeed: '1.0' },
};

const recentActivities = [
  { id: 1, title: 'Darsni yakunladingiz',  description: 'JavaScript Asoslari - Dars 7',   timestamp: '2 soat oldin',  icon: CheckCircle,    color: 'text-green-600'  },
  { id: 2, title: 'Topshiriq yuborildi',   description: 'React Components loyihasi',        timestamp: '1 kun oldin',   icon: FileText,       color: 'text-blue-600'   },
  { id: 3, title: 'Imtihon topshirildi',   description: 'HTML/CSS yakuniy test - 95 ball',  timestamp: '3 kun oldin',   icon: GraduationCap,  color: 'text-purple-600' },
  { id: 4, title: 'Yangi yutuq',           description: 'JavaScript Master unvoni olindi',  timestamp: '1 hafta oldin', icon: Award,          color: 'text-yellow-600' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const GENDER_LABEL:  Record<string, string> = { MALE: 'Erkak', FEMALE: 'Ayol' };
const DEGREE_LABEL:  Record<string, string> = { BACHELOR: 'Bakalavr', MASTER: 'Magistr', PHD: 'Doktorantura', ASSOCIATE: 'Texnikum' };
const EFORM_LABEL:   Record<string, string> = { FULL_TIME: 'Kunduzgi', PART_TIME: 'Sirtqi', DISTANCE: 'Masofaviy', EVENING: 'Kechki' };
const PAYMENT_LABEL: Record<string, string> = { CONTRACT: 'Kontrakt', GRANT: 'Grant' };
const STATUS_STYLE:  Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  EXPELLED:  'bg-red-100 text-red-800',
  GRADUATED: 'bg-blue-100 text-blue-800',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Faol', SUSPENDED: 'To\'xtatilgan', EXPELLED: 'Chetlatilgan', GRADUATED: 'Bitiruvchi',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StudentCabinet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState<UpdateStudentProfileRequest>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: qk.studentProfile(),
    queryFn: getMyProfile,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.studentProfile() });
      setIsEditing(false);
      toast({ title: 'Profil yangilandi' });
    },
    onError: () => toast({ title: 'Xatolik yuz berdi', variant: 'destructive' }),
  });

  const startEdit = () => {
    setEditForm({
      phoneNumber:     profile?.phoneNumber     ?? '',
      email:           profile?.email           ?? '',
      currentRegion:   profile?.currentRegion   ?? '',
      currentDistrict: profile?.currentDistrict ?? '',
      currentAddress:  profile?.currentAddress  ?? '',
      photoUrl:        profile?.photoUrl        ?? '',
    });
    setIsEditing(true);
  };

  const saveEdit = () => updateMutation.mutate(editForm);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const fullName  = profile?.fullName  ?? profile?.username ?? 'Talaba';
  const initials  = fullName.split(' ').filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  const statusKey = profile?.studentStatus ?? 'ACTIVE';

  // Profil to'ldirilishi % (pasport ma'lumotlari, manzil va h.k. bo'yicha)
  const filledFields = [
    profile?.pinfl, profile?.lastName, profile?.firstName,
    profile?.birthDate, profile?.gender, profile?.passportNumber,
    profile?.phoneNumber, profile?.email,
    profile?.permanentAddress, profile?.currentAddress,
    profile?.studentNumber, profile?.facultyId, profile?.groupId,
  ].filter(Boolean).length;
  const completion = Math.round((filledFields / 13) * 100);

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile?.photoUrl
              ? <img src={profile.photoUrl} alt={fullName} className="h-full w-full object-cover rounded-full" />
              : <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">{initials}</AvatarFallback>
            }
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile?.studentNumber} • {profile?.username}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={STATUS_STYLE[statusKey]}>
                {STATUS_LABEL[statusKey] ?? statusKey}
              </Badge>
              {profile?.degreeLevel && (
                <Badge variant="outline">{DEGREE_LABEL[profile.degreeLevel] ?? profile.degreeLevel}</Badge>
              )}
              {profile?.courseNumber && (
                <Badge variant="secondary">{profile.courseNumber}-kurs</Badge>
              )}
              {profile?.academicYear && (
                <Badge variant="secondary">{profile.academicYear}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Bekor
            </Button>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            className="gap-2"
            onClick={isEditing ? saveEdit : startEdit}
            disabled={updateMutation.isPending}
          >
            <Edit className="h-4 w-4" />
            {isEditing ? 'Saqlash' : 'Tahrirlash'}
          </Button>
        </div>
      </div>

      {/* ── Profil to'ldirilishi ────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Profil to'ldirilishi</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barcha ma'lumotlarni to'ldiring
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-600">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2.5" />
        </CardContent>
      </Card>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bu hafta', value: `${STATIC.learningStats.thisWeekHours}h`, icon: Clock,      color: 'emerald' },
          { label: 'Jami soat', value: `${STATIC.learningStats.totalHours}h`,  icon: Activity,   color: 'blue'    },
          { label: 'Sessiya',   value: `${STATIC.learningStats.avgSessionTime}m`, icon: Target,  color: 'purple'  },
          { label: 'Streak',    value: `${STATIC.learningStats.streakDays}🔥`,  icon: Star,      color: 'orange'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-${color}-200 dark:border-${color}-800 border-2`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                <Icon className={`h-5 w-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="academic">Akademik</TabsTrigger>
          <TabsTrigger value="address">Manzil</TabsTrigger>
          <TabsTrigger value="activity">Faoliyat</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        {/* ── Profil tab ────────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Shaxsiy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" /> Shaxsiy ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Familiya"    value={profile?.lastName} />
                <InfoRow label="Ism"         value={profile?.firstName} />
                <InfoRow label="Otasining ismi" value={profile?.middleName} />
                <Separator className="my-2" />
                <InfoRow label="PINFL"       value={profile?.pinfl} />
                <InfoRow label="Tug'ilgan sana" value={profile?.birthDate ?? undefined} />
                <InfoRow label="Jinsi"       value={profile?.gender ? (GENDER_LABEL[profile.gender] ?? profile.gender) : undefined} />
                <InfoRow label="Fuqarolik"   value={profile?.citizenship === 'UZBEKISTAN' ? "O'zbekiston" : profile?.citizenship ?? undefined} />
              </CardContent>
            </Card>

            {/* Pasport */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> Pasport ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Hujjat turi"  value={profile?.passportType?.replace('_', ' ')} />
                <InfoRow label="Seriya"        value={profile?.passportSeries} />
                <InfoRow label="Raqam"         value={profile?.passportNumber} />
                <Separator className="my-2" />
                <InfoRow label="Berilgan sana" value={profile?.passportIssuedDate ?? undefined} />
                <InfoRow label="Amal qilish muddati" value={profile?.passportExpiryDate ?? undefined} />
                <InfoRow label="Bergan organ"  value={profile?.passportIssuedBy} />
              </CardContent>
            </Card>

            {/* Aloqa — tahrirlanadigan */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" /> Aloqa ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefon raqam</Label>
                  <Input
                    value={isEditing ? (editForm.phoneNumber ?? '') : (profile?.phoneNumber ?? '')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="+998901234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={isEditing ? (editForm.email ?? '') : (profile?.email ?? '')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Xavfsizlik */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" /> Xavfsizlik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Joriy parol</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yangi parol</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tasdiqlash</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full gap-2" size="sm">
                  <Lock className="h-4 w-4" /> Parolni yangilash
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Akademik tab ──────────────────────────────────────────────────── */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Ta'lim */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-4 w-4" /> Ta'lim ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{profile?.courseNumber ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Kurs</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {profile?.degreeLevel ? (DEGREE_LABEL[profile.degreeLevel] ?? profile.degreeLevel) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Daraja</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <InfoRow label="Talaba raqami"   value={profile?.studentNumber} />
                <InfoRow label="Ta'lim shakli"   value={profile?.educationForm ? (EFORM_LABEL[profile.educationForm] ?? profile.educationForm) : undefined} />
                <InfoRow label="Ta'lim tili"     value={profile?.educationLanguage?.toUpperCase()} />
                <InfoRow label="Akademik yil"    value={profile?.academicYear} />
                <InfoRow label="Qabul sanasi"    value={profile?.admissionDate ?? undefined} />
                <InfoRow label="Buyruq raqami"   value={profile?.admissionOrderNumber} />
              </CardContent>
            </Card>

            {/* To'lov */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> To'lov ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="mb-3">
                  {profile?.paymentType ? (
                    <Badge className={profile.paymentType === 'GRANT' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {PAYMENT_LABEL[profile.paymentType]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                </div>
                <Separator className="my-2" />
                <InfoRow label="Kontrakt raqami"  value={profile?.contractNumber} />
                <InfoRow
                  label="Kontrakt summasi"
                  value={profile?.contractAmount != null
                    ? `${profile.contractAmount.toLocaleString()} so'm`
                    : undefined}
                />
                <Separator className="my-2" />
                <InfoRow label="Tizimga kirish"   value={profile?.username} />
                <InfoRow
                  label="Oxirgi kirish"
                  value={profile?.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString('uz-UZ')
                    : undefined}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Akademik ma'lumotnoma
            </Button>
          </div>
        </TabsContent>

        {/* ── Manzil tab ────────────────────────────────────────────────────── */}
        <TabsContent value="address" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Doimiy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4" /> Doimiy yashash manzili
                </CardTitle>
                <CardDescription className="text-xs">Pasportdagi manzil — faqat admin o'zgartira oladi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Viloyat"  value={profile?.permanentRegion} />
                <InfoRow label="Tuman"    value={profile?.permanentDistrict} />
                <InfoRow label="Manzil"   value={profile?.permanentAddress} />
              </CardContent>
            </Card>

            {/* Hozirgi — tahrirlanadigan */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" /> Hozirgi yashash manzili
                </CardTitle>
                <CardDescription className="text-xs">O'zingiz yangilay olasiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Viloyat</Label>
                  <Input
                    value={isEditing ? (editForm.currentRegion ?? '') : (profile?.currentRegion ?? '')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm(f => ({ ...f, currentRegion: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tuman</Label>
                  <Input
                    value={isEditing ? (editForm.currentDistrict ?? '') : (profile?.currentDistrict ?? '')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm(f => ({ ...f, currentDistrict: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To'liq manzil</Label>
                  <Input
                    value={isEditing ? (editForm.currentAddress ?? '') : (profile?.currentAddress ?? '')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm(f => ({ ...f, currentAddress: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Faoliyat tab ──────────────────────────────────────────────────── */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" /> So'nggi faoliyatlar
              </CardTitle>
              <CardDescription>Oxirgi o'quv faoliyatlari va yutuqlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map(({ id, icon: Icon, color, title, description, timestamp }) => (
                  <div key={id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-white dark:bg-muted shadow-sm shrink-0">
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{title}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistika */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{STATIC.learningStats.thisWeekHours}h</p>
              <p className="text-xs text-muted-foreground mt-1">Bu hafta</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{STATIC.learningStats.totalHours}h</p>
              <p className="text-xs text-muted-foreground mt-1">Jami</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{STATIC.learningStats.avgSessionTime}m</p>
              <p className="text-xs text-muted-foreground mt-1">O'rtacha sessiya</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{STATIC.learningStats.streakDays}</p>
              <p className="text-xs text-muted-foreground mt-1">Kun streak 🔥</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* ── Sozlamalar tab ────────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" /> Bildirishnomalar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email bildirishnomalar',  desc: 'Yangi darslar va topshiriqlar haqida', key: 'email'  as const },
                  { label: 'Push bildirishnomalar',    desc: 'Brauzer orqali bildirishnomalar',       key: 'push'   as const },
                  { label: 'SMS bildirishnomalar',     desc: 'Muhim xabarlar uchun SMS',              key: 'sms'    as const },
                ].map(({ label, desc, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch defaultChecked={STATIC.notifications[key]} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" /> Maxfiylik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Profil ko'rinishi",    desc: "Boshqa talabalar profilingizni ko'ra olsinmi",       key: 'profileVisible'    as const },
                  { label: "Jarayon ko'rsatish",   desc: "O'quv jarayoningizni boshqalarga ko'rsatish",        key: 'showProgress'      as const },
                  { label: "Yutuqlar ko'rsatish",  desc: "Yutuqlaringizni boshqalarga ko'rsatish",             key: 'showAchievements'  as const },
                ].map(({ label, desc, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch defaultChecked={STATIC.privacy[key]} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4" /> O'quv sozlamalari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avtomatik ijro</p>
                  <p className="text-xs text-muted-foreground">Video darslarni avtomatik boshlash</p>
                </div>
                <Switch defaultChecked={STATIC.learning.autoplay} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Subtitrlar</p>
                  <p className="text-xs text-muted-foreground">Video darslarda subtitrlarni ko'rsatish</p>
                </div>
                <Switch defaultChecked={STATIC.learning.subtitles} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Ijro tezligi</Label>
                <Select defaultValue={STATIC.learning.playbackSpeed}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['0.5', '0.75', '1.0', '1.25', '1.5', '2.0'].map(v => (
                      <SelectItem key={v} value={v}>{v === '1.0' ? '1.0x (Normal)' : `${v}x`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
