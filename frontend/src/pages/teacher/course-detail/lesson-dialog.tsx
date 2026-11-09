import { Loader2, Plus } from "lucide-react";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CourseModule, TeacherCourse } from "@/services/api/teacher-portal-api";
import type { ContentType } from "./shared";
import { Field } from "./shared-ui";
import type { ContentsTabController } from "./use-contents-tab";

/** Material (dars) yaratish va tahrirlash dialogi; qoralamasi sessiyada saqlanadi */
export function LessonDialog({
  course,
  modules,
  controller,
}: {
  course: TeacherCourse;
  modules: CourseModule[];
  controller: ContentsTabController;
}) {
  const {
    lessonDraft,
    setContentTitle,
    setContentDescription,
    setContentUrl,
    setContentBody,
    setContentAssetId,
    setContentAssetName,
    setContentType,
    setContentModuleId,
    setContentLanguage,
    setContentAuthor,
    setContentVersion,
    setContentSourceName,
    setContentSourceUrl,
    setContentValidFrom,
    setContentValidUntil,
    setContentDuration,
    contentFile,
    setContentFile,
    selectContentFile,
    saveContent,
    closeLesson,
    saveContentMutation,
  } = controller;
  const {
    lessonDialogOpen,
    contentTitle,
    contentDescription,
    contentUrl,
    contentBody,
    contentAssetId,
    contentAssetName,
    contentType,
    contentModuleId,
    contentLanguage,
    contentAuthor,
    contentVersion,
    contentSourceName,
    contentSourceUrl,
    contentValidFrom,
    contentValidUntil,
    contentDuration,
    editingContentId,
  } = lessonDraft.value;

  return (
    <Dialog
      open={lessonDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeLesson();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContentId ? "Materialni tahrirlash" : "Yangi material qo'shish"}
          </DialogTitle>
          <DialogDescription>
            Darsni tanlang, material turini belgilang va materialni kiriting.
          </DialogDescription>
        </DialogHeader>
        <p role="status" className="text-sm text-muted-foreground">{lessonDraft.storageFailed
          ? "Qoralamani brauzerda saqlab bo'lmadi. Darsni saqlang."
          : "Dars matni va sozlamalari shu oynada saqlanadi. Sahifa yangilanganda yuklanmagan faylni qayta tanlang."}</p>
        <fieldset disabled={saveContentMutation.isPending} className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Dars nomi *">
            <Input
              maxLength={255}
              value={contentTitle}
              onChange={(event) => setContentTitle(event.target.value)}
              placeholder="Dars mavzusi"
            />
          </Field>
          <Field label="Bo'lim *">
            <Select
              value={contentModuleId}
              onValueChange={setContentModuleId}
              disabled={Boolean(editingContentId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={String(module.id)}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Dars turi *" className="md:col-span-2">
            <Select
              value={contentType}
              onValueChange={(value) => {
                setContentType(value as ContentType);
                setContentFile(null);
                setContentUrl("");
                setContentAssetId(null);
                setContentAssetName("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video dars</SelectItem>
                <SelectItem value="TEXT">Matnli dars va formula</SelectItem>
                <SelectItem value="DOCUMENT">PDF, Word yoki prezentatsiya</SelectItem>
                <SelectItem value="LINK">Ichki player uchun video manbasi</SelectItem>
                <SelectItem value="FILE">Boshqa fayl</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {contentType === "TEXT" ? (
            <Field label="Dars matni *" className="md:col-span-2">
              <LazyRichTextEditor
                disabled={saveContentMutation.isPending}
                value={contentBody}
                onChange={setContentBody}
                placeholder="Dars mazmunini yozing, HTML yoki formula kiriting..."
              />
            </Field>
          ) : contentType === "LINK" ? (
            <Field label="YouTube, Vimeo yoki MP4 manzili *" className="md:col-span-2">
              <Input
                value={contentUrl}
                onChange={(event) => setContentUrl(event.target.value)}
                placeholder="https://..."
              />
            </Field>
          ) : (
            <div className="space-y-4 md:col-span-2">
              <Field label={contentType === "VIDEO" ? "Video fayl" : "Fayl"}>
                <FileDropzone
                  disabled={saveContentMutation.isPending}
                  accept={
                    contentType === "VIDEO"
                      ? ".mp4,.webm"
                      : contentType === "DOCUMENT"
                        ? ".pdf,.txt,.html,.htm,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        : ".pdf,.txt,.csv,.html,.htm,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.mp4,.webm"
                  }
                  file={contentFile}
                  existingFileName={contentAssetName || undefined}
                  hint={
                    contentType === "VIDEO"
                      ? "Videoni shu yerga tashlang yoki tanlang"
                      : "Faylni shu yerga tashlang yoki tanlang"
                  }
                  onFileChange={selectContentFile}
                />
              </Field>
              <Field label="Yoki ichki player uchun video manzili">
                <Input
                  value={contentUrl}
                  disabled={Boolean(contentFile || contentAssetId)}
                  onChange={(event) => setContentUrl(event.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>
          )}
          <Field label="Til *">
            <Select value={contentLanguage} onValueChange={setContentLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O'zbekcha</SelectItem>
                <SelectItem value="ru">Ruscha</SelectItem>
                <SelectItem value="en">Inglizcha</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={editingContentId ? "Yangi versiya *" : "Versiya *"}>
            <Input
              value={contentVersion}
              onChange={(event) => setContentVersion(event.target.value)}
              placeholder="1.0"
            />
          </Field>
          <Field label="Muallif *">
            <Input
              value={contentAuthor}
              onChange={(event) => setContentAuthor(event.target.value)}
            />
          </Field>
          <Field label="Manba nomi *">
            <Input
              value={contentSourceName}
              onChange={(event) => setContentSourceName(event.target.value)}
              placeholder={course.subjectName || "Mualliflik materiali"}
            />
          </Field>
          <Field label="Manba havolasi">
            <Input
              value={contentSourceUrl}
              onChange={(event) => setContentSourceUrl(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Amal qilish boshlanishi *">
            <Input
              type="date"
              value={contentValidFrom}
              onChange={(event) => setContentValidFrom(event.target.value)}
            />
          </Field>
          <Field label="Amal qilish yakuni">
            <Input
              type="date"
              min={contentValidFrom}
              value={contentValidUntil}
              onChange={(event) => setContentValidUntil(event.target.value)}
            />
          </Field>
          <Field label="Davomiyligi (daqiqa)">
            <Input
              type="number"
              min="0"
              step="1"
              value={contentDuration}
              onChange={(event) => setContentDuration(event.target.value)}
              placeholder="Masalan: 45"
            />
          </Field>
          <Field label="Qisqa tavsif" className="md:col-span-2">
            <Textarea
              value={contentDescription}
              onChange={(event) => setContentDescription(event.target.value)}
            />
          </Field>
        </fieldset>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={saveContentMutation.isPending}
            onClick={closeLesson}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={saveContent}
            disabled={saveContentMutation.isPending || modules.length === 0}
            className="gap-2"
          >
            {saveContentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingContentId ? "Yangi versiyani saqlash" : "Materialni saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
