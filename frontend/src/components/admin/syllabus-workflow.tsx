import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";
import { extractApiError } from "@/lib/academic-api";

export const syllabusStatuses = { DRAFT: "Qoralama", IN_REVIEW: "Tekshiruvda", APPROVED: "Tasdiqlangan" };
function Content({ item }: { item: SubjectSyllabus }) {
  return <div className="space-y-3 text-sm"><p>{item.subjectName} · {item.language}</p><p className="whitespace-pre-wrap">{item.shortDescription}</p>{item.requirements && <div><b>Talablar</b><p className="whitespace-pre-wrap">{item.requirements}</p></div>}<div><b>To‘liq mazmun</b><p className="whitespace-pre-wrap">{item.fullDescription}</p></div></div>;
}
export function SyllabusWorkflow({ item, canWrite, reload, close }: { item: SubjectSyllabus; canWrite: boolean; reload: () => void; close: () => void }) {
  const history = useQuery({ queryKey: ["syllabus-history", item.id], queryFn: () => syllabusApi.history(item.id) });
  const mutation = useMutation({ mutationFn: (action: Parameters<typeof syllabusApi.workflow>[1]) => syllabusApi.workflow(item.id, action),
    onSuccess: async () => { reload(); await history.refetch(); close(); } });
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) close(); }}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>{item.name}</DialogTitle><DialogDescription>{item.revisionNumber}-versiya · {syllabusStatuses[item.status]}. Tasdiqlangan nusxalar tarixda saqlanadi.</DialogDescription></DialogHeader>
    <Content item={item} />
    {canWrite && <div className="flex flex-wrap gap-2">
      {item.status === "DRAFT" && <Button disabled={mutation.isPending || !item.active} onClick={() => mutation.mutate("SUBMIT")}>Tekshiruvga yuborish</Button>}
      {item.status === "IN_REVIEW" && <><Button disabled={mutation.isPending} onClick={() => mutation.mutate("APPROVE")}>Versiyani tasdiqlash</Button><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate("RETURN")}>Tahrirga qaytarish</Button></>}
      {item.status === "APPROVED" && <Button disabled={mutation.isPending} onClick={() => mutation.mutate("NEW_VERSION")}>Yangi versiya ochish</Button>}
    </div>}
    {mutation.isError && <p role="alert" className="text-destructive">{extractApiError(mutation.error, "Amal bajarilmadi").message}</p>}
    <div className="space-y-2 border-t pt-4"><b>Tasdiqlangan versiyalar</b>
      {history.isLoading && <p>Tarix yuklanmoqda...</p>}
      {history.isError && <div role="alert">Tarix yuklanmadi. <Button variant="outline" onClick={() => history.refetch()}>Qayta urinish</Button></div>}
      {!history.isLoading && !history.isError && !history.data?.length && <p className="text-sm text-muted-foreground">Hali tasdiqlangan versiya yo‘q.</p>}
      {history.data?.map(version => <details key={version.revisionNumber} className="rounded border p-3"><summary className="cursor-pointer">{version.revisionNumber}-versiya · {version.approvedByName} · {new Date(version.approvedAt).toLocaleString("uz-Latn")}</summary><div className="pt-3"><h3 className="font-medium">{version.content.name}</h3><Content item={version.content} /></div></details>)}
    </div>
  </DialogContent></Dialog>;
}
