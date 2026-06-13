import { useState } from "react";
import {
  Upload, BookOpen, Video, FileText, File,
  Search, Plus, Trash2, Download, Link as LinkIcon,
  MoreHorizontal, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: number;
  name: string;
  type: "scorm" | "video" | "pdf" | "file" | "link";
  course: string;
  module: string;
  size: string;
  uploadedAt: string;
  linked: boolean;
}

const CONTENT: ContentItem[] = [
  { id: 1,  name: "Kirish darsi.mp4",           type: "video", course: "JS Asoslari",  module: "Kirish",              size: "245 MB", uploadedAt: "2025-06-01", linked: true  },
  { id: 2,  name: "JS Asoslari reja.pdf",        type: "pdf",   course: "JS Asoslari",  module: "Kirish",              size: "1.2 MB", uploadedAt: "2025-06-01", linked: true  },
  { id: 3,  name: "O'zgaruvchilar.scorm",        type: "scorm", course: "JS Asoslari",  module: "O'zgaruvchilar",      size: "18 MB",  uploadedAt: "2025-06-03", linked: true  },
  { id: 4,  name: "Funksiyalar_amaliyot.zip",    type: "file",  course: "JS Asoslari",  module: "Funksiyalar",         size: "5 MB",   uploadedAt: "2025-06-05", linked: false },
  { id: 5,  name: "React Kirish.mp4",            type: "video", course: "React Dev",    module: "React Asoslari",      size: "312 MB", uploadedAt: "2025-06-05", linked: true  },
  { id: 6,  name: "Hooks_interaktiv.scorm",      type: "scorm", course: "React Dev",    module: "React Hooks",         size: "22 MB",  uploadedAt: "2025-06-07", linked: true  },
  { id: 7,  name: "React State qo'llanma.pdf",   type: "pdf",   course: "React Dev",    module: "React Hooks",         size: "2.5 MB", uploadedAt: "2025-06-07", linked: false },
  { id: 8,  name: "Express REST API.scorm",      type: "scorm", course: "Node.js",      module: "REST API",            size: "30 MB",  uploadedAt: "2025-06-08", linked: true  },
];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  scorm: { label: "SCORM", icon: BookOpen,  cls: "text-blue-600"   },
  video: { label: "Video", icon: Video,     cls: "text-red-500"    },
  pdf:   { label: "PDF",   icon: FileText,  cls: "text-red-700"    },
  file:  { label: "Fayl",  icon: File,      cls: "text-slate-500"  },
  link:  { label: "URL",   icon: LinkIcon,  cls: "text-purple-500" },
};

const COURSES  = ["Barchasi", "JS Asoslari", "React Dev", "Node.js", "TypeScript"];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("uz-Latn", { day: "2-digit", month: "short" });
}

export function TeacherContent() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("Barchasi");
  const [tab, setTab] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "scorm", course: "JS Asoslari", module: "", url: "" });
  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = CONTENT.filter((c) => {
    const t = search.toLowerCase();
    const typeMatch = tab === "all" || c.type === tab || (tab === "linked" && c.linked) || (tab === "unlinked" && !c.linked);
    return (
      (!t || c.name.toLowerCase().includes(t) || c.course.toLowerCase().includes(t)) &&
      (course === "Barchasi" || c.course === course) &&
      typeMatch
    );
  });

  const stats: Record<string, number> = { total: CONTENT.length };
  CONTENT.forEach((c) => { stats[c.type] = (stats[c.type] ?? 0) + 1; });
  stats.linked   = CONTENT.filter((c) => c.linked).length;
  stats.unlinked = CONTENT.filter((c) => !c.linked).length;

  const handleUpload = async () => {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Nom majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Kontent qo'shildi", description: form.name });
    setUploadOpen(false);
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontent kutubxonasi</h1>
          <p className="text-muted-foreground">SCORM, video, PDF va boshqa materiallar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <LinkIcon className="h-4 w-4" />URL qo'shish
          </Button>
          <Button className="gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />Fayl yuklash
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Jami",    value: stats.total,    cls: "" },
          { label: "SCORM",   value: stats.scorm??0, cls: "text-blue-600" },
          { label: "Video",   value: stats.video??0, cls: "text-red-500" },
          { label: "Ulangan", value: stats.linked,   cls: "text-green-600" },
          { label: "Ulanmagan",value: stats.unlinked, cls: "text-orange-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Kontent nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Barchasi ({stats.total})</TabsTrigger>
          <TabsTrigger value="scorm">SCORM ({stats.scorm ?? 0})</TabsTrigger>
          <TabsTrigger value="video">Video ({stats.video ?? 0})</TabsTrigger>
          <TabsTrigger value="pdf">PDF ({stats.pdf ?? 0})</TabsTrigger>
          <TabsTrigger value="unlinked">Ulanmagan ({stats.unlinked})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {filtered.map((c) => {
            const meta = TYPE_META[c.type];
            const Icon = meta.icon;
            return (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-2 rounded-md bg-muted shrink-0`}>
                    <Icon className={`h-5 w-5 ${meta.cls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.course} · {c.module} · {c.size} · {fmtDate(c.uploadedAt)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                      {c.linked
                        ? <Badge className="bg-green-100 text-green-800 text-xs">Ulangan</Badge>
                        : <Badge className="bg-orange-100 text-orange-800 text-xs">Ulanmagan</Badge>
                      }
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" />Ko'rish</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" />Yuklab olish</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />O'chirish</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!o) setUploadOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kontent qo'shish</DialogTitle>
            <DialogDescription>Yangi material yuklang yoki URL kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nomi <span className="text-destructive">*</span></Label>
              <Input placeholder="Material nomi" value={form.name} onChange={(e) => setF("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Turi</Label>
                <Select value={form.type} onValueChange={(v) => setF("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kurs</Label>
                <Select value={form.course} onValueChange={(v) => setF("course", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COURSES.filter((c) => c !== "Barchasi").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Modul nomi</Label>
              <Input placeholder="Modul nomi" value={form.module} onChange={(e) => setF("module", e.target.value)} />
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm">Fayl sudrab tashlang yoki bosing</p>
              <p className="text-xs mt-1">SCORM, MP4, PDF, ZIP — max 500 MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleUpload} disabled={saving}>{saving ? "Yuklanmoqda..." : "Yuklash"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}