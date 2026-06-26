import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Home, Users, Settings, BookOpen, GraduationCap,
  FileText, Library, Monitor, MessageCircle, UserCheck,
  ClipboardList, Activity, Database, ChevronsUpDown, LogOut,
  Sparkles, Building2, Layers3, NotebookText, UserCog,
  LayoutDashboard, Shield, Building, FolderTree, Calendar,
  Plug, ScrollText, BookMarked, CalendarDays, FileQuestion,
  Star, Bell, CircleUser, Video, Megaphone,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// ─── Nav model ─────────────────────────────────────────────────────────────
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const ITEMS = {
  // ── Umumiy ──────────────────────────────────────────────────────────────
  home:       { name: "Bosh sahifa",           href: "/",                    icon: Home          },
  courses:    { name: "Kurslar",               href: "/courses",             icon: BookOpen      },
  resources:  { name: "Axborot resurslari",    href: "/resources",           icon: Library       },
  exams:      { name: "Imtihonlar",            href: "/exams",               icon: GraduationCap },
  comms:      { name: "Kommunikatsiya",        href: "/communication",       icon: MessageCircle },
  cabinet:    { name: "Shaxsiy kabinet",       href: "/cabinet",             icon: UserCheck     },
  contingent: { name: "Kontingent",            href: "/contingent",          icon: ClipboardList },
  attendance: { name: "Davomat",               href: "/attendance",          icon: Activity      },
  teaching:   { name: "O'qitishni boshqarish", href: "/teaching",            icon: Database      },
  stats:      { name: "Statistika",            href: "/statistics",          icon: BarChart3     },

  // ── O'qituvchi navigatsiyasi (/teacher/*) ──────────────────────────────
  tDashboard:     { name: "Dashboard",          href: "/teacher/dashboard",     icon: LayoutDashboard },
  tCourses:       { name: "Mening kurslarim",   href: "/teacher/courses",       icon: BookOpen        },
  tContent:       { name: "Kontent",            href: "/teacher/content",       icon: Video           },
  tAssignments:   { name: "Topshiriqlar",       href: "/teacher/assignments",   icon: ClipboardList   },
  tTests:         { name: "Testlar",            href: "/teacher/tests",         icon: FileQuestion    },
  tGradebook:     { name: "Baholash",           href: "/teacher/gradebook",     icon: Star            },
  tStudents:      { name: "Talabalar",          href: "/teacher/students",      icon: Users           },
  tAttendance:    { name: "Davomat",            href: "/teacher/attendance",    icon: UserCheck       },
  tMessages:      { name: "Xabarlar",           href: "/teacher/messages",      icon: MessageCircle   },
  tAnnouncements: { name: "E'lonlar",           href: "/teacher/announcements", icon: Megaphone       },
  tReports:       { name: "Hisobotlar",         href: "/teacher/reports",       icon: BarChart3       },
  tProfile:       { name: "Profil",             href: "/teacher/profile",       icon: CircleUser      },

  // ── Talaba navigatsiyasi (/student/*) ──────────────────────────────────
  sDashboard:     { name: "Dashboard",           href: "/student/dashboard",     icon: LayoutDashboard },
  sCourses:       { name: "Mening kurslarim",    href: "/student/courses",       icon: BookOpen        },
  sSchedule:      { name: "Dars jadvali",        href: "/student/schedule",      icon: CalendarDays    },
  sAssignments:   { name: "Topshiriqlar",        href: "/student/assignments",   icon: ClipboardList   },
  sTests:         { name: "Testlar",             href: "/student/tests",         icon: FileQuestion    },
  sExams:         { name: "Imtihonlar",          href: "/student/exams",         icon: GraduationCap   },
  sGrades:        { name: "Baholar",             href: "/student/grades",        icon: Star            },
  sAttendance:    { name: "Davomat",             href: "/student/attendance",    icon: UserCheck       },
  sMessages:      { name: "Xabarlar",            href: "/student/messages",      icon: MessageCircle   },
  sNotifications: { name: "Bildirishnomalar",    href: "/student/notifications", icon: Bell            },
  sCalendar:      { name: "Akademik kalendar",   href: "/student/calendar",      icon: Calendar        },
  sProfile:       { name: "Profil",              href: "/student/profile",       icon: CircleUser      },

  // ── Admin navigatsiyasi (/admin/*) ──────────────────────────────────────
  aDashboard:    { name: "Dashboard",           href: "/admin/dashboard",    icon: LayoutDashboard },
  aUsers:        { name: "Foydalanuvchilar",    href: "/admin/users",        icon: Users           },
  aStudents:     { name: "Talabalar",           href: "/admin/students",     icon: UserCheck       },
  aTeachers:     { name: "O'qituvchilar",       href: "/admin/teachers",     icon: UserCog         },
  aRoles:        { name: "Rollar",              href: "/admin/roles",        icon: Shield          },
  aFaculties:    { name: "Fakultetlar",         href: "/admin/faculties",    icon: Building2       },
  aDepartments:  { name: "Kafedralar",          href: "/admin/departments",  icon: Building        },
  aPrograms:     { name: "Yo'nalishlar",        href: "/admin/programs",     icon: FolderTree      },
  aGroups:       { name: "Guruhlar",            href: "/admin/groups",       icon: Layers3         },
  aSubjects:     { name: "Fanlar",              href: "/admin/subjects",     icon: NotebookText    },
  aStudyPlans:   { name: "O'quv reja",          href: "/admin/study-plans",  icon: BookMarked      },
  aCourses:      { name: "Kurslar",             href: "/admin/courses",      icon: BookOpen        },
  aCalendar:     { name: "Akademik kalendar",   href: "/admin/calendar",     icon: Calendar        },
  aReports:      { name: "Hisobotlar",          href: "/admin/reports",      icon: BarChart3       },
  aIntegrations: { name: "Integratsiyalar",     href: "/admin/integrations", icon: Plug            },
  aAuditLogs:     { name: "Audit log",            href: "/admin/audit-logs",       icon: ScrollText      },
  aSettings:      { name: "Sozlamalar",          href: "/admin/settings",         icon: Settings        },
  aNotifications: { name: "Bildirishnomalar",    href: "/admin/notifications",     icon: Bell            },
  tNotifications: { name: "Bildirishnomalar",    href: "/teacher/notifications",   icon: Bell            },
} satisfies Record<string, NavItem>;

