import { useState } from "react";
import {
  Megaphone, Plus, Eye, Edit, Trash2, MoreHorizontal,
  Users, Clock, Pin, Globe, Lock, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: number;
  title: string;
  body: string;
  target: string;
  views: number;
  pinned: boolean;
  isPublic: boolean;
  createdAt: string;
  category: "info" | "deadline" | "event" | "warning";
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: "Yakuniy imtihon jadvali",           body: "Yakuniy imtihon 25-iyun soat 09:00 da B-201 xonasida o'tkaziladi. Barcha talabalar vaqtida kelishi shart.",        target: "CS-22-01",    views: 42, pinned: true,  isPublic: true,  createdAt: "2025-06-12", category: "info"     },
  { id: 2, title: "Loyiha topshirish muddati uzaytirildi", body: "JavaScript loyiha topshirish muddati 22-iyungacha uzaytirildi. Yaxshi natijalar kutilmoqda.",                    target: "CS-22-01",    views: 38, pinned: false, isPublic: true,  createdAt: "2025-06-11", category: "deadline" },
  { id: 3, title: "React Workshop taklifi",             body: "Kelasi hafta qo'shimcha React workshop o'tkaziladi. Ishtiroq etmoqchi bo'lganlar ro'yxatdan o'ting.",             target: "Barchasi",    views: 95, pinned: false, isPublic: true,  createdAt: "2025-06-10", category: "event"    },
  { id: 4, title: "Plagiat haqida ogohlantirish",       body: "Topshiriqlarda plagiat aniqlandi. Barcha talabalar mustaqil ishlashi talab etiladi, aks holda 0 ball qo'yiladi.", target: "CS-22-01",    views: 45, pinned: true,  isPublic: false, createdAt: "2025-06-09", category: "warning"  },
  { id: 5, title: "Node.js sinf o'zgarishi",            body: "Ertangi Node.js darsi B-201 xonasidan Lab-3 ga ko'chirildi.",                                                     target: "CS-21-03",    views: 28, pinned: false, isPublic: true,  createdAt: "2025-06-08", category: "info"     },
];

const CAT_META: Record<string, { label: string; cls: string }> = {
  info:     { label: "Ma'lumot",       cls: "bg-blue-100   text-blue-800"   },
  deadline: { label: "Muddat",         cls: "bg-orange-100 text-orange-800" },
  event:    { label: "Tadbir",         cls: "bg-purple-100 text-purple-800" },
  warning:  { label: "Ogohlantirish",  cls: "bg-red-100    text-red-800"    },
};

export function TeacherAnnouncements() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target: "Barchasi", category: "info", pinned: false, isPublic: true });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const sorted = [...ANNOUNCEMENTS].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Sarlavha majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "E'lon yaratildi", description: form.title });
    setCreateOpen(false);
    setSaving(false);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            E'lonlar xizmati hali real API ga ulanmagan. Ko'rsatilgan ma'lumotlar namunavirus.
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">E'lonlar</h1>
          <p className="text-muted-foreground">Talabalar uchun e'lonlar va xabarlar</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />E'lon yaratish
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami e'lonlar", value: ANNOUNCEMENTS.length,                               cls: "" },
          { label: "Pinlangan",     value: ANNOUNCEMENTS.filter((a) => a.pinned).length,       cls: "text-yellow-600" },
          { label: "Jami ko'rishlar", value: ANNOUNCEMENTS.reduce((s, a) => s + a.views, 0),  cls: "text-blue-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((a) => (
          <Card key={a.id} className={a.pinned ? "border-yellow-300 dark:border-yellow-800/60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Megaphone className={`h-5 w-5 mt-0.5 shrink-0 ${CAT_META[a.category].cls.split(" ")[1]}`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                      <CardTitle className="text-base leading-tight">{a.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5 flex items-center gap-2">
                      <span>{a.createdAt}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.target}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.views}</span>
                      {a.isPublic
                        ? <span className="flex items-center gap-1 text-green-600"><Globe className="h-3 w-3" />Ochiq</span>
                        : <span className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" />Yopiq</span>
                      }
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={CAT_META[a.category].cls + " text-xs"}>{CAT_META[a.category].label}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" />Tahrirlash</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Pin className="h-4 w-4" />{a.pinned ? "Pinni olish" : "Pinlash"}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />O'chirish</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi E'lon</DialogTitle>
            <DialogDescription>Talabalar uchun e'lon yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Sarlavha <span className="text-destructive">*</span></Label>
              <Input placeholder="E'lon sarlavhasi" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Matn</Label>
              <Textarea rows={4} placeholder="E'lon matni..." value={form.body} onChange={(e) => set("body", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Maqsad auditoriya</Label>
                <Select value={form.target} onValueChange={(v) => set("target", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Barchasi", "CS-22-01", "CS-22-02", "CS-21-03"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kategoriya</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.pinned} onCheckedChange={(v) => set("pinned", v)} id="pin" />
                <Label htmlFor="pin">Pinlash</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublic} onCheckedChange={(v) => set("isPublic", v)} id="pub" />
                <Label htmlFor="pub">Ochiq</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Yaratilmoqda..." : "Yaratish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
