import { Search, Shield, Monitor } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { NotificationPanel } from "@/components/layout/notification-panel";
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Loyihaning asosiy layouti — rasmiy shadcn `Sidebar` primitivlari asosida.
 *  - Ctrl/Cmd + B yoki header'dagi trigger → sidebar'ni yig'ish/ochish
 *  - desktop'da "icon" rejimga yig'iladi (tooltip bilan)
 *  - mobil'da avtomatik Sheet (drawer)
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        {/* ── Header (skrol qilinganda yuqorida qotib turadi) ──────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />

          {/* Desktop qidiruv */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kurslar, talabalar yoki imtihonlarni qidiring..."
              className="w-56 lg:w-80 bg-muted/50 pl-10"
            />
          </div>

          {/* Mobile qidiruv tugmasi */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>

          {/* O'ng tomon */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1.5 lg:flex">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Shield className="h-3 w-3" /> SCORM
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Monitor className="h-3 w-3" /> Avtoproktoring
              </Badge>
            </div>

            <div className="hidden md:block">
              <RoleSwitcher />
            </div>

            <ThemeToggle />

            <NotificationPanel />
          </div>
        </header>

        {/* ── Asosiy kontent ───────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
