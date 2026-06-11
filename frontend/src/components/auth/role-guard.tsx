import { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  userRole?: string | string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, userRole, fallback }: RoleGuardProps) {
  const { user } = useAuth();
  const userRoles = userRole
    ? toRoleList(userRole)
    : user?.roles.map((role) => role.code || role.name) ?? [];

  const hasAccess = allowedRoles.length === 0 || allowedRoles.some((allowedRole) =>
    userRoles.some((role) => normalizeRole(role) === normalizeRole(allowedRole))
  );

  if (!hasAccess) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Ruxsat yo'q</h2>
          <p className="text-muted-foreground">
            Bu sahifaga kirish uchun sizda yetarli huquq yo'q.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function toRoleList(role: string | string[]): string[] {
  return Array.isArray(role) ? role : [role];
}

function normalizeRole(role: string): string {
  return role.replace(/^ROLE_/i, "").toUpperCase();
}
