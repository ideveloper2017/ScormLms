import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Home, 
  Users, 
  Settings, 
  BookOpen, 
  GraduationCap,
  FileText,
  Library,
  Shield,
  X,
  Monitor,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Kurslar', href: '/courses', icon: BookOpen },
    { name: 'Axborot Resurslari', href: '/resources', icon: Library },
    { name: 'Kommunikatsiya', href: '/communication', icon: MessageCircle },
    { name: 'Imtihonlar', href: '/exams', icon: GraduationCap },
  ];

  const roleName = normalizeRole(role);

  if (roleName === 'STUDENT') {
    return [
      ...baseNavigation,
      { name: 'Shaxsiy Kabinet', href: '/cabinet', icon: Users },
      { name: 'Hisobotlar', href: '/reports', icon: FileText },
    ];
  }

  if (roleName === 'INSTRUCTOR') {
    return [
      ...baseNavigation,
      { name: 'Davomat va O\'zlashtirish', href: '/attendance', icon: BarChart3 },
      { name: 'Kontingent', href: '/contingent', icon: Users },
      { name: 'O\'qitishni Boshqarish', href: '/teaching', icon: Users },
      { name: 'Hisobotlar', href: '/reports', icon: FileText },
    ];
  }

  if (roleName === 'PROCTOR') {
    return [
      { name: 'Imtihonlarni Nazorat qilish', href: '/exams', icon: Shield },
      { name: 'Monitoring', href: '/statistics', icon: Monitor },
    ];
  }

  if (roleName === 'MONITOR') {
    return [
      { name: 'Monitoring', href: '/statistics', icon: Monitor },
      { name: 'Hisobotlar', href: '/reports', icon: FileText },
    ];
  }
  
  if (roleName === 'METODIST') {
    return [
      ...baseNavigation,
      { name: 'O\'qitishni Boshqarish', href: '/teaching', icon: Users },
      { name: 'Talabalar Boshqaruvi', href: '/students-management', icon: Users },
      { name: 'Hisobotlar', href: '/reports', icon: FileText },
    ];
  }

  // Admin and Super Admin navigation
  return [
    ...baseNavigation,
    { name: 'Kontingent', href: '/contingent', icon: Users },
    { name: 'Talabalar Boshqaruvi', href: '/students-management', icon: Users },
    { name: 'Davomat va O\'zlashtirish', href: '/attendance', icon: BarChart3 },
    { name: 'Boshqarish', href: '/management', icon: Settings },
    { name: 'O\'qitishni Boshqarish', href: '/teaching', icon: Users },
    { name: 'Hisobotlar', href: '/reports', icon: FileText },
    { name: 'Statistika', href: '/statistics', icon: BarChart3 },
    { name: 'Sozlamalar', href: '/settings', icon: Shield },
  ];
};

const oldNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Kurslar', href: '/courses', icon: BookOpen },
  { name: 'Axborot Resurslari', href: '/resources', icon: Library },
  { name: 'Kontingent', href: '/contingent', icon: Users },
  { name: 'Davomat va O\'zlashtirish', href: '/attendance', icon: BarChart3 },
  { name: 'Kommunikatsiya', href: '/communication', icon: MessageCircle },
  { name: 'Imtihonlar', href: '/exams', icon: GraduationCap },
  { name: 'Boshqarish', href: '/management', icon: Settings },
  { name: 'O\'qitishni Boshqarish', href: '/teaching', icon: Users },
  { name: 'Hisobotlar', href: '/reports', icon: FileText },
  { name: 'Statistika', href: '/statistics', icon: BarChart3 },
  { name: 'Sozlamalar', href: '/settings', icon: Shield },
];

export function Sidebar({ open, setOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const primaryRole = user?.roles?.[0]?.code || user?.roles?.[0]?.name || '';
  const navigation = user ? getNavigationForRole(primaryRole) : oldNavigation;
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Foydalanuvchi';
  const displayEmail = user?.email || user?.phone || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Monitor className="text-white h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg">EduLMS</span>
              <p className="text-xs text-muted-foreground">SCORM Platform</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-secondary/80 text-secondary-foreground"
                )}
                onClick={() => {
                  navigate(item.href);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        {/* SCORM & Avtoproktoring Status */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              SCORM 2004 tayyor
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Monitor className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Avtoproktoring faol
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function normalizeRole(role: string): string {
  return role.replace(/^ROLE_/i, '').toUpperCase();
}
