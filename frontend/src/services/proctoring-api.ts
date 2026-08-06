import api, { API_BASE_URL, getToken, type ApiResponse } from '@/lib/api';

export interface ProctoringChallenge {
  sessionId: string;
  nonce: string;
  direction: 'left' | 'right';
  expiresAt: Date;
}

export interface ProctoringVerification {
  sessionId: string;
  verified: boolean;
  verifiedAt: Date;
}

export type ProctoringEventType =
  | 'CAMERA_STARTED'
  | 'CAMERA_STOPPED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'TAB_HIDDEN'
  | 'TAB_VISIBLE'
  | 'WINDOW_BLURRED'
  | 'WINDOW_FOCUSED'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_ONLINE'
  | 'HEARTBEAT'
  | 'PAGE_EXIT';

export interface ProctoringClientEvent {
  clientEventId: string;
  type: ProctoringEventType;
  occurredAt: string;
}

export interface ProctoringEventBatchResult {
  accepted: number;
  duplicates: number;
  serverTime: Date;
}

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message || fallback);
  return response.data;
}

export async function issueProctoringChallenge(testId: string): Promise<ProctoringChallenge> {
  const response = await api.post<ApiResponse<Omit<ProctoringChallenge, 'expiresAt'> & { expiresAt: string }>>(
    `/tests/${testId}/proctoring/challenge`,
  );
  const challenge = unwrap(response.data, 'Proktoring challenge yaratilmadi');
  return { ...challenge, expiresAt: new Date(challenge.expiresAt) };
}

export async function verifyProctoringChallenge(
  testId: string,
  challenge: ProctoringChallenge,
  centerFrame: Blob,
  movementFrame: Blob,
): Promise<ProctoringVerification> {
  const form = new FormData();
  form.append('nonce', challenge.nonce);
  form.append('centerFrame', centerFrame, 'center-frame.jpg');
  form.append('challengeFrame', movementFrame, 'movement-frame.jpg');
  const response = await api.post<ApiResponse<Omit<ProctoringVerification, 'verifiedAt'> & { verifiedAt: string }>>(
    `/tests/${testId}/proctoring/${challenge.sessionId}/verify`,
    form,
  );
  const verification = unwrap(response.data, 'Proktoring tekshiruvi muvaffaqiyatsiz');
  return { ...verification, verifiedAt: new Date(verification.verifiedAt) };
}

export async function recordProctoringEvents(
  testId: string,
  attemptId: string,
  events: ProctoringClientEvent[],
): Promise<ProctoringEventBatchResult> {
  const response = await api.post<ApiResponse<Omit<ProctoringEventBatchResult, 'serverTime'> & { serverTime: string }>>(
    `/tests/${testId}/attempts/${attemptId}/proctoring/events`,
    { events },
  );
  const result = unwrap(response.data, 'Proktoring hodisalari saqlanmadi');
  return { ...result, serverTime: new Date(result.serverTime) };
}

/** Best-effort delivery used only while the page is being hidden or closed. */
export function keepaliveProctoringEvents(
  testId: string,
  attemptId: string,
  events: ProctoringClientEvent[],
): Promise<Response> | null {
  const token = getToken();
  if (!token || events.length === 0) return null;
  const base = API_BASE_URL.replace(/\/$/, '');
  return fetch(`${base}/tests/${testId}/attempts/${attemptId}/proctoring/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    keepalive: true,
    body: JSON.stringify({ events: events.slice(0, 50) }),
  });
}
