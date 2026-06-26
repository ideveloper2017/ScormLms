import { useState } from "react";
import {
  Download, Loader2, Search, CheckSquare, Square,
  Users, AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { hemisApi, type HemisGroup, type HemisStudentPreview, type HemisImportResult } from "@/services/api/hemis-api";

type Step = "group" | "preview" | "result";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

export function HemisImportDialog({ open, onOpenChange, onImported }: Props) {
  const [step, setStep]               = useState<Step>("group");
  const [groups, setGroups]           = useState<HemisGroup[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<HemisGroup | null>(null);
  const [students, setStudents]       = useState<HemisStudentPreview[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [result, setResult]           = useState<HemisImportResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Guruhlarni yuklash
  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hemisApi.getGroups();
      setGroups(data);
      setStep("group");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Guruh tanlanganda talabalar previewini yuklash
  const loadStudents = async (group: HemisGroup) => {
    setSelectedGroup(group);
    setLoading(true);
    setError(null);
    try {
      const data = await hemisApi.previewStudents(group.id);
      setStudents(data);
      setSelected(new Set(data.filter(s => !s.alreadyExists).map(s => s.studentNumber)));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talabalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Import bajarish
  const executeImport = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    setError(null);
    try {
      const studentNumbers = selected.size < students.length
        ? Array.from(selected)
        : undefined; // hammasini
      const data = await hemisApi.importStudents(selectedGroup.id, studentNumbers);
      setResult(data);
      setStep("result");
      toast.success(`${data.created} ta talaba muvaffaqiyatli qo'shildi`);
      onImported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import qilishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("group");
    setGroups([]);
    setGroupSearch("");
    setSelectedGroup(null);
    setStudents([]);
    setSelected(new Set());
    setResult(null);
    setError(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const toggleAll = () => {
    const importable = students.filter(s => !s.alreadyExists).map(s => s.studentNumber);
    if (selected.size === importable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(importable));
    }
  };

  const toggleOne = (num: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const newStudents    = students.filter(s => !s.alreadyExists);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            HEMIS dan talabalarni import qilish
          </DialogTitle>
          <DialogDescription>
            {step === "group"   && "Guruh tanlang — HEMIS dan talabalar ro'yxatini olish uchun"}
            {step === "preview" && `"${selectedGroup?.name}" guruhidagi talabalar — importni tasdiqlang`}
            {step === "result"  && "Import natijasi"}
          </DialogDescription>
        </DialogHeader>

        {/* Xatolik */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Guruh tanlash ──────────────────────────────────────── */}
        {step === "group" && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                <Users className="h-12 w-12 opacity-20" />
                <p className="text-sm">HEMIS guruhlarini yuklash uchun tugmani bosing</p>
                <Button onClick={loadGroups} disabled={loading} className="gap-2">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Yuklanmoqda...</>
                    : <><RefreshCw className="h-4 w-4" />Guruhlarni yuklash</>}
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Guruh nomi bo'yicha qidiring..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="flex-1 max-h-72 rounded-md border">
                  <div className="divide-y">
                    {filteredGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => loadStudents(g)}
                        disabled={loading}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/60 transition-colors text-left"
                      >
                        <span className="font-medium">{g.name}</span>
                        {g.studentsCount != null && (
                          <Badge variant="secondary">{g.studentsCount} ta talaba</Badge>
                        )}
                      </button>
                    ))}
                    {filteredGroups.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">Guruh topilmadi</p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        {/* ── STEP 2: Talabalar preview ──────────────────────────────────── */}
        {step === "preview" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Statistika */}
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline">{students.length} ta jami</Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {newStudents.length} ta yangi
              </Badge>
              {students.length - newStudents.length > 0 && (
                <Badge variant="secondary">{students.length - newStudents.length} ta mavjud</Badge>
              )}
              <span className="ml-auto text-muted-foreground">
                {selected.size} ta tanlandi
              </span>
            </div>

            {/* Hammasini tanlash */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                disabled={newStudents.length === 0}
              >
                {selected.size === newStudents.length && newStudents.length > 0
                  ? <CheckSquare className="h-4 w-4 text-primary" />
                  : <Square className="h-4 w-4" />}
                Barchasini tanlash
              </button>
            </div>

            <ScrollArea className="flex-1 max-h-64 rounded-md border">
              <div className="divide-y">
                {students.map((s) => (
                  <div
                    key={s.studentNumber}
                    className={`flex items-start gap-3 px-4 py-3 ${s.alreadyExists ? "opacity-50" : "hover:bg-muted/40 cursor-pointer"}`}
                    onClick={() => !s.alreadyExists && toggleOne(s.studentNumber)}
                  >
                    <div className="mt-0.5">
                      {s.alreadyExists
                        ? <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        : selected.has(s.studentNumber)
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{s.fullName}</span>
                        {s.alreadyExists && (
                          <Badge variant="secondary" className="text-[10px] h-4">Mavjud</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.studentNumber} · {s.group} · {s.educationLang}
                      </div>
                    </div>
                    {s.birthDate && (
                      <span className="text-xs text-muted-foreground shrink-0">{s.birthDate}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── STEP 3: Natija ─────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Import muvaffaqiyatli yakunlandi</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Jami", value: result.total, color: "text-foreground" },
                { label: "Yangi qo'shildi", value: result.created, color: "text-green-600" },
                { label: "O'tkazib yuborildi", value: result.skipped, color: "text-muted-foreground" },
                { label: "Xatolik", value: result.errors.length, color: "text-red-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border p-3 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 space-y-1">
                {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                {result.errors.length > 5 && (
                  <div className="text-muted-foreground">va yana {result.errors.length - 5} ta xatolik...</div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "group" && groups.length > 0 && (
            <Button variant="outline" onClick={loadGroups} disabled={loading} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />Yangilash
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("group")}>Orqaga</Button>
              <Button
                onClick={executeImport}
                disabled={loading || selected.size === 0}
                className="gap-2"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Import qilinmoqda...</>
                  : <><Download className="h-4 w-4" />{selected.size} ta talabani import qilish</>}
              </Button>
            </>
          )}
          {step === "result" && (
            <>
              <Button variant="outline" onClick={reset}>Yana import</Button>
              <Button onClick={() => handleOpenChange(false)}>Yopish</Button>
            </>
          )}
          {step !== "result" && (
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>Bekor qilish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
