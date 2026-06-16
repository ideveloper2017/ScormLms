import { useState, useMemo } from "react";
import {
  Clock, Upload, CheckCircle2, AlertCircle,
  Circle, Search, Filter, ChevronDown, FileText, Paperclip,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssignments, useSubmitAssignment } from "@/hooks/assignments/useAssignments";
import { AssignmentListSkeleton } from "@/components/ui/skeletons/AssignmentListSkeleton";
import { useLoadingTransition } from "@/hooks/useLoadingTransition";
import type { Assignment } from "@/types/assignment.types";

const STATUS_META: Record<Assignment['status'], { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: "Kutilmoqda",     cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-300",   icon: Circle       },
  submitted: { label: "Topshirildi",    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",  icon: Upload       },
  graded:    { label: "Baholandi",      cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",   icon: CheckCircle2 },
  overdue:   { label: "Muddati o'tdi",  cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",     icon: AlertCircle  },
};

const PRIORITY_CLS: Record<Assignment['priority'], string> = {
  high:   "bg-red-100    text-red-700   dark:bg-red-900/30   dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low:    "bg-green-100  text-green-700 dark:bg-green-900/30  dark:text-green-300",
};
const PRIORITY_LABEL: Record<Assignment['priority'], string> = { high: "Yuqori", medium: "O'rta", low: "Past" };

function daysLeft(date: Date) {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  return diff;
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("uz-Latn", { day: "2-digit", month: "short", year: "numeric" });
}

export function StudentAssignments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Assignment['status'] | 'all'>("all");
  
  // Submission dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // Fetch assignments from API
  const { data: assignments, isLoading, isError, error, refetch } = useAssignments();
  const submitAssignment = useSubmitAssignment();

  // Apply loading transition with minimum 300ms display time (AC 9.7)
  const showLoading = useLoadingTransition(isLoading);

  // Sort assignments by due date (ascending)
  const sortedAssignments = useMemo(() => {
    if (!assignments) return [];
    return [...assignments].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [assignments]);

  // Filter assignments
  const filtered = useMemo(() => {
    return sortedAssignments.filter((a) => {
      const t = search.toLowerCase();
      const matchSearch = !t || a.title.toLowerCase().includes(t) || a.courseName.toLowerCase().includes(t);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sortedAssignments, search, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!assignments) return { total: 0, pending: 0, overdue: 0, done: 0 };
    return {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === "pending").length,
      overdue: assignments.filter((a) => a.status === "overdue").length,
      done: assignments.filter((a) => a.status === "submitted" || a.status === "graded").length,
    };
  }, [assignments]);

  // Handle submit assignment
  const handleOpenSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText("");
    setSubmissionFile(null);
    setSubmitDialogOpen(true);
  };

  const handleCloseSubmitDialog = () => {
    setSubmitDialogOpen(false);
    setSelectedAssignment(null);
    setSubmissionText("");
    setSubmissionFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
    }
  };

  const handleSubmitAssignment = () => {
    if (!selectedAssignment) return;

    // Validate that either file or text is provided
    if (!submissionFile && !submissionText.trim()) {
      return;
    }

    submitAssignment.mutate(
      {
        id: selectedAssignment.id,
        payload: {
          fileUrl: submissionFile || undefined,
          answer: submissionText.trim() || undefined,
          submittedAt: new Date(),
        },
      },
      {
        onSuccess: () => {
          handleCloseSubmitDialog();
        },
      }
    );
  };

  // Show loading skeleton
  if (showLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Topshiriqlar</h1>
            <p className="text-muted-foreground">Barcha kurslar bo'yicha topshiriqlar</p>
          </div>
        </div>
        <AssignmentListSkeleton count={6} />
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <h2 className="text-xl font-semibold mb-2">Xatolik yuz berdi</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Topshiriqlarni yuklab bo'lmadi"}
          </p>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : "Qayta urinish"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Topshiriqlar</h1>
          <p className="text-muted-foreground">Barcha kurslar bo'yicha topshiriqlar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami", value: stats.total, cls: "" },
          { label: "Kutilmoqda", value: stats.pending, cls: "text-blue-600" },
          { label: "Muddati o'tdi", value: stats.overdue, cls: "text-red-600" },
          { label: "Bajarildi", value: stats.done, cls: "text-green-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Topshiriq yoki kurs nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "Barcha holat" : STATUS_META[statusFilter as Assignment['status']]?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Barcha holat</DropdownMenuItem>
            {(Object.keys(STATUS_META) as Array<Assignment['status']>).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setStatusFilter(k)}>{STATUS_META[k].label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assignment list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Topshiriq topilmadi</div>
        )}
        {filtered.map((a) => {
          const meta = STATUS_META[a.status];
          const Icon = meta.icon;
          const days = daysLeft(a.dueDate);
          const isOverdue = a.status === "overdue";
          const isPending = a.status === "pending";
          const isHighPriority = a.priority === "high";

          return (
            <Card 
              key={a.id} 
              className={`
                ${isOverdue ? "border-red-200 dark:border-red-900/50" : ""}
                ${isHighPriority && !isOverdue ? "border-orange-200 dark:border-orange-900/50" : ""}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                    <div>
                      <CardTitle className="text-base leading-tight">{a.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{a.courseName}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={PRIORITY_CLS[a.priority] + " text-xs"}>{PRIORITY_LABEL[a.priority]}</Badge>
                    <Badge className={meta.cls + " text-xs"}>{meta.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{a.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Muddat: {fmtDate(a.dueDate)}
                    </span>
                    {!isOverdue && a.status !== "graded" && a.status !== "submitted" && (
                      <span className={days <= 2 ? "text-red-600 font-medium" : days <= 5 ? "text-yellow-600" : ""}>
                        {days > 0 ? `${days} kun qoldi` : "Bugun!"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === "graded" && a.grade != null && (
                      <span className="text-sm font-semibold">
                        {a.grade}/{a.maxScore} ball
                        <span className={`ml-1 ${a.grade / a.maxScore >= 0.9 ? "text-green-600" : a.grade / a.maxScore >= 0.75 ? "text-blue-600" : "text-red-600"}`}>
                          ({Math.round(a.grade / a.maxScore * 100)}%)
                        </span>
                      </span>
                    )}
                    {isPending && (
                      <Button 
                        size="sm" 
                        className="gap-1.5 h-8"
                        onClick={() => handleOpenSubmitDialog(a)}
                        disabled={submitAssignment.isPending}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Topshirish
                      </Button>
                    )}
                    {a.status === "submitted" && (
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Topshirildi</span>
                      </div>
                    )}
                    {a.status === "graded" && (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Baholandi</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submission Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Topshiriqni topshirish</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Fayl yuklash
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                />
              </div>
              {submissionFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {submissionFile.name} ({(submissionFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="submission-text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Matn javob
              </Label>
              <Textarea
                id="submission-text"
                placeholder="Topshiriq javobini shu yerga yozing..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Fayl yoki matn javob (yoki ikkalasi ham) talab qilinadi
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseSubmitDialog}
              disabled={submitAssignment.isPending}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAssignment}
              disabled={
                submitAssignment.isPending ||
                (!submissionFile && !submissionText.trim())
              }
            >
              {submitAssignment.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Topshirilmoqda...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Topshirish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}