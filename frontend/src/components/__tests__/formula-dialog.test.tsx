import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormulaDialog } from "@/components/editor/formula-dialog";
import { formulaText, parseFormulaText } from "@/components/editor/formula-plugin";

describe("formula", () => {
  it("LaTeX saqlanadigan matnga va qaytib o'giriladi", () => {
    expect(formulaText({ latex: "\\frac{a}{b}", display: false })).toBe("\\(\\frac{a}{b}\\)");
    expect(formulaText({ latex: "x^2", display: true })).toBe("\\[x^2\\]");
    expect(parseFormulaText(" \\[x^2\\] ")).toEqual({ latex: "x^2", display: true });
    expect(parseFormulaText("\\(a+b\\)")).toEqual({ latex: "a+b", display: false });
    expect(parseFormulaText("\\(a+b\\]")).toBeNull();
    expect(parseFormulaText("oddiy matn")).toBeNull();
  });

  it("oyna shablon qo'shadi, ko'rinishni chizadi va natijani qaytaradi", () => {
    const onClose = vi.fn();
    render(<FormulaDialog value={{ latex: "", display: false }} onClose={onClose} />);
    expect(screen.getByRole("button", { name: "Qo'shish" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("LaTeX"), { target: { value: "v = " } });
    fireEvent.click(screen.getByRole("button", { name: "a/b" }));
    expect(screen.getByLabelText("LaTeX")).toHaveValue("v = \\frac{a}{b}");
    expect(screen.getByLabelText("Formula ko'rinishi").querySelector(".katex")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("Alohida qatorda (markazda)"));
    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));
    expect(onClose).toHaveBeenCalledWith({ latex: "v = \\frac{a}{b}", display: true });
  });

  it("mavjud formulani tahrirlashda Saqlash, bekor qilinsa null", () => {
    const onClose = vi.fn();
    render(<FormulaDialog value={{ latex: "x^2", display: false }} onClose={onClose} />);
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Bekor qilish" }));
    expect(onClose).toHaveBeenCalledWith(null);
  });
});
