import { describe, expect, it } from "vitest";
import { parseQuizText } from "@/lib/quiz-docx";

describe("parseQuizText", () => {
  it("HEMIS formatidagi savollarni variantlar va to'g'ri javob bilan oladi", () => {
    // mammoth paragraflarni bo'sh qator bilan ajratadi
    const text = [
      "Namuna: savollar ++++ bilan ajratiladi", "", "++++", "",
      "Tezlik birligi", "", "qaysi?", "", "====", "", "#m/s", "", "====", "", "kg", "", "++++", "",
      "1 km necha metr?", "====", "# 1000|1000 m", "+++++",
      "Belgilanmagan savol", "====", "a", "====", "b",
    ].join("\n");
    expect(parseQuizText(text)).toEqual([
      { text: "Tezlik birligi\nqaysi?", type: "SINGLE_CHOICE", options: ["m/s", "kg"], correctAnswer: "m/s", explanation: "", points: 1 },
      { text: "1 km necha metr?", type: "SHORT_ANSWER", options: [], correctAnswer: "1000|1000 m", explanation: "", points: 1 },
      { text: "Belgilanmagan savol", type: "SINGLE_CHOICE", options: ["a", "b"], correctAnswer: "", explanation: "", points: 1 },
    ]);
  });

  it("bir nechta to'g'ri belgisi bo'lsa javob tanlanmaydi, bo'sh matn savol bermaydi", () => {
    expect(parseQuizText("S?\n====\n#a\n====\n#b")[0].correctAnswer).toBe("");
    expect(parseQuizText("\n\n++++\n\n")).toEqual([]);
  });
});
