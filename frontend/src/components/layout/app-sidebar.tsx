import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Home, Users, Settings, BookOpen, GraduationCap,
  FileText, Library, Monitor, MessageCircle, UserCheck,
  ClipboardList, Activity, Database, ChevronsUpDown, LogOut,
  Sparkles, Building2, Layers3, NotebookText, UserCog,
  LayoutDashboard, Shield, Building, FolderTree, Calendar,
  Plug, ScrollText, BookMarked, CalendarDays, FileQuestion,
  Star, Bell, CircleUser, Video, Megaphone, Scale, Award, ClipboardCheck, FileCheck2, LifeBuoy, Presentation, FileSearch, BriefcaseBusiness, Landmark, BadgeCheck, Globe2, Gavel, ShieldAlert, Fingerprint, ServerCog, ListChecks, ChevronRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  collapsible?: boolean;
  icon?: React.ElementType;
  href?: string;
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
  support:    { name: "Texnik yordam",         href: "/support",             icon: LifeBuoy      },

  // ── O'qituvchi navigatsiyasi (/teacher/*) ──────────────────────────────
  tDashboard:     { name: "Dashboard",          href: "/teacher/dashboard",     icon: LayoutDashboard },
  tCourses:       { name: "Mening kurslarim",   href: "/teacher/courses",       icon: BookOpen        },
  tContent:       { name: "Kontent",            href: "/teacher/content",       icon: Video           },
  tSessions:      { name: "Dars jadvali",       href: "/teacher/sessions",      icon: CalendarDays    },
  tExams:         { name: "Yakuniy nazorat",    href: "/teacher/exams",         icon: GraduationCap   },
  tAttestations:  { name: "Davlat attestatsiyasi", href: "/teacher/attestations", icon: Award            },
  tAssignments:   { name: "Topshiriqlar",       href: "/teacher/assignments",   icon: ClipboardList   },
  tTests:         { name: "Testlar",            href: "/teacher/tests",         icon: FileQuestion    },
  tGradebook:     { name: "Baholash",           href: "/teacher/gradebook",     icon: Star            },
  tStudents:      { name: "Talabalar",          href: "/teacher/students",      icon: Users           },
  tAttendance:    { name: "Davomat",            href: "/teacher/attendance",    icon: UserCheck       },
  tMessages:      { name: "Xabarlar",           href: "/teacher/messages",      icon: MessageCircle   },
  tAnnouncements: { name: "E'lonlar",           href: "/teacher/announcements", icon: Megaphone       },
  tReports:       { name: "Hisobotlar",         href: "/teacher/reports",       icon: BarChart3       },
  tProfile:       { name: "Profil",             href: "/teacher/profile",       icon: CircleUser      },
  tSurveys:       { name: "Anonim so'rovlar",  href: "/teacher/surveys",       icon: ClipboardCheck  },

  // ── Talaba navigatsiyasi (/student/*) ──────────────────────────────────
  sDashboard:     { name: "Dashboard",           href: "/student/dashboard",     icon: LayoutDashboard },
  sCourses:       { name: "Mening kurslarim",    href: "/student/courses",       icon: BookOpen        },
  sStudyPlan:     { name: "O'quv rejam",         href: "/student/study-plan",    icon: BookMarked      },
  sOrientation:   { name: "LMS orientatsiyasi",  href: "/student/orientation",   icon: Presentation    },
  sPractice:      { name: "Amaliyot",            href: "/student/practice",      icon: BriefcaseBusiness },
  sAssessmentLeave: { name: "Yakuniy nazorat ta'tili", href: "/student/assessment-leave", icon: CalendarDays },
  sSchedule:      { name: "Dars jadvali",        href: "/student/schedule",      icon: CalendarDays    },
  sAssignments:   { name: "Topshiriqlar",        href: "/student/assignments",   icon: ClipboardList   },
  sTests:         { name: "Testlar",             href: "/student/tests",         icon: FileQuestion    },
  sExams:         { name: "Imtihonlar",          href: "/student/exams",         icon: GraduationCap   },
  sAttestations:  { name: "Davlat attestatsiyasi", href: "/student/attestations", icon: Award            },
  sGrades:        { name: "Baholar",             href: "/student/grades",        icon: Star            },
  sAttendance:    { name: "Davomat",             href: "/student/attendance",    icon: UserCheck       },
  sMessages:      { name: "Xabarlar",            href: "/student/messages",      icon: MessageCircle   },
  sNotifications: { name: "Bildirishnomalar",    href: "/student/notifications", icon: Bell            },
  sCalendar:      { name: "Akademik kalendar",   href: "/student/calendar",      icon: Calendar        },
  sProfile:       { name: "Profil",              href: "/student/profile",       icon: CircleUser      },
  sSurveys:       { name: "Anonim so'rovlar",    href: "/student/surveys",       icon: ClipboardCheck  },

  // ── Admin navigatsiyasi (/admin/*) ──────────────────────────────────────
  aDashboard:    { name: "Dashboard",           href: "/admin/dashboard",    icon: LayoutDashboard },
  aUsers:        { name: "Foydalanuvchilar",    href: "/admin/users",        icon: Users           },
  aStudents:     { name: "Talabalar",           href: "/admin/students",     icon: UserCheck       },
  aReinstatementSubjects: { name: "Tiklanganlar fanlari", href: "/admin/student-movement/reinstatement-subjects", icon: FileSearch },
  aTeachers:     { name: "O'qituvchilar",       href: "/admin/teachers",     icon: UserCog         },
  aRoles:        { name: "Rollar",              href: "/admin/roles",        icon: Shield          },
  aFaculties:    { name: "Fakultetlar",         href: "/admin/faculties",    icon: Building2       },
  aDepartments:  { name: "Kafedralar",          href: "/admin/departments",  icon: Building        },
  aPrograms:     { name: "Yo'nalishlar",        href: "/admin/programs",     icon: FolderTree      },
  aGroups:       { name: "Asosiy guruhlar",     href: "/admin/groups",       icon: Layers3         },
  aStudentClassifiers: { name: "Ma'lumotnomalar", href: "/admin/student-classifiers", icon: Globe2 },
  aSubjects:     { name: "Fanlar",              href: "/admin/subjects",     icon: NotebookText    },
  aStudyPlans:   { name: "O'quv rejalari",      href: "/admin/study-plans",  icon: BookMarked      },
  aCurriculumStudents: { name: "Rejaga biriktirilganlar", href: "/admin/curriculum-students", icon: UserCheck },
  aSyllabi:      { name: "O'quv dasturi",       href: "/admin/syllabi", icon: FileText },
  aAcademicPeriods: { name: "O'quv davrlari",   href: "/admin/academic-periods", icon: Calendar },
  aSubjectCategories: { name: "Fan guruhlari", href: "/admin/subject-categories", icon: FolderTree },
  aSubjectGroups: { name: "Fan oqimlari", href: "/admin/subject-groups", icon: Layers3 },
  aAdmissionPolicies: { name: "Qabul va kontrakt", href: "/admin/admission-policies", icon: Landmark },
  aNonStateLicenses: { name: "Nodavlat litsenziyalari", href: "/admin/non-state-licenses", icon: BadgeCheck },
  aCourses:      { name: "Kurslar",             href: "/admin/courses",      icon: BookOpen        },
  aSchedule:     { name: "Dars jadvali",        href: "/admin/schedule",     icon: CalendarDays    },
  aCalendar:     { name: "Akademik kalendar",   href: "/admin/calendar",     icon: Calendar        },
  aOrientations: { name: "LMS orientatsiyasi",  href: "/admin/orientations", icon: Presentation    },
  aPractices:    { name: "Talaba amaliyoti",    href: "/admin/practices",    icon: BriefcaseBusiness },
  aAssessmentLeaves: { name: "Yakuniy nazorat ta'tili", href: "/admin/assessment-leaves", icon: CalendarDays },
  aForeignTeachers: { name: "Xorijiy pedagoglar", href: "/admin/foreign-teacher-engagements", icon: Globe2 },
  aAccountability: { name: "Javobgarlik yo'llanmalari", href: "/admin/accountability-referrals", icon: Gavel },
  aRestrictions: { name: "Taqiqlangan yo'nalishlar", href: "/admin/distance-program-restrictions", icon: ShieldAlert },
  aBiometric:    { name: "Biometrik boshqaruv", href: "/admin/biometric-governance", icon: Fingerprint },
  aReadiness:    { name: "Infratuzilma tayyorgarligi", href: "/admin/distance-readiness", icon: ServerCog },
  aPublications: { name: "Rasmiy sayt axborotlari", href: "/admin/official-site-publications", icon: Globe2 },
  aContentStandard: { name: "O'zDSt 36.2030 nazorati", href: "/admin/content-standard", icon: ListChecks },
  aReports:      { name: "Hisobotlar",          href: "/admin/reports",      icon: BarChart3       },
  aIntegrations: { name: "Integratsiyalar",     href: "/admin/integrations", icon: Plug            },
  aAuditLogs:     { name: "Audit log",            href: "/admin/audit-logs",       icon: ScrollText      },
  aCompliance559: { name: "559-son qaror",        href: "/admin/compliance-559",   icon: Scale           },
  aSurveys:       { name: "Anonim so'rovlar",     href: "/admin/surveys",          icon: ClipboardCheck  },
  aQualityStudies:{ name: "Sifat monitoringi",    href: "/admin/quality-monitoring", icon: FileSearch     },
  aContentReviews:{ name: "Kontent tekshiruvi",  href: "/admin/content-reviews",  icon: FileCheck2       },
  aSettings:      { name: "Sozlamalar",          href: "/admin/settings",         icon: Settings        },
  aNotifications: { name: "Bildirishnomalar",    href: "/admin/notifications",     icon: Bell            },
  tNotifications: { name: "Bildirishnomalar",    href: "/teacher/notifications",   icon: Bell            },
} satisfies Record<string, NavItem>;

