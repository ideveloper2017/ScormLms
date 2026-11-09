import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "./shared-ui";
import type { ContentsTabController } from "./use-contents-tab";

/** Material versiyalari va ekspertiza qarorlari tarixi ("Darslar" va "Tasdiqlash holati" tablaridan ochiladi) */
export function ContentHistoryDialog({ controller }: { controller: ContentsTabController }) {
  const { historyContent, setHistoryContent, revisionsQuery, reviewsQuery } = controller;

  return (
    <Dialog
      open={Boolean(historyContent)}
      onOpenChange={(open) => {
        if (!open) setHistoryContent(null);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kontent versiyalari</DialogTitle>
          <DialogDescription>
            {historyContent?.title} uchun o'zgarmas tahrirlar tarixi.
          </DialogDescription>
        </DialogHeader>
        {revisionsQuery.isLoading && <Loading />}
        {revisionsQuery.error && (
          <p className="text-sm text-destructive">
            {revisionsQuery.error.message}
          </p>
        )}
        <div className="space-y-3">
          {(revisionsQuery.data ?? []).map((revision) => (
            <Card key={revision.id}>
              <CardContent className="p-4 space-y-1">
                <div className="flex justify-between gap-2">
                  <strong>
                    #{revision.revisionNumber} · v{revision.contentVersion}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {new Date(revision.changedAt).toLocaleString("uz-UZ")}
                  </span>
                </div>
                <p className="text-sm">{revision.title}</p>
                <p className="text-xs text-muted-foreground">
                  {revision.languageCode} · {revision.authorName} ·{" "}
                  {revision.sourceName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {revision.validFrom} —{" "}
                  {revision.validUntil || "cheklanmagan"} · foydalanuvchi ID{" "}
                  {revision.changedBy}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <h3 className="pt-2 font-semibold">Ekspertiza qarorlari</h3>
        {reviewsQuery.isLoading && <Loading />}
        {reviewsQuery.error && (
          <p className="text-sm text-destructive">
            {reviewsQuery.error.message}
          </p>
        )}
        {(reviewsQuery.data ?? []).length === 0 &&
          !reviewsQuery.isLoading && !reviewsQuery.error && (
            <p className="text-sm text-muted-foreground">
              Hali ekspertizaga yuborilmagan.
            </p>
          )}
        <div className="space-y-3">
          {(reviewsQuery.data ?? []).map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-1">
                <div className="flex justify-between gap-2">
                  <strong>
                    Revision #{review.revisionNumber} · v
                    {review.contentVersion}
                  </strong>
                  <Badge
                    variant={
                      review.status === "approved" ? "default" : "secondary"
                    }
                  >
                    {review.status === "pending"
                      ? "Kutilmoqda"
                      : review.status === "approved"
                        ? "Tasdiqlangan"
                        : "Tuzatishga qaytarilgan"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Yuborildi:{" "}
                  {new Date(review.submittedAt).toLocaleString("uz-UZ")} · ID{" "}
                  {review.submittedBy}
                </p>
                {review.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Qaror:{" "}
                    {new Date(review.reviewedAt).toLocaleString("uz-UZ")} ·
                    ekspert ID {review.reviewedBy}
                  </p>
                )}
                {review.decisionComment && (
                  <p className="text-sm">{review.decisionComment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
