import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  teacherPortalApi,
  type CourseContentReview,
} from "@/services/api/teacher-portal-api";

export function AdminContentReviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const client = useQueryClient();
  const canReview = hasAuthority(user, "ACADEMIC_WRITE");
  const [comments, setComments] = useState<Record<number, string>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const reviews = useQuery({
    queryKey: ["content-reviews", "pending"],
    queryFn: teacherPortalApi.getPendingContentReviews,
    enabled: canReview,
  });
  const decision = useMutation({
    mutationFn: ({
      review,
      value,
    }: {
      review: CourseContentReview;
      value: "APPROVED" | "CHANGES_REQUESTED";
    }) =>
      teacherPortalApi.decideContentReview(
        review.id,
        value,
        comments[review.id],
      ),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["content-reviews", "pending"],
      });
      toast({ title: "Ekspertiza qarori saqlandi" });
    },
    onError: (error: Error) =>
      toast({
        variant: "destructive",
        title: "Qaror saqlanmadi",
        description: error.message,
      }),
  });

  async function downloadReview(review: CourseContentReview) {
    if (!review.asset) return;
    setDownloadingId(review.id);
    try {
      const blob = await teacherPortalApi.downloadContentFile(
        String(review.courseId),
        review.contentId,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = review.asset.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast({
        variant: "destructive",
        title: "Material yuklab olinmadi",
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setDownloadingId(null);
    }
  }

  if (!canReview)
    return (
      <div className="p-6 text-destructive">
        Kontent ekspertizasi uchun akademik vakolat kerak.
      </div>
    );
  const items = reviews.data ?? [];
  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Kontent ekspertizasi</h1>
        <p className="text-sm text-muted-foreground">
          O'qituvchi yuborgan aniq revisionni mustaqil metodik ko'rib chiqish va
          auditli qaror chiqarish.
        </p>
      </div>
      {reviews.isLoading && (
        <p className="text-sm text-muted-foreground">
          Ekspertiza navbati yuklanmoqda...
        </p>
      )}
      {reviews.error && (
        <p className="text-sm text-destructive">{reviews.error.message}</p>
      )}
      {!reviews.isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <FileCheck2 className="mx-auto mb-2 h-8 w-8" />
            Kutilayotgan ekspertiza yo'q.
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {review.contentTitle}
                  </CardTitle>
                  <CardDescription>
                    {review.courseTitle} · {review.moduleTitle}
                  </CardDescription>
                </div>
                <Badge>
                  v{review.contentVersion} · revision #{review.revisionNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.description && (
                <p className="text-sm">{review.description}</p>
              )}
              {review.contentBody && (
                <RichTextContent
                  value={review.contentBody}
                  className="max-h-64 overflow-y-auto rounded-lg border bg-background p-3 text-sm"
                />
              )}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <p>
                  <strong>Muallif:</strong> {review.authorName}
                </p>
                <p>
                  <strong>Til:</strong> {review.languageCode}
                </p>
                <p>
                  <strong>Manba:</strong>{" "}
                  {review.sourceUrl ? (
                    <a
                      className="underline"
                      href={review.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {review.sourceName}
                    </a>
                  ) : (
                    review.sourceName
                  )}
                </p>
                <p>
                  <strong>Amal qilish:</strong> {review.validFrom} —{" "}
                  {review.validUntil || "cheklanmagan"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Yuboruvchi ID {review.submittedBy} ·{" "}
                  {new Date(review.submittedAt).toLocaleString("uz-UZ")}
                </p>
              </div>
              <div
                className={`rounded-lg border p-3 text-sm ${review.compatibility.compatible ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100" : "border-destructive/40 bg-destructive/5 text-destructive"}`}
              >
                <p className="font-medium">
                  {review.compatibility.compatible
                    ? "Kontent tili fan va ta'lim dasturiga mos"
                    : "Til/dastur mosligi bajarilmagan"}
                </p>
                <p className="mt-1 text-xs">
                  {review.compatibility.subjectName || "Fan yo'q"} ·{" "}
                  {review.compatibility.programName || "Dastur yo'q"} · dastur
                  tili {review.compatibility.programLanguage || "—"}
                </p>
                {review.compatibility.issues.map((issue) => (
                  <p key={issue.code} className="mt-1 text-xs">
                    {issue.message}
                    {issue.details.length
                      ? `: ${issue.details.join(", ")}`
                      : ""}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {review.asset && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === review.id}
                    onClick={() => void downloadReview(review)}
                  >
                    {downloadingId === review.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-1 h-4 w-4" />
                    )}
                    {review.asset.originalFileName}
                  </Button>
                )}
                {review.contentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        review.contentUrl!,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Materialni ochish
                  </Button>
                )}
                {review.sourceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        review.sourceUrl!,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Manbani ochish
                  </Button>
                )}
              </div>
              <Textarea
                value={comments[review.id] ?? ""}
                onChange={(event) =>
                  setComments((value) => ({
                    ...value,
                    [review.id]: event.target.value,
                  }))
                }
                placeholder="Ekspert izohi; tuzatishga qaytarishda kamida 10 belgi majburiy"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={
                    decision.isPending ||
                    (comments[review.id]?.trim().length ?? 0) < 10
                  }
                  onClick={() =>
                    decision.mutate({ review, value: "CHANGES_REQUESTED" })
                  }
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Tuzatishga qaytarish
                </Button>
                <Button
                  disabled={
                    decision.isPending || !review.compatibility.compatible
                  }
                  title={
                    !review.compatibility.compatible
                      ? "Til va dastur mosligini tuzating"
                      : undefined
                  }
                  onClick={() => decision.mutate({ review, value: "APPROVED" })}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Tasdiqlash
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
