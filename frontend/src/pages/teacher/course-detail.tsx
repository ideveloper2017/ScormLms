import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit, Trash2, BookOpen, Video,
  FileText, Users, BarChart3, GripVertical, ChevronRight,
  Upload, Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COURSES_DATA: Record<string, { title: string; subject: string; group: string; students: number; progress: number; avgScore: number }> = {
  "1": { title: "JavaScript Asoslari",    subject: "Dasturlash",     group: "CS-22-01", students: 45, progress: 85, avgScore: 88 },
  "2": { title: "React Development",      subject: "Web dasturlash", group: "CS-22-02", students: 32, progress: 72, avgScore: 82 },
  "3": { title: "Node.js Backend",        subject: "Backend",        group: "CS-21-03", students: 28, progress: 60, avgScore: 75 },
  "4": { title: "TypeScript Advanced",    subject: "Dasturlash",     group: "CS-22-04", students: 51, progress: 45, avgScore: 79 },
};

const MODULES = [
  { id: 1, title: "Kirish va o'rnatish",         lessons: 4, duration: "2 soat",   status: "active"   },
  { id: 2, title: "O'zgaruvchilar va turlar",    lessons: 6, duration: "3 soat",   status: "active"   },
  { id: 3, title: "Funksiyalar",                 lessons: 8, duration: "4 soat",   status: "active"   },
  { id: 4, title: "Massivlar va ob'yektlar",     lessons: 7, duration: "3.5 soat", status: "active"   },
  { id: 5, title: "Asinxron dasturlash",         lessons: 5, duration: "2.5 soat", status: "active"   },
  { id: 6, title: "DOM va Hodisalar",            lessons: 6, duration: "3 soat",   status: "draft"    },
];

const LESSONS = [
  { id: 1, module: "Kirish va o'rnatish",      title: "JavaScript nima?",           type: "video", duration: "15 daq", order: 1 },
  { id: 2, module: "Kirish va o'rnatish",      title: "O'rnatish va sozlash",        type: "video", duration: "20 daq", order: 2 },
  { id: 3, module: "O'zgaruvchilar va turlar", title: "var, let, const",             type: "video", duration: "25 daq", order: 1 },
  { id: 4, module: "O'zgaruvchilar va turlar", title: "Ma'lumot turlari",            type: "text",  duration: "10 daq", order: 2 },
  { id: 5, module: "Funksiyalar",             title: "Funksiya yaratish",            type: "video", duration: "30 daq", order: 1 },
  { id: 6, module: "Funksiyalar",             title: "Arrow functions",              type: "video", duration: "20 daq", order: 2 },
];

const CONTENTS = [
  { id: 1, name: "Dars 1 - Kirish.mp4",          type: "video",  size: "245 MB", module: "Kirish va o'rnatish",      linked: true  },
  { id: 2, name: "JS_Asoslari_Reja.pdf",          type: "pdf",    size: "1.2 MB", module: "Kirish va o'rnatish",      linked: true  },
  { id: 3, name: "O'zgaruvchilar_dars.scorm",     type: "scorm",  size: "18 MB",  module: "O'zgaruvchilar va turlar", linked: true  },
  { id: 4, name: "Funksiyalar_amaliyot.zip",      type: "file",   size: "5 MB",   module: "Funksiyalar",              linked: false },
  { id: 5, name: "DOM_interaktiv_dars.scorm",     type: "scorm",  size: "32 MB",  module: "DOM va Hodisalar",         linked: false },
];

const CONTENT_ICON: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  video: { icon: Video,    cls: "text-red-500",    label: "Video"  },
  pdf:   { icon: FileText, cls: "text-red-700",    label: "PDF"    },
  scorm: { icon: BookOpen, cls: "text-blue-600",   label: "SCORM"  },
  file:  { icon: FileText, cls: "text-slate-500",  label: "Fayl"   },
};

const TYPE_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  video: { icon: Video,    cls: "text-red-500"    },
  text:  { icon: FileText, cls: "text-blue-500"   },
  scorm: { icon: BookOpen, cls: "text-green-500"  },
};

export function TeacherCourseDetail({ defaultTab = "overview" }: { defaultTab?: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = COURSES_DATA[id ?? "1"] ?? COURSES_DATA["1"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/courses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Faol</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{course.subject} · {course.group} · {course.students} talaba</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="h-4 w-4" />Tahrirlash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Modullar",         value: MODULES.length,  cls: "text-blue-600"   },
          { label: "Darslar",          value: LESSONS.length,  cls: "text-green-600"  },
          { label: "Talabalar",        value: course.students, cls: "text-purple-600" },
          { label: "O'rtacha ball",    value: `${course.avgScore}%`, cls: "text-yellow-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="modules">Modullar</TabsTrigger>
          <TabsTrigger value="lessons">Darslar</TabsTrigger>
          <TabsTrigger value="contents">Kontent</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />Kurs jarayoni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Kurs to'ldirilganlik</span>
                <span className="font-semibold">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-3" />
              <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                  <div className="font-bold text-green-600 text-lg">{Math.round(course.students * 0.7)}</div>
                  <div className="text-muted-foreground">Faol talaba</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-2">
                  <div className="font-bold text-yellow-600 text-lg">{Math.round(course.students * 0.2)}</div>
                  <div className="text-muted-foreground">Kechikayotgan</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                  <div className="font-bold text-blue-600 text-lg">{Math.round(course.students * 0.1)}</div>
                  <div className="text-muted-foreground">A'lochi</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />Modul qo'shish
              </Button>
            </div>
            {MODULES.map((mod, i) => (
              <Card key={mod.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="flex items-center gap-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{mod.title}</div>
                    <div className="text-xs text-muted-foreground">{mod.lessons} dars · {mod.duration}</div>
                  </div>
                  <Badge className={mod.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                    {mod.status === "active" ? "Faol" : "Qoralama"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lessons */}
        <TabsContent value="lessons" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />Dars qo'shish
              </Button>
            </div>
            {LESSONS.map((lesson) => {
              const typeIcon = TYPE_ICON[lesson.type] ?? TYPE_ICON.text;
              const Icon = typeIcon.icon;
              return (
                <Card key={lesson.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                    <Icon className={`h-5 w-5 shrink-0 ${typeIcon.cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{lesson.title}</div>
                      <div className="text-xs text-muted-foreground">{lesson.module} · {lesson.duration}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Contents */}
        <TabsContent value="contents" className="mt-4">
          <div className="space-y-3">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LinkIcon className="h-4 w-4" />URL qo'shish
              </Button>
              <Button size="sm" className="gap-1.5">
                <Upload className="h-4 w-4" />Fayl yuklash
              </Button>
            </div>
            {CONTENTS.map((c) => {
              const meta = CONTENT_ICON[c.type] ?? CONTENT_ICON.file;
              const Icon = meta.icon;
              return (
                <Card key={c.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`h-5 w-5 shrink-0 ${meta.cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.module} · {c.size}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                      {c.linked
                        ? <Badge className="bg-green-100 text-green-800 text-xs">Ulangan</Badge>
                        : <Badge className="bg-slate-100 text-slate-600 text-xs">Ulanmagan</Badge>
                      }
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
