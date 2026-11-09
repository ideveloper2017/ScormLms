import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { RoleGuard } from "@/components/auth/role-guard";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import LoginPage from "@/pages/auth/login";

// Har bir sahifa alohida faylga (chunk) bo'linadi va faqat ochilganda yuklanadi: aks holda login sahifasi
// uchun ham butun ilova (100+ sahifa) bitta katta fayl bo'lib yuklanardi.

// Auth pages
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));
const HemisCallbackPage = lazy(() => import("@/pages/auth/hemis-callback"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard").then((m) => ({ default: m.AdminDashboard })));
const StudentDashboard = lazy(() => import("@/pages/student-dashboard").then((m) => ({ default: m.StudentDashboard })));
const StudentCourses = lazy(() => import("@/pages/student/courses").then((m) => ({ default: m.StudentCourses })));
const StudentSubject = lazy(() => import("@/pages/student/subject").then((m) => ({ default: m.StudentSubject })));
const StudentSubjectLesson = lazy(() => import("@/pages/student/subject-lesson").then((m) => ({ default: m.StudentSubjectLesson })));
const ProctorDashboard = lazy(() => import("@/pages/proctor-dashboard").then((m) => ({ default: m.ProctorDashboard })));
const MonitorDashboard = lazy(() => import("@/pages/monitor-dashboard").then((m) => ({ default: m.MonitorDashboard })));

// Feature pages
const Communication = lazy(() => import("@/pages/communication").then((m) => ({ default: m.Communication })));
const Courses = lazy(() => import("@/pages/courses").then((m) => ({ default: m.Courses })));
const Exams = lazy(() => import("@/pages/exams").then((m) => ({ default: m.Exams })));
const Reports = lazy(() => import("@/pages/reports").then((m) => ({ default: m.Reports })));
const Resources = lazy(() => import("@/pages/resources").then((m) => ({ default: m.Resources })));
const SupportPage = lazy(() => import("@/pages/support").then((m) => ({ default: m.SupportPage })));
const StudentCabinet = lazy(() => import("@/pages/student-cabinet").then((m) => ({ default: m.StudentCabinet })));
const StudentManagement = lazy(() => import("@/pages/student-management").then((m) => ({ default: m.StudentManagement })));
const UserManagement = lazy(() => import("@/pages/user-management").then((m) => ({ default: m.UserManagement })));
const TeacherManagement = lazy(() => import("@/pages/teacher-management").then((m) => ({ default: m.TeacherManagement })));
const AcademicStructure = lazy(() => import("@/pages/academic-structure").then((m) => ({ default: m.AcademicStructure })));
const CoursePlayer = lazy(() => import("@/components/scorm/course-player").then((m) => ({ default: m.CoursePlayer })));
const ProctoringSession = lazy(() => import("@/components/proctoring/proctoring-session").then((m) => ({ default: m.ProctoringSession })));

// Admin pages
const AdminRoles = lazy(() => import("@/pages/admin/roles").then((m) => ({ default: m.AdminRoles })));
const AdminFaculties = lazy(() => import("@/pages/admin/faculties").then((m) => ({ default: m.AdminFaculties })));
const AdminDepartments = lazy(() => import("@/pages/admin/departments").then((m) => ({ default: m.AdminDepartments })));
const AdminPrograms = lazy(() => import("@/pages/admin/programs").then((m) => ({ default: m.AdminPrograms })));
const AdminGroups = lazy(() => import("@/pages/admin/groups").then((m) => ({ default: m.AdminGroups })));
const AdminStudentClassifiers = lazy(() => import("@/pages/admin/student-classifiers").then((m) => ({ default: m.AdminStudentClassifiers })));
const AdminReinstatementSubjectReport = lazy(() => import("@/pages/admin/reinstatement-subject-report").then((m) => ({ default: m.AdminReinstatementSubjectReport })));
const AdminSubjects = lazy(() => import("@/pages/admin/subjects").then((m) => ({ default: m.AdminSubjects })));
const AdminStudyPlans = lazy(() => import("@/pages/admin/study-plans").then((m) => ({ default: m.AdminStudyPlans })));
const AdminCurriculumStudents = lazy(() => import("@/pages/admin/curriculum-students").then((m) => ({ default: m.AdminCurriculumStudents })));
const AdminStudyPlanEditor = lazy(() => import("@/pages/admin/study-plan-editor").then((m) => ({ default: m.AdminStudyPlanEditor })));
const AdminAcademicPeriods = lazy(() => import("@/pages/admin/academic-periods").then((m) => ({ default: m.AdminAcademicPeriods })));
const CurriculumSemesters = lazy(() => import("@/pages/admin/curriculum-semesters").then((m) => ({ default: m.CurriculumSemesters })));
const AdminSubjectCategories = lazy(() => import("@/pages/admin/subject-categories").then((m) => ({ default: m.AdminSubjectCategories })));
const AdminSyllabi = lazy(() => import("@/pages/admin/syllabi").then((m) => ({ default: m.AdminSyllabi })));
const AdminAdmissionPolicies = lazy(() => import("@/pages/admin/admission-policies").then((m) => ({ default: m.AdminAdmissionPolicies })));
const AdminNonStateLicenses = lazy(() => import("@/pages/admin/non-state-licenses").then((m) => ({ default: m.AdminNonStateLicenses })));
const AdminIntegrations = lazy(() => import("@/pages/admin/integrations").then((m) => ({ default: m.AdminIntegrations })));
const AdminAuditLogs = lazy(() => import("@/pages/admin/audit-logs").then((m) => ({ default: m.AdminAuditLogs })));
const AdminCompliance559 = lazy(() => import("@/pages/admin/compliance-559").then((m) => ({ default: m.AdminCompliance559 })));
const AdminSurveys = lazy(() => import("@/pages/admin/surveys").then((m) => ({ default: m.AdminSurveys })));
const AdminContentReviews = lazy(() => import("@/pages/admin/content-reviews").then((m) => ({ default: m.AdminContentReviews })));
const AdminOrientations = lazy(() => import("@/pages/admin/orientations").then((m) => ({ default: m.AdminOrientations })));
const AdminQualityMonitoring = lazy(() => import("@/pages/admin/quality-monitoring").then((m) => ({ default: m.AdminQualityMonitoring })));
const AdminPractices = lazy(() => import("@/pages/admin/practices").then((m) => ({ default: m.AdminPractices })));
const AdminAssessmentLeaves = lazy(() => import("@/pages/admin/assessment-leaves").then((m) => ({ default: m.AdminAssessmentLeaves })));
const AdminForeignTeacherEngagements = lazy(() => import("@/pages/admin/foreign-teacher-engagements").then((m) => ({ default: m.AdminForeignTeacherEngagements })));
const AdminAccountabilityReferrals = lazy(() => import("@/pages/admin/accountability-referrals").then((m) => ({ default: m.AdminAccountabilityReferrals })));
const AdminDistanceProgramRestrictions = lazy(() => import("@/pages/admin/distance-program-restrictions").then((m) => ({ default: m.AdminDistanceProgramRestrictions })));
const AdminBiometricGovernance = lazy(() => import("@/pages/admin/biometric-governance").then((m) => ({ default: m.AdminBiometricGovernance })));
const AdminDistanceReadiness = lazy(() => import("@/pages/admin/distance-readiness").then((m) => ({ default: m.AdminDistanceReadiness })));
const AdminOfficialSitePublications = lazy(() => import("@/pages/admin/official-site-publications").then((m) => ({ default: m.AdminOfficialSitePublications })));
const AdminUniversities = lazy(() => import("@/pages/admin/universities").then((m) => ({ default: m.AdminUniversities })));
const AdminNationalities = lazy(() => import("@/pages/admin/reference-data").then((m) => ({ default: m.AdminNationalities })));
const AdminReferenceLabels = lazy(() => import("@/pages/admin/reference-data").then((m) => ({ default: m.AdminReferenceLabels })));
const AdminSystemConfigs = lazy(() => import("@/pages/admin/system-settings").then((m) => ({ default: m.AdminSystemConfigs })));
const AdminSystemLanguages = lazy(() => import("@/pages/admin/system-settings").then((m) => ({ default: m.AdminSystemLanguages })));
const AdminTranslationMessages = lazy(() => import("@/pages/admin/system-settings").then((m) => ({ default: m.AdminTranslationMessages })));
const AcademicStatements = lazy(() => import("@/pages/admin/academic-results").then((m) => ({ default: m.AcademicStatements })));
const AcademicTestResults = lazy(() => import("@/pages/admin/academic-results").then((m) => ({ default: m.AcademicTestResults })));
const AdminRatingSystems = lazy(() => import("@/pages/admin/academic-results").then((m) => ({ default: m.AdminRatingSystems })));
const StudentAcademicResultsView = lazy(() => import("@/pages/admin/academic-results").then((m) => ({ default: m.StudentAcademicResultsView })));
const StudentGpaRegistry = lazy(() => import("@/pages/admin/academic-results").then((m) => ({ default: m.StudentGpaRegistry })));
const AcademicStatisticsDashboard = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.AcademicStatisticsDashboard })));
const AppropriationStatistics = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.AppropriationStatistics })));
const FailedStudentsStatistics = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.FailedStudentsStatistics })));
const GradeDistributionReport = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.GradeDistributionReport })));
const StudentTaskStatisticsReport = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.StudentTaskStatisticsReport })));
const SubjectStatisticsReport = lazy(() => import("@/pages/admin/statistics-reports").then((m) => ({ default: m.SubjectStatisticsReport })));
const ElectiveChoiceMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.ElectiveChoiceMonitoring })));
const InactiveStudentMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.InactiveStudentMonitoring })));
const LearningParticipationMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.LearningParticipationMonitoring })));
const LessonCommentMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.LessonCommentMonitoring })));
const StudentIpMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.StudentIpMonitoring })));
const StudentLoginMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.StudentLoginMonitoring })));
const TeacherLoginMonitoring = lazy(() => import("@/pages/admin/monitoring-reports").then((m) => ({ default: m.TeacherLoginMonitoring })));
const StudentMovementRegistry = lazy(() => import("@/pages/admin/student-movements").then((m) => ({ default: m.StudentMovementRegistry })));
const ControlsOverview = lazy(() => import("@/pages/admin/controls-overview").then((m) => ({ default: m.ControlsOverview })));
const FinalExamCallLetters = lazy(() => import("@/pages/admin/academic-documents").then((m) => ({ default: m.FinalExamCallLetters })));
const StudentTranscripts = lazy(() => import("@/pages/admin/academic-documents").then((m) => ({ default: m.StudentTranscripts })));
const ReReadingApplications = lazy(() => import("@/pages/admin/re-reading").then((m) => ({ default: m.ReReadingApplications })));
const ReReadingPlans = lazy(() => import("@/pages/admin/re-reading").then((m) => ({ default: m.ReReadingPlans })));
const ReReadingRecoveryResults = lazy(() => import("@/pages/admin/re-reading").then((m) => ({ default: m.ReReadingRecoveryResults })));
const StudentReReadingReport = lazy(() => import("@/pages/admin/re-reading").then((m) => ({ default: m.StudentReReadingReport })));
const TeacherReReadingReport = lazy(() => import("@/pages/admin/re-reading").then((m) => ({ default: m.TeacherReReadingReport })));
const TutorGroups = lazy(() => import("@/pages/admin/tutor-groups").then((m) => ({ default: m.TutorGroups })));
const AdminContentStandard = lazy(() => import("@/pages/admin/content-standard").then((m) => ({ default: m.AdminContentStandard })));
const PublicInstitutionDisclosure = lazy(() => import("@/pages/public/institution-disclosure").then((m) => ({ default: m.PublicInstitutionDisclosure })));
const Surveys = lazy(() => import("@/pages/surveys").then((m) => ({ default: m.Surveys })));

