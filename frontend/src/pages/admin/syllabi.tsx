import { SyllabusCatalog } from "@/components/admin/syllabus-catalog";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";

/**
 * O'quv dasturlari — bitta ro'yxat (Mentor LMS kabi). Dasturni o'quv reja faniga biriktirish ro'yxatdagi ⋮ menyuda
 * ("O'quv rejaga biriktirish").
 */
export function AdminSyllabi() {
  const { user } = useAuth();
  return <div className="p-3 sm:p-6"><SyllabusCatalog canWrite={hasAuthority(user, "ACADEMIC_WRITE")} /></div>;
}
