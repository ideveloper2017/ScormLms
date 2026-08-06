import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { issueProctoringChallenge, recordProctoringEvents, verifyProctoringChallenge } from '../proctoring-api';

vi.mock('@/lib/api');

describe('proctoring API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('server challenge yaratadi va muddatni Date ga aylantiradi', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          sessionId: '17',
          nonce: 'one-time-nonce',
          direction: 'left',
          expiresAt: '2026-08-06T07:30:00Z',
        },
      },
    });

    const challenge = await issueProctoringChallenge('9');

    expect(api.post).toHaveBeenCalledWith('/tests/9/proctoring/challenge');
    expect(challenge.expiresAt).toBeInstanceOf(Date);
    expect(challenge.direction).toBe('left');
  });

  it('nonce va ikkita alohida kadrni multipart shaklida yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: { sessionId: '17', verified: true, verifiedAt: '2026-08-06T07:29:00Z' },
      },
    });
    const challenge = {
      sessionId: '17',
      nonce: 'one-time-nonce',
      direction: 'right' as const,
      expiresAt: new Date('2026-08-06T07:30:00Z'),
    };

    const verification = await verifyProctoringChallenge(
      '9',
      challenge,
      new Blob(['center'], { type: 'image/jpeg' }),
      new Blob(['movement'], { type: 'image/jpeg' }),
    );

    expect(api.post).toHaveBeenCalledWith(
      '/tests/9/proctoring/17/verify',
      expect.any(FormData),
    );
    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get('nonce')).toBe('one-time-nonce');
    expect(form.get('centerFrame')).toBeInstanceOf(File);
    expect(form.get('challengeFrame')).toBeInstanceOf(File);
    expect(verification.verified).toBe(true);
    expect(verification.verifiedAt).toBeInstanceOf(Date);
  });

  it('attemptga boglangan event batchni yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: { accepted: 2, duplicates: 0, serverTime: '2026-08-06T08:00:00Z' },
      },
    });
    const events = [
      { clientEventId: 'fbac866e-2df2-45a4-a427-67ac82bdd69b', type: 'TAB_HIDDEN' as const, occurredAt: '2026-08-06T07:59:58Z' },
      { clientEventId: '01ce4b87-6978-4828-a15f-cb2d44d4fa94', type: 'NETWORK_OFFLINE' as const, occurredAt: '2026-08-06T07:59:59Z' },
    ];

    const result = await recordProctoringEvents('9', '21', events);

    expect(api.post).toHaveBeenCalledWith('/tests/9/attempts/21/proctoring/events', { events });
    expect(result.accepted).toBe(2);
    expect(result.serverTime).toBeInstanceOf(Date);
  });
});
