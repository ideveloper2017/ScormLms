import { useMemo, useState } from "react";
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
  Subscript,
  Superscript,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5";
import MathType from "@wiris/mathtype-ckeditor5/dist/index.js";
import { Formula, type FormulaValue } from './formula-plugin';
import { FormulaDialog } from './formula-dialog';
import { LocalTextEditor } from './local-text-editor';
import "ckeditor5/ckeditor5.css";
import "@wiris/mathtype-ckeditor5/dist/index.css";
import "katex/dist/katex.min.css";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * CKEditor 5: matn, jadval, havola va matematik formula ("∑ Formula" — LaTeX, KaTeX bilan chiziladi, tashqi
 * xizmatsiz). MathType/ChemType faqat WIRIS litsenziyasi bo'lsa yoqiladi (VITE_MATHTYPE_ENABLED=true).
 * CKEditor litsenziya kaliti berilmasa — oddiy matn/HTML muharriri (unda ham LaTeX formula bor).
 */
export function RichTextEditor({ value, onChange, placeholder, disabled = false }: RichTextEditorProps) {
  const licenseKey = import.meta.env.VITE_CKEDITOR_LICENSE_KEY?.trim();
  const mathType = import.meta.env.VITE_MATHTYPE_ENABLED === "true";
  const [formula, setFormula] = useState<{ value: FormulaValue; resolve: (value: FormulaValue | null) => void } | null>(null);
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
      Subscript,
      Superscript,
      Alignment,
      Link,
      List,
      BlockQuote,
      Table,
      TableToolbar,
      Formula,
      ...(mathType ? [MathType] : []),
    ],
    toolbar: {
      items: [
        // Formula oldinda — tor oynada "⋮" ichiga yashirinmasin
        "formula", ...(mathType ? ["MathType", "ChemType"] : []), "|",
        "heading", "|",
        "bold", "italic", "underline", "subscript", "superscript", "|",
        "alignment", "bulletedList", "numberedList", "|",
        "link", "insertTable", "blockQuote", "|",
        "undo", "redo",
      ],
      shouldNotGroupWhenFull: false,
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
    formula: {
      open: (current: FormulaValue) => new Promise<FormulaValue | null>((resolve) => setFormula({ value: current, resolve })),
    },
    placeholder,
  }) : null, [licenseKey, mathType, placeholder]);

  if (!config) {
    return <LocalTextEditor value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} />;
  }

  return <div className="ckeditor-shell">
    <CKEditor
      editor={ClassicEditor}
      data={value}
      disabled={disabled}
      config={config}
      onChange={(_, editor) => onChange(editor.getData())}
    />
    {formula && <FormulaDialog value={formula.value} onClose={(result) => { formula.resolve(result); setFormula(null); }} />}
  </div>;
}
