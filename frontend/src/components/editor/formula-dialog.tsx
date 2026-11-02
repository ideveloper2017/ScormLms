import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextContent } from "./rich-text-content";
import { formulaText, type FormulaValue } from "./formula-plugin";

/** Tez qo'shiladigan shablonlar: [tugma, LaTeX] */
const SNIPPETS: [string, string][] = [
  ["a/b", "\\frac{a}{b}"], ["√x", "\\sqrt{x}"], ["ⁿ√x", "\\sqrt[n]{x}"], ["xⁿ", "x^{n}"], ["xᵢ", "x_{i}"],
  ["∫", "\\int_{a}^{b} f(x)\\,dx"], ["∑", "\\sum_{i=1}^{n} x_i"], ["lim", "\\lim_{x \\to 0}"], ["v⃗", "\\vec{v}"],
  ["( )", "\\left( x \\right)"], ["matritsa", "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"],
  ["≤", "\\le"], ["≥", "\\ge"], ["≠", "\\neq"], ["≈", "\\approx"], ["±", "\\pm"], ["·", "\\cdot"], ["×", "\\times"],
  ["∞", "\\infty"], ["α", "\\alpha"], ["β", "\\beta"], ["γ", "\\gamma"], ["Δ", "\\Delta"], ["θ", "\\theta"],
  ["λ", "\\lambda"], ["μ", "\\mu"], ["π", "\\pi"], ["ω", "\\omega"],
];

/** CKEditor "∑ Formula" tugmasi oynasi: LaTeX, shablonlar va jonli ko'rinish (KaTeX) */
export function FormulaDialog({ value, onClose }: { value: FormulaValue; onClose: (value: FormulaValue | null) => void }) {
  const [latex, setLatex] = useState(value.latex);
  const [display, setDisplay] = useState(value.display);
  const input = useRef<HTMLTextAreaElement>(null);
  const insert = (snippet: string) => {
    const start = input.current?.selectionStart ?? latex.length;
    const end = input.current?.selectionEnd ?? latex.length;
    setLatex(latex.slice(0, start) + snippet + latex.slice(end));
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(null); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Matematik formula</DialogTitle>
        <DialogDescription>LaTeX ko'rinishida yozing yoki shablonni tanlang — ko'rinishi pastda chiqadi.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap gap-1" aria-label="Formula shablonlari">
        {SNIPPETS.map(([label, snippet]) => <Button key={label} type="button" variant="outline" size="sm" className="h-8 min-w-8 px-2"
          title={snippet} onClick={() => insert(snippet)}>{label}</Button>)}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="formula-latex">LaTeX</Label>
        <Textarea id="formula-latex" ref={input} rows={3} className="font-mono" value={latex} autoFocus
          placeholder="Masalan: v = \frac{s}{t}" onChange={(e) => setLatex(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} />
        Alohida qatorda (markazda)
      </label>
      <div aria-label="Formula ko'rinishi" className="min-h-16 overflow-x-auto rounded-md border bg-muted/30 p-3">
        {latex.trim() ? <RichTextContent value={formulaText({ latex, display: true })} plainText />
          : <p className="text-sm text-muted-foreground">Formula ko'rinishi shu yerda</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose(null)}>Bekor qilish</Button>
        <Button disabled={!latex.trim()} onClick={() => onClose({ latex: latex.trim(), display })}>{value.latex ? "Saqlash" : "Qo'shish"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
