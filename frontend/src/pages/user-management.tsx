import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  Key,
  Trash2,
  UserCheck,
  UserCog,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Spinner } from '@/components/ui/spinner.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Permissions, Role, User } from '@/types/auth.types';
import {
  addPermissionToRole,
  assignRoleToUser,
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  deleteUser,
  hasAuthority,
  listPermissions,
  listRoles,
  listUsers,
  registerUser,
} from '@/lib/rbac-api';

// Tailwind v3'da ui/tabs.tsx'dagi data-active: variantlari kompilyatsiya bo'lmaydi;
// faol tab ko'rinishi uchun v3-mos arbitrary variant shu yerda beriladi
const ACTIVE_TAB_CLASS =
  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm';

const ROLE_BADGE_COLORS: Record<string, string> = {
  ROLE_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  ROLE_INSTRUCTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ROLE_STUDENT: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

function displayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

function initials(user: User): string {
  const name = displayName(user);
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function RoleBadge({ role }: { role: Role }) {
  const color = role.code ? ROLE_BADGE_COLORS[role.code.toUpperCase()] : undefined;
  return (
    <Badge className={color} variant={color ? undefined : 'secondary'}>
      {role.name || role.code}
    </Badge>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const canManageRoles = hasAuthority(currentUser, 'ROLE_MANAGE');
  const canWriteUsers = hasAuthority(currentUser, 'USER_WRITE');

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('users');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Yangi foydalanuvchi
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('');

  // Rol biriktirish
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [assignRoleCode, setAssignRoleCode] = useState('');

  // Foydalanuvchini o'chirish
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Yangi rol / rolni o'chirish / rolga huquq qo'shish
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<Role | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<Role | null>(null);
  const [permissionCode, setPermissionCode] = useState('');

  // Yangi huquq / huquqni o'chirish
  const [createPermissionOpen, setCreatePermissionOpen] = useState(false);
  const [newPermissionCode, setNewPermissionCode] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [deletePermissionTarget, setDeletePermissionTarget] = useState<Permissions | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [usersData, rolesData, permissionsData, logsData] = await Promise.all([
        listUsers(),
        canManageRoles ? listRoles() : Promise.resolve<Role[]>([]),
        canManageRoles ? listPermissions() : Promise.resolve<Permissions[]>([]),
        canManageRoles ? listAuditLogs() : Promise.resolve<any[]>([]),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setAuditLogs(logsData);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  }, [canManageRoles]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Filter uchun rollar: ROLE_MANAGE bo'lmasa userlardagi rollardan yig'amiz
  const filterRoles = useMemo(() => {
    if (roles.length > 0) return roles;
    const seen = new Map<string, Role>();
    for (const user of users) {
      for (const role of user.roles ?? []) {
        if (role.code && !seen.has(role.code)) seen.set(role.code, role);
      }
    }
    return [...seen.values()];
  }, [roles, users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.username.toLowerCase().includes(term) ||
        (user.email ?? '').toLowerCase().includes(term) ||
        displayName(user).toLowerCase().includes(term);
      const matchesRole =
        roleFilter === 'all' || (user.roles ?? []).some((role) => role.code === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const roleUserCount = useCallback(
    (role: Role) => users.filter((u) => (u.roles ?? []).some((r) => r.code === role.code)).length,
    [users]
  );

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsSubmitting(true);
    try {
      await action();
      toast({ title: successMessage });
      await loadAll();
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Amal bajarilmadi',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    const username = newUsername.trim();
    if (!username || !newPassword) {
      toast({ variant: 'destructive', title: 'Login va parol majburiy' });
      return;
    }
    const ok = await runAction(async () => {
      await registerUser(username, newPassword);
      if (canManageRoles && newUserRole && newUserRole !== 'ROLE_STUDENT') {
        await assignRoleToUser(username, newUserRole);
      }
    }, `${username} yaratildi`);
    if (ok) {
      setCreateUserOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('');
    }
  };

  const handleAssignRole = async () => {
    if (!assignTarget || !assignRoleCode) return;
    const ok = await runAction(
      () => assignRoleToUser(assignTarget.username, assignRoleCode).then(() => undefined),
      `${assignTarget.username} foydalanuvchisiga rol biriktirildi`
    );
    if (ok) {
      setAssignTarget(null);
      setAssignRoleCode('');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    await runAction(
      () => deleteUser(deleteTarget.username),
      `${deleteTarget.username} o'chirildi`
    );
    setDeleteTarget(null);
  };

  const handleCreateRole = async () => {
    const code = newRoleCode.trim().toUpperCase();
    const name = newRoleName.trim();
    if (!code || !name) {
      toast({ variant: 'destructive', title: 'Rol kodi va nomi majburiy' });
      return;
    }
    const ok = await runAction(
      () => createRole(code, name).then(() => undefined),
      `${code} roli yaratildi`
    );
    if (ok) {
      setCreateRoleOpen(false);
      setNewRoleCode('');
      setNewRoleName('');
    }
  };

  const handleAddPermission = async () => {
    if (!permissionTarget?.code || !permissionCode) return;
    const ok = await runAction(
      () => addPermissionToRole(permissionTarget.code!, permissionCode).then(() => undefined),
      `${permissionTarget.code} roliga huquq qo'shildi`
    );
    if (ok) {
      setPermissionTarget(null);
      setPermissionCode('');
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget?.code) return;
    await runAction(
      () => deleteRole(deleteRoleTarget.code!),
      `${deleteRoleTarget.code} roli o'chirildi`
    );
    setDeleteRoleTarget(null);
  };

  const handleCreatePermission = async () => {
    const code = newPermissionCode.trim().toUpperCase();
    const name = newPermissionName.trim();
    if (!code || !name) {
      toast({ variant: 'destructive', title: 'Huquq kodi va nomi majburiy' });
      return;
    }
    const ok = await runAction(
      () => createPermission(code, name).then(() => undefined),
      `${code} huquqi yaratildi`
    );
    if (ok) {
      setCreatePermissionOpen(false);
      setNewPermissionCode('');
      setNewPermissionName('');
    }
  };

  const handleDeletePermission = async () => {
    if (!deletePermissionTarget?.code) return;
    await runAction(
      () => deletePermission(deletePermissionTarget.code!),
      `${deletePermissionTarget.code} huquqi o'chirildi`
    );
    setDeletePermissionTarget(null);
  };

  const assignableRoles = useMemo(() => {
    if (!assignTarget) return roles;
    const owned = new Set((assignTarget.roles ?? []).map((r) => r.code));
    return roles.filter((r) => r.code && !owned.has(r.code));
  }, [roles, assignTarget]);

  const addablePermissions = useMemo(() => {
    if (!permissionTarget) return permissions;
    const owned = new Set((permissionTarget.permissions ?? []).map((p) => p.code));
    return permissions.filter((p) => p.code && !owned.has(p.code));
  }, [permissions, permissionTarget]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-center text-muted-foreground">{loadError}</p>
            <Button onClick={loadAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boshqarish Komponenti</h1>
          <p className="text-muted-foreground">
            Foydalanuvchilar, rollar va huquqlarni boshqarish
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadAll} title="Yangilash">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={() => setCreateUserOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi Foydalanuvchi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jami Foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Faol Foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.enabled).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              2FA Yoqilgan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.twoFactorEnabled).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Rollar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterRoles.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-col space-y-6">
        <TabsList className={`grid w-full ${canManageRoles ? 'grid-cols-4' : 'grid-cols-1'}`}>
          <TabsTrigger value="users" className={ACTIVE_TAB_CLASS}>Foydalanuvchilar</TabsTrigger>
          {canManageRoles && (
            <TabsTrigger value="roles" className={ACTIVE_TAB_CLASS}>Rollar</TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="permissions" className={ACTIVE_TAB_CLASS}>Huquqlar</TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="audit" className={ACTIVE_TAB_CLASS}>Audit Loglar</TabsTrigger>
          )}
        </TabsList>
        {/* ... */}
        {canManageRoles && (
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Loglar</CardTitle>
                <CardDescription>Tizim faoliyati va foydalanuvchi harakatlari tarixi</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foydalanuvchi</TableHead>
                      <TableHead>Harakat</TableHead>
                      <TableHead>Tafsilotlar</TableHead>
                      <TableHead>Vaqt</TableHead>
                      <TableHead>IP Manzil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                          Loglar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.username || 'System'}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="text-muted-foreground">{log.details}</TableCell>
                        <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-mono">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Login, ism yoki email bo'yicha qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                {filterRoles.map((role) => (
                  <SelectItem key={role.code} value={role.code ?? ''}>
                    {role.name || role.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Foydalanuvchilar Ro'yxati</CardTitle>
              <CardDescription>
                Barcha tizim foydalanuvchilari va ularning rollari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Rollar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Email tasdiqlangan</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        Foydalanuvchi topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredUsers.map((user) => {
                    const isSelf = currentUser?.username === user.username;
                    return (
                      <TableRow key={user.id ?? user.username}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {user.photo && <AvatarImage src={user.photo} alt={displayName(user)} />}
                              <AvatarFallback>{initials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{displayName(user)}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email || user.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(user.roles ?? []).map((role) => (
                              <RoleBadge key={role.code ?? role.name} role={role} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.enabled ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              Faol
                            </Badge>
                          ) : (
                            <Badge variant="outline">Bloklangan</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              Tasdiqlangan
                            </Badge>
                          ) : (
                            <Badge variant="outline">Tasdiqlanmagan</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.twoFactorEnabled ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 gap-1">
                              <Shield className="h-3 w-3" />
                              Yoqilgan
                            </Badge>
                          ) : (
                            <Badge variant="outline">O'chiq</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {canManageRoles && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Rol biriktirish"
                                onClick={() => {
                                  setAssignTarget(user);
                                  setAssignRoleCode('');
                                }}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            )}
                            {canWriteUsers && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={isSelf ? "O'zingizni o'chira olmaysiz" : "O'chirish"}
                                disabled={isSelf}
                                onClick={() => setDeleteTarget(user)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        {canManageRoles && (
          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setCreateRoleOpen(true)}>
                <Plus className="h-4 w-4" />
                Yangi Rol
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Rollar va Huquqlar</CardTitle>
                <CardDescription>Tizim rollari va ularga biriktirilgan huquqlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roles.length === 0 && (
                  <p className="text-center text-muted-foreground py-10">Rollar topilmadi</p>
                )}
                {roles.map((role) => (
                  <div
                    key={role.code ?? role.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <RoleBadge role={role} />
                        <span className="text-sm font-mono text-muted-foreground">{role.code}</span>
                        <span className="text-sm text-muted-foreground">
                          {roleUserCount(role)} foydalanuvchi
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions ?? []).length === 0 && (
                          <span className="text-xs text-muted-foreground">Huquqlar yo'q</span>
                        )}
                        {(role.permissions ?? []).map((permission) => (
                          <Badge key={permission.code} variant="outline" className="text-xs">
                            {permission.name || permission.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissionTarget(role);
                          setPermissionCode('');
                        }}
                      >
                        Huquq qo'shish
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Rolni o'chirish"
                        onClick={() => setDeleteRoleTarget(role)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Permissions Tab */}
        {canManageRoles && (
          <TabsContent value="permissions" className="space-y-6">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setCreatePermissionOpen(true)}>
                <Plus className="h-4 w-4" />
                Yangi Huquq
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Huquqlar Katalogi</CardTitle>
                <CardDescription>
                  Tizimdagi barcha huquqlar va ular ishlatiladigan rollar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Rollarda</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                          Huquqlar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                    {permissions.map((permission) => {
                      const usedIn = roles.filter((role) =>
                        (role.permissions ?? []).some((p) => p.code === permission.code)
                      );
                      return (
                        <TableRow key={permission.code ?? permission.id}>
                          <TableCell className="font-mono text-sm">{permission.code}</TableCell>
                          <TableCell>{permission.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {usedIn.length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              {usedIn.map((role) => (
                                <RoleBadge key={role.code} role={role} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Huquqni o'chirish"
                              onClick={() => setDeletePermissionTarget(permission)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Yangi foydalanuvchi dialogi */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Foydalanuvchi Qo'shish</DialogTitle>
            <DialogDescription>
              Foydalanuvchi STUDENT roli bilan yaratiladi
              {canManageRoles ? ", so'ng tanlangan rol biriktiriladi" : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Login</Label>
              <Input
                placeholder="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Parol</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {canManageRoles && (
              <div className="space-y-2">
                <Label>Qo'shimcha rol (ixtiyoriy)</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rolni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.code} value={role.code ?? ''}>
                        {role.name || role.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rol biriktirish dialogi */}
      <Dialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rol biriktirish</DialogTitle>
            <DialogDescription>
              {assignTarget ? `${displayName(assignTarget)} (${assignTarget.username})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Rol</Label>
            <Select value={assignRoleCode} onValueChange={setAssignRoleCode}>
              <SelectTrigger>
                <SelectValue placeholder="Rolni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Barcha rollar allaqachon biriktirilgan
                  </div>
                )}
                {assignableRoles.map((role) => (
                  <SelectItem key={role.code} value={role.code ?? ''}>
                    {role.name || role.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAssignRole} disabled={isSubmitting || !assignRoleCode}>
              {isSubmitting ? 'Biriktirilmoqda...' : 'Biriktirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yangi rol dialogi */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Rol</DialogTitle>
            <DialogDescription>Rol kodi ROLE_ prefiksi bilan yoziladi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kod</Label>
              <Input
                placeholder="ROLE_MODERATOR"
                value={newRoleCode}
                onChange={(e) => setNewRoleCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                placeholder="Moderator"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateRole} disabled={isSubmitting}>
              {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rolga huquq qo'shish dialogi */}
      <Dialog
        open={permissionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rolga huquq qo'shish</DialogTitle>
            <DialogDescription>{permissionTarget?.code}</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Huquq</Label>
            <Select value={permissionCode} onValueChange={setPermissionCode}>
              <SelectTrigger>
                <SelectValue placeholder="Huquqni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {addablePermissions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Barcha huquqlar allaqachon qo'shilgan
                  </div>
                )}
                {addablePermissions.map((permission) => (
                  <SelectItem key={permission.code} value={permission.code ?? ''}>
                    {permission.name || permission.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionTarget(null)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAddPermission} disabled={isSubmitting || !permissionCode}>
              {isSubmitting ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yangi huquq dialogi */}
      <Dialog open={createPermissionOpen} onOpenChange={setCreatePermissionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Huquq</DialogTitle>
            <DialogDescription>Masalan: COURSE_READ, EXAM_MANAGE</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kod</Label>
              <Input
                placeholder="COURSE_READ"
                value={newPermissionCode}
                onChange={(e) => setNewPermissionCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                placeholder="Kurslarni ko'rish"
                value={newPermissionName}
                onChange={(e) => setNewPermissionName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePermissionOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreatePermission} disabled={isSubmitting}>
              {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Foydalanuvchini o'chirish tasdiqlash */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${displayName(deleteTarget)} (${deleteTarget.username}) butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rolni o'chirish tasdiqlash */}
      <AlertDialog
        open={deleteRoleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRoleTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRoleTarget
                ? `${deleteRoleTarget.code} roli o'chiriladi. Bu rolga ega ${roleUserCount(deleteRoleTarget)} foydalanuvchi unga bog'liq huquqlarini yo'qotadi.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteRole}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Huquqni o'chirish tasdiqlash */}
      <AlertDialog
        open={deletePermissionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePermissionTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Huquqni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePermissionTarget
                ? `${deletePermissionTarget.code} huquqi o'chiriladi va barcha rollardan olib tashlanadi.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePermission}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
