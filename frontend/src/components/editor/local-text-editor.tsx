import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RichTextContent } from './rich-text-content';
import type { RichTextEditorProps } from './rich-text-editor';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Local authoring tools also work without an external editor service or license key. */
export function LocalTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const [preview, setPreview] = useState(false);
  const [formula, setFormula] = useState('\\frac{a}{b}');
  const input = useRef<HTMLTextAreaElement>(null);
  const formulaId = useId();
  function insertHtml(before: string, after: string, fallback: string) {
    const start = input.current?.selectionStart ?? value.length;
    const end = input.current?.selectionEnd ?? value.length;
    const html = /<[a-z][\s\S]*>/i.test(value);
    const encode = (text: string) => html ? text : escape(text).replace(/\n/g, '<br>');
    onChange(encode(value.slice(0, start)) + before + encode(value.slice(start, end) || fallback) + after + encode(value.slice(end)));
    input.current?.focus();
  }
  return <div className="space-y-3 rounded-md border p-3">
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant={!preview ? 'secondary' : 'ghost'} onClick={() => setPreview(false)}>Matn / HTML</Button>
      <Button type="button" size="sm" variant={preview ? 'secondary' : 'ghost'} onClick={() => setPreview(true)}>Ko‘rinishi</Button>
    </div>
    {!preview && <>
      <div className="flex flex-wrap gap-1" aria-label="Matn vositalari">
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<h2>', '</h2>', 'Sarlavha')}>Sarlavha</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<strong>', '</strong>', 'Qalin matn')}>Qalin</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<em>', '</em>', 'Kursiv matn')}>Kursiv</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<ul><li>', '</li></ul>', 'Ro‘yxat bandi')}>Ro‘yxat</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<table><tbody><tr><th>', '</th><th>Qiymat</th></tr><tr><td>Misol</td><td>Natija</td></tr></tbody></table>', 'Ustun')}>Jadval</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => insertHtml('<pre><code>', '</code></pre>', 'Kod namunasi')}>Kod</Button>
      </div>
      <Textarea ref={input} className="min-h-56 font-mono" aria-label="Dars matni yoki HTML" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
      <div className="space-y-2 rounded border p-3">
        <label className="text-sm font-medium" htmlFor={formulaId}>Matematik formula (LaTeX)</label>
        <div className="flex flex-wrap gap-2">
          <Input id={formulaId} className="min-w-0 flex-1 font-mono" value={formula} disabled={disabled} onChange={event => setFormula(event.target.value)} />
          <Button type="button" variant="outline" disabled={disabled || !formula.trim()} onClick={() => {
            const base = /<[a-z][\s\S]*>/i.test(value) ? value : escape(value).replace(/\n/g, '<br>');
            onChange(`${base}<p>\\[${escape(formula.trim())}\\]</p>`);
          }}>Formula qo‘shish</Button>
        </div>
        <RichTextContent value={`\\[${formula}\\]`} plainText />
        <p className="text-xs text-muted-foreground">Kasr: \frac{'{a}{b}'} · Ildiz: \sqrt{'{x}'} · Daraja: x^2</p>
      </div>
    </>}
    {preview && <RichTextContent value={value || 'Matn kiriting — ko‘rinishi shu yerda chiqadi.'} contained className="min-h-56 p-2" />}
  </div>;
}
