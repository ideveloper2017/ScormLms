import { useEffect, useId, useRef, useState, type DragEvent } from "react";
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
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedName = file?.name ?? existingFileName;

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected: File | null) => {
    if (disabled) return;
    if (selected && selected.size > maxSizeMb * 1024 * 1024) {
      setError(`Fayl hajmi ${maxSizeMb} MB dan oshmasligi kerak`);
      return;
    }
    const allowed = accept.split(",").map((item) => item.trim().toLowerCase());
    if (selected && !allowed.some((item) => item === "" || (item.startsWith(".")
      ? selected.name.toLowerCase().endsWith(item)
      : item.endsWith("/*") ? selected.type.startsWith(item.slice(0, -1)) : selected.type === item))) {
      setError(`Ruxsat etilgan formatlar: ${accept}`);
      return;
    }
    setError("");
    onFileChange(selected);
  };

  const acceptDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
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
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            selectFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </label>
      {error && <p id={`${inputId}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
      {preview && <img src={preview} alt="Tanlangan rasm ko'rinishi" className="max-h-48 rounded-lg object-contain" />}
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
            disabled={disabled}
            onClick={() => {
              selectFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
