import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import api, { refreshToken, SESSION_EXPIRED_EVENT } from "@/lib/api";

const ok = <T,>(data: T) => ({ success: true, data });

describe("access token yangilanishi", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    localStorage.clear();
    localStorage.setItem("token", "old-access");
    localStorage.setItem("refreshToken", "refresh-1");
  });

  afterEach(() => {
    mock.restore();
    localStorage.clear();
  });

  it("yangilash so'rovida access token emas, refresh token yuboriladi", async () => {
    mock.onPost("/auth/refresh-token").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer refresh-1");
      return [200, ok({ accessToken: "new-access", refreshToken: "refresh-2", expiresIn: 3600 })];
    });

    const tokens = await refreshToken();

    expect(tokens.accessToken).toBe("new-access");
    expect(localStorage.getItem("token")).toBe("new-access");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-2");
  });

  it("401 kelganda token yangilanib, so'rov yangi token bilan qayta yuboriladi", async () => {
    mock.onPost("/auth/refresh-token").reply(200, ok({ accessToken: "new-access", refreshToken: "refresh-2", expiresIn: 3600 }));
    mock.onGet("/students/me").reply((config) =>
      config.headers?.Authorization === "Bearer new-access" ? [200, ok({ id: 7 })] : [401, { message: "expired" }]);

    const response = await api.get("/students/me");

    expect(response.data.data).toEqual({ id: 7 });
    expect(mock.history.post.filter((r) => r.url === "/auth/refresh-token")).toHaveLength(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("bir vaqtda kelgan bir nechta 401 uchun token bir marta yangilanadi", async () => {
    mock.onPost("/auth/refresh-token").reply(200, ok({ accessToken: "new-access", refreshToken: "refresh-2", expiresIn: 3600 }));
    mock.onGet(/\/items\/\d/).reply((config) =>
      config.headers?.Authorization === "Bearer new-access" ? [200, ok(config.url)] : [401, {}]);

    const results = await Promise.all([api.get("/items/1"), api.get("/items/2"), api.get("/items/3")]);

    expect(results.map((r) => r.data.data)).toEqual(["/items/1", "/items/2", "/items/3"]);
    expect(mock.history.post.filter((r) => r.url === "/auth/refresh-token")).toHaveLength(1);
  });

  it("yangilab bo'lmasa sessiya tozalanadi va ilovaga xabar beriladi", async () => {
    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    mock.onPost("/auth/refresh-token").reply(401, { message: "Refresh token yaroqsiz" });
    mock.onPost("/tests/5/submit").reply(401, {});

    await expect(api.post("/tests/5/submit", {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    // Qayta yuborilgan so'rov yo'q: cheksiz aylanish bo'lmaydi
    expect(mock.history.post.filter((r) => r.url === "/tests/5/submit")).toHaveLength(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  });

  it("qayta yuborilgan so'rov yana 401 bersa ikkinchi marta yangilanmaydi", async () => {
    mock.onPost("/auth/refresh-token").reply(200, ok({ accessToken: "new-access", refreshToken: "refresh-2", expiresIn: 3600 }));
    mock.onGet("/always-401").reply(401, {});

    await expect(api.get("/always-401")).rejects.toMatchObject({ response: { status: 401 } });

    expect(mock.history.post.filter((r) => r.url === "/auth/refresh-token")).toHaveLength(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("login so'rovidagi 401 (parol xato) tokenni yangilashga urinmaydi", async () => {
    mock.onPost("/auth/login").reply(401, { message: "Login yoki parol noto'g'ri" });

    await expect(api.post("/auth/login", { username: "a", password: "b" })).rejects.toBeTruthy();

    expect(mock.history.post.filter((r) => r.url === "/auth/refresh-token")).toHaveLength(0);
    expect(localStorage.getItem("refreshToken")).toBe("refresh-1");
  });

  it("refresh token boshqa oynada yangilangan bo'lsa foydalanuvchi chiqarib yuborilmaydi", async () => {
    mock.onPost("/auth/refresh-token").reply(() => {
      // Boshqa oyna shu orada yangi tokenlarni saqlab qo'ygan
      localStorage.setItem("token", "other-tab-access");
      localStorage.setItem("refreshToken", "other-tab-refresh");
      return [401, { message: "Refresh token yaroqsiz" }];
    });

    const tokens = await refreshToken();

    expect(tokens.accessToken).toBe("other-tab-access");
    expect(localStorage.getItem("token")).toBe("other-tab-access");
  });

  it("refresh token bo'lmasa 401 oddiy xato sifatida qaytadi", async () => {
    localStorage.removeItem("refreshToken");
    mock.onGet("/students/me").reply(401, {});

    await expect(api.get("/students/me")).rejects.toMatchObject({ message: "Sessiya tugagan. Tizimga qayta kiring." });

    expect(mock.history.post).toHaveLength(0);
  });
});
