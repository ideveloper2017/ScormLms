import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import api, {
  clearAuthData, getToken, isAuthenticated, login, logout, refreshToken, SESSION_EXPIRED_EVENT, SESSION_FLAG_KEY,
} from "@/lib/api";

const ok = <T,>(data: T) => ({ success: true, data });
const tokens = (accessToken: string) => ok({ accessToken, expiresIn: 3600 });
const refreshCalls = (mock: MockAdapter) => mock.history.post.filter((r) => r.url === "/auth/refresh-token");

/** Tizimga kirilgan holat: access token xotirada, sessiya belgisi localStorage'da. */
async function signIn(mock: MockAdapter, accessToken = "old-access") {
  mock.onPost("/auth/login").replyOnce(200, ok({ accessToken, expiresIn: 3600, user: { id: 1, username: "ali", roles: [] } }));
  await login({ username: "ali", password: "parol" });
  mock.resetHistory();
}

describe("sessiya: access token xotirada, refresh token HttpOnly cookie'da", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    localStorage.clear();
    clearAuthData();
  });

  afterEach(() => {
    mock.restore();
    localStorage.clear();
    clearAuthData();
  });

  it("kirishdan keyin hech qanday token brauzer xotirasiga (localStorage) yozilmaydi", async () => {
    await signIn(mock, "secret-access");

    expect(getToken()).toBe("secret-access");
    expect(localStorage.getItem(SESSION_FLAG_KEY)).toBe("1");
    const stored = Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key)}`).join(";");
    expect(stored).not.toContain("secret-access");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("yangilash so'rovi token yubormaydi: server refresh tokenni cookie'dan oladi", async () => {
    await signIn(mock);
    mock.onPost("/auth/refresh-token").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      expect(config.withCredentials).toBe(true);
      return [200, tokens("new-access")];
    });

    const result = await refreshToken();

    expect(result.accessToken).toBe("new-access");
    expect(getToken()).toBe("new-access");
  });

  it("401 kelganda token yangilanib, so'rov yangi token bilan qayta yuboriladi", async () => {
    await signIn(mock);
    mock.onPost("/auth/refresh-token").reply(200, tokens("new-access"));
    mock.onGet("/students/me").reply((config) =>
      config.headers?.Authorization === "Bearer new-access" ? [200, ok({ id: 7 })] : [401, { message: "expired" }]);

    const response = await api.get("/students/me");

    expect(response.data.data).toEqual({ id: 7 });
    expect(refreshCalls(mock)).toHaveLength(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("bir vaqtda kelgan bir nechta 401 uchun token bir marta yangilanadi", async () => {
    await signIn(mock);
    mock.onPost("/auth/refresh-token").reply(200, tokens("new-access"));
    mock.onGet(/\/items\/\d/).reply((config) =>
      config.headers?.Authorization === "Bearer new-access" ? [200, ok(config.url)] : [401, {}]);

    const results = await Promise.all([api.get("/items/1"), api.get("/items/2"), api.get("/items/3")]);

    expect(results.map((r) => r.data.data)).toEqual(["/items/1", "/items/2", "/items/3"]);
    expect(refreshCalls(mock)).toHaveLength(1);
  });

  it("yangilab bo'lmasa sessiya tozalanadi va ilovaga xabar beriladi", async () => {
    await signIn(mock);
    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    mock.onPost("/auth/refresh-token").reply(401, { message: "Sessiya tugagan" });
    mock.onPost("/tests/5/submit").reply(401, {});

    await expect(api.post("/tests/5/submit", {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
    expect(localStorage.getItem(SESSION_FLAG_KEY)).toBeNull();
    // Asl so'rov qayta yuborilmagan: cheksiz aylanish bo'lmaydi
    expect(mock.history.post.filter((r) => r.url === "/tests/5/submit")).toHaveLength(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  });

  it("boshqa oyna aynan shu paytda yangilagan bo'lsa bir marta qayta urinadi va chiqarib yubormaydi", async () => {
    await signIn(mock);
    mock.onPost("/auth/refresh-token")
      .replyOnce(401, { message: "Refresh token revoked" })
      .onPost("/auth/refresh-token").replyOnce(200, tokens("after-retry"));

    const result = await refreshToken();

    expect(result.accessToken).toBe("after-retry");
    expect(refreshCalls(mock)).toHaveLength(2);
    expect(localStorage.getItem(SESSION_FLAG_KEY)).toBe("1");
  });

  it("qayta yuborilgan so'rov yana 401 bersa ikkinchi marta yangilanmaydi", async () => {
    await signIn(mock);
    mock.onPost("/auth/refresh-token").reply(200, tokens("new-access"));
    mock.onGet("/always-401").reply(401, {});

    await expect(api.get("/always-401")).rejects.toMatchObject({ response: { status: 401 } });

    expect(refreshCalls(mock)).toHaveLength(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("login so'rovidagi 401 (parol xato) tokenni yangilashga urinmaydi", async () => {
    await signIn(mock);
    mock.onPost("/auth/login").reply(401, { message: "Login yoki parol noto'g'ri" });

    await expect(api.post("/auth/login", { username: "a", password: "b" })).rejects.toBeTruthy();

    expect(refreshCalls(mock)).toHaveLength(0);
  });

  it("sahifa yangilanganda (xotira bo'sh) sessiya cookie orqali tiklanadi", async () => {
    // Avvalgi tashrifdan faqat belgi qolgan; access token xotirada yo'q
    localStorage.setItem(SESSION_FLAG_KEY, "1");
    mock.onPost("/auth/refresh-token").reply(200, tokens("restored-access"));

    await expect(isAuthenticated()).resolves.toBe(true);

    expect(getToken()).toBe("restored-access");
  });

  it("tizimga hech qachon kirilmagan bo'lsa serverga so'rov yuborilmaydi", async () => {
    await expect(isAuthenticated()).resolves.toBe(false);

    mock.onGet("/students/me").reply(401, {});
    await expect(api.get("/students/me")).rejects.toMatchObject({ message: "Sessiya tugagan. Tizimga qayta kiring." });
    expect(mock.history.post).toHaveLength(0);
  });

  it("eski versiyadan qolgan refresh token bir marta yuboriladi va localStorage'dan o'chiriladi", async () => {
    localStorage.setItem("token", "legacy-access");
    localStorage.setItem("refreshToken", "legacy-refresh");
    localStorage.setItem("tokenExpiresAt", "1");
    mock.onPost("/auth/refresh-token").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer legacy-refresh");
      // Eski mijoz rejimida server tokenni tanada ham qaytaradi: u saqlanmasligi kerak
      return [200, ok({ accessToken: "migrated-access", refreshToken: "must-not-be-stored", expiresIn: 3600 })];
    });

    await expect(isAuthenticated()).resolves.toBe(true);

    expect(getToken()).toBe("migrated-access");
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("tokenExpiresAt")).toBeNull();
    expect(JSON.stringify({ ...localStorage })).not.toContain("must-not-be-stored");
  });

  it("chiqishda server cookie'ni o'chirishi uchun so'rov yuboriladi va holat tozalanadi", async () => {
    await signIn(mock);
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    mock.onPost("/auth/logout").reply(204);

    await logout();

    expect(mock.history.post.filter((r) => r.url === "/auth/logout")).toHaveLength(1);
    expect(getToken()).toBeNull();
    expect(localStorage.getItem(SESSION_FLAG_KEY)).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
