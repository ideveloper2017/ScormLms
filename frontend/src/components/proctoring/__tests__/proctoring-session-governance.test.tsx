import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProctoringSession } from '../proctoring-session';
import { biometricGovernanceApi, type BiometricPolicy, type MyBiometricStatus } from '@/services/api/biometric-governance-api';

const mockGetUserMedia = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  configurable: true,
  value: { getUserMedia: mockGetUserMedia },
});

vi.mock('@/services/api/biometric-governance-api', () => ({
  biometricGovernanceApi: {
    myStatus: vi.fn(),
    accept: vi.fn(),
    withdraw: vi.fn(),
  },
}));

vi.mock('@/components/auth/face-photo-setup', () => ({
  default: () => <div>Yuz shablonini ro'yxatdan o'tkazish</div>,
}));

vi.mock('@/services/test-api', () => ({ startTest: vi.fn() }));
vi.mock('@/services/proctoring-api', () => ({
  issueProctoringChallenge: vi.fn(),
  verifyProctoringChallenge: vi.fn(),
}));

const policy: BiometricPolicy = {
  id: 38,
  versionCode: 'BIO-2026-01',
  title: 'Proktoring biometrik siyosati',
  purposeText: 'Proktorli imtihonda talabgor shaxsini tasdiqlash maqsadi.',
  legalBasis: 'Universitetning tasdiqlangan ichki hujjati.',
  consentText: 'Yuz shablonimni ushbu aniq maqsad va muddatda qayta ishlashga roziman.',
  privacyNotice: "Ma'lumot faqat proktorli imtihon uchun ishlatiladi va muddatida o'chiriladi.",
  documentNumber: 'LEGAL-01',
  documentDate: '2026-08-06',
  documentReference: 'internal://legal/BIO-2026-01',
  faceTemplateRetentionDays: 30,
  proctoringEvidenceRetentionDays: 90,
  statementHash: 'a'.repeat(64),
  status: 'PUBLISHED',
  createdByName: 'author',
  publishedByName: 'publisher',
};

const renderSession = () => render(
  <MemoryRouter initialEntries={['/student/tests/77/proctoring']}>
    <Routes>
      <Route path="/student/tests/:testId/proctoring" element={<ProctoringSession />} />
    </Routes>
  </MemoryRouter>,
);

describe('ProctoringSession biometric governance gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({ getTracks: () => [] });
  });

  it('fails closed and never starts the camera when no published policy exists', async () => {
    vi.mocked(biometricGovernanceApi.myStatus).mockResolvedValue({
      policy: null,
      consentGranted: false,
      faceRegistered: false,
    });

    renderSession();

    expect(await screen.findByText(/Tasdiqlangan biometrik siyosat mavjud emas/i)).toBeInTheDocument();
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });

  it('binds explicit consent to the exact published policy id and statement hash before camera use', async () => {
    const beforeConsent: MyBiometricStatus = {
      policy,
      consentGranted: false,
      faceRegistered: false,
    };
    const afterConsent: MyBiometricStatus = {
      ...beforeConsent,
      consentGranted: true,
      consentedAt: '2026-08-06T12:00:00Z',
    };
    vi.mocked(biometricGovernanceApi.myStatus).mockResolvedValue(beforeConsent);
    vi.mocked(biometricGovernanceApi.accept).mockResolvedValue(afterConsent);

    renderSession();

    const consentButton = await screen.findByRole('button', { name: /Rozilik berish va davom etish/i });
    expect(consentButton).toBeDisabled();
    expect(mockGetUserMedia).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(consentButton);

    await waitFor(() => {
      expect(biometricGovernanceApi.accept).toHaveBeenCalledWith(policy.id, policy.statementHash);
    });
    expect(await screen.findByText(/Yuz shablonini ro'yxatdan o'tkazish/i)).toBeInTheDocument();
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });
});
