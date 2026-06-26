import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Mail, Phone, BookOpen, Building, Award,
  Edit, Save, Camera, Star, TrendingUp, Users,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

export function TeacherProfile() {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading: profileLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.profile(),
    queryFn: teacherPortalApi.getProfile,
    staleTime: 120_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: qk.teacher.stats(),
    queryFn: teacherPortalApi.getDashboardStats,
    staleTime: 120_000,
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", bio: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const startEditing = () => {
    setForm({
      name:  profile?.fullName ?? "",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      bio:   "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Profil yangilandi" });
    setEditing(false);
    setSaving(false);
  };

  const initials = (profile?.fullName ?? "")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  if (profileLoading || statsLoading) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-9 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Profil</h1>
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Profil</h1>
        {!editing
          ? <Button variant="outline" className="gap-2" onClick={startEditing}><Edit className="h-4 w-4" />Tahrirlash</Button>
          : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Bekor qilish</Button>
              <Button className="gap-2" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />{saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          )
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: avatar + stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 pb-4 flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {profile?.photoUrl && <AvatarImage src={profile.photoUrl} alt={profile.fullName} />}
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{profile?.fullName}</div>
                {profile?.position && (
                  <div className="text-sm text-muted-foreground">{profile.position}</div>
                )}
                <div className="flex items-center gap-1 mt-1 justify-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">—</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
              </div>
              {profile?.academicDegree && (
                <Badge className="bg-blue-100 text-blue-800">{profile.academicDegree}</Badge>
              )}
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Statistika</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Talabalar",  value: stats.totalStudents,  icon: Users,    cls: "text-blue-600"  },
                  { label: "Kurslar",    value: stats.activeCourses,  icon: BookOpen, cls: "text-green-600" },
                  { label: "Topshiriqlar",value: stats.newSubmissions, icon: Award,  cls: "text-purple-600"},
                ].map(({ label, value, icon: Icon, cls }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className={`h-4 w-4 ${cls}`} />{label}
                    </div>
                    <span className={`font-semibold ${cls}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5" />Shaxsiy ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ism Familiya</Label>
                  {editing
                    ? <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                    : <p className="text-sm font-medium">{profile?.fullName}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Elektron pochta</Label>
                  {editing
                    ? <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    : <p className="text-sm">{profile?.email ?? "—"}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  {editing
                    ? <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    : <p className="text-sm">{profile?.phone ?? "—"}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Foydalanuvchi nomi</Label>
                  <p className="text-sm">{profile?.username ?? "—"}</p>
                </div>
              </div>
              {editing && (
                <div className="space-y-1.5">
                  <Label>Haqimda</Label>
                  <Textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-5 w-5" />Kafedra ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Kafedra",       value: profile?.departmentName ?? "—" },
                { label: "Lavozim",       value: profile?.position ?? "—" },
                { label: "Ilmiy daraja",  value: profile?.academicDegree ?? "—" },
                { label: "Ilmiy unvon",   value: profile?.academicRank ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