// Student pages
const StudentSchedule = lazy(() => import("@/pages/student/schedule").then((m) => ({ default: m.StudentSchedule })));
const StudentAssignments = lazy(() => import("@/pages/student/assignments").then((m) => ({ default: m.StudentAssignments })));
const StudentTests = lazy(() => import("@/pages/student/tests").then((m) => ({ default: m.StudentTests })));
const TestSession = lazy(() => import("@/pages/student/test-session").then((m) => ({ default: m.TestSession })));
const TestResults = lazy(() => import("@/pages/student/test-results").then((m) => ({ default: m.TestResults })));
const StudentGrades = lazy(() => import("@/pages/student/grades").then((m) => ({ default: m.StudentGrades })));
const StudentTranscript = lazy(() => import("@/pages/student/academic-reports").then((m) => ({ default: m.StudentTranscript })));
const StudentReports = lazy(() => import("@/pages/student/academic-reports").then((m) => ({ default: m.StudentReports })));
const StudentAttendance = lazy(() => import("@/pages/student/attendance").then((m) => ({ default: m.StudentAttendance })));
const StudentNotifications = lazy(() => import("@/pages/student/notifications").then((m) => ({ default: m.StudentNotifications })));
const StudentStudyPlan = lazy(() => import("@/pages/student/study-plan").then((m) => ({ default: m.StudentStudyPlan })));
const StudentCourseLearning = lazy(() => import("@/pages/student/course-learning").then((m) => ({ default: m.StudentCourseLearning })));
const StudentOrientation = lazy(() => import("@/pages/student/orientation").then((m) => ({ default: m.StudentOrientation })));
const StudentPractice = lazy(() => import("@/pages/student/practice").then((m) => ({ default: m.StudentPractice })));
const StudentAssessmentLeave = lazy(() => import("@/pages/student/assessment-leave").then((m) => ({ default: m.StudentAssessmentLeave })));

