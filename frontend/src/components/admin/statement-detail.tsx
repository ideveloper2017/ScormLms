import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStatement, completeStatement } from "@/services/api/academic-results-api";
import { downloadCsv } from "@/utils/csv-export";

const attendanceNames: Record<string, string> = { EXPECTED: "Kutilmoqda", PRESENT: "Qatnashdi", LATE: "Kechikdi", ABSENT: "Kelmagan", EXCUSE: "Sabab tekshirilmoqda", EXCUSED: "Uzrli" };
export function StatementDetails({ id, canWrite, close }: { id: number; canWrite: boolean; close: () => void }) {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const query = useQuery({ queryKey: ["statement-detail", id], queryFn: () => getStatement(id) });
  const mutation = useMutation({ mutationFn: () => completeStatement(id), onSuccess: async (result) => {
    client.setQueryData(["statement-detail", id], result);
    await Promise.all([client.invalidateQueries({ queryKey: ["academic-statements"] }), client.invalidateQueries({ queryKey: ["student-academic-results"] })]);
  } });
  const item = query.data;
  const rows = item?.students.filter(row => `${row.fullName} ${row.studentNumber}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) close(); }}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>{item?.title ?? "Vedomost"}</DialogTitle><DialogDescription>Talabalar davomati va baholarini tekshiring. Yakunlangandan keyin oddiy baho tahriri yopiladi; o‘zgartirishlar apellyatsiya orqali amalga oshiriladi.</DialogDescription></DialogHeader>
    {query.isLoading && <p>Yuklanmoqda...</p>}
    {query.isError && <div role="alert">{query.error.message} <Button onClick={() => query.refetch()}>Qayta urinish</Button></div>}
    {item && <>
      <div className="flex flex-wrap gap-3"><Input className="max-w-sm" aria-label="Vedomostdan talaba qidirish" placeholder="Ism yoki talaba raqami" value={search} onChange={e => setSearch(e.target.value)} /><Button variant="outline" onClick={() => downloadCsv(`vedomost-${id}.csv`, ["F.I.O.", "Talaba raqami", "Davomat", "Ball", "Maksimum", "Foiz", "O‘tish foizi", "Natija"], rows.map(r => [r.fullName, r.studentNumber, attendanceNames[r.attendance] ?? r.attendance, r.score, r.maximum, r.percentage, r.passingPercentage, r.passed == null ? "Baholanmagan" : r.passed ? "O‘tdi" : "O‘tmadi"]))}>CSV yuklash</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["Talaba", "Davomat", "Ball", "O‘tish chegarasi", "Natija"].map(x => <th key={x} className="p-2 text-left">{x}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.enrollmentId} className="border-t"><td className="p-2">{r.fullName}<div className="text-xs text-muted-foreground">{r.studentNumber}</div></td><td className="p-2">{attendanceNames[r.attendance] ?? r.attendance}{r.verified && " · Tasdiqlangan"}</td><td className="p-2">{r.score == null ? "Kiritilmagan" : `${r.score}/${r.maximum} (${r.percentage}%)`}</td><td className="p-2">{r.passingPercentage.toFixed(2)}%</td><td className="p-2">{r.passed == null ? "Baholanmagan" : r.passed ? "O‘tdi" : "O‘tmadi"}{r.comments && <p className="text-muted-foreground">{r.comments}</p>}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-4 text-center">Talabalar topilmadi</p>}</div>
      {item.status === "COMPLETED" ? <p className="text-emerald-700">Vedomost yakunlangan.</p> : <>
        {item.completionProblems.map(problem => <p key={problem} className="text-sm text-amber-700">{problem}</p>)}
        {canWrite && <><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={mutation.isPending || item.completionProblems.length > 0} onChange={e => setConfirmed(e.target.checked)} />Davomat va baholarni tekshirdim</label><Button disabled={!confirmed || mutation.isPending || item.completionProblems.length > 0} onClick={() => mutation.mutate()}>Tasdiqlab yakunlash</Button></>}
      </>}
    </>}
    {mutation.isError && <p role="alert" className="text-destructive">{mutation.error.message}</p>}
  </DialogContent></Dialog>;
}
