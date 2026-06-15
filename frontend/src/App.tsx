import { useState } from "react";
import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { RoleGuard } from "@/components/auth/role-guard";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/toaster";
import FaceRecognition from "@/components/auth/face-recognition";
import LoginPage from "@/pages/auth/login";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { AttendanceProgress } from "@/pages/attendance-progress";
import { Communication } from "@/pages/communication";
import { ContingentManagement } from "@/pages/contingent-management";
import { Courses } from "@/pages/courses";
import { Exams } from "@/pages/exams";
import { InstructorDashboard } from "@/pages/instructor-dashboard";
import { Reports } from "@/pages/reports";
import { Resources } from "@/pages/resources";
import { Settings } from "@/pages/settings";
import { Statistics } from "@/pages/statistics";
import { StudentCabinet } from "@/pages/student-cabinet";
import { StudentDashboard } from "@/pages/student-dashboard";
import { TeachingManagement } from "@/pages/teaching-management";
import { UserManagement } from "@/pages/user-management";
import { CoursePlayer } from "@/components/scorm/course-player";
import { ProctoringSession } from "@/components/proctoring/proctoring-session";
import { ProctorDashboard } from "@/pages/proctor-dashboard";
import { MonitorDashboard } from "@/pages/monitor-dashboard";
import { StudentManagement } from "@/pages/student-management";

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
        <Route path="/login" element={<LoginPage />} />

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

        <Route
          path="/student-dashboard"
          element={
            <ProtectedPage allowedRoles={["ROLE_STUDENT"]}>
              <StudentDashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/cabinet"
          element={
            <ProtectedPage allowedRoles={["ROLE_STUDENT"]}>
              <StudentCabinet />
            </ProtectedPage>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <Courses />
            </ProtectedPage>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <Resources />
            </ProtectedPage>
          }
        />
        <Route
          path="/communication"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <Communication />
            </ProtectedPage>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <Exams />
            </ProtectedPage>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <Reports />
            </ProtectedPage>
          }
        />

        <Route
          path="/contingent"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR"]}>
              <ContingentManagement />
            </ProtectedPage>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR"]}>
              <AttendanceProgress />
            </ProtectedPage>
          }
        />
        <Route
          path="/teaching"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR"]}>
              <TeachingManagement />
            </ProtectedPage>
          }
        />

        <Route
          path="/management"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN"]}>
              <UserManagement />
            </ProtectedPage>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN"]}>
              <Statistics />
            </ProtectedPage>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN"]}>
              <Settings />
            </ProtectedPage>
          }
        />

        <Route
          path="/course/:id"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_STUDENT"]}>
              <CoursePlayer />
            </ProtectedPage>
          }
        />
        <Route
          path="/exam/:id/proctoring"
          element={
            <ProtectedPage allowedRoles={["ROLE_STUDENT"]}>
              <ProctoringSession />
            </ProtectedPage>
          }
        />

        <Route
          path="/students-management"
          element={
            <ProtectedPage allowedRoles={["ROLE_ADMIN", "ROLE_METODIST"]}>
              <StudentManagement />
            </ProtectedPage>
          }
        />

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

function ProtectedPage({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard allowedRoles={allowedRoles}>{children}</RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}

function getDashboardComponent(user: ReturnType<typeof useAuth>["user"]) {
  if (isStudent(user)) return <StudentDashboard />;
  if (hasRole(user, "ROLE_INSTRUCTOR")) return <InstructorDashboard />;
  if (hasRole(user, "ROLE_PROCTOR")) return <ProctorDashboard />;
  if (hasRole(user, "ROLE_MONITOR")) return <MonitorDashboard />;
  // New roles mapping:
  if (isSuperAdmin(user) || hasRole(user, "ROLE_ADMIN") || hasRole(user, "ROLE_METODIST")) {
      return <AdminDashboard />;
  }
  return <AdminDashboard />;
}

function isStudent(user: ReturnType<typeof useAuth>["user"]): boolean {
  return hasRole(user, "ROLE_STUDENT") || hasRole(user, "STUDENT");
}

function isSuperAdmin(user: ReturnType<typeof useAuth>["user"]): boolean {
  return hasRole(user, "ROLE_SUPER_ADMIN");
}

function hasRole(user: ReturnType<typeof useAuth>["user"], roleToMatch: string): boolean {
  return user?.roles.some((role) => normalizeRole(role.code || role.name) === normalizeRole(roleToMatch)) ?? false;
}

function normalizeRole(role: string): string {
  return role.replace(/^ROLE_/i, "").toUpperCase();
}

export default App;
