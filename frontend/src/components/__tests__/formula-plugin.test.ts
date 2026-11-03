import { ClassicEditor, Essentials, Paragraph } from "ckeditor5";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Formula, type FormulaOpener } from "@/components/editor/formula-plugin";

let editor: ClassicEditor | null = null;
const create = async (open?: FormulaOpener) => {
  const element = document.createElement("div");
  document.body.appendChild(element);
  editor = await ClassicEditor.create(element, {
    licenseKey: "GPL", plugins: [Essentials, Paragraph, Formula], toolbar: ["formula"], formula: { open },
  } as never);
  return editor;
};
afterEach(async () => { await editor?.destroy(); editor = null; });

// CKEditor jsdom'da sekinroq ishga tushadi
describe("Formula (CKEditor)", { timeout: 20_000 }, () => {
  it("saqlangan formula muharrirda KaTeX bilan chiziladi va o'zgarmay saqlanadi", async () => {
    const instance = await create();
    instance.setData("<p>Tezlik <span class=\"math-tex\">\\(v=\\frac{s}{t}\\)</span> va</p><p><span class=\"math-tex\">\\[E=mc^2\\]</span></p>");
    // Inline obyekt yonidagi bo'shliq &nbsp; bo'lib saqlanadi (CKEditor odati)
    expect(instance.getData()).toBe("<p>Tezlik&nbsp;<span class=\"math-tex\">\\(v=\\frac{s}{t}\\)</span>&nbsp;va</p><p><span class=\"math-tex\">\\[E=mc^2\\]</span></p>");
    const editable = instance.ui.getEditableElement()!;
    expect(editable.querySelectorAll(".ck-formula .katex")).toHaveLength(2);
    expect(editable.querySelector(".ck-formula_display")).not.toBeNull();
  });

  it("tugma oynani ochadi va formulani kursor joyiga qo'shadi", async () => {
    const open = vi.fn<FormulaOpener>().mockResolvedValue({ latex: "\\sqrt{x}", display: false });
    const instance = await create(open);
    instance.setData("<p>Ildiz:</p>");
    instance.model.change((writer) => writer.setSelection(instance.model.document.getRoot()!.getChild(0)!, "end"));
    const button = [...instance.ui.view.toolbar!.items].find((item) => (item as { label?: string }).label === "∑ Formula") as { fire: (event: string) => void };
    button.fire("execute");
    expect(open).toHaveBeenCalledWith({ latex: "", display: false });
    await vi.waitFor(() => expect(instance.getData()).toBe("<p>Ildiz:<span class=\"math-tex\">\\(\\sqrt{x}\\)</span></p>"));
  });
});
