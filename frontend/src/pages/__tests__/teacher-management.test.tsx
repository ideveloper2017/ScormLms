import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { TeacherManagement } from "../teacher-management";

vi.mock("@/lib/teacher-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listTeachers: vi.fn(async () => []), createTeacher: vi.fn(), updateTeacher: vi.fn(), deleteTeacher: vi.fn(),
}));
vi.mock("@/lib/academic-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listDepartments: vi.fn(async () => []),
  listSubjects: vi.fn(async () => [
    { id: 1, name: "Fizika 1,2", active: true }, { id: 2, name: "Falsafa", active: true }, { id: 3, name: "Dasturlash", active: true },
  ]),
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: { name: "admin" }, roles: [], permissions: ["TEACHER_WRITE"] } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

it("o'qituvchi formasida fan qidiruvi, tanlanganlar soni, tayyor daraja/lavozim ro'yxatlari, HEMIS bo'limi yig'ilgan", async () => {
  render(<QueryClientProvider client={new QueryClient()}><TeacherManagement /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: /Qo'shish/ }));
  const dialog = await screen.findByRole("dialog");

  expect(await within(dialog).findByText("Dasturlash")).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText("Fanni qidirish"), { target: { value: "fiz" } });
  expect(within(dialog).getByText("Fizika 1,2")).toBeInTheDocument();
  expect(within(dialog).queryByText("Falsafa")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByText("Fizika 1,2"));
  expect(within(dialog).getByText("1 ta tanlangan")).toBeInTheDocument();

  const degrees = dialog.querySelector("datalist#teacher-degrees");
  expect(Array.from(degrees?.querySelectorAll("option") ?? []).map((o) => o.getAttribute("value"))).toContain("Falsafa doktori (PhD)");
  expect(within(dialog).getByText("HEMIS orqali kirish (ixtiyoriy)").closest("details")).not.toHaveAttribute("open");
});
