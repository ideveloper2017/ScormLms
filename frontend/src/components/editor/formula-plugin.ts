import { ButtonView, Command, Plugin, Widget, toWidget, viewToModelPositionOutsideModelElement, type Editor } from "ckeditor5";
import katex from "katex";

/** Formula: LaTeX matni; display — alohida qatorda (\[ \]), aks holda matn ichida (\( \)) */
export interface FormulaValue { latex: string; display: boolean }
/** Formula oynasini ochadi (React tomonda); bekor qilinsa null */
export type FormulaOpener = (current: FormulaValue) => Promise<FormulaValue | null>;

/** Saqlanadigan HTML: <span class="math-tex">\(...\)</span> — o'qish sahifasida KaTeX auto-render chizadi */
export const formulaText = ({ latex, display }: FormulaValue) => (display ? `\\[${latex}\\]` : `\\(${latex}\\)`);
export function parseFormulaText(text: string): FormulaValue | null {
  const match = text.trim().match(/^\\([[(])([\s\S]*)\\([\])])$/);
  if (!match || (match[1] === "[") !== (match[3] === "]")) return null;
  return { latex: match[2].trim(), display: match[1] === "[" };
}

class InsertFormulaCommand extends Command {
  override refresh() {
    const { model } = this.editor;
    const selected = model.document.selection.getSelectedElement();
    this.value = selected?.is("element", "formula")
      ? { latex: String(selected.getAttribute("latex") ?? ""), display: Boolean(selected.getAttribute("display")) } : null;
    this.isEnabled = model.schema.findAllowedParent(model.document.selection.getFirstPosition()!, "formula") !== null;
  }

  override execute(value: FormulaValue) {
    const { model } = this.editor;
    model.change((writer) => {
      model.insertObject(writer.createElement("formula", { latex: value.latex, display: value.display }), null, null, { setSelection: "on" });
    });
  }
}

/**
 * CKEditor uchun matematik formula (KaTeX, tashqi xizmat va litsenziyasiz): tugma LaTeX oynasini ochadi,
 * formula muharrirda chizilgan holda ko'rinadi; tanlangan formulani qayta bosish — tahrirlash.
 */
export class Formula extends Plugin {
  static get requires() { return [Widget] as const; }
  static get pluginName() { return "Formula" as const; }

  init() {
    const editor = this.editor;
    editor.model.schema.register("formula", { inheritAllFrom: "$inlineObject", allowAttributes: ["latex", "display"] });

    editor.conversion.for("upcast").elementToElement({
      view: { name: "span", classes: "math-tex" },
      model: (view, { writer }) => {
        const text = [...view.getChildren()].map((child) => (child.is("$text") ? child.data : "")).join("");
        const value = parseFormulaText(text) ?? { latex: text, display: false };
        return writer.createElement("formula", { latex: value.latex, display: value.display });
      },
    });
    editor.conversion.for("dataDowncast").elementToElement({
      model: "formula",
      view: (model, { writer }) => {
        const span = writer.createContainerElement("span", { class: "math-tex" });
        writer.insert(writer.createPositionAt(span, 0), writer.createText(formulaText(valueOf(model))));
        return span;
      },
    });
    editor.conversion.for("editingDowncast").elementToElement({
      model: "formula",
      view: (model, { writer }) => {
        const value = valueOf(model);
        const span = writer.createContainerElement("span", { class: `math-tex ck-formula${value.display ? " ck-formula_display" : ""}` });
        const rendered = writer.createRawElement("span", {}, (dom) => {
          katex.render(value.latex, dom, { displayMode: value.display, throwOnError: false, trust: false, maxExpand: 500, maxSize: 20 });
        });
        writer.insert(writer.createPositionAt(span, 0), rendered);
        return toWidget(span, writer, { label: "Formula" });
      },
    });
    editor.editing.mapper.on("viewToModelPosition", viewToModelPositionOutsideModelElement(editor.model, (view) => view.hasClass("ck-formula")));
    editor.commands.add("insertFormula", new InsertFormulaCommand(editor));

    editor.ui.componentFactory.add("formula", (locale) => {
      const command = editor.commands.get("insertFormula")!;
      const button = new ButtonView(locale);
      button.set({ label: "∑ Formula", withText: true, tooltip: "Matematik formula (LaTeX)" });
      button.bind("isEnabled").to(command, "isEnabled");
      button.on("execute", () => openFormula(editor));
      return button;
    });
  }
}

const valueOf = (model: { getAttribute: (key: string) => unknown }): FormulaValue =>
  ({ latex: String(model.getAttribute("latex") ?? ""), display: Boolean(model.getAttribute("display")) });

function openFormula(editor: Editor) {
  const open = editor.config.get("formula.open" as never) as FormulaOpener | undefined;
  const current = (editor.commands.get("insertFormula")!.value as FormulaValue | null) ?? { latex: "", display: false };
  if (!open) return;
  void open(current).then((value) => {
    if (value?.latex.trim()) editor.execute("insertFormula", { latex: value.latex.trim(), display: value.display });
    editor.editing.view.focus();
  });
}
