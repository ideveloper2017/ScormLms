import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3, Home, Users, Settings, BookOpen, GraduationCap,
  FileText, Library, Shield, X, Monitor, MessageCircle,
  UserCheck, ClipboardList, Activity, Database, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

function buildNav(role: string): NavItem[] {
  const r = role.replace(/^ROLE_/i, '').toUpperCase();

  const home:       NavItem = { name: 'Bosh sahifa',           href: '/',                   icon: Home          };
  const courses:    NavItem = { name: 'Kurslar',               href: '/courses',             icon: BookOpen      };
  const resources:  NavItem = { name: 'Axborot resurslari',    href: '/resources',           icon: Library       };
  const exams:      NavItem = { name: 'Imtihonlar',            href: '/exams',               icon: GraduationCap };
  const comms:      NavItem = { name: 'Kommunikatsiya',        href: '/communication',       icon: MessageCircle };
  const reports:    NavItem = { name: 'Hisobotlar',            href: '/reports',             icon: FileText      };
  const stats:      NavItem = { name: 'Statistika',            href: '/statistics',          icon: BarChart3     };
  const users:      NavItem = { name: 'Foydalanuvchilar',      href: '/management',          icon: Users         };
  const students:   NavItem = { name: 'Talabalar',             href: '/students-management', icon: UserCheck     };
  const contingent: NavItem = { name: 'Kontingent',            href: '/contingent',          icon: ClipboardList };
  const attendance: NavItem = { name: 'Davomat',               href: '/attendance',          icon: Activity      };
  const teaching:   NavItem = { name: "O'qitishni boshqarish", href: '/teaching',            icon: Database      };
  const cabinet:    NavItem = { name: 'Shaxsiy kabinet',       href: '/cabinet',             icon: UserCheck     };
  const settings:   NavItem = { name: 'Sozlamalar',            href: '/settings',            icon: Settings      };

  switch (r) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return [home, users, students, contingent, courses, resources, exams, attendance, teaching, comms, reports, stats, settings];
    case 'METODIST':
      return [home, courses, resources, students, contingent, teaching, exams, comms, reports, stats];
    case 'TEACHER':
      return [home, courses, resources, exams, attendance, teaching, comms, reports];
    case 'STUDENT':
      return [home, courses, resources, exams, cabinet, comms];
    case 'PROCTOR':
      return [home, exams, comms];
    case 'MONITORING':
      return [home, stats, reports, comms];
    default:
      return [home, courses, comms];
  }
}

const ROLE_META: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  ADMIN:       { label: 'Admin',       cls: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300'    },
  METODIST:    { label: 'Metodist',    cls: 'bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300'   },
  TEACHER:     { label: "O'qituvchi",  cls: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300'   },
  STUDENT:     { label: 'Talaba',      cls: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300'  },
  PROCTOR:     { label: 'Proktor',     cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  MONITORING:  { label: 'Monitoring',  cls: 'bg-slate-100  text-slate-700  dark:bg-slate-800/40  dark:text-slate-400'  },
};

export function Sidebar({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const rawRole    = user?.role?.name || user?.roles?.[0]?.name || '';
  const normRole   = rawRole.replace(/^ROLE_/i, '').toUpperCase();
  const roleMeta   = ROLE_META[normRole];
  const navigation = buildNav(rawRole);

  const displayName = user?.fullName?.trim() || user?.username || 'Foydalanuvchi';
  const displaySub  = user?.email || user?.phone || '';
  const initials    = displayName
    .split(/\s+/).filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <TooltipProvider delayDuration={300}>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar container ───────────────────────────────────────────── */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50',
        'flex flex-col bg-card border-r border-border',
        'transition-all duration-300 ease-in-out',
        // Width: mobile=256px drawer | tablet=56px icon-only | desktop=collapsed?56:256
        'w-64 md:w-14',
        !collapsed && 'lg:w-64',
        // Mobile: slide via open; md+: always visible
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center border-b border-border h-14 shrink-0 overflow-hidden',
          'px-5 gap-3',
          'md:justify-center md:px-0 md:gap-0',
          !collapsed && 'lg:justify-start lg:px-5 lg:gap-3',
        )}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Monitor className="text-white h-5 w-5" />
          </div>

          {/* Logo text: mobile + desktop-expanded */}
          <div className={cn(
            'overflow-hidden min-w-0 transition-all',
            collapsed ? 'hidden' : 'md:hidden lg:block',
          )}>
            <span className="font-bold text-base leading-none whitespace-nowrap">EduLMS</span>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 whitespace-nowrap">
              SCORM Platform
            </p>
          </div>

          {/* Close button: mobile only */}
          <Button
            variant="ghost" size="icon"
            className="ml-auto md:hidden h-8 w-8 shrink-0"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navigation.map((item) => {
            const Icon     = item.icon;
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full h-10 text-sm font-normal',
                      // Mobile: left-aligned
                      'justify-start gap-3 px-2.5',
                      // Tablet: centered icon-only
                      'md:justify-center md:px-0 md:gap-0',
                      // Desktop-expanded: restore left-aligned
                      !collapsed && 'lg:justify-start lg:px-2.5 lg:gap-3',
                      isActive
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => { navigate(item.href); setOpen(false); }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {/* Label: hide on tablet and desktop-collapsed */}
                    <span className={cn(
                      'truncate overflow-hidden whitespace-nowrap transition-all',
                      collapsed ? 'hidden' : 'md:hidden lg:block',
                    )}>
                      {item.name}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Status chips: mobile + desktop-expanded only ──────────────── */}
        <div className={cn(
          'px-3 py-3 space-y-1.5 border-t border-border',
          collapsed ? 'hidden' : 'flex flex-col md:hidden lg:flex',
        )}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20">
            <Shield className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              SCORM 2004 tayyor
            </span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20">
            <Monitor className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Avtoproktoring faol
            </span>
          </div>
        </div>

        {/* ── User footer ───────────────────────────────────────────────── */}
        <div className="border-t border-border">
          {/* Full card: mobile + desktop-expanded */}
          <div className={cn(
            'items-center gap-3 p-2.5 m-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors',
            collapsed ? 'hidden' : 'flex md:hidden lg:flex',
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{displayName}</p>
              {roleMeta ? (
                <Badge className={cn('text-[10px] px-1.5 py-0 mt-0.5 font-normal', roleMeta.cls)}>
                  {roleMeta.label}
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground truncate">{displaySub}</p>
              )}
            </div>
          </div>

          {/* Avatar only: tablet + desktop-collapsed */}
          <div className={cn(
            'justify-center py-3',
            collapsed ? 'hidden md:flex' : 'hidden md:flex lg:hidden',
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center cursor-default select-none">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{displayName}</p>
                {roleMeta && (
                  <p className="text-xs text-muted-foreground">{roleMeta.label}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Desktop collapse toggle ────────────────────────────────────── */}
        <div className="hidden lg:flex items-center justify-end border-t border-border px-2 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setCollapsed(!collapsed)}
              >
                <ChevronLeft className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  collapsed && 'rotate-180',
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Kengaytirish" : "Yig'ish"}
            </TooltipContent>
          </Tooltip>
        </div>

      </aside>
    </TooltipProvider>
  );
}