// Teacher pages
const TeacherDashboard = lazy(() => import("@/pages/teacher/dashboard").then((m) => ({ default: m.TeacherDashboard })));
const TeacherCourses = lazy(() => import("@/pages/teacher/courses").then((m) => ({ default: m.TeacherCourses })));
const TeacherCourseCreate = lazy(() => import("@/pages/teacher/course-create").then((m) => ({ default: m.TeacherCourseCreate })));
const TeacherCourseDetail = lazy(() => import("@/pages/teacher/course-detail").then((m) => ({ default: m.TeacherCourseDetail })));
const TeacherAssignments = lazy(() => import("@/pages/teacher/assignments").then((m) => ({ default: m.TeacherAssignments })));
const TeacherSubmissions = lazy(() => import("@/pages/teacher/submissions").then((m) => ({ default: m.TeacherSubmissions })));
const TeacherTests = lazy(() => import("@/pages/teacher/tests").then((m) => ({ default: m.TeacherTests })));
const TeacherQuestions = lazy(() => import("@/pages/teacher/questions").then((m) => ({ default: m.TeacherQuestions })));
const TeacherGradebook = lazy(() => import("@/pages/teacher/gradebook").then((m) => ({ default: m.TeacherGradebook })));
const TeacherStudents = lazy(() => import("@/pages/teacher/students").then((m) => ({ default: m.TeacherStudents })));
const TeacherAttendance = lazy(() => import("@/pages/teacher/attendance").then((m) => ({ default: m.TeacherAttendance })));
const TeacherAnnouncements = lazy(() => import("@/pages/teacher/announcements").then((m) => ({ default: m.TeacherAnnouncements })));
const TeacherContent = lazy(() => import("@/pages/teacher/content").then((m) => ({ default: m.TeacherContent })));
const TeacherSessions = lazy(() => import("@/pages/teacher/sessions").then((m) => ({ default: m.TeacherSessions })));
const TeacherExams = lazy(() => import("@/pages/teacher/exams").then((m) => ({ default: m.TeacherExams })));
const TeacherAttestations = lazy(() => import("@/pages/teacher/attestations").then((m) => ({ default: m.TeacherAttestations })));
const StudentAttestations = lazy(() => import("@/pages/student/attestations").then((m) => ({ default: m.StudentAttestations })));
const TeacherProfile = lazy(() => import("@/pages/teacher/profile").then((m) => ({ default: m.TeacherProfile })));
const NotFoundPage = lazy(() => import("@/pages/not-found").then((m) => ({ default: m.NotFoundPage })));

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
    return <FullScreenLoader />;
  }

  return (
    <>
      <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/auth/hemis/callback" element={<HemisCallbackPage />} />
        <Route path="/public/institution" element={<PublicInstitutionDisclosure />} />
        
        {/* ── Face Recognition Setup (for students) ──────────────────────── */}
        {/* ── Root: redirect to role-appropriate dashboard ─────────────────── */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <DashboardLayout><Suspense fallback={<PageLoader />}>{getDashboardComponent(user)}</Suspense></DashboardLayout>
            </AuthGuard>
          }
        />

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
        <Route path="/student/courses"       element={<P roles={[R_STU]}><StudentCourses /></P>} />
        <Route path="/student/subjects/:id"  element={<P roles={[R_STU]}><StudentSubject /></P>} />
        <Route path="/student/subjects/:id/lessons/:topicId" element={<P roles={[R_STU]}><StudentSubjectLesson /></P>} />
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
        <Route path="/student/transcript" element={<P roles={[R_STU]}><StudentTranscript /></P>} />
        <Route path="/student/reports" element={<P roles={[R_STU]}><StudentReports /></P>} />
        <Route path="/student/resources" element={<P roles={[R_STU]}><Resources /></P>} />
        <Route path="/student/attendance"    element={<P roles={[R_STU]}><StudentAttendance /></P>} />
        <Route path="/student/messages"      element={<P roles={[R_STU]}><Communication /></P>} />
        <Route path="/student/notifications" element={<P roles={[R_STU]}><StudentNotifications /></P>} />
        <Route path="/student/calendar"      element={<P roles={[R_STU]}><StudentSchedule /></P>} />
        <Route path="/student/profile"       element={<P roles={[R_STU]}><StudentCabinet /></P>} />
        <Route path="/student/surveys"       element={<P roles={[R_STU]}><Surveys /></P>} />

        {/* ── All learning participants (staff + students) ─────────────────── */}
        <Route path="/courses"       element={<P roles={CONTENT_ROLES}><Courses /></P>} />
        <Route path="/resources"     element={<P roles={CONTENT_ROLES}><Resources /></P>} />
        {/* Monitoring menyusida ham "Aloqa" bor — roli ruxsat ro'yxatida bo'lmasa "Ruxsat yo'q" chiqardi */}
        <Route path="/communication" element={<P roles={[...CONTENT_ROLES, R_PROC, R_MON]}><Communication /></P>} />
        <Route path="/messages"      element={<P roles={[...CONTENT_ROLES, R_PROC]}><Communication /></P>} />
        <Route path="/support"       element={<P roles={ALL_ROLES}><SupportPage /></P>} />
        <Route path="/exams"         element={<P roles={[R_SUPER, R_ADMIN, R_MET, R_TEACH, R_STU, R_PROC]}><Exams /></P>} />
        <Route path="/reports"       element={<P roles={REPORTING_ROLES}><Reports /></P>} />
        <Route path="/course/:id"    element={<P roles={CONTENT_ROLES}><CoursePlayer /></P>} />

        {/* ── Teacher / Metodist / Admin ────────────────────────────────────── */}
        {/* Bu manzillarda ilgari namunaviy (soxta) ma'lumotli sahifalar turardi; eski havolalar haqiqiy sahifalarga o'tadi */}
        <Route path="/contingent"  element={<Navigate to="/students/students" replace />} />
        <Route path="/attendance"  element={<Navigate to="/teacher/attendance" replace />} />
        <Route path="/teaching"    element={<Navigate to="/teacher/courses" replace />} />

        {/* ── Akademik tuzilma (Stage 3) ───────────────────────────────────── */}
        <Route path="/academic"            element={<P roles={STAFF_ROLES}><AcademicStructure /></P>} />
        <Route path="/groups"              element={<Navigate to="/admin/groups" replace />} />
        <Route path="/subjects"            element={<Navigate to="/admin/subjects" replace />} />

        {/* ── Proctor ──────────────────────────────────────────────────────── */}
        <Route path="/exam/:id/proctoring" element={<P roles={[R_STU]}><ProctoringSession /></P>} />

        {/* ── Admin / Super Admin ───────────────────────────────────────────── */}
        <Route path="/statistics" element={<Navigate to="/statistics-dashbord" replace />} />
        <Route path="/settings"   element={<Navigate to="/settings/configs" replace />} />

        {/* ── /admin/* ─────────────────────────────────────────────────────── */}
        <Route path="/universities"       element={<P roles={STAFF_ROLES}><AdminUniversities /></P>} />

        {/* ── control-eLMS compatible staff routes ─────────────────────────── */}
        <Route path="/structure/faculties"    element={<P roles={STAFF_ROLES}><AdminFaculties /></P>} />
        <Route path="/structure/specialities" element={<P roles={STAFF_ROLES}><AdminPrograms /></P>} />

        <Route path="/edu-process/curriculum"        element={<P roles={STAFF_ROLES}><AdminStudyPlans /></P>} />
        <Route path="/edu-process/curriculum/new"    element={<P roles={STAFF_ROLES}><AdminStudyPlanEditor /></P>} />
        <Route path="/edu-process/curriculum/:id"    element={<P roles={STAFF_ROLES}><AdminStudyPlanEditor /></P>} />
        <Route path="/edu-process/attached-students" element={<P roles={STAFF_ROLES}><AdminCurriculumStudents /></P>} />
        <Route path="/edu-process/syllabus"          element={<P roles={STAFF_ROLES}><AdminSyllabi /></P>} />
        <Route path="/edu-process/academic-years"    element={<P roles={STAFF_ROLES}><AdminAcademicPeriods view="years" /></P>} />
        <Route path="/edu-process/semesters"         element={<P roles={STAFF_ROLES}><CurriculumSemesters /></P>} />
        <Route path="/edu-process/subject-groups"    element={<P roles={STAFF_ROLES}><AdminSubjectCategories /></P>} />
        <Route path="/edu-process/subjects"          element={<P roles={STAFF_ROLES}><AdminSubjects /></P>} />
        <Route path="/edu-process/rating-systems"    element={<P roles={STAFF_ROLES}><AdminRatingSystems /></P>} />
        <Route path="/edu-process/statements"        element={<P roles={REPORTING_ROLES}><AcademicStatements finalStatement={false} /></P>} />
        <Route path="/edu-process/total-statements"  element={<P roles={REPORTING_ROLES}><AcademicStatements finalStatement /></P>} />
        <Route path="/controls"                       element={<P roles={REPORTING_ROLES}><ControlsOverview /></P>} />
        <Route path="/edu-process/export-rating-to-hemis" element={<P roles={STAFF_ROLES}><StudentAcademicResultsView mode="hemis" /></P>} />

        <Route path="/re-reading-subject-groups" element={<P roles={STAFF_ROLES}><ReReadingApplications /></P>} />
        <Route path="/student/re-reading-application" element={<P roles={STAFF_ROLES}><ReReadingPlans /></P>} />
        <Route path="/edu-process/academic-debtors" element={<P roles={REPORTING_ROLES}><StudentAcademicResultsView mode="debtors" /></P>} />
        <Route path="/edu-process/gpa-rating-students" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><StudentGpaRegistry /></P>} />
        <Route path="/users/rating-monitoring" element={<P roles={REPORTING_ROLES}><StudentAcademicResultsView mode="monitoring" /></P>} />
        <Route path="/users/rating-average" element={<P roles={REPORTING_ROLES}><StudentAcademicResultsView mode="average" /></P>} />
        <Route path="/students-reading-recovery-for-rating" element={<P roles={TEACHER_ROLES}><ReReadingRecoveryResults /></P>} />

        <Route path="/teachers/tutor-groups" element={<P roles={STAFF_ROLES}><TutorGroups /></P>} />
        <Route path="/teachers/tutors"       element={<P roles={STAFF_ROLES}><TeacherManagement /></P>} />

        <Route path="/students/student-groups" element={<P roles={STAFF_ROLES}><AdminGroups /></P>} />
        <Route path="/students/students" element={<P roles={STAFF_ROLES}><StudentManagement /></P>} />
        <Route path="/students/graduated" element={<P roles={STAFF_ROLES}><StudentManagement initialStatus="GRADUATED" title="Bitirgan talabalar" description="Bitiruvchi holatiga o'tkazilgan talabalar reyestri." allowCreate={false} /></P>} />
        <Route path="/students/recovery" element={<P roles={STAFF_ROLES}><StudentMovementRegistry eventType="REINSTATEMENT" title="O'qishni tiklagan talabalar" description="O'qishni qayta tiklash buyrug'i rasmiylashtirilgan talabalar (har talabaning oxirgi buyrug'i)." /></P>} />
        <Route path="/students/academic-leave" element={<P roles={STAFF_ROLES}><StudentMovementRegistry eventType="SUSPENSION" showReason title="Akademik ta'tildagi talabalar" description="Akademik ta'til (o'qishni to'xtatish) buyrug'i rasmiylashtirilgan talabalar va sababi." /></P>} />
        <Route path="/transfer-students" element={<P roles={STAFF_ROLES}><StudentManagement initialStatus="ACTIVE" title="Talabalarni ko'chirish" description="Faol talabalarni yangi dastur yoki guruhga yakka va ommaviy ko'chirish." allowCreate={false} /></P>} />
        <Route path="/students/expelled" element={<P roles={STAFF_ROLES}><StudentManagement initialStatus="EXPELLED" title="Chetlashtirilgan talabalar" description="Chetlashtirish buyrug'i rasmiylashtirilgan talabalar reyestri." allowCreate={false} /></P>} />
        <Route path="/student/recovery-study-subjects-info" element={<P roles={STAFF_ROLES}><AdminReinstatementSubjectReport /></P>} />

        <Route path="/call-to-final-exam-letter" element={<P roles={STAFF_ROLES}><FinalExamCallLetters /></P>} />
        <Route path="/transcript-students" element={<P roles={TEACHER_ROLES}><StudentTranscripts /></P>} />

        <Route path="/monitoring/students" element={<P roles={REPORTING_ROLES}><StudentLoginMonitoring /></P>} />
        <Route path="/monitoring/teachers" element={<P roles={REPORTING_ROLES}><TeacherLoginMonitoring /></P>} />
        <Route path="/monitoring/students-login-date" element={<P roles={REPORTING_ROLES}><InactiveStudentMonitoring /></P>} />
        <Route path="/users/not-choose-subject-students" element={<P roles={REPORTING_ROLES}><ElectiveChoiceMonitoring /></P>} />
        <Route path="/students/use-syllabus" element={<P roles={REPORTING_ROLES}><LearningParticipationMonitoring /></P>} />
        <Route path="/monitoring/test-results" element={<P roles={REPORTING_ROLES}><AcademicTestResults /></P>} />
        <Route path="/check-login-users" element={<P roles={ADMIN_ROLES}><StudentIpMonitoring /></P>} />
        <Route path="/commentary-lessons" element={<P roles={REPORTING_ROLES}><LessonCommentMonitoring /></P>} />

        <Route path="/content/posts" element={<P roles={TEACHER_ROLES}><TeacherAnnouncements /></P>} />
        <Route path="/content/schedule" element={<P roles={STAFF_ROLES}><TeacherSessions managementMode /></P>} />
        <Route path="/content/online-resource" element={<P roles={CONTENT_ROLES}><Resources /></P>} />

        <Route path="/accounts/admins" element={<P roles={ADMIN_ROLES}><UserManagement /></P>} />
        <Route path="/accounts/permission-groups" element={<P roles={ADMIN_ROLES}><AdminRoles /></P>} />

        <Route path="/statistics-dashbord" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AcademicStatisticsDashboard /></P>} />
        <Route path="/appropriation" element={<P roles={[...ADMIN_ROLES, R_MET, R_MON]}><AppropriationStatistics /></P>} />
        <Route path="/subjects-report" element={<P roles={REPORTING_ROLES}><SubjectStatisticsReport mode="content" /></P>} />
        <Route path="/subjects-test-report" element={<P roles={REPORTING_ROLES}><SubjectStatisticsReport mode="tests" /></P>} />
        <Route path="/teacher-re-reading-report" element={<P roles={STAFF_ROLES}><TeacherReReadingReport /></P>} />
        <Route path="/student-re-reading-report" element={<P roles={STAFF_ROLES}><StudentReReadingReport /></P>} />
        <Route path="/report/semester-subject" element={<P roles={REPORTING_ROLES}><SubjectStatisticsReport mode="semester" /></P>} />
        <Route path="/student-tasks-report" element={<P roles={REPORTING_ROLES}><StudentTaskStatisticsReport /></P>} />
        <Route path="/users-rating-mark-report" element={<P roles={REPORTING_ROLES}><GradeDistributionReport /></P>} />
        <Route path="/failed-students" element={<P roles={REPORTING_ROLES}><FailedStudentsStatistics /></P>} />

        <Route path="/general-info/labels" element={<P roles={STAFF_ROLES}><AdminReferenceLabels /></P>} />
        <Route path="/general-info/countries" element={<P roles={STAFF_ROLES}><AdminStudentClassifiers initialTab="countries" /></P>} />
        <Route path="/general-info/regions" element={<P roles={STAFF_ROLES}><AdminStudentClassifiers initialTab="regions" /></P>} />
        <Route path="/general-info/districts" element={<P roles={STAFF_ROLES}><AdminStudentClassifiers initialTab="districts" /></P>} />
        <Route path="/general-info/nationalities" element={<P roles={STAFF_ROLES}><AdminNationalities /></P>} />

        <Route path="/settings/configs" element={<P roles={ADMIN_ROLES}><AdminSystemConfigs /></P>} />
        <Route path="/settings/languages" element={<P roles={ADMIN_ROLES}><AdminSystemLanguages /></P>} />
        <Route path="/settings/internalization" element={<P roles={ADMIN_ROLES}><AdminTranslationMessages /></P>} />

        <Route path="/admin/dashboard"    element={<P roles={STAFF_ROLES}><AdminDashboard /></P>} />
        <Route path="/admin/roles"        element={<P roles={ADMIN_ROLES}><AdminRoles /></P>} />
        <Route path="/admin/departments"  element={<P roles={STAFF_ROLES}><AdminDepartments /></P>} />
        <Route path="/admin/programs"     element={<P roles={STAFF_ROLES}><AdminPrograms /></P>} />
        <Route path="/admin/groups"       element={<P roles={STAFF_ROLES}><AdminGroups /></P>} />
        <Route path="/admin/student-classifiers" element={<P roles={STAFF_ROLES}><AdminStudentClassifiers /></P>} />
        <Route path="/admin/subjects"     element={<P roles={STAFF_ROLES}><AdminSubjects /></P>} />
        <Route path="/admin/academic-periods" element={<P roles={STAFF_ROLES}><AdminAcademicPeriods /></P>} />
        <Route path="/admin/subject-categories" element={<P roles={STAFF_ROLES}><AdminSubjectCategories /></P>} />
        <Route path="/admin/syllabi" element={<P roles={STAFF_ROLES}><AdminSyllabi /></P>} />
        <Route path="/admin/admission-policies" element={<P roles={STAFF_ROLES}><AdminAdmissionPolicies /></P>} />
        <Route path="/admin/non-state-licenses" element={<P roles={STAFF_ROLES}><AdminNonStateLicenses /></P>} />
        <Route path="/admin/schedule"     element={<P roles={STAFF_ROLES}><TeacherSessions managementMode /></P>} />
        <Route path="/admin/calendar"     element={<Navigate to="/edu-process/academic-years" replace />} />
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
        <Route path="/admin/settings"          element={<Navigate to="/settings/configs" replace />} />
        <Route path="/admin/notifications"     element={<P roles={STAFF_ROLES}><StudentNotifications /></P>} />

        {/* Noto'g'ri manzil: jimgina bosh sahifani ko'rsatmasdan, aniq "topilmadi" xabari */}
        <Route
          path="*"
          element={
            <AuthGuard>
              <DashboardLayout><Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense></DashboardLayout>
            </AuthGuard>
          }
        />
      </Routes>
      </Suspense>
      <Toaster />
      {/* Ilovaning bir qismi xabarlarni sonner orqali chiqaradi: usiz ular ekranda ko'rinmaydi */}
      <SonnerToaster position="top-right" richColors closeButton />
    </>
  );
}

// ─── Protected page wrapper ─────────────────────────────────────────────────────────

function P({ roles, children }: { roles: string[]; children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard allowedRoles={roles}>
          {/* Menyu joyida qoladi, faqat sahifa qismi yuklanadi */}
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}

// ─── Yuklanish ko'rsatkichlari ───────────────────────────────────────────────────────

function FullScreenLoader() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Sahifa yuklanmoqda...</p>
      </div>
    </div>
  );
}

// ─── Dashboard routing by role ──────────────────────────────────────────────────────
function getDashboardComponent(user: ReturnType<typeof useAuth>["user"]) {
  if (isStudent(user))                return <StudentDashboard />;
  if (hasRole(user, R_TEACH))         return <TeacherDashboard />;
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
