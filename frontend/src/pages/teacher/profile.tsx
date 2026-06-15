import { useState } from "react";
import {
  User, Mail, Phone, BookOpen, Building, Award,
  Edit, Save, Camera, Star, TrendingUp, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const PROFILE = {
  name:        "Jamshid Toshmatov",
  email:       "j.toshmatov@university.uz",
  phone:       "+998 90 123 45 67",
  department:  "Kompyuter fanlari kafedrasi",
  faculty:     "Axborot texnologiyalari fakulteti",
  position:    "Katta o'qituvchi",
  experience:  "8 yil",
  degree:      "Texnika fanlari nomzodi",
  bio:         "JavaScript va React bo'yicha mutaxassis. Web dasturlash yo'nalishida 8 yillik pedagogik tajribaga ega. Zamonaviy front-end texnologiyalarni o'qitish sohasida faol ish olib boraman.",
  subjects:    ["JavaScript", "React", "Node.js", "TypeScript", "Web dasturlash"],
  publications: 12,
  rating:      4.8,
  students:    156,
  courses:     6,
};

const ACHIEVEMENTS = [
  { label: "Eng yaxshi o'qituvchi 2024",  year: "2024", icon: Award,      cls: "text-yellow-500" },
  { label: "100+ talaba",                  year: "2023", icon: Users,      cls: "text-blue-500"   },
  { label: "5 yillik tajriba",             year: "2022", icon: TrendingUp, cls: "text-green-500"  },
];

export function TeacherProfile() {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: PROFILE.name, email: PROFILE.email, phone: PROFILE.phone, bio: PROFILE.bio });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Profil yangilandi" });
    setEditing(false);
    setSaving(false);
  };

  const initials = PROFILE.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        {!editing
          ? <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}><Edit className="h-4 w-4" />Tahrirlash</Button>
          : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Bekor qilish</Button>
              <Button className="gap-2" onClick={handleSave} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
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
                <div className="font-bold text-lg">{PROFILE.name}</div>
                <div className="text-sm text-muted-foreground">{PROFILE.position}</div>
                <div className="flex items-center gap-1 mt-1 justify-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{PROFILE.rating}</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{PROFILE.degree}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Statistika</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Talabalar",   value: PROFILE.students,    icon: Users,    cls: "text-blue-600"   },
                { label: "Kurslar",     value: PROFILE.courses,     icon: BookOpen, cls: "text-green-600"  },
                { label: "Nashrlar",    value: PROFILE.publications, icon: Award,   cls: "text-purple-600" },
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

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Yutuqlar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ACHIEVEMENTS.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.label} className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 shrink-0 ${a.cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">{a.label}</div>
                      <div className="text-xs text-muted-foreground">{a.year}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5" />Shaxsiy ma'lumotlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ism Familiya</Label>
                  {editing
                    ? <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                    : <p className="text-sm font-medium">{form.name}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Elektron pochta</Label>
                  {editing
                    ? <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    : <p className="text-sm">{form.email}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  {editing
                    ? <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    : <p className="text-sm">{form.phone}</p>
                  }
                </div>
                <div className="space-y-1.5">
                  <Label>Tajriba</Label>
                  <p className="text-sm">{PROFILE.experience}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Haqimda</Label>
                {editing
                  ? <Textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
                  : <p className="text-sm text-muted-foreground">{form.bio}</p>
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building className="h-5 w-5" />Kafedra ma'lumotlari</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Kafedra",   value: PROFILE.department },
                { label: "Fakultet",  value: PROFILE.faculty    },
                { label: "Lavozim",   value: PROFILE.position   },
                { label: "Ilmiy daraja", value: PROFILE.degree  },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5" />O'qitiladigan fanlar</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PROFILE.subjects.map((s) => (
                  <Badge key={s} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Reyting taqsimoti</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { stars: 5, pct: 72 },
                { stars: 4, pct: 20 },
                { stars: 3, pct: 6  },
                { stars: 2, pct: 2  },
                { stars: 1, pct: 0  },
              ].map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs w-6 text-right text-muted-foreground">{stars}★</span>
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="text-xs w-8 text-muted-foreground">{pct}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}