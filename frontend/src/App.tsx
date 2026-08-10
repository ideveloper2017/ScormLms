import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { RoleGuard } from "@/components/auth/role-guard";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/toaster";

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
import { SupportPage } from "@/pages/support";
import { Statistics } from "@/pages/statistics";
import { StudentCabinet } from "@/pages/student-cabinet";
import { StudentManagement } from "@/pages/student-management";
import { TeachingManagement } from "@/pages/teaching-management";
import { UserManagement } from "@/pages/user-management";
import { Groups } from "@/pages/groups";
import { Subjects } from "@/pages/subjects";
import { TeacherManagement } from "@/pages/teacher-management";
import { AcademicStructure } from "@/pages/academic-structure";
import { CoursePlayer } from "@/components/scorm/course-player";
import { ProctoringSession } from "@/components/proctoring/proctoring-session";

// Admin pages
import { AdminRoles } from "@/pages/admin/roles";
import { AdminFaculties } from "@/pages/admin/faculties";
import { AdminDepartments } from "@/pages/admin/departments";
import { AdminPrograms } from "@/pages/admin/programs";
import { AdminGroups } from "@/pages/admin/groups";
import { AdminStudentClassifiers } from "@/pages/admin/student-classifiers";
import { AdminReinstatementSubjectReport } from "@/pages/admin/reinstatement-subject-report";
import { AdminSubjects } from "@/pages/admin/subjects";
import { AdminStudyPlans } from "@/pages/admin/study-plans";
import { AdminAcademicPeriods } from "@/pages/admin/academic-periods";
import { AdminSubjectGroups } from "@/pages/admin/subject-groups";
import { AdminAdmissionPolicies } from "@/pages/admin/admission-policies";
import { AdminNonStateLicenses } from "@/pages/admin/non-state-licenses";
import { AdminCalendar } from "@/pages/admin/calendar";
import { AdminIntegrations } from "@/pages/admin/integrations";
import { AdminAuditLogs } from "@/pages/admin/audit-logs";
import { AdminCompliance559 } from "@/pages/admin/compliance-559";
import { AdminSurveys } from "@/pages/admin/surveys";
import { AdminContentReviews } from "@/pages/admin/content-reviews";
import { AdminOrientations } from "@/pages/admin/orientations";
import { AdminQualityMonitoring } from "@/pages/admin/quality-monitoring";
import { AdminPractices } from "@/pages/admin/practices";
import { AdminAssessmentLeaves } from "@/pages/admin/assessment-leaves";
import { AdminForeignTeacherEngagements } from "@/pages/admin/foreign-teacher-engagements";
import { AdminAccountabilityReferrals } from "@/pages/admin/accountability-referrals";
import { AdminDistanceProgramRestrictions } from "@/pages/admin/distance-program-restrictions";
import { AdminBiometricGovernance } from "@/pages/admin/biometric-governance";
import { AdminDistanceReadiness } from "@/pages/admin/distance-readiness";
import { AdminOfficialSitePublications } from "@/pages/admin/official-site-publications";
import { AdminContentStandard } from "@/pages/admin/content-standard";
import { PublicInstitutionDisclosure } from "@/pages/public/institution-disclosure";
import { Surveys } from "@/pages/surveys";

// Student pages
import { StudentSchedule } from "@/pages/student/schedule";
import { StudentAssignments } from "@/pages/student/assignments";
import { StudentTests } from "@/pages/student/tests";
import { TestSession } from "@/pages/student/test-session";
import { TestResults } from "@/pages/student/test-results";
import { StudentGrades } from "@/pages/student/grades";
import { StudentAttendance } from "@/pages/student/attendance";
import { StudentNotifications } from "@/pages/student/notifications";
import { StudentStudyPlan } from "@/pages/student/study-plan";
import { StudentCourseLearning } from "@/pages/student/course-learning";
import { StudentOrientation } from "@/pages/student/orientation";
import { StudentPractice } from "@/pages/student/practice";
import { StudentAssessmentLeave } from "@/pages/student/assessment-leave";

// Teacher pages
import { TeacherDashboard } from "@/pages/teacher/dashboard";
import { TeacherCourses } from "@/pages/teacher/courses";
import { TeacherCourseCreate } from "@/pages/teacher/course-create";
import { TeacherCourseDetail } from "@/pages/teacher/course-detail";
import { TeacherAssignments } from "@/pages/teacher/assignments";
import { TeacherSubmissions } from "@/pages/teacher/submissions";
import { TeacherTests } from "@/pages/teacher/tests";
import { TeacherQuestions } from "@/pages/teacher/questions";
import { TeacherGradebook } from "@/pages/teacher/gradebook";
import { TeacherStudents } from "@/pages/teacher/students";
import { TeacherAttendance } from "@/pages/teacher/attendance";
import { TeacherAnnouncements } from "@/pages/teacher/announcements";
import { TeacherContent } from "@/pages/teacher/content";
import { TeacherSessions } from "@/pages/teacher/sessions";
import { TeacherExams } from "@/pages/teacher/exams";
import { TeacherAttestations } from "@/pages/teacher/attestations";
import { StudentAttestations } from "@/pages/student/attestations";
import { TeacherProfile } from "@/pages/teacher/profile";

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
const ALL_ROLES       = [R_SUPER, R_ADMIN, R_MET, R_TEACH, R_STU, R_PROC, R_MON];

