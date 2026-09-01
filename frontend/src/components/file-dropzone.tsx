import { useId, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  accept: string;
  file: File | null;
  existingFileName?: string;
  disabled?: boolean;
  hint?: string;
  maxSizeMb?: number;
  onFileChange: (file: File | null) => void;
}

export function FileDropzone({
  accept,
  file,
  existingFileName,
  disabled = false,
  hint = "Faylni shu yerga tashlang yoki kompyuterdan tanlang",
  maxSizeMb = 200,
  onFileChange,
}: FileDropzoneProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const selectedName = file?.name ?? existingFileName;

  const acceptDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) onFileChange(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={acceptDrop}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-6 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-primary" />
        <span className="font-medium">{hint}</span>
        <span className="mt-1 text-xs text-muted-foreground">
          Bitta fayl, maksimum {maxSizeMb} MB
        </span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) =>
            onFileChange(event.target.files?.[0] ?? null)
          }
        />
      </label>
      {selectedName && (
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{selectedName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Tanlangan faylni olib tashlash"
            onClick={() => onFileChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