// Role → grouped navigation. Bo'sh guruhlar avtomatik yashiriladi.
export function buildNav(role: string): NavGroup[] {
  const r = role.replace(/^ROLE_/i, "").toUpperCase();
  const referenceItem = (name: string, href: string, icon: React.ElementType): NavItem => ({ name, href, icon });

  const ADMIN_NAV: NavGroup[] = [
    { label: "Universitetlar",       href: "/universities", icon: Building2, items: [] },
    { label: "Tuzilishi", icon: Building, collapsible: true, items: [
      referenceItem("Fakultetlar", "/structure/faculties", Building2),
      referenceItem("Mutaxassisliklar", "/structure/specialities", FolderTree),
    ] },
    { label: "Ta'lim jarayoni", icon: BookOpen, collapsible: true, items: [
      referenceItem("O'quv reja", "/edu-process/curriculum", BookMarked),
      referenceItem("O'quv rejaga biriktirilgan talabalar", "/edu-process/attached-students", UserCheck),
      referenceItem("O'quv dasturi", "/edu-process/syllabus", FileText),
      referenceItem("O'quv yillari", "/edu-process/academic-years", Calendar),
      referenceItem("Semestrlar", "/edu-process/semesters", CalendarDays),
      referenceItem("Fan guruhlari", "/edu-process/subject-groups", FolderTree),
      referenceItem("Fanlar", "/edu-process/subjects", NotebookText),
      referenceItem("Baholash tizimi", "/edu-process/rating-systems", Star),
      referenceItem("Vedmost", "/edu-process/statements", ClipboardList),
      referenceItem("Yakuniy vedmost", "/edu-process/total-statements", FileCheck2),
      referenceItem("Nazoratlar", "/controls", GraduationCap),
      referenceItem("HEMISga baholarini yuborish", "/edu-process/export-rating-to-hemis", Plug),
    ] },
    { label: "O'zlashtirish", icon: Award, collapsible: true, items: [
      referenceItem("Qayta o'qish", "/re-reading-subject-groups", BookOpen),
      referenceItem("Qayta o'qish rejasi", "/student/re-reading-application", ClipboardList),
      referenceItem("Akademik qarzdorlar", "/edu-process/academic-debtors", ShieldAlert),
      referenceItem("GPA", "/edu-process/gpa-rating-students", Award),
      referenceItem("Reyting monitoringi", "/users/rating-monitoring", Monitor),
      referenceItem("O'zlashtirish ko'rsatkichi", "/users/rating-average", BarChart3),
      referenceItem("Baholash", "/students-reading-recovery-for-rating", Star),
    ] },
    { label: "O'qituvchilar", icon: UserCog, collapsible: true, items: [
      referenceItem("O'qituvchi guruhlari", "/teachers/tutor-groups", Users),
      referenceItem("O'qituvchilar", "/teachers/tutors", UserCog),
    ] },
    { label: "Talabalar", icon: Users, collapsible: true, items: [
      referenceItem("Talabalar guruhlari", "/students/student-groups", Layers3),
      referenceItem("Talabalar", "/students/students", Users),
      referenceItem("Bitirgan talabalar", "/students/graduated", GraduationCap),
      referenceItem("O'qishni tiklagan talabalar", "/students/recovery", Activity),
      referenceItem("Akademik ta'tildagi talabalar", "/students/academic-leave", CalendarDays),
    ] },
    { label: "Talabalar harakati", icon: Activity, collapsible: true, items: [
      referenceItem("Ko'chirish", "/transfer-students", Activity),
      referenceItem("Chetlashtirilgan talabalar", "/students/expelled", UserCheck),
      referenceItem("Tiklangan talabalar fanlari hisoboti", "/student/recovery-study-subjects-info", FileSearch),
    ] },
    { label: "Akademik arxiv", icon: BookMarked, collapsible: true, items: [
      referenceItem("Chaqiruv qog'ozi", "/call-to-final-exam-letter", FileText),
      referenceItem("Transkript", "/transcript-students", ScrollText),
    ] },
    { label: "Monitoring", icon: Monitor, collapsible: true, items: [
      referenceItem("Talabalar", "/monitoring/students", Users),
      referenceItem("Darsga qatnashmayotganlar", "/monitoring/students-login-date", Activity),
      referenceItem("Tanlov fanlari", "/users/not-choose-subject-students", BookOpen),
      referenceItem("Talabalarning fanlarda ishtiroki", "/students/use-syllabus", UserCheck),
      referenceItem("Test natijalari", "/monitoring/test-results", FileQuestion),
      referenceItem("O'qituvchilar", "/monitoring/teachers", UserCog),
      referenceItem("Talabalarning IP manzillari", "/check-login-users", Fingerprint),
      referenceItem("Izohlar", "/commentary-lessons", MessageCircle),
    ] },
    { label: "Yangiliklar", icon: Megaphone, collapsible: true, items: [
      referenceItem("Yangiliklar", "/content/posts", Megaphone),
      ITEMS.aSchedule,
      referenceItem("Online resurslar", "/content/online-resource", Globe2),
    ] },
    { label: "Xabarlar",             href: "/messages", icon: MessageCircle, items: [] },
    { label: "Akkauntlar", icon: Shield, collapsible: true, items: [
      referenceItem("Administratorlar", "/accounts/admins", Users),
      referenceItem("Ruxsat guruhlari", "/accounts/permission-groups", Shield),
    ] },
    { label: "Statistika", icon: BarChart3, collapsible: true, items: [
      referenceItem("Statistika dashbordi", "/statistics-dashbord", LayoutDashboard),
      referenceItem("O'zlashtirish ko'rsatkichi", "/appropriation", BarChart3),
      referenceItem("Fan ma'lumotlari", "/subjects-report", BookOpen),
      referenceItem("Test ma'lumotlari", "/subjects-test-report", FileQuestion),
      referenceItem("Qayta o'qish ma'lumotlari", "/teacher-re-reading-report", FileSearch),
      referenceItem("Qayta o'qiyotgan talabalar", "/student-re-reading-report", Users),
      referenceItem("Semestr fanlari hisoboti", "/report/semester-subject", Calendar),
      referenceItem("Talabalar topshiriqlari statistikasi", "/student-tasks-report", ClipboardList),
      referenceItem("Talabalar baholari statistikasi", "/users-rating-mark-report", Star),
      referenceItem("Akademik qarzdor talabalar", "/failed-students", ShieldAlert),
    ] },
    { label: "Asosiy ma'lumot", icon: Database, collapsible: true, items: [
      referenceItem("Yorliqlar", "/general-info/labels", BadgeCheck),
      referenceItem("Davlatlar", "/general-info/countries", Globe2),
      referenceItem("Hududlar", "/general-info/regions", Landmark),
      referenceItem("Tumanlar", "/general-info/districts", Building),
      referenceItem("Millatlar", "/general-info/nationalities", Users),
    ] },
    { label: "Sozlamalar", icon: Settings, collapsible: true, items: [
      referenceItem("Sozlamalar", "/settings/configs", Settings),
      referenceItem("Tillar", "/settings/languages", Globe2),
      referenceItem("Tarjima", "/settings/internalization", FileText),
    ] },
  ];

  const groups: Record<string, NavGroup[]> = {
    SUPER_ADMIN: ADMIN_NAV,
    ADMIN:       ADMIN_NAV,
    METODIST: [
      { label: "Asosiy",             items: [ITEMS.aDashboard, ITEMS.aNotifications] },
      { label: "Talabalar",          items: [ITEMS.aStudents, ITEMS.aGroups, ITEMS.aReinstatementSubjects, ITEMS.aTeachers, ITEMS.contingent] },
      { label: "Ta'lim jarayoni",    items: [ITEMS.aAcademicPeriods, ITEMS.aPrograms, ITEMS.aSubjectCategories, ITEMS.aSubjects, ITEMS.aStudyPlans, ITEMS.aCurriculumStudents, ITEMS.aSyllabi, ITEMS.aSubjectGroups, ITEMS.aCourses, ITEMS.aSchedule, ITEMS.exams] },
      { label: "Nazorat va hisobot", items: [ITEMS.aContentReviews, ITEMS.aReports, ITEMS.aQualityStudies, ITEMS.aSurveys, ITEMS.stats] },
      { label: "Sozlamalar",         items: [ITEMS.aStudentClassifiers] },
      { label: "Kengaytirilgan", collapsible: true, items: [ITEMS.aFaculties, ITEMS.aDepartments, ITEMS.aForeignTeachers, ITEMS.aRestrictions, ITEMS.aAdmissionPolicies, ITEMS.aNonStateLicenses, ITEMS.aContentStandard, ITEMS.aOrientations, ITEMS.aPractices, ITEMS.aAssessmentLeaves, ITEMS.aAccountability, ITEMS.aReadiness, ITEMS.aPublications, ITEMS.resources, ITEMS.teaching, ITEMS.comms, ITEMS.aIntegrations, ITEMS.support] },
    ],
    TEACHER: [
      { label: "Asosiy",         items: [ITEMS.tDashboard] },
      { label: "Kurslar",        items: [ITEMS.tCourses, ITEMS.tContent, ITEMS.tSessions] },
      { label: "Baholash",       items: [ITEMS.tAssignments, ITEMS.tTests, ITEMS.tExams, ITEMS.tAttestations, ITEMS.tGradebook] },
      { label: "Talabalar",      items: [ITEMS.tStudents, ITEMS.tAttendance] },
      { label: "Kommunikatsiya", items: [ITEMS.tMessages, ITEMS.tAnnouncements, ITEMS.tNotifications] },
      { label: "Boshqa",         items: [ITEMS.tSurveys, ITEMS.tReports, ITEMS.support, ITEMS.tProfile] },
    ],
    STUDENT: [
      { label: "Asosiy",    items: [ITEMS.sDashboard] },
      { label: "Ta'lim",    items: [ITEMS.sOrientation, ITEMS.sPractice, ITEMS.sAssessmentLeave, ITEMS.sStudyPlan, ITEMS.sCourses, ITEMS.sSchedule, ITEMS.sAssignments, ITEMS.sTests, ITEMS.sExams, ITEMS.sAttestations] },
      { label: "Natijalar", items: [ITEMS.sGrades, ITEMS.sAttendance] },
      { label: "Aloqa",     items: [ITEMS.sMessages, ITEMS.sNotifications] },
      { label: "Boshqa",    items: [ITEMS.sSurveys, ITEMS.sCalendar, ITEMS.support, ITEMS.sProfile] },
    ],
    PROCTOR: [
      { label: "Asosiy", items: [ITEMS.home, ITEMS.exams, ITEMS.comms, ITEMS.support] },
    ],
    MONITORING: [
      { label: "Asosiy", items: [ITEMS.home] },
      { label: "Tahlil", items: [ITEMS.stats, ITEMS.aReports, ITEMS.aSurveys, ITEMS.aQualityStudies, ITEMS.aContentStandard, ITEMS.aRestrictions, ITEMS.aAccountability, ITEMS.aBiometric, ITEMS.aReadiness, ITEMS.aPublications, ITEMS.aIntegrations, ITEMS.comms, ITEMS.support] },
    ],
  };
  return groups[r] ?? [{ label: "Asosiy", items: [ITEMS.home, ITEMS.courses, ITEMS.comms, ITEMS.support] }];
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
        {navGroups.map((group) => {
          const GroupIcon = group.icon;

          if (group.href && GroupIcon) {
            return <SidebarGroup key={group.label} className="py-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={group.label}
                    isActive={isActive(group.href)}
                    onClick={() => go(group.href!)}
                  >
                    <GroupIcon />
                    <span>{group.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>;
          }

          if (group.collapsible && GroupIcon) {
            const groupActive = group.items.some((item) => isActive(item.href));
            return <Collapsible
              key={group.label}
              defaultOpen={groupActive}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={group.label} isActive={groupActive}>
                        <GroupIcon />
                        <span>{group.label}</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              href={item.href}
                              isActive={isActive(item.href)}
                              onClick={(event) => {
                                event.preventDefault();
                                go(item.href);
                              }}
                            >
                              <item.icon />
                              <span>{item.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </Collapsible>;
          }

          const groupContent = <SidebarGroupContent>
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
          </SidebarGroupContent>;

          if (group.collapsible) {
            return <Collapsible
              key={group.label}
              defaultOpen={group.items.some(item => isActive(item.href))}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="w-full cursor-pointer justify-between">
                    <span>{group.label}</span>
                    <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>{groupContent}</CollapsibleContent>
              </SidebarGroup>
            </Collapsible>;
          }

          return <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            {groupContent}
          </SidebarGroup>;
        })}
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
