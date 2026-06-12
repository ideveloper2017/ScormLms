import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, Plus, Search, Shield, Key, Trash2, UserCheck, UserX,
  RefreshCw, AlertTriangle, MoreHorizontal, Pencil, History,
  Lock, Unlock, Upload, Eye, EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/types/auth.types';
import {
  AuditLogEntry, UserCreateRequest, UserRecord, UserUpdateRequest,
  assignRoleToUser, changeUserStatus, createUser, deleteUser,
  getUserAuditLogs, hasAuthority, importUsers, listAuditLogs,
  listRoles, listUsers, resetUserPassword, updateUser,
} from '@/lib/rbac-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVE_TAB = 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm';

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: 'Faol',          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  INACTIVE:  { label: 'Nofaol',        className: 'bg-gray-100  text-gray-700  dark:bg-gray-800/40  dark:text-gray-400'  },
  BLOCKED:   { label: 'Bloklangan',    className: 'bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300'   },
  GRADUATED: { label: 'Bitirgan',      className: 'bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300'  },
  EXPELLED:  { label: 'Chetlashtirilgan', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  ARCHIVED:  { label: 'Arxivlangan',   className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400' },
};

const ROLE_META: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin:       'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300',
  metodist:    'bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300',
  teacher:     'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',
  student:     'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300',
  proctor:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  monitoring:  'bg-slate-100  text-slate-700  dark:bg-slate-800/40  dark:text-slate-400',
};

const ALL_STATUSES = Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }));

const ROLE_DISPLAY: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', metodist: 'Metodist',
  teacher: "O'qituvchi", student: 'Talaba', proctor: 'Proktor', monitoring: 'Monitoring',
};

const ROLES_ORDER = ['super_admin','admin','metodist','teacher','student','proctor','monitoring'];

const PERMISSION_MATRIX: Record<string, string[]> = {
  super_admin: ['USER_READ','USER_WRITE','USER_MANAGE','USER_MONITOR','COURSE_READ','COURSE_WRITE','ROLE_MANAGE','AUDIT_READ','REPORT_READ','STAT_READ','EXAM_MANAGE','EXAM_PROCTOR','EXAM_TAKE'],
  admin:       ['USER_READ','USER_WRITE','USER_MANAGE','COURSE_READ','COURSE_WRITE','AUDIT_READ','REPORT_READ','STAT_READ','EXAM_MANAGE'],
  metodist:    ['USER_READ','COURSE_READ','COURSE_WRITE','REPORT_READ','STAT_READ'],
  teacher:     ['COURSE_READ','COURSE_WRITE','EXAM_MANAGE','REPORT_READ'],
  student:     ['COURSE_READ','EXAM_TAKE'],
  proctor:     ['EXAM_PROCTOR','USER_MONITOR'],
  monitoring:  ['USER_READ','AUDIT_READ','REPORT_READ','STAT_READ'],
};

const ALL_PERMISSIONS: { code: string; label: string; group: string }[] = [
  { code: 'USER_READ',    label: "Foydalanuvchilarni ko'rish",         group: 'Foydalanuvchilar' },
  { code: 'USER_WRITE',   label: 'Foydalanuvchi yaratish/tahrirlash',   group: 'Foydalanuvchilar' },
  { code: 'USER_MANAGE',  label: "Parol tiklash, bloklash",             group: 'Foydalanuvchilar' },
  { code: 'USER_MONITOR', label: 'Monitoring',                          group: 'Foydalanuvchilar' },
  { code: 'ROLE_MANAGE',  label: 'Rollarni boshqarish',                 group: 'Tizim' },
  { code: 'AUDIT_READ',   label: 'Audit loglarni ko\'rish',             group: 'Tizim' },
  { code: 'COURSE_READ',  label: "Kurslarni ko'rish",                   group: 'Ta\'lim' },
  { code: 'COURSE_WRITE', label: 'Kurs yaratish/tahrirlash',            group: 'Ta\'lim' },
  { code: 'EXAM_MANAGE',  label: 'Imtihon boshqarish',                  group: 'Imtihon' },
  { code: 'EXAM_PROCTOR', label: 'Proctoring',                          group: 'Imtihon' },
  { code: 'EXAM_TAKE',    label: 'Imtihon topshirish',                  group: 'Imtihon' },
  { code: 'REPORT_READ',  label: "Hisobotlarni ko'rish",                group: 'Hisobot' },
  { code: 'STAT_READ',    label: "Statistikani ko'rish",                group: 'Hisobot' },
];