// Role → grouped navigation. Bo'sh guruhlar avtomatik yashiriladi.
function buildNav(role: string): NavGroup[] {
  const r = role.replace(/^ROLE_/i, "").toUpperCase();

  const ADMIN_NAV: NavGroup[] = [
    { label: "Asosiy",           items: [ITEMS.aDashboard, ITEMS.aNotifications] },
    { label: "Foydalanuvchilar", items: [ITEMS.aUsers, ITEMS.aStudents, ITEMS.aTeachers, ITEMS.aRoles] },
    { label: "Akademik tuzilma", items: [ITEMS.aFaculties, ITEMS.aDepartments, ITEMS.aPrograms, ITEMS.aGroups, ITEMS.aSubjects] },
    { label: "Kontent",          items: [ITEMS.aStudyPlans, ITEMS.aCourses, ITEMS.aCalendar] },
    { label: "Tahlil va tizim",  items: [ITEMS.aReports, ITEMS.aIntegrations, ITEMS.aAuditLogs, ITEMS.aSettings] },
  ];

  const groups: Record<string, NavGroup[]> = {
    SUPER_ADMIN: ADMIN_NAV,
    ADMIN:       ADMIN_NAV,
    METODIST: [
      { label: "Asosiy",           items: [ITEMS.aDashboard, ITEMS.aNotifications] },
      { label: "Ta'lim",           items: [ITEMS.aCourses, ITEMS.resources, ITEMS.teaching, ITEMS.exams] },
      { label: "Akademik tuzilma", items: [ITEMS.aFaculties, ITEMS.aDepartments, ITEMS.aPrograms, ITEMS.aGroups, ITEMS.aSubjects] },
      { label: "Boshqaruv",        items: [ITEMS.aStudents, ITEMS.aTeachers, ITEMS.contingent, ITEMS.comms] },
      { label: "Tahlil",           items: [ITEMS.aReports, ITEMS.stats] },
    ],
    TEACHER: [
      { label: "Asosiy",         items: [ITEMS.tDashboard] },
      { label: "Kurslar",        items: [ITEMS.tCourses, ITEMS.tContent] },
      { label: "Baholash",       items: [ITEMS.tAssignments, ITEMS.tTests, ITEMS.tGradebook] },
      { label: "Talabalar",      items: [ITEMS.tStudents, ITEMS.tAttendance] },
      { label: "Kommunikatsiya", items: [ITEMS.tMessages, ITEMS.tAnnouncements, ITEMS.tNotifications] },
      { label: "Boshqa",         items: [ITEMS.tReports, ITEMS.tProfile] },
    ],
    STUDENT: [
      { label: "Asosiy",    items: [ITEMS.sDashboard] },
      { label: "Ta'lim",    items: [ITEMS.sCourses, ITEMS.sSchedule, ITEMS.sAssignments, ITEMS.sTests, ITEMS.sExams] },
      { label: "Natijalar", items: [ITEMS.sGrades, ITEMS.sAttendance] },
      { label: "Aloqa",     items: [ITEMS.sMessages, ITEMS.sNotifications] },
      { label: "Boshqa",    items: [ITEMS.sCalendar, ITEMS.sProfile] },
    ],
    PROCTOR: [
      { label: "Asosiy", items: [ITEMS.home, ITEMS.exams, ITEMS.comms] },
    ],
    MONITORING: [
      { label: "Asosiy", items: [ITEMS.home] },
      { label: "Tahlil", items: [ITEMS.stats, ITEMS.aReports, ITEMS.comms] },
    ],
  };
  return groups[r] ?? [{ label: "Asosiy", items: [ITEMS.home, ITEMS.courses, ITEMS.comms] }];
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", METODIST: "Metodist",
  TEACHER: "O'qituvchi", STUDENT: "Talaba", PROCTOR: "Proktor",
  MONITORING: "Monitoring",
};

