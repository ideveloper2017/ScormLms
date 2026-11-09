import { describe, expect, it } from "vitest";
import { unwrap } from "../unwrap";

describe("unwrap", () => {
  it("muvaffaqiyatli javobdan ma'lumotni qaytaradi", () => {
    expect(unwrap({ success: true, data: { id: 7 } }, "Yuklanmadi")).toEqual({ id: 7 });
  });

  it("0, false va bo'sh satr kabi qiymatlarni ma'lumot deb hisoblaydi", () => {
    expect(unwrap({ success: true, data: 0 }, "Yuklanmadi")).toBe(0);
    expect(unwrap({ success: true, data: false }, "Yuklanmadi")).toBe(false);
    expect(unwrap({ success: true, data: "" }, "Yuklanmadi")).toBe("");
    expect(unwrap({ success: true, data: [] as number[] }, "Yuklanmadi")).toEqual([]);
  });

  it("muvaffaqiyatsiz javobda server xabari bilan xato tashlaydi", () => {
    expect(() => unwrap({ success: false, data: { id: 7 }, message: "Ruxsat yo'q" }, "Yuklanmadi")).toThrow("Ruxsat yo'q");
  });

  it("ma'lumot null yoki undefined bo'lsa xato tashlaydi", () => {
    expect(() => unwrap({ success: true, data: null as unknown as string, message: "Topilmadi" }, "Yuklanmadi")).toThrow("Topilmadi");
    expect(() => unwrap<string>({ success: true }, "Yuklanmadi")).toThrow("Yuklanmadi");
  });

  it("server xabari bo'lmasa fallback matnini ishlatadi", () => {
    expect(() => unwrap<string>({ success: false }, "Yuklanmadi")).toThrow("Yuklanmadi");
  });
});
