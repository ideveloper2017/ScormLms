import { User, Settings, LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

export function RoleSwitcher() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const getRoleLabel = (role: string) => {
    switch (normalizeRole(role)) {
      case 'STUDENT':
        return 'Talaba';
      case 'INSTRUCTOR':
        return 'O\'qituvchi';
      case 'ADMIN':
        return 'Administrator';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
  const primaryRole = user.roles[0]?.code || user.roles[0]?.name || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photo} alt={displayName} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge variant="secondary">
              {getRoleLabel(primaryRole)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/*<DropdownMenuLabel className="text-xs font-medium text-muted-foreground">*/}
        {/*  Rolni o'zgartirish*/}
        {/*</DropdownMenuLabel>*/}
        {/*<DropdownMenuItem onClick={() => switchRole('student')}>*/}
        {/*  <UserCheck className="mr-2 h-4 w-4" />*/}
        {/*  <span>Talaba sifatida</span>*/}
        {/*</DropdownMenuItem>*/}
        {/*<DropdownMenuItem onClick={() => switchRole('instructor')}>*/}
        {/*  <User className="mr-2 h-4 w-4" />*/}
        {/*  <span>O'qituvchi sifatida</span>*/}
        {/*</DropdownMenuItem>*/}
        {/*<DropdownMenuItem onClick={() => switchRole('admin')}>*/}
        {/*  <Settings className="mr-2 h-4 w-4" />*/}
        {/*  <span>Administrator sifatida</span>*/}
        {/*</DropdownMenuItem>*/}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Chiqish</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function normalizeRole(role: string): string {
  return role.replace(/^ROLE_/i, '').toUpperCase();
}
