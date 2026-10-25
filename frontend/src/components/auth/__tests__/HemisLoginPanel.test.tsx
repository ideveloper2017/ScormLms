import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HemisLoginPanel } from '../HemisLoginPanel';
import { getHemisLoginOptions, hemisPasswordLogin } from '@/lib/api';

vi.mock('@/lib/api', async () => ({
  ...await vi.importActual<object>('@/lib/api'),
  getHemisLoginOptions: vi.fn(),
  hemisPasswordLogin: vi.fn(),
}));

const location = { replace: vi.fn(), assign: vi.fn() };

describe('HemisLoginPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, ...location });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("talaba HEMIS login va paroli bilan kiradi", async () => {
    vi.mocked(getHemisLoginOptions).mockResolvedValue({ studentPasswordLogin: true, studentOAuth: false, employeeOAuth: true });
    vi.mocked(hemisPasswordLogin).mockResolvedValue(undefined as never);
    render(<HemisLoginPanel />);

    fireEvent.change(await screen.findByLabelText('HEMIS login'), { target: { value: ' 390211100123 ' } });
    fireEvent.change(screen.getByLabelText('HEMIS paroli'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'HEMIS orqali kirish' }));

    await waitFor(() => expect(hemisPasswordLogin).toHaveBeenCalledWith('390211100123', 'secret'));
    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/'));
  });

  it("server xatosini ko'rsatadi", async () => {
    vi.mocked(getHemisLoginOptions).mockResolvedValue({ studentPasswordLogin: true, studentOAuth: false, employeeOAuth: false });
    vi.mocked(hemisPasswordLogin).mockRejectedValue(new Error("HEMIS login yoki parol noto'g'ri"));
    render(<HemisLoginPanel />);

    fireEvent.change(await screen.findByLabelText('HEMIS login'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('HEMIS paroli'), { target: { value: 'y' } });
    fireEvent.click(screen.getByRole('button', { name: 'HEMIS orqali kirish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("HEMIS login yoki parol noto'g'ri");
  });

  it("o'qituvchi HEMIS xodim OAuth sahifasiga yo'naltiriladi", async () => {
    vi.mocked(getHemisLoginOptions).mockResolvedValue({ studentPasswordLogin: true, studentOAuth: true, employeeOAuth: true });
    render(<HemisLoginPanel />);

    fireEvent.click(await screen.findByRole('tab', { name: /O'qituvchi/ }));
    fireEvent.click(screen.getByRole('button', { name: /O'qituvchi sifatida HEMIS orqali kirish/ }));

    expect(location.assign).toHaveBeenCalledWith(expect.stringMatching(/\/oauth2\/authorization\/hemis-employee$/));
  });

  it("o'qituvchi kirishi sozlanmagan bo'lsa tushuntiradi", async () => {
    vi.mocked(getHemisLoginOptions).mockRejectedValue(new Error('offline'));
    render(<HemisLoginPanel />);

    // Sozlamalar kelmasa: talaba uchun eski OAuth tugmasi qoladi
    expect(await screen.findByRole('button', { name: 'HEMIS orqali kirish' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /O'qituvchi/ }));
    expect(screen.getByText(/O'qituvchilar uchun HEMIS orqali kirish hali sozlanmagan/)).toBeInTheDocument();
  });
});
