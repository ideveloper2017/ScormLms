import { useEffect, useState } from "react";
import { Shield, Users, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listUsers, listRoles } from "@/lib/rbac-api";
import type { Role } from "@/types/auth.types";

const ROLE_META: Record<string, { label: string; cls: string }> = {
  super_admin: { label: "Super Admin",  cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  admin:       { label: "Admin",        cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300"    },
  metodist:    { label: "Metodist",     cls: "bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300"   },
  teacher:     { label: "O'qituvchi",   cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  student:     { label: "Talaba",       cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  proctor:     { label: "Proktor",      cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  monitoring:  { label: "Monitoring",   cls: "bg-slate-100  text-slate-700  dark:bg-slate-800/40  dark:text-slate-400"  },
};

const PERMISSION_MATRIX: Record<string, string[]> = {
  super_admin: ["USER_READ","USER_WRITE","USER_MANAGE","USER_MONITOR","COURSE_READ","COURSE_WRITE","ROLE_MANAGE","AUDIT_READ","REPORT_READ","STAT_READ","EXAM_MANAGE","EXAM_PROCTOR","EXAM_TAKE"],
  admin:       ["USER_READ","USER_WRITE","USER_MANAGE","COURSE_READ","COURSE_WRITE","AUDIT_READ","REPORT_READ","STAT_READ","EXAM_MANAGE"],
  metodist:    ["USER_READ","COURSE_READ","COURSE_WRITE","REPORT_READ","STAT_READ"],
  teacher:     ["COURSE_READ","COURSE_WRITE","EXAM_MANAGE","REPORT_READ"],
  student:     ["COURSE_READ","EXAM_TAKE"],
  proctor:     ["EXAM_PROCTOR","USER_MONITOR"],
  monitoring:  ["USER_READ","AUDIT_READ","REPORT_READ","STAT_READ"],
};

const ALL_PERMISSIONS: { code: string; label: string; group: string }[] = [
  { code: "USER_READ",    label: "Foydalanuvchilarni ko'rish",        group: "Foydalanuvchilar" },
  { code: "USER_WRITE",   label: "Foydalanuvchi yaratish/tahrirlash", group: "Foydalanuvchilar" },
  { code: "USER_MANAGE",  label: "Parol tiklash, bloklash",           group: "Foydalanuvchilar" },
  { code: "USER_MONITOR", label: "Monitoring",                        group: "Foydalanuvchilar" },
  { code: "ROLE_MANAGE",  label: "Rollarni boshqarish",               group: "Tizim"            },
  { code: "AUDIT_READ",   label: "Audit loglarni ko'rish",            group: "Tizim"            },
  { code: "COURSE_READ",  label: "Kurslarni ko'rish",                 group: "Ta'lim"           },
  { code: "COURSE_WRITE", label: "Kurs yaratish/tahrirlash",          group: "Ta'lim"           },
  { code: "EXAM_MANAGE",  label: "Imtihon boshqarish",                group: "Imtihon"          },
  { code: "EXAM_PROCTOR", label: "Proctoring",                        group: "Imtihon"          },
  { code: "EXAM_TAKE",    label: "Imtihon topshirish",                group: "Imtihon"          },
  { code: "REPORT_READ",  label: "Hisobotlarni ko'rish",              group: "Hisobot"          },
  { code: "STAT_READ",    label: "Statistikani ko'rish",              group: "Hisobot"          },
];

const ROLES_ORDER = ["super_admin","admin","metodist","teacher","student","proctor","monitoring"];

export function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, u] = await Promise.all([listRoles(), listUsers()]);
      setRoles(r);
      const counts: Record<string, number> = {};
      u.forEach((usr) => {
        const key = usr.role?.name?.toLowerCase() ?? "unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
      setUserCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner className="h-8 w-8" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

  const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rollar</h1>
          <p className="text-muted-foreground">Tizim rollari va ruxsatlar matritsasi</p>
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Rol kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {ROLES_ORDER.map((key) => {
          const meta = ROLE_META[key];
          const count = userCounts[key] ?? 0;
          const perms = PERMISSION_MATRIX[key] ?? [];
          return (
            <Card key={key} className="flex flex-col">
              <CardHeader className="pb-2 pt-4 px-4">
                <Badge className={meta.cls + " w-fit"}>{meta.label}</Badge>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">{count}</span>
                  <span className="text-muted-foreground text-xs">ta</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {perms.length} ruxsat
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Ruxsatlar Matritsasi</CardTitle>
          <CardDescription>
            Har bir rol ega bo'lgan ruxsatlar. Tizimda kodlangan va avtomatik boshqariladi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56 min-w-[200px]">Ruxsat</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-28">Guruh</TableHead>
                  {ROLES_ORDER.map((r) => {
                    const meta = ROLE_META[r];
                    return (
                      <TableHead key={r} className="text-center min-w-[90px]">
                        <Badge className={meta.cls + " text-xs"}>{meta.label}</Badge>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map((perm, i) => {
                  const prevGroup = i > 0 ? ALL_PERMISSIONS[i - 1].group : null;
                  const isNewGroup = perm.group !== prevGroup;
                  return (
                    <>
                      {isNewGroup && (
                        <TableRow key={`grp-${perm.group}`} className="bg-muted/40">
                          <TableCell colSpan={2 + ROLES_ORDER.length}
                            className="py-1.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {perm.group}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow key={perm.code}>
                        <TableCell>
                          <div className="text-sm font-medium">{perm.label}</div>
                          <div className="text-xs font-mono text-muted-foreground">{perm.code}</div>
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

      {/* Summary */}
      <div className="text-xs text-muted-foreground text-center">
        Jami {roles.length} ta rol • {totalUsers} ta foydalanuvchi
      </div>
    </div>
  );
}
