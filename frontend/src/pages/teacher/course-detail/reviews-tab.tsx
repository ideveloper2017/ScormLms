import type { UseQueryResult } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import type { CourseContent } from "@/services/api/teacher-portal-api";
import { Loading, SettingsCard } from "./shared-ui";

/** "Tasdiqlash holati" tabi: har bir materialning ekspertiza va nashr holati */
export function ReviewsTab({
  contentsQuery,
  setHistoryContent,
}: {
  contentsQuery: UseQueryResult<CourseContent[]>;
  setHistoryContent: (content: CourseContent) => void;
}) {
  const contents = contentsQuery.data ?? [];
  return (
    <TabsContent value="reviews" className="mt-0">
      <SettingsCard title="Kontentni tasdiqlash holati" description="Har bir darsning joriy ekspertiza va nashr holati.">
        {contentsQuery.isPending && <Loading />}
        {contentsQuery.isError && <p role="alert">{contentsQuery.error.message}</p>}
        {!contentsQuery.isPending && !contentsQuery.isError && contents.length === 0 && <p>Tekshirish uchun hali dars qo'shilmagan.</p>}
        {contents.map(content => <div key={content.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
          <div><p className="font-medium">{content.title}</p><p className="text-sm text-muted-foreground">{content.moduleTitle} · v{content.contentVersion}</p></div>
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{{ draft: 'Qoralama', in_review: 'Ekspertizada', approved: 'Tasdiqlangan', changes_requested: 'Tuzatish so‘ralgan' }[content.reviewStatus]}</Badge><Badge variant="secondary">{content.status === 'published' ? 'Nashrda' : 'Nashr qilinmagan'}</Badge><Button variant="outline" onClick={() => setHistoryContent(content)}>Ekspertiza tarixi</Button></div>
        </div>)}
      </SettingsCard>
    </TabsContent>
  );
}
