import { BarChart3 } from "lucide-react";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import type { CourseContent, TeacherCourse } from "@/services/api/teacher-portal-api";

/** "Asosiy ma'lumotlar" tabi: kurs tavsifi va kontent tayyorligi */
export function OverviewTab({
  course,
  contents,
}: {
  course: TeacherCourse;
  contents: CourseContent[];
}) {
  return (
    <TabsContent value="overview" className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Kurs holati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.syllabusName && (
            <p className="text-sm">
              <span className="text-muted-foreground">O'quv dasturi: </span>
              <span className="font-medium">{course.syllabusName}</span>
              {course.syllabusRevision ? <span className="text-muted-foreground"> · {course.syllabusRevision}-versiya</span> : null}
            </p>
          )}
          <RichTextContent value={course.description || "Kurs tavsifi kiritilmagan"} className="text-sm" />
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Kontent tayyorligi</span>
              <span>
                {contents.length
                  ? Math.round(
                      (contents.filter(
                        (item) => item.status === "published",
                      ).length /
                        contents.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <Progress
              value={
                contents.length
                  ? (contents.filter((item) => item.status === "published")
                      .length /
                      contents.length) *
                    100
                  : 0
              }
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
