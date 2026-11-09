import { useNavigate } from "react-router-dom";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  ChevronDown,
  ClipboardCheck,
  Edit,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { CourseSyllabusPanel } from "@/components/course-syllabus-panel";
import { TopicTypeBadge } from "@/components/topic-type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { groupByUnit } from "@/lib/course-units";
import type {
  CourseContent,
  CourseModule,
  CourseUnit,
  TeacherCourse,
} from "@/services/api/teacher-portal-api";
import { ContentItemCard } from "./content-item-card";
import { NO_UNIT, type ConfirmFn } from "./shared";
import { Empty, Field, Loading } from "./shared-ui";
import type { ContentsTabController } from "./use-contents-tab";

/** "Darslar" tabi: kurs tuzilmasi (modul → dars → material), tayyor material biriktirish va darslar ro'yxati */
export function ContentsTab({
  course,
  courseId,
  units,
  modulesQuery,
  contentsQuery,
  controller,
  confirm,
  onPreviewContent,
}: {
  course: TeacherCourse;
  courseId: string;
  units: CourseUnit[];
  modulesQuery: UseQueryResult<CourseModule[]>;
  contentsQuery: UseQueryResult<CourseContent[]>;
  controller: ContentsTabController;
  confirm: ConfirmFn;
  onPreviewContent: (contentId: number) => void;
}) {
  const navigate = useNavigate();
  const {
    unitTitle,
    setUnitTitle,
    editingUnitId,
    setEditingUnitId,
    saveUnit,
    saveUnitMutation,
    unitStatusMutation,
    deleteUnitMutation,
    moduleTitle,
    setModuleTitle,
    editingModuleId,
    setEditingModuleId,
    moduleUnitId,
    setModuleUnitId,
    editingModuleLinked,
    saveModule,
    editModule,
    saveModuleMutation,
    moduleStatusMutation,
    deleteModuleMutation,
    bankModuleId,
    setBankModuleId,
    bankMaterialId,
    setBankMaterialId,
    subjectMaterialsQuery,
    attachMaterialMutation,
    lessonTests,
    refreshLearningItems,
    startNewLesson,
  } = controller;
  const modules = modulesQuery.data ?? [];
  const contents = contentsQuery.data ?? [];
  // Darslar raqami ko'rinish tartibida (modul -> dars), talaba ko'radigan tartib bilan bir xil
  const lessonGroups = groupByUnit(units, modules, (module) => module.unitId);
  const displayedLessons = lessonGroups.flatMap((group) => group.items);
  const subjectMaterials = (subjectMaterialsQuery.data ?? []).filter(
    (material) => material.subjectId === course.subjectId,
  );

  return (
    <TabsContent value="contents" className="mt-4 space-y-3">
      {(modulesQuery.isError || contentsQuery.isError) && <div role="alert" className="rounded-lg border border-destructive p-3">
        Darslar yoki bo'limlar yuklanmadi.
        <Button variant="outline" onClick={() => { void modulesQuery.refetch(); void contentsQuery.refetch(); }}>Qayta urinish</Button>
      </div>}
      {course?.syllabusId && <CourseSyllabusPanel courseId={courseId} onChanged={refreshLearningItems} />}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurs tuzilmasi: modul → dars → material</CardTitle>
          <CardDescription>
            {course?.syllabusId
              ? "Modullar va darslar o'quv dasturidan olinadi. Dasturda yo'q modul yoki dars kerak bo'lsa (masalan, takrorlash) shu yerda qo'shing, so'ng dars ichiga video, matn yoki fayl qo'shing."
              : "Avval modul va uning darslarini yarating, keyin dars ichiga video, matn yoki hujjat ko'rinishidagi materiallarni qo'shing."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Modul nomi"
              value={unitTitle}
              onChange={(event) => setUnitTitle(event.target.value)}
              placeholder="Modul nomi, masalan: Takrorlash"
            />
            <Button variant="outline" onClick={saveUnit} disabled={saveUnitMutation.isPending} className="gap-2 sm:shrink-0">
              {saveUnitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              {editingUnitId ? "Modulni yangilash" : "Modul qo'shish"}
            </Button>
            {editingUnitId && (
              <Button variant="ghost" onClick={() => { setEditingUnitId(null); setUnitTitle(""); }}>Bekor qilish</Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Dars nomi"
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              placeholder="Dars nomi, masalan: 1-mavzu. Kirish"
            />
            {units.length > 0 && !editingModuleLinked && (
              <Select value={moduleUnitId} onValueChange={setModuleUnitId}>
                <SelectTrigger className="sm:w-64" aria-label="Dars moduli"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_UNIT}>Modulsiz</SelectItem>
                  {units.map((unit) => <SelectItem key={unit.id} value={String(unit.id)}>{unit.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={saveModule}
              disabled={saveModuleMutation.isPending}
              className="gap-2 sm:shrink-0"
            >
              {saveModuleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingModuleId ? "Darsni yangilash" : "Dars qo'shish"}
            </Button>
            {editingModuleId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingModuleId(null);
                  setModuleTitle("");
                  setModuleUnitId(NO_UNIT);
                }}
              >
                Bekor qilish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tayyor materialni biriktirish
          </CardTitle>
          <CardDescription>
            Fan kutubxonasidagi materialni dars ichiga biriktiring.
            Fayl qayta yuklanmaydi.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
          <Field label="Dars *">
            <Select value={bankModuleId} onValueChange={setBankModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Darsni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={String(module.id)}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fan materiali *">
            <Select
              value={bankMaterialId}
              onValueChange={setBankMaterialId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Materialni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {subjectMaterials.map((material) => (
                  <SelectItem
                    key={material.id}
                    value={String(material.id)}
                  >
                    {material.title} · {material.contentType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            className="gap-2"
            disabled={
              !bankModuleId ||
              !bankMaterialId ||
              attachMaterialMutation.isPending
            }
            onClick={() => attachMaterialMutation.mutate()}
          >
            {attachMaterialMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Biriktirish
          </Button>
          {subjectMaterialsQuery.isError && (
            <div role="alert" className="md:col-span-3 flex flex-wrap items-center gap-2 text-sm text-destructive">
              Fan materiallarini yuklab bo'lmadi.
              <Button variant="outline" size="sm" onClick={() => void subjectMaterialsQuery.refetch()}>Qayta urinish</Button>
            </div>
          )}
          {!subjectMaterialsQuery.isLoading && !subjectMaterialsQuery.isError &&
            subjectMaterials.length === 0 && (
              <p className="md:col-span-3 text-sm text-muted-foreground">
                Bu fan uchun material yo'q. Avval “Fan materiallari”
                bo'limida material yarating.
              </p>
            )}
        </CardContent>
      </Card>
      {(modulesQuery.isLoading || contentsQuery.isLoading) && <Loading />}
      {!modulesQuery.isLoading && !modulesQuery.isError && modules.length === 0 && (
        <Empty text="Material qo'shish uchun avval dars yarating" />
      )}
      {lessonGroups.map((group, groupIndex) => (
        <section key={group.unit?.id ?? `loose-${groupIndex}`} className="space-y-3" aria-label={group.title ?? undefined}>
          {group.title && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{group.title}</h3>
              <span className="text-xs text-muted-foreground">{group.items.length} ta dars</span>
              {group.unit?.syllabusModuleId && <Badge variant="outline">O'quv dasturidan</Badge>}
              {group.unit && (
                <div className="ml-auto flex flex-wrap items-center gap-1">
                  {group.items.length > 0 && (() => {
                    const allPublished = group.items.every((item) => item.status === "published");
                    return (
                      <Button variant="outline" size="sm" disabled={unitStatusMutation.isPending}
                        onClick={() => unitStatusMutation.mutate({ unitId: group.unit!.id, status: allPublished ? "DRAFT" : "PUBLISHED" })}>
                        {allPublished ? "Modulni yashirish" : "Modulni nashr qilish"}
                      </Button>
                    );
                  })()}
                  {!group.unit.syllabusModuleId && <>
                    <Button variant="ghost" size="icon" aria-label={`${group.unit.title} modulini tahrirlash`}
                      onClick={() => { setEditingUnitId(group.unit!.id); setUnitTitle(group.unit!.title); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" aria-label={`${group.unit.title} modulini o'chirish`}
                      disabled={deleteUnitMutation.isPending}
                      onClick={async () => {
                        if (await confirm({ title: `“${group.unit!.title}” moduli o'chirilsinmi?`, description: "Darslari va materiallari saqlanadi.", confirmLabel: "O'chirish" }))
                          deleteUnitMutation.mutate(group.unit!.id);
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>}
                </div>
              )}
            </div>
          )}
          {group.unit && group.items.length === 0 && (
            <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
              Bu modulda dars yo'q. Yuqoridagi formada dars qo'shib, "{group.unit.title}" modulini tanlang.
            </p>
          )}
      {group.items.map((module) => {
        const sectionIndex = displayedLessons.indexOf(module);
        const sectionLessons = contents.filter(
          (content) => content.moduleId === module.id,
        );
        return (
          <Collapsible key={module.id} defaultOpen>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {sectionIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      {module.topicType && <TopicTypeBadge type={module.topicType} hours={module.plannedHours} />}
                      <span>{sectionLessons.length} ta material</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      module.status === "published" ? "default" : "secondary"
                    }
                  >
                    {module.status === "published" ? "Nashrda" : "Qoralama"}
                  </Badge>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => startNewLesson(module.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Material qo'shish
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Darsni tahrirlash"
                    onClick={() => editModule(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      moduleStatusMutation.mutate({
                        moduleId: module.id,
                        status:
                          module.status === "published" ? "DRAFT" : "PUBLISHED",
                      })
                    }
                  >
                    {module.status === "published" ? "Yashirish" : "Nashr"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Darsni o'chirish"
                    className="text-destructive"
                    disabled={deleteModuleMutation.isPending}
                    onClick={async () => {
                      if (await confirm({ title: `“${module.title}” darsi va undagi barcha materiallar o‘chirilsinmi?`, confirmLabel: "O'chirish" }))
                        deleteModuleMutation.mutate(module.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Darsni ochish yoki yopish">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
            <CardContent className="space-y-2 p-3 sm:p-4">
              {sectionLessons.length === 0 && (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Bu darsda material yo'q. “Material qo'shish” tugmasini bosing.
                </div>
              )}
              {sectionLessons.map((content, contentIndex) => (
                <ContentItemCard
                  key={content.id}
                  module={module}
                  content={content}
                  contentIndex={contentIndex}
                  sectionLessons={sectionLessons}
                  controller={controller}
                  confirm={confirm}
                  onPreviewContent={onPreviewContent}
                />
              ))}
              {lessonTests(module.id).map((test) => (
                <div key={test.id} role="group" aria-label={`Dars testi: ${test.title}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{test.title}</span>
                  <span className="text-xs text-muted-foreground">{test.questions} ta savol · {test.duration} daqiqa</span>
                  {test.fromSyllabus && <Badge variant="outline">O'quv dasturidan</Badge>}
                  <Badge variant={test.status === "draft" ? "secondary" : "default"}>{test.status === "draft" ? "Qoralama" : "Nashrda"}</Badge>
                  <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={() => navigate("/teacher/tests")}>Testlar sahifasida ochish</Button>
                </div>
              ))}
            </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>
        );
      })}
        </section>
      ))}
    </TabsContent>
  );
}
