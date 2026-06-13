import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
  /** Header'da chiqadigan sahifa sarlavhasi */
  title?: string;
  children: React.ReactNode;
}

/**
 * Rasmiy shadcn `Sidebar` primitivlari asosidagi namuna layout.
 *
 * Ishlatish:
 *   <AppShell title="Kurslar"><Courses /></AppShell>
 *
 * Imkoniyatlar:
 *  - Ctrl/Cmd + B  → sidebar'ni ochish/yopish
 *  - desktop'da "icon" rejimga yig'iladi (faqat ikonkalar + tooltip)
 *  - mobil'da avtomatik Sheet (drawer) ga aylanadi
 *  - ochiq/yopiq holat cookie'da saqlanadi
 */
export function AppShell({ title, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title && <h1 className="text-sm font-medium">{title}</h1>}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
