import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { extractApiError as extractAcademicError } from "../academic-api";
import { apiErrorMessage, responseErrorMessage } from "../api-error";
import { extractApiError as extractRbacError } from "../rbac-api";

function axiosError(status: number, data: unknown, message = `Request failed with status code ${status}`): AxiosError {
  const config = {} as InternalAxiosRequestConfig;
  const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, response);
}

describe("apiErrorMessage", () => {
  it("server javobidagi xabarni message → detail → error tartibida oladi", () => {
    expect(apiErrorMessage(axiosError(400, { message: "Guruh nomi band", error: "Bad Request" }))).toBe("Guruh nomi band");
    expect(apiErrorMessage(axiosError(422, { message: "  ", detail: "Semestr noto'g'ri" }))).toBe("Semestr noto'g'ri");
    expect(apiErrorMessage(axiosError(409, { error: "Reja tasdiqlangan" }))).toBe("Reja tasdiqlangan");
  });

  it("axios bo'lmagan, lekin response.data ko'rinishidagi obyektni ham tushunadi", () => {
    expect(apiErrorMessage({ response: { data: { message: "Parol noto'g'ri" } } }, "Xatolik")).toBe("Parol noto'g'ri");
  });

  it("server faqat holat nomini bersa, xato matniga (interceptor qo'ygan izohga) qaytadi", () => {
    const error = axiosError(404, { error: "Not Found" }, "Ma'lumot topilmadi. U o'chirilgan bo'lishi mumkin.");
    expect(apiErrorMessage(error, "Xatolik")).toBe("Ma'lumot topilmadi. U o'chirilgan bo'lishi mumkin.");
    expect(apiErrorMessage({ response: { data: { error: "Not Found" } } }, "Xatolik")).toBe("Xatolik");
  });

  it("oddiy Error va satrni o'z matni bilan qaytaradi", () => {
    expect(apiErrorMessage(new Error("Fayl juda katta"))).toBe("Fayl juda katta");
    expect(apiErrorMessage("Bekor qilindi")).toBe("Bekor qilindi");
  });

  it("matn topilmasa fallback, u berilmagan bo'lsa umumiy xabarni qaytaradi", () => {
    for (const value of [null, undefined, 42, {}, "", "   ", new Error(""), { response: { data: "<html>" } }]) {
      expect(apiErrorMessage(value, "Saqlanmadi")).toBe("Saqlanmadi");
    }
    expect(apiErrorMessage(undefined)).toBe("Amalni bajarib bo'lmadi.");
  });
});

describe("responseErrorMessage", () => {
  it("server matnini o'zgartirmasdan qaytaradi, bo'lmasa undefined", () => {
    expect(responseErrorMessage(axiosError(404, { error: "Not Found" }))).toBe("Not Found");
    expect(responseErrorMessage(axiosError(400, { message: 123 }))).toBeUndefined();
    expect(responseErrorMessage(new Error("x"))).toBeUndefined();
    expect(responseErrorMessage(null)).toBeUndefined();
  });
});

describe("extractApiError (academic-api)", () => {
  it("server xabarini, bo'lmasa axios matnini, bo'lmasa fallbackni Error qilib qaytaradi", () => {
    expect(extractAcademicError(axiosError(400, { message: "Kod band" }), "Saqlanmadi").message).toBe("Kod band");
    expect(extractAcademicError(axiosError(404, { error: "Not Found" }), "Saqlanmadi").message).toBe("Not Found");
    expect(extractAcademicError(axiosError(403, { message: "Ruxsat yo'q (server)" }), "Saqlanmadi").message).toBe("Ruxsat yo'q (server)");
    expect(extractAcademicError(axiosError(500, {}, "Server xatosi"), "Saqlanmadi").message).toBe("Server xatosi");
    expect(extractAcademicError(axiosError(500, {}, ""), "Saqlanmadi").message).toBe("Saqlanmadi");
  });

  it("oddiy Error o'zi qaytadi, boshqa qiymat fallback bilan almashtiriladi", () => {
    const original = new Error("Tekshiruvdan o'tmadi");
    expect(extractAcademicError(original, "Saqlanmadi")).toBe(original);
    expect(extractAcademicError("satr", "Saqlanmadi").message).toBe("Saqlanmadi");
  });
});

describe("extractApiError (rbac-api)", () => {
  it("aloqa uzilishi, 401 va 403 uchun server matni o'rniga tayyor xabar beradi", () => {
    const offline = new AxiosError("Network Error", "ERR_NETWORK", {} as InternalAxiosRequestConfig);
    expect(extractRbacError(offline, "Yuklanmadi").message).toBe("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
    expect(extractRbacError(axiosError(401, { message: "Token expired" }), "Yuklanmadi").message).toBe("Sessiya muddati tugagan. Qaytadan kiring.");
    expect(extractRbacError(axiosError(403, { message: "Ruxsat yo'q (server)" }), "Yuklanmadi").message).toBe("Sizda bu amal uchun huquq yo'q.");
  });

  it("boshqa holatlarda server xabarini, u bo'lmasa asl xatoning o'zini qaytaradi", () => {
    expect(extractRbacError(axiosError(400, { message: "Login band" }), "Yuklanmadi").message).toBe("Login band");
    expect(extractRbacError(axiosError(409, { error: "Conflict" }), "Yuklanmadi").message).toBe("Conflict");
    const bare = axiosError(500, {});
    expect(extractRbacError(bare, "Yuklanmadi")).toBe(bare);
    expect(extractRbacError(42, "Yuklanmadi").message).toBe("Yuklanmadi");
  });
});
