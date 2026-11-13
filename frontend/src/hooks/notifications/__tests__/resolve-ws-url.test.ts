import { describe, expect, it } from "vitest";
import { resolveWsUrl } from "../useWebSocketNotifications";

describe("resolveWsUrl", () => {
  const http = { protocol: "http:", host: "localhost:5173" };
  const https = { protocol: "https:", host: "lms.example.uz" };

  it("nisbiy manzilni sahifa manzilidan yasaydi", () => {
    expect(resolveWsUrl("/ws", http)).toBe("ws://localhost:5173/ws");
    expect(resolveWsUrl("/ws", https)).toBe("wss://lms.example.uz/ws");
    expect(resolveWsUrl("ws", https)).toBe("wss://lms.example.uz/ws");
  });

  it("absolyut manzilni o'zgartirmaydi", () => {
    expect(resolveWsUrl("ws://localhost:8081/ws", http)).toBe("ws://localhost:8081/ws");
    expect(resolveWsUrl("WSS://api.lms.example.uz/ws", http)).toBe("WSS://api.lms.example.uz/ws");
  });

  it("berilmagan bo'lsa /ws ishlatiladi", () => {
    expect(resolveWsUrl(undefined, http)).toBe("ws://localhost:5173/ws");
    expect(resolveWsUrl("  ", https)).toBe("wss://lms.example.uz/ws");
  });
});