// ─── Component ─────────────────────────────────────────────────────────────
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, logout } = useAuth();

  const rawRole  = user?.role?.name || user?.roles?.[0]?.name || "";
  const normRole = rawRole.replace(/^ROLE_/i, "").toUpperCase();
  const navGroups = buildNav(rawRole);

  const displayName = user?.fullName?.trim() || user?.username || "Foydalanuvchi";
  const displaySub  = user?.email || user?.phone || ROLE_LABEL[normRole] || "";
  const initials = displayName
    .split(/\s+/).filter(Boolean).map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

  const go = (href: string) => {
    navigate(href);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  return (
    <Sidebar collapsible="icon">
      {/* ── Brand ─────────────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => go("/")}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Monitor className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">EduLMS</span>
                <span className="truncate text-xs text-muted-foreground">SCORM Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation ────────────────────────────────────────── */}
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.name}
                      isActive={isActive(item.href)}
                      onClick={() => go(item.href)}
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── User footer + dropdown ────────────────────────────── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{displaySub}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {ROLE_LABEL[normRole] || displaySub}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("/cabinet")}>
                  <Sparkles className="mr-2 size-4" /> Shaxsiy kabinet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("/settings")}>
                  <Settings className="mr-2 size-4" /> Sozlamalar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className={cn("text-destructive focus:text-destructive")}
                >
                  <LogOut className="mr-2 size-4" /> Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