function displayName(u: UserRecord): string {
  return u.fullName?.trim() || u.username;
}

function initials(u: UserRecord): string {
  return displayName(u)
    .split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, className: '' };
  return <Badge className={m.className}>{m.label}</Badge>;
}

function RoleBadge({ role }: { role: Role | null }) {
  if (!role) return <span className="text-muted-foreground text-xs">—</span>;
  const key = role.name?.toLowerCase();
  const cls = key ? ROLE_META[key] : undefined;
  const label = key ? (ROLE_DISPLAY[key] ?? role.name) : role.name;
  return <Badge className={cls} variant={cls ? undefined : 'secondary'}>{label}</Badge>;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('uz-Latn', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('uz-Latn', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── CSV/JSON import parser ───────────────────────────────────────────────────

function parseImportText(raw: string): UserCreateRequest[] {
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  // detect JSON array
  if (raw.trim().startsWith('[')) {
    try { return JSON.parse(raw); } catch { return []; }
  }
  // CSV: fullName,username,password,email,phone,jshshir,faculty,direction,groupName,roleCode
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return {
      fullName:  obj.fullName  || obj.full_name || undefined,
      username:  obj.username,
      password:  obj.password,
      email:     obj.email     || undefined,
      phone:     obj.phone     || undefined,
      jshshir:   obj.jshshir   || undefined,
      faculty:   obj.faculty   || undefined,
      direction: obj.direction || undefined,
      groupName: obj.groupName || obj.group || obj.group_name || undefined,
      roleCode:  obj.roleCode  || obj.role  || 'student',
    } as UserCreateRequest;
  }).filter((r) => r.username);
}

// ─── Blank form ───────────────────────────────────────────────────────────────

function blankForm(): UserCreateRequest {
  return {
    fullName: '', username: '', email: '', phone: '',
    jshshir: '', faculty: '', direction: '', groupName: '',
    password: '', roleCode: '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const canWrite       = hasAuthority(currentUser, 'USER_WRITE');
  const canManage      = hasAuthority(currentUser, 'USER_MANAGE');
  const canAudit       = hasAuthority(currentUser, 'AUDIT_READ');
  const canRoles       = hasAuthority(currentUser, 'ROLE_MANAGE');
  const canManageRoles = canRoles || hasAuthority(currentUser, 'ROLE_SUPER_ADMIN');

  // ── data ──────────────────────────────────────────────────────────────────
  const [users,     setUsers]     = useState<UserRecord[]>([]);
  const [roles,     setRoles]     = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── filters ───────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── dialog targets ────────────────────────────────────────────────────────
  const [editTarget,   setEditTarget]   = useState<UserRecord | null>(null);  // null = create
  const [createOpen,   setCreateOpen]   = useState(false);
  const [assignTarget, setAssignTarget] = useState<UserRecord | null>(null);
  const [resetPwdTarget, setResetPwdTarget] = useState<UserRecord | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<UserRecord | null>(null);
  const [blockTarget,    setBlockTarget]    = useState<{ user: UserRecord; block: boolean } | null>(null);
  const [importOpen,  setImportOpen]  = useState(false);
  const [auditTarget, setAuditTarget] = useState<UserRecord | null>(null);
  const [userAuditLogs, setUserAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading,  setAuditLoading]  = useState(false);

  // ── form state ────────────────────────────────────────────────────────────
  const [form, setForm]             = useState<UserCreateRequest>(blankForm());
  const [showPwd,  setShowPwd]      = useState(false);
  const [assignRole, setAssignRole] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<UserCreateRequest[]>([]);

  // ─── load ─────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [u, r] = await Promise.all([listUsers(), listRoles()]);
      setUsers(u);
      setRoles(r);
      if (canAudit) {
        try { setAuditLogs(await listAuditLogs()); } catch { /* ignore */ }
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  }, [canAudit]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = !t ||
        u.username.toLowerCase().includes(t) ||
        (u.fullName ?? '').toLowerCase().includes(t) ||
        (u.email    ?? '').toLowerCase().includes(t) ||
        (u.phone    ?? '').toLowerCase().includes(t) ||
        (u.jshshir  ?? '').toLowerCase().includes(t);
      const matchRole   = roleFilter   === 'all' || (u.role?.name ?? '') === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ─── stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   users.length,
    active:  users.filter((u) => u.status === 'ACTIVE').length,
    blocked: users.filter((u) => u.status === 'BLOCKED').length,
    roles:   roles.length,
  }), [users, roles]);

  // ─── action runner ────────────────────────────────────────────────────────
  const run = async (fn: () => Promise<void>, msg: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await fn();
      toast({ title: msg });
      await loadAll();
      return true;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Xatolik', description: err instanceof Error ? err.message : 'Amal bajarilmadi' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── handlers ─────────────────────────────────────────────────────────────

  const openCreate = () => { setForm(blankForm()); setEditTarget(null); setCreateOpen(true); };
  const openEdit   = (u: UserRecord) => {
    setEditTarget(u);
    setForm({
      fullName:  u.fullName  ?? '',
      username:  u.username,
      email:     u.email     ?? '',
      phone:     u.phone     ?? '',
      jshshir:   u.jshshir   ?? '',
      faculty:   u.faculty   ?? '',
      direction: u.direction ?? '',
      groupName: u.groupName ?? '',
      password:  '',
      roleCode:  u.role?.name ?? '',
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) { toast({ variant: 'destructive', title: 'Login majburiy' }); return; }
    if (!editTarget && !form.password) { toast({ variant: 'destructive', title: 'Parol majburiy' }); return; }
    if (!editTarget && !form.roleCode) { toast({ variant: 'destructive', title: 'Rol majburiy' }); return; }

    const ok = await run(async () => {
      if (editTarget) {
        const req: UserUpdateRequest = {
          fullName:  form.fullName  || undefined,
          email:     form.email     || undefined,
          phone:     form.phone     || undefined,
          jshshir:   form.jshshir   || undefined,
          faculty:   form.faculty   || undefined,
          direction: form.direction || undefined,
          groupName: form.groupName || undefined,
          roleCode:  form.roleCode  || undefined,
        };
        await updateUser(editTarget.id, req);
      } else {
        await createUser(form);
      }
    }, editTarget ? `${form.username} yangilandi` : `${form.username} yaratildi`);

    if (ok) { setCreateOpen(false); setEditTarget(null); }
  };

  const handleAssignRole = async () => {
    if (!assignTarget || !assignRole) return;
    const ok = await run(
      () => assignRoleToUser(assignTarget.username, assignRole).then(() => undefined),
      `${displayName(assignTarget)} ga rol biriktirildi`
    );
    if (ok) { setAssignTarget(null); setAssignRole(''); }
  };

  const handleResetPwd = async () => {
    if (!resetPwdTarget || !newPwd.trim()) { toast({ variant: 'destructive', title: 'Yangi parol majburiy' }); return; }
    const ok = await run(
      () => resetUserPassword(resetPwdTarget.id, newPwd).then(() => undefined),
      `${displayName(resetPwdTarget)} paroli tiklandi`
    );
    if (ok) { setResetPwdTarget(null); setNewPwd(''); }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    const newStatus = blockTarget.block ? 'BLOCKED' : 'ACTIVE';
    const label = blockTarget.block ? 'bloklandi' : 'faollashtirildi';
    const ok = await run(
      () => changeUserStatus(blockTarget.user.id, newStatus as any).then(() => undefined),
      `${displayName(blockTarget.user)} ${label}`
    );
    if (ok) setBlockTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await run(
      () => deleteUser(deleteTarget.id),
      `${displayName(deleteTarget)} o'chirildi`
    );
    if (ok) setDeleteTarget(null);
  };

  const handleImport = async () => {
    if (importPreview.length === 0) { toast({ variant: 'destructive', title: 'Hech narsa topilmadi' }); return; }
    const ok = await run(
      () => importUsers(importPreview).then(() => undefined),
      `${importPreview.length} ta foydalanuvchi import qilindi`
    );
    if (ok) { setImportOpen(false); setImportText(''); setImportPreview([]); }
  };

  const openAudit = async (u: UserRecord) => {
    setAuditTarget(u);
    setUserAuditLogs([]);
    setAuditLoading(true);
    try {
      setUserAuditLogs(await getUserAuditLogs(u.username));
    } catch {
      toast({ variant: 'destructive', title: 'Loglarni yuklab bo\'lmadi' });
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── loading/error ────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-muted-foreground">Yuklanmoqda...</p>
    </div>
  );

  if (loadError) return (
    <div className="p-6">
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-center text-muted-foreground">{loadError}</p>
          <Button onClick={loadAll} className="gap-2"><RefreshCw className="h-4 w-4" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar Reestri</h1>
          <p className="text-muted-foreground">Barcha tizim foydalanuvchilari yagona ro'yxatda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadAll} title="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
          {canWrite && (
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />Import
            </Button>
          )}
          {canWrite && (
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />Qo'shish
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users,     label: 'Jami',        value: stats.total,   cls: '' },
          { icon: UserCheck, label: 'Faol',         value: stats.active,  cls: 'text-green-600' },
          { icon: UserX,     label: 'Bloklangan',   value: stats.blocked, cls: 'text-red-600' },
          { icon: Shield,    label: 'Rollar',       value: stats.roles,   cls: 'text-blue-600' },
        ].map(({ icon: Icon, label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className={`h-4 w-4 ${cls}`} />{label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className={`grid w-full ${canAudit && canManageRoles ? 'grid-cols-3' : canAudit || canManageRoles ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="users"       className={ACTIVE_TAB}>Foydalanuvchilar</TabsTrigger>
          {canManageRoles && <TabsTrigger value="permissions" className={ACTIVE_TAB}>Huquqlar Matritsasi</TabsTrigger>}
          {canAudit       && <TabsTrigger value="audit"       className={ACTIVE_TAB}>Audit Log</TabsTrigger>}
        </TabsList>

        {/* ── Users tab ──────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ism, login, email, telefon, JSHSHIR..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    {ROLE_DISPLAY[r.name?.toLowerCase()] ?? r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {filtered.length} ta foydalanuvchi
                  {filtered.length !== users.length && ` (jami: ${users.length})`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">F.I.Sh / Login</TableHead>
                      <TableHead>Telefon / Email</TableHead>
                      <TableHead>JSHSHIR</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Fak. / Yo'n. / Guruh</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qo'shilgan</TableHead>
                      <TableHead className="text-right w-12">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          Foydalanuvchi topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((u) => {
                      const isSelf = currentUser?.username === u.username;
                      return (
                        <TableRow key={u.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{initials(u)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm leading-tight">{displayName(u)}</div>
                                <div className="text-xs text-muted-foreground">{u.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm leading-tight">{u.phone ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{u.email ?? '—'}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{u.jshshir ?? '—'}</TableCell>
                          <TableCell><RoleBadge role={u.role} /></TableCell>
                          <TableCell>
                            <div className="text-xs leading-snug space-y-0.5">
                              {u.faculty   && <div className="text-muted-foreground">{u.faculty}</div>}
                              {u.direction && <div className="text-muted-foreground">{u.direction}</div>}
                              {u.groupName && <div className="font-medium">{u.groupName}</div>}
                              {!u.faculty && !u.direction && !u.groupName && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={u.status} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {canWrite && (
                                  <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2">
                                    <Pencil className="h-4 w-4" />Tahrirlash
                                  </DropdownMenuItem>
                                )}
                                {canRoles && (
                                  <DropdownMenuItem onClick={() => { setAssignTarget(u); setAssignRole(''); }} className="gap-2">
                                    <Shield className="h-4 w-4" />Rol biriktirish
                                  </DropdownMenuItem>
                                )}
                                {canManage && (
                                  <DropdownMenuItem onClick={() => { setResetPwdTarget(u); setNewPwd(''); }} className="gap-2">
                                    <Key className="h-4 w-4" />Parolni tiklash
                                  </DropdownMenuItem>
                                )}
                                {canAudit && (
                                  <DropdownMenuItem onClick={() => openAudit(u)} className="gap-2">
                                    <History className="h-4 w-4" />Harakatlarni ko'rish
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {canWrite && !isSelf && u.status !== 'BLOCKED' && (
                                  <DropdownMenuItem
                                    onClick={() => setBlockTarget({ user: u, block: true })}
                                    className="gap-2 text-orange-600 focus:text-orange-600"
                                  >
                                    <Lock className="h-4 w-4" />Bloklash
                                  </DropdownMenuItem>
                                )}
                                {canWrite && !isSelf && u.status === 'BLOCKED' && (
                                  <DropdownMenuItem
                                    onClick={() => setBlockTarget({ user: u, block: false })}
                                    className="gap-2 text-green-600 focus:text-green-600"
                                  >
                                    <Unlock className="h-4 w-4" />Blokni ochish
                                  </DropdownMenuItem>
                                )}
                                {canWrite && !isSelf && (
                                  <DropdownMenuItem
                                    onClick={() => setDeleteTarget(u)}
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />O'chirish
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Permissions Matrix tab ─────────────────────────────────────── */}
        {canManageRoles && (
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rollar va Huquqlar Matritsasi</CardTitle>
                <CardDescription>
                  Har bir rol ega bo'lgan huquqlar. Bu huquqlar tizimda kodlangan va avtomatik boshqariladi.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64 min-w-[200px]">Huquq</TableHead>
                        <TableHead className="text-xs text-muted-foreground w-24">Guruh</TableHead>
                        {ROLES_ORDER.map((r) => (
                          <TableHead key={r} className="text-center min-w-[90px]">
                            <div className="flex flex-col items-center gap-1">
                              <RoleBadge role={{ name: r }} />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_PERMISSIONS.map((perm, i) => {
                        const prevGroup = i > 0 ? ALL_PERMISSIONS[i - 1].group : null;
                        const isNewGroup = perm.group !== prevGroup;
                        return (
                          <>
                            {isNewGroup && (
                              <TableRow key={`group-${perm.group}`} className="bg-muted/40">
                                <TableCell colSpan={2 + ROLES_ORDER.length}
                                  className="py-1.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {perm.group}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow key={perm.code}>
                              <TableCell>
                                <div>
                                  <div className="text-sm font-medium">{perm.label}</div>
                                  <div className="text-xs font-mono text-muted-foreground">{perm.code}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{perm.group}</TableCell>
                              {ROLES_ORDER.map((role) => {
                                const has = PERMISSION_MATRIX[role]?.includes(perm.code);
                                return (
                                  <TableCell key={role} className="text-center">
                                    {has
                                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-bold">✓</span>
                                      : <span className="inline-block w-4 h-px bg-muted-foreground/30 mx-auto" />
                                    }
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Per-role cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ROLES_ORDER.map((role) => {
                const perms = PERMISSION_MATRIX[role] ?? [];
                const userCount = users.filter((u) => u.role?.name?.toLowerCase() === role).length;
                return (
                  <Card key={role} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <RoleBadge role={{ name: role }} />
                        <span className="text-xs text-muted-foreground">{userCount} ta</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-wrap gap-1">
                        {perms.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs font-mono py-0">{p}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* ── Audit tab ──────────────────────────────────────────────────── */}
        {canAudit && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tizim Audit Logi</CardTitle>
                <CardDescription>So'nggi 200 ta amal</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead>Harakat</TableHead>
                        <TableHead>Metod / URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Vaqt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Log topilmadi</TableCell>
                        </TableRow>
                      )}
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-sm">{log.username ?? 'System'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-mono">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.method && <span className="text-foreground mr-1">{log.method}</span>}
                            {log.path}
                          </TableCell>
                          <TableCell>
                            {log.status && (
                              <Badge className={log.status >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                {log.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{log.ip ?? '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ════════════════ DIALOGS ════════════════════════════════════════════ */}

      {/* Create / Edit user */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi qo\'shish'}</DialogTitle>
            <DialogDescription>
              {editTarget ? `${editTarget.username} ma'lumotlarini yangilash` : 'Barcha majburiy maydonlarni to\'ldiring'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>F.I.Sh.</Label>
              <Input placeholder="Ismoilov Ismoil Ismoilovich" value={form.fullName ?? ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Login <span className="text-destructive">*</span></Label>
              <Input placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editTarget} />
            </div>
            {!editTarget && (
              <div className="space-y-1.5">
                <Label>Parol <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPwd((v) => !v)}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Rol {!editTarget && <span className="text-destructive">*</span>}</Label>
              <Select value={form.roleCode ?? ''} onValueChange={(v) => setForm({ ...form, roleCode: v })}>
                <SelectTrigger><SelectValue placeholder="Rolni tanlang" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.name} value={r.name}>
                      {ROLE_DISPLAY[r.name?.toLowerCase()] ?? r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input placeholder="+998901234567" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>JSHSHIR</Label>
              <Input placeholder="12345678901234" value={form.jshshir ?? ''} onChange={(e) => setForm({ ...form, jshshir: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Guruh</Label>
              <Input placeholder="CS-22-01" value={form.groupName ?? ''} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fakultet</Label>
              <Input placeholder="Kompyuter Fanlari" value={form.faculty ?? ''} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Yo'nalish</Label>
              <Input placeholder="Dasturiy injiniring" value={form.direction ?? ''} onChange={(e) => setForm({ ...form, direction: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null); }}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saqlanmoqda...' : (editTarget ? 'Saqlash' : 'Yaratish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => { if (!o) setAssignTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rol biriktirish</DialogTitle>
            <DialogDescription>{assignTarget ? displayName(assignTarget) : ''}</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Yangi rol</Label>
            <Select value={assignRole} onValueChange={setAssignRole}>
              <SelectTrigger><SelectValue placeholder="Rolni tanlang" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    {ROLE_DISPLAY[r.name?.toLowerCase()] ?? r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Bekor qilish</Button>
            <Button onClick={handleAssignRole} disabled={isSubmitting || !assignRole}>
              {isSubmitting ? 'Biriktirilmoqda...' : 'Biriktirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password (admin) */}
      <Dialog open={!!resetPwdTarget} onOpenChange={(o) => { if (!o) setResetPwdTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Parolni tiklash</DialogTitle>
            <DialogDescription>
              {resetPwdTarget ? `${displayName(resetPwdTarget)} uchun yangi parol o'rnating` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Yangi parol</Label>
            <div className="relative">
              <Input type={showNewPwd ? 'text' : 'password'} placeholder="••••••••"
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNewPwd((v) => !v)}>
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwdTarget(null)}>Bekor qilish</Button>
            <Button onClick={handleResetPwd} disabled={isSubmitting}>
              {isSubmitting ? 'Tiklanmoqda...' : 'Tiklash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Audit Log */}
      <Dialog open={!!auditTarget} onOpenChange={(o) => { if (!o) setAuditTarget(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Foydalanuvchi harakatlari</DialogTitle>
            <DialogDescription>{auditTarget ? `${displayName(auditTarget)} — ${auditTarget.username}` : ''}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            {auditLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : userAuditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Harakatlar topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Harakat</TableHead>
                    <TableHead>Metod / URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Vaqt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline" className="text-xs font-mono">{log.action}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.method && <span className="text-foreground mr-1">{log.method}</span>}{log.path}
                      </TableCell>
                      <TableCell>
                        {log.status && (
                          <Badge className={log.status >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {log.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.ip ?? '—'}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Import */}
      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) { setImportOpen(false); setImportText(''); setImportPreview([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foydalanuvchilarni import qilish</DialogTitle>
            <DialogDescription>CSV yoki JSON formatida ma'lumot kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-md p-3 text-xs font-mono text-muted-foreground">
              CSV format (1-qator sarlavha):<br />
              fullName,username,password,email,phone,jshshir,faculty,direction,groupName,roleCode
            </div>
            <textarea
              className="w-full h-40 border rounded-md p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
              placeholder={"fullName,username,password,email,phone,jshshir,faculty,direction,groupName,roleCode\nAli Valiyev,ali001,pass123,ali@edu.uz,+998901111111,12345678901234,Fizika,Yadro fizikasi,FIZ-22-01,student"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setImportPreview(parseImportText(importText))}>
                <Eye className="h-4 w-4" />Ko'rib chiqish
              </Button>
              {importPreview.length > 0 && (
                <span className="text-sm text-muted-foreground self-center">{importPreview.length} ta yozuv topildi</span>
              )}
            </div>
            {importPreview.length > 0 && (
              <div className="border rounded-md overflow-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login</TableHead><TableHead>F.I.Sh.</TableHead>
                      <TableHead>Email</TableHead><TableHead>Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.username}</TableCell>
                        <TableCell className="text-xs">{r.fullName ?? '—'}</TableCell>
                        <TableCell className="text-xs">{r.email ?? '—'}</TableCell>
                        <TableCell className="text-xs">{r.roleCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportText(''); setImportPreview([]); }}>Bekor qilish</Button>
            <Button onClick={handleImport} disabled={isSubmitting || importPreview.length === 0} className="gap-2">
              <Upload className="h-4 w-4" />
              {isSubmitting ? 'Import qilinmoqda...' : `Import (${importPreview.length} ta)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block / Unblock confirm */}
      <AlertDialog open={!!blockTarget} onOpenChange={(o) => { if (!o) setBlockTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.block ? 'Foydalanuvchini bloklash' : 'Blokni ochish'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget
                ? blockTarget.block
                  ? `${displayName(blockTarget.user)} tizimga kira olmaydi. Blokni keyinchalik ochish mumkin.`
                  : `${displayName(blockTarget.user)} yana tizimga kira oladi.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className={blockTarget?.block ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={handleBlock}
            >
              {blockTarget?.block ? 'Bloklash' : 'Faollashtirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${displayName(deleteTarget)} (${deleteTarget.username}) butunlay o'chiriladi. Bu amlni bekor qilib bo'lmaydi.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
