import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useConfirm } from "@/components/confirm-dialog";
import { QueryState } from "@/components/query-state";
import { NotFoundPage } from "@/pages/not-found";
import { AuthGuard } from "@/components/auth/auth-guard";

const authState = vi.hoisted(() => ({ isLoading: false, isAuthenticated: true }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => authState }));

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const { confirm, confirmDialog } = useConfirm();
  return (
    <>
      <button
        onClick={async () => {
          if (await confirm({ title: "Dars o'chirilsinmi?", confirmLabel: "O'chirish" })) onDelete();
        }}
      >
        O'chir
      </button>
      {confirmDialog}
    </>
  );
}

describe("useConfirm", () => {
  it("tasdiqlanmaguncha amal bajarilmaydi, tasdiqlansa bajariladi", async () => {
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "O'chir" }));
    expect(await screen.findByText("Dars o'chirilsinmi?")).toBeInTheDocument();
    expect(screen.getByText("Bu amalni qaytarib bo'lmaydi.")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "O'chirish" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("bekor qilinsa amal bajarilmaydi", async () => {
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "O'chir" }));
    fireEvent.click(await screen.findByRole("button", { name: "Bekor qilish" }));

    await waitFor(() => expect(screen.queryByText("Dars o'chirilsinmi?")).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("QueryState", () => {
  it("yuklanayotganda kontent o'rniga yuklanish ko'rsatiladi", () => {
    render(<QueryState isLoading><p>kontent</p></QueryState>);
    expect(screen.getByRole("status")).toHaveTextContent("Yuklanmoqda");
    expect(screen.queryByText("kontent")).not.toBeInTheDocument();
  });

  it("xato bo'sh holat sifatida emas, xato sifatida ko'rsatiladi va qayta urinish mumkin", async () => {
    const onRetry = vi.fn();
    render(
      <QueryState isError error={new Error("Server bilan aloqa yo'q.")} onRetry={onRetry} isEmpty emptyText="Hozircha ma'lumot yo'q">
        <p>kontent</p>
      </QueryState>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Server bilan aloqa yo'q.");
    expect(screen.queryByText("Hozircha ma'lumot yo'q")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Qayta urinish/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("bo'sh ro'yxat uchun bo'sh holat matni, ma'lumot bo'lsa kontent chiqadi", () => {
    const { rerender } = render(<QueryState isEmpty emptyText="Hozircha topshiriq yo'q"><p>kontent</p></QueryState>);
    expect(screen.getByText("Hozircha topshiriq yo'q")).toBeInTheDocument();

    rerender(<QueryState isEmpty={false}><p>kontent</p></QueryState>);
    expect(screen.getByText("kontent")).toBeInTheDocument();
  });
});

describe("NotFoundPage", () => {
  it("noto'g'ri manzilni ko'rsatadi va bosh sahifaga qaytaradi", async () => {
    render(
      <MemoryRouter initialEntries={["/yoq-sahifa"]}>
        <Routes>
          <Route path="/" element={<p>bosh sahifa</p>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Sahifa topilmadi" })).toBeInTheDocument();
    expect(screen.getByText("/yoq-sahifa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bosh sahifa/ }));
    expect(await screen.findByText("bosh sahifa")).toBeInTheDocument();
  });
});

describe("AuthGuard", () => {
  const renderGuarded = () =>
    render(
      <MemoryRouter initialEntries={["/maxfiy"]}>
        <Routes>
          <Route path="/login" element={<p>login sahifasi</p>} />
          <Route path="/maxfiy" element={<AuthGuard><p>maxfiy kontent</p></AuthGuard>} />
        </Routes>
      </MemoryRouter>,
    );

  it("tizimga kirgan foydalanuvchiga kontentni ko'rsatadi", () => {
    Object.assign(authState, { isLoading: false, isAuthenticated: true });
    renderGuarded();
    expect(screen.getByText("maxfiy kontent")).toBeInTheDocument();
  });

  it("tizimga kirmagan foydalanuvchini login sahifasiga yuboradi", async () => {
    Object.assign(authState, { isLoading: false, isAuthenticated: false });
    renderGuarded();
    expect(await screen.findByText("login sahifasi")).toBeInTheDocument();
    expect(screen.queryByText("maxfiy kontent")).not.toBeInTheDocument();
  });

  it("holat aniqlanmaguncha na kontent, na login ko'rsatiladi", () => {
    Object.assign(authState, { isLoading: true, isAuthenticated: false });
    renderGuarded();
    expect(screen.queryByText("maxfiy kontent")).not.toBeInTheDocument();
    expect(screen.queryByText("login sahifasi")).not.toBeInTheDocument();
  });
});
