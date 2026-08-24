import { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5";
import MathType from "@wiris/mathtype-ckeditor5/dist/index.js";
import { Textarea } from "@/components/ui/textarea";
import "ckeditor5/ckeditor5.css";
import "@wiris/mathtype-ckeditor5/dist/index.css";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, disabled = false }: RichTextEditorProps) {
  const licenseKey = import.meta.env.VITE_CKEDITOR_LICENSE_KEY?.trim();
  const config = useMemo(() => licenseKey ? ({
    licenseKey,
    plugins: [
      Essentials,
      Autoformat,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Underline,
      Alignment,
      Link,
      List,
      BlockQuote,
      Table,
      TableToolbar,
      MathType,
    ],
    toolbar: {
      items: [
        "undo", "redo", "|",
        "heading", "|",
        "bold", "italic", "underline", "|",
        "alignment", "bulletedList", "numberedList", "|",
        "link", "insertTable", "blockQuote", "|",
        "MathType", "ChemType",
      ],
      shouldNotGroupWhenFull: false,
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
    placeholder,
  }) : null, [licenseKey, placeholder]);

  if (!config) {
    return <div className="space-y-2">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        CKEditor ishlashi uchun <code>VITE_CKEDITOR_LICENSE_KEY</code> qiymatini kiriting
        (GPL-compatible loyiha uchun <code>GPL</code>, aks holda commercial kalit).
        Kalit kiritilguncha oddiy matn muharriri ishlaydi.
      </div>
      <Textarea
        className="min-h-48"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>;
  }

  return <div className="ckeditor-shell">
    <CKEditor
      editor={ClassicEditor}
      data={value}
      disabled={disabled}
      config={config}
      onChange={(_, editor) => onChange(editor.getData())}
    />
  </div>;
}