// ─── App ────────────────────────────────────────────────────────────────────────────────

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    console.log('App.tsx - Showing loading screen');
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/public/institution" element={<PublicInstitutionDisclosure />} />
        
        {/* ── Face Recognition Setup (for students) ──────────────────────── */}
        {/* ── Root: redirect to role-appropriate dashboard ─────────────────── */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <DashboardLayout>{getDashboardComponent(user)}</DashboardLayout>
            </AuthGuard>
          }
        />

        {/* ── Student-only ────────────────────────────────────────────────── */}
        <Route path="/student-dashboard" element={<P roles={[R_STU]}><StudentDashboard /></P>} />
        <Route path="/cabinet"           element={<P roles={[R_STU]}><StudentCabinet /></P>} />

        {/* ── /teacher/* ───────────────────────────────────────────────────── */}
        <Route path="/teacher/dashboard"              element={<P roles={TEACHER_ROLES}><TeacherDashboard /></P>} />
        <Route path="/teacher/courses"                element={<P roles={TEACHER_ROLES}><TeacherCourses /></P>} />
        <Route path="/teacher/courses/create"         element={<P roles={TEACHER_ROLES}><TeacherCourseCreate /></P>} />
        <Route path="/teacher/courses/:id"            element={<P roles={TEACHER_ROLES}><TeacherCourseDetail /></P>} />
        <Route path="/teacher/courses/:id/modules"    element={<P roles={TEACHER_ROLES}><TeacherCourseDetail defaultTab="modules" /></P>} />
        <Route path="/teacher/courses/:id/lessons"    element={<P roles={TEACHER_ROLES}><TeacherCourseDetail defaultTab="lessons" /></P>} />
        <Route path="/teacher/courses/:id/contents"   element={<P roles={TEACHER_ROLES}><TeacherCourseDetail defaultTab="contents" /></P>} />
        <Route path="/teacher/courses/:id/forum"      element={<P roles={TEACHER_ROLES}><TeacherCourseDetail defaultTab="forum" /></P>} />
        <Route path="/teacher/assignments"            element={<P roles={TEACHER_ROLES}><TeacherAssignments /></P>} />
        <Route path="/teacher/assignments/create"     element={<P roles={TEACHER_ROLES}><TeacherAssignments openCreate /></P>} />
        <Route path="/teacher/assignments/:id/submissions" element={<P roles={TEACHER_ROLES}><TeacherSubmissions /></P>} />
        <Route path="/teacher/tests"                  element={<P roles={TEACHER_ROLES}><TeacherTests /></P>} />
        <Route path="/teacher/tests/create"           element={<P roles={TEACHER_ROLES}><TeacherTests openCreate /></P>} />
        <Route path="/teacher/questions"              element={<P roles={TEACHER_ROLES}><TeacherQuestions /></P>} />
        <Route path="/teacher/gradebook"              element={<P roles={TEACHER_ROLES}><TeacherGradebook /></P>} />
        <Route path="/teacher/students"               element={<P roles={TEACHER_ROLES}><TeacherStudents /></P>} />
        <Route path="/teacher/attendance"             element={<P roles={TEACHER_ROLES}><TeacherAttendance /></P>} />
        <Route path="/teacher/sessions"               element={<P roles={TEACHER_ROLES}><TeacherSessions /></P>} />
        <Route path="/teacher/exams"                  element={<P roles={TEACHER_ROLES}><TeacherExams /></P>} />
        <Route path="/teacher/attestations"           element={<P roles={TEACHER_ROLES}><TeacherAttestations /></P>} />
        <Route path="/teacher/messages"               element={<P roles={TEACHER_ROLES}><Communication /></P>} />
        <Route path="/teacher/announcements"          element={<P roles={TEACHER_ROLES}><TeacherAnnouncements /></P>} />
        <Route path="/teacher/notifications"          element={<P roles={TEACHER_ROLES}><StudentNotifications /></P>} />
        <Route path="/teacher/content"                element={<P roles={TEACHER_ROLES}><TeacherContent /></P>} />
        <Route path="/teacher/reports"                element={<P roles={TEACHER_ROLES}><Reports /></P>} />
        <Route path="/teacher/profile"                element={<P roles={TEACHER_ROLES}><TeacherProfile /></P>} />
        <Route path="/teacher/surveys"                element={<P roles={[R_TEACH]}><Surveys /></P>} />

        {/* ── /student/* ───────────────────────────────────────────────────── */}
        <Route path="/student/dashboard"     element={<P roles={[R_STU]}><StudentDashboard /></P>} />
        <Route path="/student/courses"       element={<P roles={[R_STU]}><Courses /></P>} />
        <Route path="/student/study-plan"    element={<P roles={[R_STU]}><StudentStudyPlan /></P>} />
        <Route path="/student/orientation"   element={<P roles={[R_STU]}><StudentOrientation /></P>} />
        <Route path="/student/practice"      element={<P roles={[R_STU]}><StudentPractice /></P>} />
        <Route path="/student/assessment-leave" element={<P roles={[R_STU]}><StudentAssessmentLeave /></P>} />
        <Route path="/student/courses/:id/learn" element={<P roles={[R_STU]}><StudentCourseLearning /></P>} />
        <Route path="/student/schedule"      element={<P roles={[R_STU]}><StudentSchedule /></P>} />
        <Route path="/student/assignments"   element={<P roles={[R_STU]}><StudentAssignments /></P>} />
        <Route path="/student/tests"         element={<P roles={[R_STU]}><StudentTests /></P>} />
        <Route path="/student/tests/:testId/proctoring" element={<P roles={[R_STU]}><ProctoringSession /></P>} />
        <Route path="/student/tests/:testId/session" element={<P roles={[R_STU]}><TestSession /></P>} />
        <Route path="/student/tests/:testId/results" element={<P roles={[R_STU]}><TestResults /></P>} />
        <Route path="/student/exams"         element={<P roles={[R_STU]}><Exams /></P>} />
        <Route path="/student/attestations"  element={<P roles={[R_STU]}><StudentAttestations /></P>} />
        <Route path="/student/grades"        element={<P roles={[R_STU]}><StudentGrades /></P>} />
        <Route path="/student/attendance"    element={<P roles={[R_STU]}><StudentAttendance /></P>} />
        <Route path="/student/messages"      element={<P roles={[R_STU]}><Communication /></P>} />
        <Route path="/student/notifications" element={<P roles={[R_STU]}><StudentNotifications /></P>} />
        <Route path="/student/calendar"      element={<P roles={[R_STU]}><AdminCalendar /></P>} />
        <Route path="/student/profile"       element={<P roles={[R_STU]}><StudentCabinet /></P>} />
        <Route path="/student/surveys"       element={<P roles={[R_STU]}><Surveys /></P>} />

        {/* ── All learning participants (staff + students) ─────────────────── */}
        <Route path="/courses"       element={<P roles={CONTENT_ROLES}><Courses /></P>} />
        <Route path="/resources"     element={<P roles={CONTENT_ROLES}><Resources /></P>} />
        <Route path="/communication" element={<P roles={[...CONTENT_ROLES, R_PROC]}><Communication /></P>} />
        <Route path="/support"       element={<P roles={ALL_ROLES}><SupportPage /></P>} />
        <Route path="/exams"         element={<P roles={[R_SUPER, R_ADMIN, R_MET, R_TEACH, R_STU, R_PROC]}><Exams /></P>} />
        <Route path="/reports"       element={<P roles={REPORTING_ROLES}><Reports /></P>} />
        <Route path="/course/:id"    element={<P roles={CONTENT_ROLES}><CoursePlayer /></P>} />

        {/* ── Teacher / Metodist / Admin ────────────────────────────────────── */}
        <Route path="/contingent"  element={<P roles={STAFF_ROLES}><ContingentManagement /></P>} />
        <Route path="/attendance"  element={<P roles={TEACHER_ROLES}><AttendanceProgress /></P>} />
        <Route path="/teaching"    element={<P roles={TEACHER_ROLES}><TeachingManagement /></P>} />
        <Route path="/students-management" element={<P roles={STAFF_ROLES}><StudentManagement /></P>} />

        {/* ── Akademik tuzilma (Stage 3) ───────────────────────────────────── */}
        <Route path="/academic"            element={<P roles={STAFF_ROLES}><AcademicStructure /></P>} />
        <Route path="/groups"              element={<P roles={STAFF_ROLES}><Groups /></P>} />
        <Route path="/subjects"            element={<P roles={STAFF_ROLES}><Subjects /></P>} />
        <Route path="/teachers-management" element={<P roles={STAFF_ROLES}><TeacherManagement /></P>} />

        {/* ── Proctor ──────────────────────────────────────────────────────── */}
        <Route path="/exam/:id/proctoring" element={<P roles={[R_STU]}><ProctoringSession /></P>} />

        {/* ── Admin / Super Admin ───────────────────────────────────────────── */}
        <Route path="/management" element={<P roles={ADMIN_ROLES}><UserManagement /></P>} />
        <Route path="/statistics" element={<P roles={[...ADMIN_ROLES, R_MON, R_MET]}><Statistics /></P>} />
        <Route path="/settings"   element={<P roles={ADMIN_ROLES}><Settings /></P>} />

        {/* ── /admin/* ─────────────────────────────────────────────────────── */}
        <Route path="/admin/dashboard"    element={<P roles={STAFF_ROLES}><AdminDashboard /></P>} />
        <Route path="/admin/users"        element={<P roles={ADMIN_ROLES}><UserManagement /></P>} />
        <Route path="/admin/students"     element={<P roles={STAFF_ROLES}><StudentManagement /></P>} />
        <Route path="/admin/student-movement/reinstatement-subjects" element={<P roles={STAFF_ROLES}><AdminReinstatementSubjectReport /></P>} />
        <Route path="/admin/teachers"     element={<P roles={STAFF_ROLES}><TeacherManagement /></P>} />
        <Route path="/admin/roles"        element={<P roles={ADMIN_ROLES}><AdminRoles /></P>} />
        <Route path="/admin/faculties"    element={<P roles={STAFF_ROLES}><AdminFaculties /></P>} />
        <Route path="/admin/departments"  element={<P roles={STAFF_ROLES}><AdminDepartments /></P>} />
        <Route path="/admin/programs"     element={<P roles={STAFF_ROLES}><AdminPrograms /></P>} />
        <Route path="/admin/groups"       element={<P roles={STAFF_ROLES}><AdminGroups /></P>} />
        <Route path="/admin/student-classifiers" element={<P roles={STAFF_ROLES}><AdminStudentClassifiers /></P>} />
        <Route path="/admin/subjects"     element={<P roles={STAFF_ROLES}><AdminSubjects /></P>} />
        <Route path="/admin/study-plans"  element={<P roles={STAFF_ROLES}><AdminStudyPlans /></P>} />
        <Route path="/admin/academic-periods" element={<P roles={STAFF_ROLES}><AdminAcademicPeriods /></P>} />
        <Route path="/admin/subject-groups" element={<P roles={STAFF_ROLES}><AdminSubjectGroups /></P>} />
        <Route path="/admin/admission-policies" element={<P roles={STAFF_ROLES}><AdminAdmissionPolicies /></P>} />
        <Route path="/admin/non-state-licenses" element={<P roles={STAFF_ROLES}><AdminNonStateLicenses /></P>} />
        <Route path="/admin/courses"      element={<P roles={TEACHER_ROLES}><Courses /></P>} />
        <Route path="/admin/calendar"     element={<P roles={STAFF_ROLES}><AdminCalendar /></P>} />
        <Route path="/admin/orientations" element={<P roles={STAFF_ROLES}><AdminOrientations /></P>} />
        <Route path="/admin/practices"    element={<P roles={STAFF_ROLES}><AdminPractices /></P>} />
        <Route path="/admin/assessment-leaves" element={<P roles={STAFF_ROLES}><AdminAssessmentLeaves /></P>} />
        <Route path="/admin/foreign-teacher-engagements" element={<P roles={STAFF_ROLES}><AdminForeignTeacherEngagements /></P>} />
        <Route path="/admin/accountability-referrals" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminAccountabilityReferrals /></P>} />
        <Route path="/admin/distance-program-restrictions" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminDistanceProgramRestrictions /></P>} />
        <Route path="/admin/biometric-governance" element={<P roles={[...ADMIN_ROLES, R_MON]}><AdminBiometricGovernance /></P>} />
        <Route path="/admin/distance-readiness" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminDistanceReadiness /></P>} />
        <Route path="/admin/official-site-publications" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminOfficialSitePublications /></P>} />
        <Route path="/admin/content-standard" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminContentStandard /></P>} />
        <Route path="/admin/reports"      element={<P roles={REPORTING_ROLES}><Reports /></P>} />
        <Route path="/admin/integrations" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminIntegrations /></P>} />
        <Route path="/admin/audit-logs"   element={<P roles={ADMIN_ROLES}><AdminAuditLogs /></P>} />
        <Route path="/admin/compliance-559" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminCompliance559 /></P>} />
        <Route path="/admin/surveys"        element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminSurveys /></P>} />
        <Route path="/admin/quality-monitoring" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AdminQualityMonitoring /></P>} />
        <Route path="/admin/content-reviews" element={<P roles={STAFF_ROLES}><AdminContentReviews /></P>} />
        <Route path="/admin/settings"          element={<P roles={ADMIN_ROLES}><Settings /></P>} />
        <Route path="/admin/notifications"     element={<P roles={STAFF_ROLES}><StudentNotifications /></P>} />

        {/* ── Wildcard: show role-appropriate dashboard ────────────────────── */}
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

export default App;
