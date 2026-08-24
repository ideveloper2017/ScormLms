import { lazy, Suspense } from "react";
import type { RichTextEditorProps } from "@/components/editor/rich-text-editor";

const RichTextEditor = lazy(() => import("@/components/editor/rich-text-editor")
  .then((module) => ({ default: module.RichTextEditor })));

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return <Suspense fallback={<div className="flex min-h-48 items-center justify-center rounded-md border text-sm text-muted-foreground">Muharrir yuklanmoqda...</div>}>
    <RichTextEditor {...props} />
  </Suspense>;
}
