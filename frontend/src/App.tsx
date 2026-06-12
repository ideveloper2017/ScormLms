import { useState } from "react";
import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { RoleGuard } from "@/components/auth/role-guard";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/toaster";
import FaceRecognition from "@/components/auth/face-recognition";

// Auth pages
import LoginPage from "@/pages/auth/login";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";

// Dashboards
import { AdminDashboard } from "@/pages/admin-dashboard";
import { InstructorDashboard } from "@/pages/instructor-dashboard";
import { StudentDashboard } from "@/pages/student-dashboard";
import { ProctorDashboard } from "@/pages/proctor-dashboard";
import { MonitorDashboard } from "@/pages/monitor-dashboard";

// Feature pages
import { AttendanceProgress } from "@/pages/attendance-progress";
import { Communication } from "@/pages/communication";
import { ContingentManagement } from "@/pages/contingent-management";
import { Courses } from "@/pages/courses";
import { Exams } from "@/pages/exams";
import { Reports } from "@/pages/reports";
import { Resources } from "@/pages/resources";
import { Settings } from "@/pages/settings";
import { Statistics } from "@/pages/statistics";
import { StudentCabinet } from "@/pages/student-cabinet";
import { StudentManagement } from "@/pages/student-management";
import { TeachingManagement } from "@/pages/teaching-management";
import { UserManagement } from "@/pages/user-management";
import { CoursePlayer } from "@/components/scorm/course-player";
import { ProctoringSession } from "@/components/proctoring/proctoring-session";

// ─── Role constants (match backend role names, normalizeRole strips ROLE_ prefix) ──────
// Backend returns role.name = "super_admin" | "admin" | "metodist" | "teacher" |
//                             "student" | "proctor" | "monitoring"
// RoleGuard.normalizeRole("super_admin") → "SUPER_ADMIN"
// RoleGuard.normalizeRole("ROLE_SUPER_ADMIN") → "SUPER_ADMIN"  ← these must match

const R_SUPER  = "ROLE_SUPER_ADMIN";
const R_ADMIN  = "ROLE_ADMIN";
const R_MET    = "ROLE_METODIST";
const R_TEACH  = "ROLE_TEACHER";
const R_STU    = "ROLE_STUDENT";
const R_PROC   = "ROLE_PROCTOR";
const R_MON    = "ROLE_MONITORING";

// Convenience role groups
const ADMIN_ROLES     = [R_SUPER, R_ADMIN];
const STAFF_ROLES     = [R_SUPER, R_ADMIN, R_MET];
const TEACHER_ROLES   = [R_SUPER, R_ADMIN, R_MET, R_TEACH];
const CONTENT_ROLES   = [R_SUPER, R_ADMIN, R_MET, R_TEACH, R_STU];
const REPORTING_ROLES = [R_SUPER, R_ADMIN, R_MET, R_TEACH, R_MON];

// ─── App ────────────────────────────────────────────────────────────────────────────────

function App() {
  const { user, isLoading, completeLogin } = useAuth();
  const [faceRecognitionCompleted, setFaceRecognitionCompleted] = useState(
    localStorage.getItem("faceRecognitionCompleted") === "true"
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const handleFaceCompleted = () => {
    completeLogin(user ?? undefined);
    localStorage.setItem("faceRecognitionCompleted", "true");
    setFaceRecognitionCompleted(true);
  };

  return (
    <>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* ── Root: redirect to role-appropriate dashboard ─────────────────── */}
        <Route
          path="/"
          element={
            <AuthGuard>
              {isStudent(user) && !faceRecognitionCompleted ? (
                <FaceRecognition
                  referenceImage={user?.photo || "img.png"}
                  onSuccess={handleFaceCompleted}
                  onSkip={handleFaceCompleted}
                />
              ) : (
                <DashboardLayout>{getDashboardComponent(user)}</DashboardLayout>
              )}
            </AuthGuard>
          }
        />

        {/* ── Student-only ────────────────────────────────────────────────── */}
        <Route path="/student-dashboard" element={<P roles={[R_STU]}><StudentDashboard /></P>} />
        <Route path="/cabinet"           element={<P roles={[R_STU]}><StudentCabinet /></P>} />

        {/* ── All learning participants (staff + students) ─────────────────── */}
        <Route path="/courses"       element={<P roles={CONTENT_ROLES}><Courses /></P>} />
        <Route path="/resources"     element={<P roles={CONTENT_ROLES}><Resources /></P>} />
        <Route path="/communication" element={<P roles={[...CONTENT_ROLES, R_PROC]}><Communication /></P>} />
        <Route path="/exams"         element={<P roles={[R_SUPER, R_ADMIN, R_MET, R_TEACH, R_STU, R_PROC]}><Exams /></P>} />
        <Route path="/reports"       element={<P roles={REPORTING_ROLES}><Reports /></P>} />
        <Route path="/course/:id"    element={<P roles={CONTENT_ROLES}><CoursePlayer /></P>} />

        {/* ── Teacher / Metodist / Admin ────────────────────────────────────── */}
        <Route path="/contingent"  element={<P roles={STAFF_ROLES}><ContingentManagement /></P>} />
        <Route path="/attendance"  element={<P roles={TEACHER_ROLES}><AttendanceProgress /></P>} />
        <Route path="/teaching"    element={<P roles={TEACHER_ROLES}><TeachingManagement /></P>} />
        <Route path="/students-management" element={<P roles={STAFF_ROLES}><StudentManagement /></P>} />

        {/* ── Proctor ──────────────────────────────────────────────────────── */}
        <Route path="/exam/:id/proctoring" element={<P roles={[R_STU, R_PROC]}><ProctoringSession /></P>} />

        {/* ── Admin / Super Admin ───────────────────────────────────────────── */}
        <Route path="/management" element={<P roles={ADMIN_ROLES}><UserManagement /></P>} />
        <Route path="/statistics" element={<P roles={[...ADMIN_ROLES, R_MON, R_MET]}><Statistics /></P>} />
        <Route path="/settings"   element={<P roles={ADMIN_ROLES}><Settings /></P>} />

        {/* ── Wildcard: show role-appropriate dashboard ────────────────────── */}
        <Route
          path="*"
          element={
            <AuthGuard>
              <DashboardLayout>{getDashboardComponent(user)}</DashboardLayout>
            </AuthGuard>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

// ─── Protected page wrapper ─────────────────────────────────────────────────────────

function P({ roles, children }: { roles: string[]; children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard allowedRoles={roles}>{children}</RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}

// ─── Dashboard routing by role ──────────────────────────────────────────────────────

function getDashboardComponent(user: ReturnType<typeof useAuth>["user"]) {
  if (isStudent(user))                return <StudentDashboard />;
  if (hasRole(user, R_TEACH))         return <InstructorDashboard />;
  if (hasRole(user, R_PROC))          return <ProctorDashboard />;
  if (hasRole(user, R_MON))           return <MonitorDashboard />;
  if (hasRole(user, R_SUPER) ||
      hasRole(user, R_ADMIN) ||
      hasRole(user, R_MET))           return <AdminDashboard />;
  return <AdminDashboard />;
}

// ─── Role helpers ────────────────────────────────────────────────────────────────────

function isStudent(user: ReturnType<typeof useAuth>["user"]): boolean {
  return hasRole(user, R_STU);
}

function hasRole(user: ReturnType<typeof useAuth>["user"], roleToMatch: string): boolean {
  return (
    user?.roles.some(
      (role) => norm(role.code || role.name) === norm(roleToMatch)
    ) ?? false
  );
}

function norm(role: string): string {
  return role.replace(/^ROLE_/i, "").toUpperCase();
}

export default App;