import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, FileCheck2, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  DECISION_559_REQUIRED_BANDS,
  decision559UatApi,
  type Decision559UatEvidence,
  type Decision559UatManualEvidenceProgressItem,
  type Decision559UatRequirementGuidance,
  type DownloadedUatFile,
  type UatOutcome,
  type UatRunStatus,
} from "@/services/api/decision-559-uat-api";

const runLabel: Record<UatRunStatus, string> = {
  DRAFT: "Dalil yig'ilmoqda",
  IN_REVIEW: "Yakuniy reviewda",
  APPROVED: "Qabul qilingan",
  REJECTED: "Qayta ishlashga qaytarilgan",
};
const outcomeLabel: Record<UatOutcome, string> = {
  AUTOMATED_PASS: "Avtomatik test o'tdi",
  MANUAL_PASS: "Qo'lda tekshirildi",
  NOT_APPLICABLE: "Tatbiq etilmaydi",
  PARTIAL: "Qisman",
  BLOCKED_EXTERNAL: "Tashqi dalil kutilmoqda",
};

export function Decision559UatPanel() {
  const { user } = useAuth();
  const canRead = hasAuthority(user, "UAT_READ");
  const canWrite = hasAuthority(user, "UAT_WRITE");
  const canApprove = hasAuthority(user, "UAT_APPROVE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<number>();
  const [newRunTitle, setNewRunTitle] = useState("559-son qaror yakuniy UAT qabuli");
  const [band, setBand] = useState(3);
  const [outcome, setOutcome] = useState<UatOutcome>("BLOCKED_EXTERNAL");
  const [ownerName, setOwnerName] = useState("");
  const [summary, setSummary] = useState("");
  const [reference, setReference] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [manualEvidenceIndexes, setManualEvidenceIndexes] = useState<number[]>([]);
  const [reviewNotes, setReviewNotes] = useState("Dalil rekviziti va mazmuni mustaqil tekshirildi");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [signedDate, setSignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [signatories, setSignatories] = useState("");
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [coordinationItem, setCoordinationItem] = useState<Decision559UatManualEvidenceProgressItem>();
  const [coordinationAssigneeName, setCoordinationAssigneeName] = useState("");
  const [coordinationDueDate, setCoordinationDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [coordinationNote, setCoordinationNote] = useState("");
  const [bulkCoordinationDueDate, setBulkCoordinationDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [bulkCoordinationNote, setBulkCoordinationNote] = useState(
    "Tavsiya etilgan mas'ul bo'lim hujjatni belgilangan muddatda taqdim etadi",
  );

  const requirements = useQuery({ queryKey: ["decision-559-uat", "requirements"], queryFn: decision559UatApi.requirements, enabled: canRead });
  const runs = useQuery({ queryKey: ["decision-559-uat", "runs"], queryFn: decision559UatApi.list, enabled: canRead });
  useEffect(() => {
    if (!selectedRunId && runs.data?.length) setSelectedRunId(runs.data[0].id);
  }, [runs.data, selectedRunId]);
  useEffect(() => {
    setCoordinationItem(undefined);
  }, [selectedRunId]);
  const detail = useQuery({
    queryKey: ["decision-559-uat", "detail", selectedRunId],
    queryFn: () => decision559UatApi.detail(selectedRunId!),
    enabled: canRead && selectedRunId != null,
  });
  const manualProgress = useQuery({
    queryKey: ["decision-559-uat", "manual-evidence-progress", selectedRunId],
    queryFn: () => decision559UatApi.manualEvidenceProgress(selectedRunId!),
    enabled: canRead && selectedRunId != null && (detail.data?.run.manifestSchemaVersion ?? 0) >= 5,
  });
  const refresh = async () => client.invalidateQueries({ queryKey: ["decision-559-uat"] });
  const errorToast = (title: string) => (error: Error) => toast({ variant: "destructive", title, description: error.message });

  const createRun = useMutation({
    mutationFn: () => decision559UatApi.create(newRunTitle),
    onSuccess: async created => { setSelectedRunId(created.id); await refresh(); toast({ title: `UAT run #${created.id} yaratildi` }); },
    onError: errorToast("UAT run yaratilmadi"),
  });
  const saveEvidence = useMutation({
    mutationFn: () => decision559UatApi.saveEvidence(selectedRunId!, {
      band, outcome, ownerName, summary, evidenceReference: reference, files: evidenceFiles, manualEvidenceIndexes,
    }),
    onSuccess: async () => {
      setSummary(""); setReference(""); setEvidenceFiles([]); setManualEvidenceIndexes([]); await refresh();
      toast({ title: `${band}-band dalili saqlandi`, description: "Endi uni boshqa vakolatli foydalanuvchi review qilishi kerak." });
    },
    onError: errorToast("Dalil saqlanmadi"),
  });
  const review = useMutation({
    mutationFn: ({ evidence, status }: { evidence: Decision559UatEvidence; status: "ACCEPTED" | "REJECTED" }) =>
      decision559UatApi.reviewEvidence(evidence.id, status, reviewNotes),
    onSuccess: async () => { await refresh(); toast({ title: "Mustaqil review saqlandi" }); },
    onError: errorToast("Review saqlanmadi"),
  });
  const uploadProtocol = useMutation({
    mutationFn: () => decision559UatApi.uploadProtocol(selectedRunId!, {
      protocolNumber, signedDate, signatories,
      evidenceSetSha256: detail.data!.run.evidenceSetSha256,
      file: protocolFile!,
    }),
    onSuccess: async () => { setProtocolFile(null); await refresh(); toast({ title: "Imzolangan qabul protokoli yuklandi" }); },
    onError: errorToast("Protokol yuklanmadi"),
  });
  const transition = useMutation({
    mutationFn: (action: "submit" | "approve" | "reject") => action === "submit"
      ? decision559UatApi.submit(selectedRunId!)
      : action === "approve"
        ? decision559UatApi.approve(selectedRunId!)
        : decision559UatApi.reject(selectedRunId!, rejectionReason),
    onSuccess: async run => { await refresh(); toast({ title: `UAT holati: ${runLabel[run.status]}` }); },
    onError: errorToast("UAT holati o'zgarmadi"),
  });
  const deleteAttachment = useMutation({
    mutationFn: (id: number) => decision559UatApi.deleteEvidenceAttachment(id),
    onSuccess: async () => { await refresh(); toast({ title: "Dalil attachmenti olib tashlandi" }); },
    onError: errorToast("Dalil attachmenti olib tashlanmadi"),
  });
  const coordinateManualTask = useMutation({
    mutationFn: () => decision559UatApi.updateManualTaskCoordination(
      selectedRunId!,
      coordinationItem!.requirementId,
      coordinationItem!.itemIndex,
      { assigneeName: coordinationAssigneeName, dueDate: coordinationDueDate, note: coordinationNote },
    ),
    onSuccess: async () => {
      setCoordinationItem(undefined); setCoordinationNote(""); await refresh();
      toast({ title: "Manual topshiriq koordinatsiyasi saqlandi" });
    },
    onError: errorToast("Manual topshiriq koordinatsiyasi saqlanmadi"),
  });
  const bulkCoordinateManualTasks = useMutation({
    mutationFn: () => decision559UatApi.bulkCoordinateManualTasks(
      selectedRunId!,
      { dueDate: bulkCoordinationDueDate, note: bulkCoordinationNote },
    ),
    onSuccess: async progress => {
      await refresh();
      toast({ title: "Manual topshiriqlar ommaviy taqsimlandi", description: `${progress.coordinatedCount}/${progress.requiredCount} topshiriq tayinlandi` });
    },
    onError: errorToast("Manual topshiriqlar ommaviy taqsimlanmadi"),
  });
  const download = useMutation({
    mutationFn: ({ kind, id }: { kind: "manualPack" | "manualProgressCsv" | "evidence" | "attachment" | "protocolDraft" | "protocol" | "manifest" | "bundle"; id?: number }) => kind === "manualPack"
      ? decision559UatApi.manualEvidencePack()
      : kind === "manualProgressCsv"
        ? decision559UatApi.manualEvidenceProgressCsv(id!)
      : kind === "evidence"
      ? decision559UatApi.evidenceFile(id!)
      : kind === "attachment"
        ? decision559UatApi.evidenceAttachmentFile(id!)
        : kind === "protocolDraft"
          ? decision559UatApi.protocolDraft(id!)
          : kind === "protocol"
            ? decision559UatApi.protocolFile(id!)
            : kind === "manifest"
              ? decision559UatApi.manifestFile(id!)
              : decision559UatApi.acceptanceBundle(id!),
    onSuccess: file => {
      saveDownloadedFile(file);
      if (file.sha256) toast({ title: "Fayl yuklandi", description: `SHA-256: ${file.sha256}` });
    },
    onError: errorToast("Xususiy fayl yuklanmadi"),
  });

  if (!canRead) return null;
  const current = detail.data;
  const selectedGuidance = requirements.data?.find(item => item.band === band);
  const editable = current?.run.status === "DRAFT" || current?.run.status === "REJECTED";
  const evidenceReady = current?.run.evidenceCount === 27 && current.run.acceptedCount === 27 && current.run.blockingCount === 0;
  const existingBand = current?.evidence.find(item => item.band === band);
  const attachmentCount = (existingBand?.files.length ?? 0) + evidenceFiles.length;
  const attachmentLimitValid = attachmentCount <= 10;
  const manualCoverageValid = selectedGuidance?.baselineStatus !== "PARTIAL" || outcome !== "MANUAL_PASS" ||
    manualEvidenceIndexes.length === selectedGuidance.manualEvidence.length;
  const manualCoverageHasFile = manualEvidenceIndexes.length === 0 || evidenceFiles.length > 0 ||
    (existingBand?.files.length ?? 0) > 0;
  const evidenceValid = attachmentLimitValid && ownerName.trim().length >= 2 && summary.trim().length >= 10 && (
    ((outcome === "PARTIAL" || outcome === "BLOCKED_EXTERNAL") && manualCoverageHasFile) ||
    (outcome === "MANUAL_PASS" && manualCoverageValid && manualCoverageHasFile && (evidenceFiles.length > 0 || (existingBand?.files.length ?? 0) > 0)) ||
    ((outcome === "AUTOMATED_PASS" || outcome === "NOT_APPLICABLE") && reference.trim().length > 0)
  );

  return <Card>
    <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />559 UAT qabul komissiyasi</CardTitle><CardDescription>3 va 8–33-bandlar bo'yicha real dalil, mustaqil review, SHA-256 va imzolangan PDF protokol.</CardDescription></div>
      {canWrite && <div className="flex w-full max-w-xl gap-2 lg:w-auto"><Input value={newRunTitle} minLength={5} maxLength={255} onChange={event => setNewRunTitle(event.target.value)} aria-label="Yangi UAT run nomi" /><Button disabled={newRunTitle.trim().length < 5 || createRun.isPending} onClick={() => createRun.mutate()}>{createRun.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Yangi run</Button></div>}
    </CardHeader>
    <CardContent className="space-y-5">
      {runs.error && <Alert variant="destructive"><AlertTitle>UAT ma'lumoti yuklanmadi</AlertTitle><AlertDescription>{runs.error.message}</AlertDescription></Alert>}
      {requirements.error && <Alert variant="destructive"><AlertTitle>Band yo'riqnomasi yuklanmadi</AlertTitle><AlertDescription>{requirements.error.message}</AlertDescription></Alert>}
      <div className="flex justify-end"><Button variant="outline" disabled={download.isPending || requirements.isLoading} onClick={() => download.mutate({ kind: "manualPack" })}><Download className="mr-2 h-4 w-4" />14 band manual dalil paketi</Button></div>
      {(runs.data?.length ?? 0) === 0 && !runs.isLoading && <p className="rounded border p-4 text-sm text-muted-foreground">Hali UAT run mavjud emas. Birinchi qabul davrini yarating.</p>}
      {!!runs.data?.length && <Select value={selectedRunId?.toString()} onValueChange={value => setSelectedRunId(Number(value))}><SelectTrigger><SelectValue placeholder="UAT runini tanlang" /></SelectTrigger><SelectContent>{runs.data.map(run => <SelectItem key={run.id} value={String(run.id)}>#{run.id} · {run.title} · {runLabel[run.status]}</SelectItem>)}</SelectContent></Select>}
      {detail.isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {detail.error && <Alert variant="destructive"><AlertTitle>Run tafsiloti yuklanmadi</AlertTitle><AlertDescription>{detail.error.message}</AlertDescription></Alert>}
      {manualProgress.error && <Alert variant="destructive"><AlertTitle>Manual dalil progressi yuklanmadi</AlertTitle><AlertDescription>{manualProgress.error.message}</AlertDescription></Alert>}

      {current && <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Stat label="Holat" value={runLabel[current.run.status]} good={current.run.status === "APPROVED"} /><Stat label="Kiritilgan band" value={`${current.run.evidenceCount}/27`} good={current.run.evidenceCount === 27} /><Stat label="Mustaqil qabul" value={`${current.run.acceptedCount}/27`} good={current.run.acceptedCount === 27} /><Stat label="Manual yig'ildi" value={`${current.run.manualEvidenceCoveredCount}/${current.run.manualEvidenceRequiredCount}`} good={current.run.manualEvidenceCoveredCount === current.run.manualEvidenceRequiredCount} /><Stat label="Manual qabul" value={`${current.run.manualEvidenceAcceptedCount}/${current.run.manualEvidenceRequiredCount}`} good={current.run.manualEvidenceAcceptedCount === current.run.manualEvidenceRequiredCount} /><Stat label="Bloklovchi" value={String(current.run.blockingCount)} good={current.run.blockingCount === 0} /></div>
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: "manifest", id: current.run.id })}><Download className="mr-2 h-4 w-4" />Audit manifest JSON</Button>{current.run.status === "APPROVED" && <Button variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: "bundle", id: current.run.id })}><Download className="mr-2 h-4 w-4" />Qabul arxivi ZIP</Button>}</div>
        <Progress value={current.run.acceptedCount / 27 * 100} />
        {current.run.rejectionReason && <Alert variant="destructive"><AlertTitle>Run qaytarildi</AlertTitle><AlertDescription>{current.run.rejectionReason}</AlertDescription></Alert>}

        {current.run.manifestSchemaVersion >= 5 && <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">43 manual topshiriq yig'ish monitoringi</h3><p className="text-xs text-muted-foreground">Holat katalog qamrovi va mustaqil reviewdan serverda hisoblanadi.</p></div><Button variant="outline" disabled={download.isPending || manualProgress.isLoading} onClick={() => download.mutate({ kind: "manualProgressCsv", id: current.run.id })}><Download className="mr-2 h-4 w-4" />Progress CSV</Button></div>
          {manualProgress.isLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {manualProgress.data && <div className="grid gap-2 sm:grid-cols-3"><Stat label="Tayinlangan" value={`${manualProgress.data.coordinatedCount}/${manualProgress.data.requiredCount}`} good={manualProgress.data.uncoordinatedCount === 0} /><Stat label="Tayinlanmagan" value={String(manualProgress.data.uncoordinatedCount)} good={manualProgress.data.uncoordinatedCount === 0} /><Stat label="Muddati o'tgan" value={String(manualProgress.data.overdueCount)} good={manualProgress.data.overdueCount === 0} /></div>}
          {manualProgress.data && canWrite && editable && manualProgress.data.uncoordinatedCount > 0 && <div className="space-y-3 rounded border border-dashed p-3"><div><p className="text-sm font-medium">Tayinlanmaganlarni ommaviy taqsimlash</p><p className="text-xs text-muted-foreground">Mavjud individual tayinlovlar saqlanadi; qolgan {manualProgress.data.uncoordinatedCount} topshiriq katalogdagi tavsiya etilgan bo'limga beriladi.</p></div><div className="grid gap-3 md:grid-cols-2"><div className="space-y-1"><Label>Umumiy muddat</Label><Input type="date" min={new Date().toISOString().slice(0, 10)} value={bulkCoordinationDueDate} onChange={event => setBulkCoordinationDueDate(event.target.value)} /></div><div className="space-y-1"><Label>Umumiy kuzatuv izohi</Label><Input maxLength={2000} value={bulkCoordinationNote} onChange={event => setBulkCoordinationNote(event.target.value)} /></div></div><Button disabled={!bulkCoordinationDueDate || bulkCoordinationNote.trim().length < 5 || bulkCoordinateManualTasks.isPending} onClick={() => bulkCoordinateManualTasks.mutate()}>{manualProgress.data.uncoordinatedCount} topshiriqni taqsimlash</Button></div>}
          {manualProgress.data && canWrite && editable && <div className="space-y-3 rounded border bg-muted/30 p-3"><div className="space-y-1"><Label>Koordinatsiya qilinadigan topshiriq</Label><Select value={coordinationItem ? `${coordinationItem.requirementId}:${coordinationItem.itemIndex}` : undefined} onValueChange={value => { const [requirementId, rawIndex] = value.split(":"); const item = manualProgress.data?.items.find(candidate => candidate.requirementId === requirementId && candidate.itemIndex === Number(rawIndex)); setCoordinationItem(item); if (item) { setCoordinationAssigneeName(item.coordinationAssigneeName ?? item.actualOwnerName ?? item.recommendedOwner); setCoordinationDueDate(item.coordinationDueDate ?? new Date().toISOString().slice(0, 10)); setCoordinationNote(item.coordinationNote ?? "Mas'ul bilan hujjatni taqdim etish muddati kelishildi"); } }}><SelectTrigger><SelectValue placeholder="43 topshiriqdan birini tanlang" /></SelectTrigger><SelectContent>{manualProgress.data.items.map(item => <SelectItem key={`${item.requirementId}:${item.itemIndex}`} value={`${item.requirementId}:${item.itemIndex}`}>{item.band}-band · {item.itemIndex + 1} · {item.status}</SelectItem>)}</SelectContent></Select></div>{coordinationItem && <><p className="text-xs">{coordinationItem.description}</p><div className="grid gap-3 md:grid-cols-2"><div className="space-y-1"><Label>Mas'ul bo'lim yoki shaxs</Label><Input value={coordinationAssigneeName} maxLength={255} onChange={event => setCoordinationAssigneeName(event.target.value)} /></div><div className="space-y-1"><Label>Muddat</Label><Input type="date" min={new Date().toISOString().slice(0, 10)} value={coordinationDueDate} onChange={event => setCoordinationDueDate(event.target.value)} /></div></div><div className="space-y-1"><Label>Kuzatuv izohi</Label><Textarea rows={2} maxLength={2000} value={coordinationNote} onChange={event => setCoordinationNote(event.target.value)} /></div><div className="flex gap-2"><Button disabled={coordinationAssigneeName.trim().length < 2 || coordinationNote.trim().length < 5 || !coordinationDueDate || coordinateManualTask.isPending} onClick={() => coordinateManualTask.mutate()}>Koordinatsiyani saqlash</Button><Button variant="outline" onClick={() => setCoordinationItem(undefined)}>Bekor qilish</Button></div></>}</div>}
          {manualProgress.data?.items.some(item => item.coordinationAssigneeName) && <div className="space-y-2 rounded border p-3"><p className="text-xs font-medium">Tayinlangan muddatlar</p>{manualProgress.data.items.filter(item => item.coordinationAssigneeName).map(item => <div key={`coord-${item.requirementId}-${item.itemIndex}`} className="flex flex-col gap-1 border-t pt-2 text-xs first:border-0 first:pt-0 md:flex-row md:items-center md:justify-between"><span>{item.band}-band · {item.itemIndex + 1} · {item.coordinationAssigneeName}</span><span className={item.coordinationOverdue ? "font-medium text-destructive" : "text-muted-foreground"}>{item.coordinationDueDate}{item.coordinationOverdue ? " · MUDDAT O'TGAN" : ""}</span></div>)}</div>}
          {manualProgress.data && <><div className="grid gap-2 sm:grid-cols-3"><Stat label="Kutilmoqda" value={String(manualProgress.data.pendingCount)} good={manualProgress.data.pendingCount === 0} /><Stat label="Yig'ilgan" value={`${manualProgress.data.collectedCount}/${manualProgress.data.requiredCount}`} good={manualProgress.data.collectedCount === manualProgress.data.requiredCount} /><Stat label="Qabul qilingan" value={`${manualProgress.data.acceptedCount}/${manualProgress.data.requiredCount}`} good={manualProgress.data.acceptedCount === manualProgress.data.requiredCount} /></div><div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">{manualProgress.data.items.map(item => <div key={`${item.requirementId}-${item.itemIndex}`} className="grid gap-2 rounded border p-3 text-xs lg:grid-cols-[90px_1fr_170px] lg:items-start"><strong>{item.band}-band · {item.itemIndex + 1}</strong><div><p>{item.description}</p><p className="mt-1 text-muted-foreground">Mas'ul: {item.actualOwnerName ?? item.recommendedOwner}{item.blockedBy.length > 0 ? ` · ${item.blockedBy.join(", ")}` : ""}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><ManualProgressBadge status={item.status} />{item.fileCount > 0 && <Badge variant="outline">{item.fileCount} fayl</Badge>}</div></div>)}</div></>}
        </div>}

        {canWrite && editable && <div className="space-y-4 rounded-lg border p-4">
          <div><h3 className="font-semibold">Band dalilini kiritish</h3><p className="text-xs text-muted-foreground">Qabul qilingan dalil faqat rad etilgan run qayta ishlanganda o'zgaradi; har qanday dalil o'zgarishi eski protokolni bekor qiladi va muallif o'z dalilini review qila olmaydi.</p></div>
          <div className="grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>Band</Label><Select value={String(band)} onValueChange={value => { setBand(Number(value)); setManualEvidenceIndexes([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DECISION_559_REQUIRED_BANDS.map(item => <SelectItem key={item} value={String(item)}>{item}-band{requirementTitle(requirements.data, item)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Natija</Label><Select value={outcome} onValueChange={value => { setOutcome(value as UatOutcome); if (value !== "MANUAL_PASS") setManualEvidenceIndexes([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(outcomeLabel).filter(([value]) => selectedGuidance?.baselineStatus !== "PARTIAL" || !["AUTOMATED_PASS", "NOT_APPLICABLE"].includes(value)).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Dalil egasi</Label><Input value={ownerName} onChange={event => setOwnerName(event.target.value)} placeholder="Bo'lim yoki komissiya" maxLength={255} /></div></div>
          {selectedGuidance && <div className="space-y-2 rounded border bg-muted/30 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><strong>{selectedGuidance.band}-band: {selectedGuidance.title}</strong><Badge variant={selectedGuidance.baselineStatus === "PARTIAL" ? "secondary" : "outline"}>{selectedGuidance.baselineStatus === "PARTIAL" ? "Real/manual dalil kerak" : "Texnik baseline avtomatik"}</Badge></div><p><span className="font-medium">Tavsiya etilgan mas'ul:</span> {selectedGuidance.owner}</p>{selectedGuidance.blockedBy.length > 0 && <p><span className="font-medium">Tashqi bog'liqlik:</span> {selectedGuidance.blockedBy.join(", ")}</p>}{selectedGuidance.manualEvidence.length > 0 && <div><p className="font-medium">Yuklanadigan real dalillar ({manualEvidenceIndexes.length}/{selectedGuidance.manualEvidence.length}):</p><div className="mt-2 space-y-2">{selectedGuidance.manualEvidence.map((item, index) => <label key={item} className="flex items-start gap-2 text-xs"><Checkbox checked={manualEvidenceIndexes.includes(index)} disabled={!["MANUAL_PASS", "PARTIAL", "BLOCKED_EXTERNAL"].includes(outcome)} onCheckedChange={checked => setManualEvidenceIndexes(currentIndexes => checked ? [...currentIndexes, index].sort((a, b) => a - b) : currentIndexes.filter(value => value !== index))} /><span>{item}</span></label>)}</div>{outcome === "MANUAL_PASS" && !manualCoverageValid && <p className="mt-2 text-xs text-destructive">MANUAL_PASS uchun barcha checklist bandlarini real fayllar asosida belgilang.</p>}{!manualCoverageHasFile && <p className="mt-2 text-xs text-destructive">Belgilangan qamrovni saqlash uchun kamida bitta real fayl biriktiring.</p>}</div>}<p className="text-xs text-muted-foreground">{selectedGuidance.note}</p><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Texnik baseline: {selectedGuidance.evidence.length} ta manba</span>{ownerName.trim().length === 0 && <Button type="button" size="sm" variant="outline" onClick={() => setOwnerName(selectedGuidance.owner)}>Mas'ulni formaga olish</Button>}</div></div>}
          <div className="space-y-2"><Label>Tekshiruv xulosasi</Label><Textarea value={summary} onChange={event => setSummary(event.target.value)} rows={3} maxLength={4000} /></div>
          <div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Test/hujjat rekviziti</Label><Input value={reference} onChange={event => setReference(event.target.value)} maxLength={1000} placeholder="Hisobot, protokol yoki tashqi havola rekviziti" /></div><div className="space-y-2"><Label>PDF/PNG/JPEG (har biri 10 MB, bandga jami 10 ta)</Label><Input type="file" multiple accept="application/pdf,image/png,image/jpeg" onChange={event => setEvidenceFiles(Array.from(event.target.files ?? []))} /><p className={`text-xs ${attachmentLimitValid ? "text-muted-foreground" : "text-destructive"}`}>Tanlandi: {evidenceFiles.length} ta; mavjud: {existingBand?.files.length ?? 0} ta; jami: {attachmentCount}/10.</p></div></div>
          <Button disabled={!evidenceValid || (existingBand?.reviewStatus === "ACCEPTED" && current.run.status !== "REJECTED") || saveEvidence.isPending} onClick={() => saveEvidence.mutate()}><Upload className="mr-2 h-4 w-4" />{existingBand ? "Dalilni yangilash" : "Dalilni saqlash"}</Button>
        </div>}

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><h3 className="font-semibold">27 band review reyestri</h3><p className="text-xs text-muted-foreground">Faqat final natija va ACCEPTED review runni tayyor qiladi.</p></div>{canApprove && editable && <div className="w-full max-w-md space-y-1"><Label>Review izohi</Label><Input value={reviewNotes} onChange={event => setReviewNotes(event.target.value)} maxLength={2000} /></div>}</div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {DECISION_559_REQUIRED_BANDS.map(requiredBand => {
              const item = current.evidence.find(candidate => candidate.band === requiredBand);
              const guidance = requirements.data?.find(candidate => candidate.band === requiredBand);
              const finalOutcome = item?.outcome === "AUTOMATED_PASS" || item?.outcome === "MANUAL_PASS" || item?.outcome === "NOT_APPLICABLE";
              const coverageComplete = guidance?.baselineStatus !== "PARTIAL" || item?.outcome !== "MANUAL_PASS" ||
                item.manualEvidenceCoverage.length === guidance.manualEvidence.length;
              return <div key={requiredBand} className="grid gap-2 rounded border p-3 text-sm lg:grid-cols-[80px_1fr_auto] lg:items-center"><strong>{requiredBand}-band</strong>{item ? <div><div className="flex flex-wrap items-center gap-2"><span>{outcomeLabel[item.outcome]}</span><ReviewBadge status={item.reviewStatus} />{item.manualEvidenceCoverage.length > 0 && <Badge variant="outline">{item.manualEvidenceCoverage.length} checklist qoplandi</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{item.ownerName} · {item.submittedByName}{item.reviewedByName ? ` · reviewer: ${item.reviewedByName}` : ""}</p><p className="mt-1 text-xs">{item.summary}</p>{item.manualEvidenceCoverage.length > 0 && <ul className="mt-1 list-disc pl-5 text-[11px]">{item.manualEvidenceCoverage.map(coverage => <li key={coverage}>{coverage}</li>)}</ul>}{(item.evidenceReference || item.sha256) && <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{item.evidenceReference ?? ""}{item.sha256 ? ` · SHA-256 ${item.sha256}` : ""}</p>}</div> : <span className="text-muted-foreground">Dalil kiritilmagan</span>}<div className="flex flex-wrap gap-2">{item?.originalName && <Button size="sm" variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: "evidence", id: item.id })}><Download className="mr-1 h-3 w-3" />Fayl</Button>}{canWrite && editable && item?.reviewStatus !== "ACCEPTED" && <Button size="sm" variant="outline" onClick={() => { setBand(requiredBand); if (item) { setOutcome(item.outcome); setOwnerName(item.ownerName); setSummary(item.summary); setReference(item.evidenceReference ?? ""); setManualEvidenceIndexes(guidance?.manualEvidence.map((entry, index) => item.manualEvidenceCoverage.includes(entry) ? index : -1).filter(index => index >= 0) ?? []); } }}>Tahrirlash</Button>}{canApprove && editable && item && item.reviewStatus !== "ACCEPTED" && <><Button size="sm" disabled={!finalOutcome || !coverageComplete || reviewNotes.trim().length < 5 || review.isPending} onClick={() => review.mutate({ evidence: item, status: "ACCEPTED" })}><CheckCircle2 className="mr-1 h-3 w-3" />Qabul</Button><Button size="sm" variant="destructive" disabled={reviewNotes.trim().length < 5 || review.isPending} onClick={() => review.mutate({ evidence: item, status: "REJECTED" })}><XCircle className="mr-1 h-3 w-3" />Rad</Button></>}</div></div>;
            })}
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium">Bandlarga biriktirilgan private fayllar</p>
            {current.evidence.flatMap(item => item.files.map(file => ({ item, file }))).length === 0
              ? <p className="text-xs text-muted-foreground">Attachment fayllar hali mavjud emas.</p>
              : <div className="flex flex-wrap gap-2">{current.evidence.flatMap(item => item.files.map(file => ({ item, file }))).map(({ item, file }) => <span key={file.id} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"><strong>{item.band}-band</strong><button type="button" className="max-w-48 truncate underline" disabled={download.isPending} onClick={() => download.mutate({ kind: "attachment", id: file.id })}>{file.originalName}</button><span className="font-mono text-[10px] text-muted-foreground">{file.sha256.slice(0, 12)}...</span>{canWrite && editable && (item.reviewStatus !== "ACCEPTED" || current.run.status === "REJECTED") && <button type="button" aria-label={`${file.originalName} faylini olib tashlash`} className="text-destructive" disabled={deleteAttachment.isPending} onClick={() => deleteAttachment.mutate(file.id)}><XCircle className="h-3 w-3" /></button>}</span>)}</div>}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">Imzolangan qabul protokoli</h3><p className="text-xs text-muted-foreground">Avval 27 bandni mustaqil qabul qiling, snapshot bilan to'ldirilgan HTML loyihani PDFga chop etib imzolang, so'ng haqiqiy PDFni yuklang.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!editable || !evidenceReady || download.isPending} onClick={() => download.mutate({ kind: "protocolDraft", id: current.run.id })}><Download className="mr-2 h-4 w-4" />Imzolash uchun loyiha</Button>{current.run.protocolOriginalName && <Button variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: "protocol", id: current.run.id })}><Download className="mr-2 h-4 w-4" />{current.run.protocolOriginalName}</Button>}</div></div>
          <div className="rounded border bg-muted/30 p-3"><p className="text-xs font-medium">Joriy evidence-set SHA-256</p><p className="break-all font-mono text-xs">{current.run.evidenceSetSha256}</p><p className="mt-1 text-xs text-muted-foreground">Imzolanadigan protokoldagi evidence-set maydoniga aynan shu qiymat yozilishi kerak; yuklashda server uni qayta tekshiradi.</p></div>
          {current.run.protocolSha256 && <p className="break-all font-mono text-xs text-muted-foreground">SHA-256: {current.run.protocolSha256}</p>}
          {current.run.protocolEvidenceSetSha256 && <p className="break-all font-mono text-xs text-muted-foreground">Protokol bog'langan evidence-set: {current.run.protocolEvidenceSetSha256}</p>}
          {canWrite && editable && <><div className="grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>Protokol raqami</Label><Input value={protocolNumber} onChange={event => setProtocolNumber(event.target.value)} maxLength={100} /></div><div className="space-y-2"><Label>Imzolangan sana</Label><Input type="date" max={new Date().toISOString().slice(0, 10)} value={signedDate} onChange={event => setSignedDate(event.target.value)} /></div><div className="space-y-2"><Label>Imzolangan PDF</Label><Input type="file" accept="application/pdf" onChange={event => setProtocolFile(event.target.files?.[0] ?? null)} /></div></div><div className="space-y-2"><Label>Imzolovchilar (kamida 3 ta; nuqtali vergul yoki yangi qator bilan)</Label><Textarea value={signatories} onChange={event => setSignatories(event.target.value)} rows={2} maxLength={2000} /></div><Button disabled={!evidenceReady || !protocolFile || protocolNumber.trim().length < 2 || parsedSignatoryCount(signatories) < 3 || uploadProtocol.isPending} onClick={() => uploadProtocol.mutate()}><FileCheck2 className="mr-2 h-4 w-4" />Protokolni yuklash</Button></>}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end md:justify-between"><div><h3 className="font-semibold">Yakuniy qaror</h3><p className="text-xs text-muted-foreground">Yuboruvchi/protokol yuklovchi yakuniy tasdiqlovchi bo'la olmaydi.</p></div><div className="flex flex-1 flex-wrap justify-end gap-2">{canWrite && editable && <Button disabled={!current.run.readyToSubmit || transition.isPending} onClick={() => transition.mutate("submit")}>Yakuniy reviewga yuborish</Button>}{canApprove && current.run.status === "IN_REVIEW" && <><Input className="max-w-sm" value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} placeholder="Rad etish sababi (kamida 10 belgi)" maxLength={2000} /><Button variant="destructive" disabled={rejectionReason.trim().length < 10 || transition.isPending} onClick={() => transition.mutate("reject")}>Qaytarish</Button><Button disabled={transition.isPending} onClick={() => transition.mutate("approve")}><ShieldCheck className="mr-2 h-4 w-4" />Qabulni tasdiqlash</Button></>}</div></div>
      </>}
    </CardContent>
  </Card>;
}

function ReviewBadge({ status }: { status: Decision559UatEvidence["reviewStatus"] }) {
  const variant = status === "ACCEPTED" ? "default" : status === "REJECTED" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status === "ACCEPTED" ? "Qabul" : status === "REJECTED" ? "Rad" : "Review kutilmoqda"}</Badge>;
}
function ManualProgressBadge({ status }: { status: "PENDING" | "COLLECTED" | "ACCEPTED" }) {
  const variant = status === "ACCEPTED" ? "default" : status === "COLLECTED" ? "secondary" : "outline";
  const label = status === "ACCEPTED" ? "Qabul qilindi" : status === "COLLECTED" ? "Yig'ildi" : "Kutilmoqda";
  return <Badge variant={variant}>{label}</Badge>;
}
function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className="flex items-center gap-3 rounded border p-3">{good ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <ShieldCheck className="h-5 w-5 text-amber-600" />}<div><p className="font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>;
}
function saveDownloadedFile(file: DownloadedUatFile) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url; link.download = file.originalName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
function parsedSignatoryCount(value: string) {
  return new Set(value.split(/[;\r\n]+/).map(item => item.trim().toLowerCase()).filter(item => item.length >= 2)).size;
}
function requirementTitle(requirements: Decision559UatRequirementGuidance[] | undefined, band: number) {
  const title = requirements?.find(item => item.band === band)?.title;
  return title ? ` · ${title}` : "";
}
