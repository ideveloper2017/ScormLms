import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TopicTypeBadge } from "@/components/topic-type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi, type CourseSyllabusTopic } from "@/services/api/teacher-portal-api";

/**
 * Kurs bo'limlarini o'quv dasturi mavzulariga moslash: mavzudan bo'lim qo'shish va dastur bilan sinxronlash.
 * Mavzular ro'yxati o'quv dasturi bo'limida kiritiladi; bu yerda ularning mazmuni (darslar) to'ldiriladi.
 */
export function CourseSyllabusPanel({ courseId, onChanged }: { courseId: string; onChanged: () => unknown }) {
  const { toast } = useToast();
  const statusQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "syllabus"],
    queryFn: () => teacherPortalApi.getCourseSyllabus(courseId),
  });
  const fail = (title: string) => (error: unknown) =>
    toast({ variant: "destructive", title, description: error instanceof Error ? error.message : undefined });

  const addTopic = useMutation({
    mutationFn: (topic: CourseSyllabusTopic) =>
      teacherPortalApi.createModule(courseId, { title: topic.title.slice(0, 255), syllabusTopicId: topic.topicId }),
    onSuccess: async (_, topic) => {
      await Promise.all([statusQuery.refetch(), onChanged()]);
      toast({ title: "Mavzu bo'lim sifatida qo'shildi", description: topic.title });
    },
    onError: fail("Mavzu qo'shilmadi"),
  });
  const sync = useMutation({
    mutationFn: () => teacherPortalApi.syncCourseSyllabus(courseId),
    onSuccess: async (result) => {
      await Promise.all([statusQuery.refetch(), onChanged()]);
      toast({
        title: "Kurs dastur bilan moslandi",
        description: `${result.added} ta yangi bo'lim qo'shildi, ${result.updated} ta bo'lim yangilandi`,
      });
    },
    onError: fail("Sinxronlanmadi"),
  });

  if (statusQuery.isLoading) return null;
  if (statusQuery.isError || !statusQuery.data) {
    return (
      <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
        O'quv dasturi mavzulari yuklanmadi.{" "}
        <Button variant="outline" size="sm" onClick={() => void statusQuery.refetch()}>Qayta urinish</Button>
      </div>
    );
  }

  const status = statusQuery.data;
  const busy = addTopic.isPending || sync.isPending;
  const approved = status.syllabusStatus === "APPROVED";
  const newRevision = status.courseSyllabusRevision != null && status.courseSyllabusRevision !== status.syllabusRevision;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">O'quv dasturi mavzulari</CardTitle>
          <CardDescription>
            {status.syllabusName} · {status.syllabusRevision}-versiya. Har bir mavzu kursda bo'lim bo'ladi —
            darslar va materiallarni shu bo'limlar ichiga qo'shing.
          </CardDescription>
        </div>
        {status.pendingCount > 0 ? (
          <Button onClick={() => sync.mutate()} disabled={busy || !approved} className="gap-2 sm:shrink-0"
            title={approved ? undefined : "Dasturning yangi versiyasi hali tasdiqlanmagan"}>
            {sync.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Dastur bilan sinxronlash ({status.pendingCount})
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />Kurs dastur bilan mos
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {(newRevision || !approved) && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            {!approved
              ? "Dasturning yangi versiyasi tayyorlanmoqda — tasdiqlangandan keyin sinxronlash mumkin."
              : `Kurs dasturning ${status.courseSyllabusRevision}-versiyasi asosida yaratilgan, hozirgi versiya — ${status.syllabusRevision}.`}
          </p>
        )}
        {status.topics.length === 0 && <p className="text-sm text-muted-foreground">Dasturda mavzular kiritilmagan.</p>}
        <ul className="divide-y rounded-md border">
          {status.topics.map((topic) => (
            <li key={topic.topicId} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <TopicTypeBadge type={topic.type} hours={topic.hours} />
              <span className="min-w-0 flex-1">{topic.sortOrder}. {topic.title}</span>
              {topic.moduleId == null ? (
                <Button size="sm" variant="outline" className="h-7 gap-1" disabled={busy}
                  onClick={() => addTopic.mutate(topic)} aria-label={`${topic.title} — bo'lim qilib qo'shish`}>
                  <Plus className="h-3 w-3" />Bo'lim qilib qo'shish
                </Button>
              ) : topic.outdated ? (
                <Badge variant="secondary">Dasturda o'zgargan</Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />Qo'shilgan
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
