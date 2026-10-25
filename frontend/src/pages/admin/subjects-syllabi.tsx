import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { NotebookText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrudData } from "@/components/admin/crud-section";
import { AdminSubjects, type SyllabusSummary } from "@/pages/admin/subjects";
import { AdminSyllabi } from "@/pages/admin/syllabi";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

type Tab = "subjects" | "syllabi";

/**
 * Fanlar va ularning o'quv dasturlari (fan dasturlari) bitta bo'limda:
 * fan qatoridan to'g'ridan-to'g'ri uning dasturlariga o'tiladi.
 */
export function AdminSubjectsAndSyllabi({ defaultTab = "subjects" }: { defaultTab?: Tab }) {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "syllabi" || params.get("tab") === "subjects" ? (params.get("tab") as Tab) : defaultTab;
  const subjectId = Number(params.get("subjectId")) || null;
  // AdminSyllabi bilan bir xil kesh kaliti — ro'yxat bir marta yuklanadi
  const syllabi = useCrudData<SubjectSyllabus>(["syllabi"], () => syllabusApi.list());

  const summaries = useMemo(() => {
    const map = new Map<number, SyllabusSummary>();
    for (const s of syllabi.items) {
      const current = map.get(s.subjectId) ?? { total: 0, approved: 0 };
      map.set(s.subjectId, { total: current.total + 1, approved: current.approved + (s.status === "APPROVED" ? 1 : 0) });
    }
    return map;
  }, [syllabi.items]);

  const go = (next: Tab, nextSubjectId: number | null = null) => {
    const value = new URLSearchParams();
    value.set("tab", next);
    if (nextSubjectId) value.set("subjectId", String(nextSubjectId));
    setParams(value, { replace: true });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
          <NotebookText className="h-3.5 w-3.5" />
          <span className="text-xs">Ta'lim jarayoni</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fanlar va o'quv dasturlari</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Fanlar, kredit soatlari va har bir fanning nazariy/amaliy mavzulari bilan o'quv dasturi
        </p>
      </div>
      <Tabs value={tab} onValueChange={(v) => go(v as Tab, v === "syllabi" ? subjectId : null)}>
        <TabsList>
          <TabsTrigger value="subjects">Fanlar</TabsTrigger>
          <TabsTrigger value="syllabi">
            O'quv dasturlari
            {syllabi.items.length > 0 && <Badge variant="secondary" className="ml-2">{syllabi.items.length}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="subjects" className="mt-4">
          <AdminSubjects embedded syllabusSummaries={summaries} onOpenSyllabi={(id) => go("syllabi", id)} />
        </TabsContent>
        <TabsContent value="syllabi" className="mt-4">
          <AdminSyllabi embedded subjectId={subjectId} onClearSubject={() => go("syllabi")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
