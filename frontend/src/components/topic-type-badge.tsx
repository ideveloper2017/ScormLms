import { Badge } from "@/components/ui/badge";
import { topicTypeMeta } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import type { SyllabusTopicType } from "@/services/api/syllabus-api";

/** Mashg'ulot turi (nazariy / amaliy / laboratoriya / seminar) va ixtiyoriy soat belgisi. */
export function TopicTypeBadge({ type, hours, suffix = "soat", className }: {
  type: SyllabusTopicType;
  hours?: number | null;
  suffix?: string;
  className?: string;
}) {
  const meta = topicTypeMeta[type] ?? topicTypeMeta.THEORETICAL;
  return (
    <Badge variant="outline" className={cn("shrink-0", meta.badge, className)}>
      {meta.short}{hours ? ` · ${hours} ${suffix}` : ""}
    </Badge>
  );
}
