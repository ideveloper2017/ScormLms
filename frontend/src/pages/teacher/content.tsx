import { useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Download,
  ExternalLink,
  File,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScormPackageManager } from "@/components/scorm/package-manager";
import { useToast } from "@/hooks/use-toast";
import {
  teacherPortalApi,
  type CourseContent,
  type TeacherCourse,
} from "@/services/api/teacher-portal-api";

type LibraryItem = CourseContent & { course: TeacherCourse };

const TYPE_META: Record<
  CourseContent["contentType"],
  { label: string; icon: ElementType; className: string }
> = {
  video: { label: "Video", icon: Video, className: "text-red-500" },
  document: { label: "Hujjat", icon: FileText, className: "text-red-700" },
  file: { label: "Fayl", icon: File, className: "text-slate-500" },
  link: { label: "Havola", icon: LinkIcon, className: "text-blue-600" },
  text: { label: "Matn", icon: FileText, className: "text-emerald-600" },
};

export function TeacherContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [tab, setTab] = useState("all");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const libraryQuery = useQuery({
    queryKey: ["teacher", "content-library"],
    queryFn: async () => {
      const courses = await teacherPortalApi.getCourses();
      const lists = await Promise.all(
        courses.map(async (course) => {
          const contents = await teacherPortalApi.getContents(course.id);
          return contents.map((content): LibraryItem => ({
            ...content,
            course,
          }));
        }),
      );
      return { courses, items: lists.flat() };
    },
  });

  const courses = libraryQuery.data?.courses ?? [];
  const items = libraryQuery.data?.items ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = items.filter(
    (item) =>
      (courseId === "all" || item.course.id === courseId) &&
      (tab === "all" || item.contentType === tab) &&
      (!normalizedSearch ||
        [
          item.title,
          item.course.title,
          item.moduleTitle,
          item.asset?.originalFileName,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch))),
  );

  async function download(item: LibraryItem) {
    if (!item.asset) return;
    setDownloadingId(item.id);
    try {
      const blob = await teacherPortalApi.downloadContentFile(
        item.course.id,
        item.id,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.asset.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast({
        variant: "destructive",
        title: "Fayl yuklab olinmadi",
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Kontent kutubxonasi
          </h1>
          <p className="text-muted-foreground">
            Kurslarga joylangan real video, matn, hujjat, fayl va havolalar
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={!courses.length}
          onClick={() =>
            navigate(
              `/teacher/courses/${courseId === "all" ? courses[0]?.id : courseId}/contents`,
            )
          }
        >
          <Plus className="h-4 w-4" />
          Kursga material qo'shish
        </Button>
      </div>

      <ScormPackageManager />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["all", "video", "document", "file", "text"] as const).map((type) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                {type === "all" ? "Jami" : TYPE_META[type].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {type === "all"
                  ? items.length
                  : items.filter((item) => item.contentType === type).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Kontent, kurs yoki modul nomi..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kurslar</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <TabsTrigger key={type} value={type}>
                {meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {libraryQuery.isLoading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {libraryQuery.error && (
            <p className="py-8 text-center text-destructive">
              {libraryQuery.error.message}
            </p>
          )}
          {!libraryQuery.isLoading && !filtered.length && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-9 w-9 mx-auto mb-2 opacity-50" />
                Material topilmadi
              </CardContent>
            </Card>
          )}
          {filtered.map((item) => {
            const meta = TYPE_META[item.contentType];
            const Icon = meta.icon;
            return (
              <Card key={`${item.course.id}-${item.id}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className={`h-5 w-5 ${meta.className}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.course.title} · {item.moduleTitle} · v
                      {item.contentVersion}
                      {item.asset
                        ? ` · ${formatBytes(item.asset.sizeBytes)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{meta.label}</Badge>
                    <Badge
                      variant={
                        item.status === "published" ? "default" : "secondary"
                      }
                    >
                      {item.status === "published" ? "Nashrda" : "Qoralama"}
                    </Badge>
                    {item.asset && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={downloadingId === item.id}
                        onClick={() => void download(item)}
                      >
                        {downloadingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Yuklash
                      </Button>
                    )}
                    {item.contentUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={item.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/teacher/courses/${item.course.id}/contents`)
                      }
                    >
                      Boshqarish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
