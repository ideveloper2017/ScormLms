import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { getToken } from "@/lib/api";

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8080/ws";

/**
 * WebSocket orqali real-time bildirishnomalarni qabul qiladi.
 *
 * Server /user/{username}/queue/notifications kanaliga yangi bildirishnoma
 * push qilganda, React Query cachelari invalidate qilinadi va avtomatik
 * refetch ishga tushadi — polling bilan birgalikda ishlaydi.
 *
 * Ishlash tartibi:
 *   1. STOMP CONNECT → Authorization: Bearer <token> headerida JWT yuboriladi
 *   2. Backend WebSocketAuthChannelInterceptor JWT ni tekshiradi
 *   3. Muvaffaqiyatli bo'lsa /user/queue/notifications ga subscribe bo'lamiz
 *   4. Xabar kelganda queryClient.invalidateQueries() chaqiriladi
 */
export function useWebSocketNotifications() {
  const queryClient = useQueryClient();
  const clientRef   = useRef<Client | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // Heartbeat: server va client o'rtasidagi ulanish tirik ekanligini tekshirish
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      // Uzilgandan so'ng 5 sekund kutib qayta ulanadi
      reconnectDelay: 5_000,

      onConnect: () => {
        // Foydalanuvchiga shaxsiy kanal — /user/queue/notifications
        client.subscribe("/user/queue/notifications", () => {
          // Yangi bildirishnoma keldi — query cacheni yangilaymiz
          queryClient.invalidateQueries({ queryKey: qk.notifications.count() });
          queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
        });
      },

      onStompError: (frame) => {
        console.warn("[WS] STOMP xatosi:", frame.headers["message"]);
      },

      onDisconnect: () => {
        console.debug("[WS] Uzildi — avtomatik qayta ulanish kutilmoqda");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [queryClient]);
}
