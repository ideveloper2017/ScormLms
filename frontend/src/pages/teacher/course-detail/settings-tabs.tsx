import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { teacherPortalApi, type TeacherCourse } from "@/services/api/teacher-portal-api";
import { Loading, SettingsCard, Summary } from "./shared-ui";

/** "Dars jadvali" tabi */
export function ScheduleTab({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  return (
    <TabsContent value="live" className="mt-0">
      <SettingsCard title="Dars jadvali" description="Kurs uchun jonli darslar jadvali va videokonferensiya havolalari shu bo'limda boshqariladi.">
        <p className="text-sm text-muted-foreground">Jonli darsni qo'shish uchun kurs jadvalidagi videokonferensiya modulidan foydalaning.</p>
        <Button onClick={() => navigate(`/teacher/sessions?courseId=${encodeURIComponent(courseId)}`)}>Dars jadvalini ochish</Button>
      </SettingsCard>
    </TabsContent>
  );
}

/** "Topshiriqlar" tabi */
export function AssignmentsTab({ course, courseId }: { course: TeacherCourse; courseId: string }) {
  const navigate = useNavigate();
  return (
    <TabsContent value="assignment" className="mt-0">
      <SettingsCard title="Topshiriqlar" description="Kurs topshiriqlarini yaratish va tekshirish.">
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate(`/teacher/assignments?courseId=${encodeURIComponent(courseId)}`)}>Kurs topshiriqlari</Button><Button disabled={course.status === 'archived'} onClick={() => navigate(`/teacher/assignments/create?courseId=${encodeURIComponent(courseId)}`)}><Plus className="mr-2 h-4 w-4" />Topshiriq yaratish</Button></div>
      </SettingsCard>
    </TabsContent>
  );
}

/** "Amal qilish muddati" tabi */
export function DurationTab({ course }: { course: TeacherCourse }) {
  return (
    <TabsContent value="duration" className="mt-0">
      <SettingsCard title="Amal qilish muddati" description="Kursning boshlanish va tugash sanalari.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Summary label="Boshlanish sanasi" value={course.startDate || "Belgilanmagan"} />
          <Summary label="Tugash sanasi" value={course.endDate || "Belgilanmagan"} />
          <Summary label="Amal qilish" value={course.expiryPeriodType === "limited_time" ? "Cheklangan" : "Doimiy"} />
        </div>
      </SettingsCard>
    </TabsContent>
  );
}

/** "Akademik ma'lumotlar" tabi */
export function AcademicInfoTab({ course }: { course: TeacherCourse }) {
  return (
    <TabsContent value="info" className="mt-0">
      <SettingsCard title="Akademik ma'lumotlar" description="Kursning akademik va katalog ma'lumotlari.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Summary label="Kategoriya" value={course.categoryName || "—"} />
          <Summary label="Fan" value={course.subjectName || "—"} />
          <Summary label="Dastur" value={course.programName || "—"} />
          <Summary label="Fan guruhi" value={course.groupName || "—"} />
          <Summary label="Til" value={(course.language || "—").toUpperCase()} />
          <Summary label="Daraja" value={course.level || "—"} />
          <Summary label="Drip content" value={course.dripContent ? "Yoqilgan" : "O'chirilgan"} />
          <Summary label="Davr" value={`${course.startDate || "—"} — ${course.endDate || "cheklanmagan"}`} />
        </div>
      </SettingsCard>
    </TabsContent>
  );
}

/** "Kurs rasmi" tabi */
export function MediaTab({ course, courseId }: { course: TeacherCourse; courseId: string }) {
  return (
    <TabsContent value="media" className="mt-0">
      <SettingsCard title="Kurs rasmi" description="Kurs uchun yuklangan rasm.">
        {course.thumbnailAvailable ? <CourseThumbnail courseId={courseId} title={course.title} /> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Kurs rasmi yuklanmagan</div>}
      </SettingsCard>
    </TabsContent>
  );
}

/** "Qidiruv ma'lumotlari" tabi */
export function SeoTab({ course }: { course: TeacherCourse }) {
  return (
    <TabsContent value="seo" className="mt-0">
      <SettingsCard title="Qidiruv ma'lumotlari" description="Qidiruv tizimlari uchun kurs metadata ma'lumotlari.">
        <div className="space-y-3">
          <Summary label="Kalit so'zlar" value={course.metaKeywords || "Kiritilmagan"} />
          <Summary label="Meta tavsif" value={course.metaDescription || "Kiritilmagan"} />
        </div>
      </SettingsCard>
    </TabsContent>
  );
}

function CourseThumbnail({ courseId, title }: { courseId: string; title: string }) {
  const thumbnailQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "thumbnail"],
    queryFn: () => teacherPortalApi.downloadCourseThumbnail(courseId),
  });
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!thumbnailQuery.data) return;
    const objectUrl = URL.createObjectURL(thumbnailQuery.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailQuery.data]);

  if (thumbnailQuery.isLoading) return <Loading />;
  if (thumbnailQuery.error) return <p className="text-sm text-destructive">Kurs rasmi yuklanmadi</p>;
  return url ? <img src={url} alt={title} className="max-h-80 w-full rounded-xl border object-cover" /> : null;
}
