import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HemisCallbackPage from "../hemis-callback";
import { exchangeHemisOAuthCode } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  exchangeHemisOAuthCode: vi.fn(),
}));

describe("HEMIS OAuth callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a safe account status error returned by the backend callback", () => {
    render(
      <MemoryRouter initialEntries={["/auth/hemis/callback?error=account_inactive"]}>
        <HemisCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Talaba yoki LMS akkaunti faol emas.")).toBeInTheDocument();
    expect(exchangeHemisOAuthCode).not.toHaveBeenCalled();
  });

  it("exchanges the short-lived callback code and displays exchange failures", async () => {
    vi.mocked(exchangeHemisOAuthCode).mockRejectedValue(new Error("Kod muddati tugagan"));
    render(
      <MemoryRouter initialEntries={["/auth/hemis/callback?code=temporary-code"]}>
        <HemisCallbackPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(exchangeHemisOAuthCode).toHaveBeenCalledWith("temporary-code"));
    expect(await screen.findByText("Kod muddati tugagan")).toBeInTheDocument();
  });
});

