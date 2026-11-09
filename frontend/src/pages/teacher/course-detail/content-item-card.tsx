import type { ElementType } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Edit,
  FileText,
  History,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Video,
} from "lucide-react";
import { richTextToPlainText } from "@/components/editor/rich-text-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseContent, CourseModule } from "@/services/api/teacher-portal-api";
import { today, type ConfirmFn } from "./shared";
import type { ContentsTabController } from "./use-contents-tab";

const CONTENT_META: Record<
  string,
  { icon: ElementType; label: string; className: string }
> = {
  video: { icon: Video, label: "Video", className: "text-red-500" },
  document: { icon: FileText, label: "Hujjat", className: "text-red-700" },
  link: { icon: LinkIcon, label: "Havola", className: "text-blue-600" },
  file: { icon: FileText, label: "Fayl", className: "text-slate-500" },
  text: { icon: FileText, label: "Matn", className: "text-emerald-600" },
};

/** Dars ichidagi bitta material qatori: holat belgilari va amallar */
export function ContentItemCard({
  module,
  content,
  contentIndex,
  sectionLessons,
  controller,
  confirm,
  onPreviewContent,
}: {
  module: CourseModule;
  content: CourseContent;
  contentIndex: number;
  /** Shu darsdagi barcha materiallar (tartibni o'zgartirish chegarasi uchun) */
  sectionLessons: CourseContent[];
  controller: ContentsTabController;
  confirm: ConfirmFn;
  onPreviewContent: (contentId: number) => void;
}) {
  const {
    moveContent,
    reorderContentsMutation,
    contentStatusMutation,
    submitReviewMutation,
    deleteContentMutation,
    downloadContent,
    downloadingContentId,
    editContent,
    setHistoryContent,
  } = controller;
  const meta = CONTENT_META[content.contentType] ?? CONTENT_META.file;
  const Icon = meta.icon;
  const modulePublished = module.status === "published";
  const validity = content.effective
    ? "Amalda"
    : content.validFrom > today()
      ? "Rejalashtirilgan"
      : "Muddati tugagan";
  const reviewLabel =
    content.reviewStatus === "approved"
      ? "Tasdiqlangan"
      : content.reviewStatus === "in_review"
        ? "Ekspertizada"
        : content.reviewStatus === "changes_requested"
          ? "Tuzatishga qaytarilgan"
          : "Ekspertizaga yuborilmagan";
  const compatible = content.compatibility.compatible;
  const compatibilityMessage = content.compatibility.issues
    .map((issue) => issue.message)
    .join("; ");
  return (
    <Card>
      <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <Icon className={`h-5 w-5 ${meta.className}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{content.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            #{content.position} · {meta.label} · v{content.contentVersion} ·{" "}
            {content.languageCode} · {content.authorName}
          </p>
          {content.durationMinutes != null && (
            <p className="text-xs text-muted-foreground">
              Davomiyligi: {content.durationMinutes} daqiqa
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {content.sourceName} · {content.validFrom} —{" "}
            {content.validUntil || "cheklanmagan"}
          </p>
          {content.asset && (
            <p className="text-xs text-muted-foreground truncate">
              {content.asset.originalFileName} · {formatBytes(content.asset.sizeBytes)}
            </p>
          )}
          {content.contentBody && (
            <p className="mt-1 text-sm line-clamp-2">{richTextToPlainText(content.contentBody)}</p>
          )}
          {!compatible && (
            <p className="mt-2 text-xs text-destructive">
              {compatibilityMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Materialni yuqoriga ko'chirish"
            disabled={contentIndex === 0 || reorderContentsMutation.isPending}
            onClick={() => moveContent(module.id, content.id, -1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Materialni pastga ko'chirish"
            disabled={
              contentIndex === sectionLessons.length - 1 ||
              reorderContentsMutation.isPending
            }
            onClick={() => moveContent(module.id, content.id, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Badge variant="outline">{meta.label}</Badge>
          <Badge
            variant={content.effective ? "default" : "secondary"}
          >
            {validity}
          </Badge>
          <Badge variant={compatible ? "default" : "destructive"}>
            {compatible ? "Til/dastur mos" : "Til/dastur nomos"}
          </Badge>
          <Badge
            variant={
              content.reviewStatus === "approved"
                ? "default"
                : "secondary"
            }
          >
            {reviewLabel}
          </Badge>
          <Badge
            variant={
              content.status === "published" ? "default" : "secondary"
            }
          >
            {content.status === "published" ? "Nashrda" : "Qoralama"}
          </Badge>
          {content.asset && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              disabled={downloadingContentId === content.id}
              onClick={() => void downloadContent(content)}
            >
              {downloadingContentId === content.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Yuklab olish
            </Button>
          )}
          {(content.contentUrl || content.asset || content.contentBody) && (
            <Button variant="ghost" size="sm" onClick={() => onPreviewContent(content.id)}>
              Shu yerda ochish
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setHistoryContent(content)}
          >
            <History className="h-4 w-4" />
            Tarix
          </Button>
          {content.status === "draft" &&
            ["draft", "changes_requested"].includes(
              content.reviewStatus,
            ) && (
              <Button
                variant="outline"
                size="sm"
                disabled={
                  submitReviewMutation.isPending || !compatible
                }
                title={!compatible ? compatibilityMessage : undefined}
                onClick={() =>
                  submitReviewMutation.mutate(content.id)
                }
              >
                Ekspertizaga
              </Button>
            )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Materialni tahrirlash"
            disabled={content.reviewStatus === "in_review"}
            onClick={() => editContent(content)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              content.status === "draft" &&
              (!modulePublished ||
                content.reviewStatus !== "approved" ||
                !compatible)
            }
            title={
              !compatible
                ? compatibilityMessage
                : content.reviewStatus !== "approved"
                  ? "Avval mustaqil ekspert tasdig'ini oling"
                  : !modulePublished
                    ? "Avval modulni nashr qiling"
                    : undefined
            }
            onClick={() =>
              contentStatusMutation.mutate({
                contentId: content.id,
                status:
                  content.status === "published"
                    ? "DRAFT"
                    : "PUBLISHED",
              })
            }
          >
            {content.status === "published" ? "Yashirish" : "Nashr"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={content.reviewStatus === "in_review" || deleteContentMutation.isPending}
            className="text-destructive"
            aria-label="Materialni o'chirish"
            onClick={async () => {
              if (await confirm({ title: `“${content.title}” darsi o‘chirilsinmi?`, confirmLabel: "O'chirish" })) deleteContentMutation.mutate(content.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
