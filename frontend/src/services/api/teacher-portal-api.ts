import api, { type ApiResponse } from '@/lib/api';

export interface TeacherProfile {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  position?: string;
  academicDegree?: string;
  academicRank?: string;
  departmentName?: string;
  photoUrl?: string;
}

export interface TeacherDashboardStats {
  activeCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  todayLessons: number;
  avgTestScore: number;
  newSubmissions: number;
  unreadMessages: number;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description?: string;
  subjectName?: string | null;
  subjectId?: number | null;
  programId?: number | null;
  programName?: string | null;
  programLanguage?: string | null;
  groupName?: string | null;
  subjectGroupId?: number | null;
  curriculumSubjectId?: number | null;
  academicYear?: string | null;
  semester?: number | null;
  credits?: number | null;
  students: number;
  progress: number;
  status: 'published' | 'draft' | 'archived';
  startDate?: string;
  endDate?: string;
  avgScore?: number;
  language?: string | null;
}

export interface CourseCreatePayload {
  title: string;
  description?: string;
  subjectName?: string;
  subjectId?: number;
  subjectGroupId?: number;
  groupName?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  level?: string;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  status: 'active' | 'completed' | 'withdrawn';
  progress: number;
  academicYear: string;
  semester: number;
  credits: number;
  required: boolean;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface EnrollmentPlanOptions {
  academicYear?: string;
  semester: number;
  credits: number;
  required: boolean;
}

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  position: number;
  status: 'draft' | 'published';
  contentCount: number;
  publishedAt?: string | null;
}

export interface CourseContent {
  id: number;
  courseId: number;
  moduleId: number;
  moduleTitle: string;
  title: string;
  description?: string | null;
  contentType: 'video' | 'document' | 'link' | 'file' | 'text';
  contentUrl?: string | null;
  contentBody?: string | null;
  asset?: CourseContentAsset | null;
  subjectMaterialId?: number | null;
  durationMinutes?: number | null;
  position: number;
  status: 'draft' | 'published';
  publishedAt?: string | null;
  languageCode: string;
  authorName: string;
  contentVersion: string;
  sourceName: string;
  sourceUrl?: string | null;
  validFrom: string;
  validUntil?: string | null;
  effective: boolean;
  metadataUpdatedAt: string;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'changes_requested';
  approvedRevisionNumber?: number | null;
  compatibility: ContentCompatibility;
}

export interface CourseContentAsset {
  id: number;
  courseId?: number | null;
  subjectId?: number | null;
  originalFileName: string;
  mediaType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt?: string | null;
}

export interface SubjectMaterial {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
  description?: string | null;
  contentType: CourseContent['contentType'];
  contentUrl?: string | null;
  contentBody?: string | null;
  asset?: CourseContentAsset | null;
  languageCode: string;
  authorName: string;
  contentVersion: string;
  sourceName: string;
  sourceUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SubjectMaterialPayload {
  subjectId: number;
  title: string;
  description?: string;
  contentType: CourseContentPayload['contentType'];
  contentUrl?: string;
  contentBody?: string;
  assetId?: number;
  languageCode?: string;
  authorName?: string;
  contentVersion?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface SubjectMaterialSubject {
  id: number;
  name: string;
}

export interface ContentCompatibilityIssue {
  code: string;
  message: string;
  details: string[];
}

export interface ContentCompatibility {
  compatible: boolean;
  courseLanguage?: string | null;
  contentLanguage: string;
  subjectId?: number | null;
  subjectName?: string | null;
  programId?: number | null;
  programName?: string | null;
  programLanguage?: string | null;
  issues: ContentCompatibilityIssue[];
}

export interface CourseContentRevision {
  id: number;
  contentId: number;
  revisionNumber: number;
  title: string;
  description?: string | null;
  contentType: CourseContent['contentType'];
  contentUrl?: string | null;
  contentBody?: string | null;
  asset?: CourseContentAsset | null;
  durationMinutes?: number | null;
  languageCode: string;
  authorName: string;
  contentVersion: string;
  sourceName: string;
  sourceUrl?: string | null;
  validFrom: string;
  validUntil?: string | null;
  changedAt: string;
  changedBy: number;
}

export interface CourseContentPayload {
  title: string;
  description?: string;
  contentType: 'VIDEO' | 'DOCUMENT' | 'LINK' | 'FILE' | 'TEXT';
  contentUrl?: string;
  contentBody?: string;
  assetId?: number;
  durationMinutes?: number;
  languageCode: string;
  authorName: string;
  contentVersion: string;
  sourceName: string;
  sourceUrl?: string;
  validFrom: string;
  validUntil?: string;
}

export interface CourseContentReview {
  id: number;
  courseId: number;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  contentId: number;
  contentTitle: string;
  description?: string | null;
  contentType: CourseContent['contentType'];
  contentUrl?: string | null;
  contentBody?: string | null;
  asset?: CourseContentAsset | null;
  languageCode: string;
  authorName: string;
  sourceName: string;
  sourceUrl?: string | null;
  validFrom: string;
  validUntil?: string | null;
  revisionNumber: number;
  contentVersion: string;
  status: 'pending' | 'approved' | 'changes_requested';
  submittedAt: string;
  submittedBy: number;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  decisionComment?: string | null;
  compatibility: ContentCompatibility;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export interface TeacherStudent {
  id: string;
  fullName: string;
  studentNumber?: string;
  groupName?: string;
  attendance: number;
  avgScore: number;
  status: 'active' | 'at-risk' | 'excellent';
}

export interface TeacherAssignment {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  dueDate: string;
  totalSubmissions: number;
  pendingGrade: number;
  status: 'active' | 'closed' | 'draft';
  description: string;
  maxScore: number;
  priority: 'low' | 'medium' | 'high';
  submissionType: 'file' | 'text' | 'both';
}

export interface TeacherAssignmentPayload {
  courseId: number;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  submissionType: 'FILE' | 'TEXT' | 'BOTH';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export interface TeacherSubmission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'late';
  score?: number;
  maxScore: number;
  feedback?: string;
  answer?: string;
  fileName?: string;
  fileUrl?: string;
  attemptNumber: number;
}

export interface TeacherTest {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  date: string;
  duration: number;
  questions: number;
  status: 'upcoming' | 'active' | 'completed' | 'draft';
  avgScore?: number;
  participants?: number;
  totalPoints: number;
  allowedAttempts: number;
  passingPercentage: number;
  proctoring: boolean;
  proctorIds: string[];
}

export interface TeacherQuizPayload {
  courseId: number;
  title: string;
  instructions: string;
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
  allowedAttempts: number;
  passingPercentage: number;
  shuffleQuestions: boolean;
  showResult: boolean;
  proctoring: boolean;
  proctorIds: number[];
  questionIds: number[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export interface QuizProctorCandidate {
  id: string;
  username: string;
  fullName: string;
}

export interface QuizProctorAssignment {
  quizId: string;
  proctors: QuizProctorCandidate[];
}

export interface TeacherQuizQuestion {
  id: string;
  courseId: string;
  courseTitle: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface TeacherQuizQuestionPayload {
  courseId: number;
  text: string;
  type: 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface TeacherQuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'timed_out';
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
}

export interface TeacherAttendance {
  id: number;
  courseId: number;
  date: string;
  courseTitle: string;
  group: string;
  sessionTitle: string;
  opensAt: string;
  closesAt: string;
  lateAfter?: string | null;
  minimumActivitySeconds: number;
  status: 'scheduled' | 'open' | 'closed';
  present: number;
  late: number;
  absent: number;
  pending: number;
  total: number;
}

export interface AttendanceSessionPayload {
  courseId: number;
  title: string;
  opensAt: string;
  closesAt: string;
  lateAfter?: string;
  minimumActivitySeconds: number;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  assignments: number;
  tests: number;
  attendance: number;
  finalGrade: number;
  letterGrade: string;
}

export interface TodaySchedule {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  group: string;
  room: string;
  type: string;
  students: number;
}

export interface TeacherLearningSession {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  format: 'synchronous' | 'asynchronous';
  sessionType: 'lecture' | 'lab' | 'seminar' | 'tutorial';
  startsAt: string;
  endsAt: string;
  room?: string;
  building?: string;
  liveUrl?: string;
  recordingUrl?: string;
  resourceUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  accessCount: number;
  videoConference?: VideoConferenceMeeting | null;
}

export interface VideoConferenceMeeting {
  id: number;
  sessionId: number;
  providerCode: string;
  status: 'PROVISIONING' | 'READY' | 'FAILED' | 'CANCELLED';
  providerMeetingId?: string | null;
  joinUrl?: string | null;
  hostUrl?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  provisionAttempts: number;
  lastRequestedAt: string;
  readyAt?: string | null;
  cancelledAt?: string | null;
  requestedByName: string;
  cancelledByName?: string | null;
}

export interface TeacherLearningSessionPayload {
  courseId: number;
  title: string;
  description: string;
  format: 'SYNCHRONOUS' | 'ASYNCHRONOUS';
  sessionType: 'LECTURE' | 'LAB' | 'SEMINAR' | 'TUTORIAL';
  startsAt: string;
  endsAt: string;
  room?: string;
  building?: string;
  liveUrl?: string;
  recordingUrl?: string;
  resourceUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export const teacherPortalApi = {
  getProfile: async (): Promise<TeacherProfile> => {
    const res = await api.get<TeacherProfile>('/teachers/me');
    return res.data;
  },
  getDashboardStats: async (): Promise<TeacherDashboardStats> => {
    const res = await api.get<TeacherDashboardStats>('/teachers/me/stats');
    return res.data;
  },
  getCourses: async (): Promise<TeacherCourse[]> => {
    const items = dataOf(await api.get<ApiResponse<Array<Omit<TeacherCourse, 'id'> & { id: number }>>>('/courses/owned'), 'Kurslar yuklanmadi');
    return items.map(item => ({ ...item, id: String(item.id) }));
  },
  getCourse: async (courseId: string): Promise<TeacherCourse> => {
    const item = dataOf(await api.get<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}`), 'Kurs topilmadi');
    return { ...item, id: String(item.id) };
  },
  createCourse: async (payload: CourseCreatePayload): Promise<TeacherCourse> => {
    const item = dataOf(await api.post<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>('/courses', payload), 'Kurs yaratilmadi');
    return { ...item, id: String(item.id) };
  },
  updateCourse: async (courseId: string, payload: Partial<CourseCreatePayload>): Promise<TeacherCourse> => {
    const item = dataOf(await api.put<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}`, payload), 'Kurs yangilanmadi');
    return { ...item, id: String(item.id) };
  },
  updateCourseStatus: async (courseId: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Promise<TeacherCourse> => {
    const item = dataOf(await api.patch<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}/status`, { status }), 'Kurs holati o\'zgarmadi');
    return { ...item, id: String(item.id) };
  },
  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },
  getEnrollments: async (courseId: string): Promise<CourseEnrollment[]> => {
    return dataOf(await api.get<ApiResponse<CourseEnrollment[]>>(`/courses/${courseId}/enrollments`), 'Kontingent yuklanmadi');
  },
  enrollStudents: async (courseId: string, studentIds: number[], plan: EnrollmentPlanOptions): Promise<CourseEnrollment[]> => {
    return dataOf(await api.post<ApiResponse<CourseEnrollment[]>>(`/courses/${courseId}/enrollments`, { studentIds, ...plan }), 'Talabalar biriktirilmadi');
  },
  withdrawStudent: async (courseId: string, studentId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/enrollments/${studentId}`);
  },
  getModules: async (courseId: string): Promise<CourseModule[]> => {
    return dataOf(await api.get<ApiResponse<CourseModule[]>>(`/courses/${courseId}/modules`), 'Modullar yuklanmadi');
  },
  createModule: async (courseId: string, payload: { title: string; description?: string }): Promise<CourseModule> => {
    return dataOf(await api.post<ApiResponse<CourseModule>>(`/courses/${courseId}/modules`, payload), 'Modul yaratilmadi');
  },
  updateModule: async (courseId: string, moduleId: number, payload: { title: string; description?: string }): Promise<CourseModule> => {
    return dataOf(await api.put<ApiResponse<CourseModule>>(`/courses/${courseId}/modules/${moduleId}`, payload), 'Modul yangilanmadi');
  },
  updateModuleStatus: async (courseId: string, moduleId: number, status: 'DRAFT' | 'PUBLISHED'): Promise<CourseModule> => {
    return dataOf(await api.patch<ApiResponse<CourseModule>>(`/courses/${courseId}/modules/${moduleId}/status`, { status }), 'Modul holati o\'zgarmadi');
  },
  deleteModule: async (courseId: string, moduleId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
  },
  getContents: async (courseId: string): Promise<CourseContent[]> => {
    return dataOf(await api.get<ApiResponse<CourseContent[]>>(`/courses/${courseId}/contents`), 'Kontentlar yuklanmadi');
  },
  uploadContentAsset: async (courseId: string, file: File): Promise<CourseContentAsset> => {
    const form = new FormData();
    form.append('file', file);
    return dataOf(await api.post<ApiResponse<CourseContentAsset>>(`/courses/${courseId}/assets`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180_000,
    }), 'Fayl yuklanmadi');
  },
  getSubjectMaterials: async (): Promise<SubjectMaterial[]> => {
    return dataOf(await api.get<ApiResponse<SubjectMaterial[]>>('/subject-materials'), 'Fan materiallari yuklanmadi');
  },
  getSubjectMaterialSubjects: async (): Promise<SubjectMaterialSubject[]> => {
    return dataOf(
      await api.get<ApiResponse<SubjectMaterialSubject[]>>('/subject-materials/subjects'),
      'Biriktirilgan fanlar yuklanmadi',
    );
  },
  uploadSubjectMaterialAsset: async (subjectId: number, file: File): Promise<CourseContentAsset> => {
    const form = new FormData();
    form.append('file', file);
    return dataOf(await api.post<ApiResponse<CourseContentAsset>>(`/subject-materials/${subjectId}/assets`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180_000,
    }), 'Fayl yuklanmadi');
  },
  createSubjectMaterial: async (payload: SubjectMaterialPayload): Promise<SubjectMaterial> => {
    return dataOf(await api.post<ApiResponse<SubjectMaterial>>('/subject-materials', payload), 'Fan materiali yaratilmadi');
  },
  deleteSubjectMaterial: async (materialId: number): Promise<void> => {
    await api.delete(`/subject-materials/${materialId}`);
  },
  attachSubjectMaterial: async (courseId: string, moduleId: number, materialId: number): Promise<CourseContent> => {
    return dataOf(
      await api.post<ApiResponse<CourseContent>>(`/courses/${courseId}/modules/${moduleId}/materials/${materialId}`),
      'Material kursga biriktirilmadi',
    );
  },
  downloadContentFile: async (courseId: string, contentId: number): Promise<Blob> => {
    const response = await api.get(`/courses/${courseId}/contents/${contentId}/file`, {
      responseType: 'blob',
      timeout: 180_000,
    });
    return response.data as Blob;
  },
  createContent: async (courseId: string, moduleId: number, payload: CourseContentPayload): Promise<CourseContent> => {
    return dataOf(await api.post<ApiResponse<CourseContent>>(`/courses/${courseId}/modules/${moduleId}/contents`, payload), 'Kontent yaratilmadi');
  },
  updateContent: async (courseId: string, contentId: number, payload: CourseContentPayload): Promise<CourseContent> => {
    return dataOf(await api.put<ApiResponse<CourseContent>>(`/courses/${courseId}/contents/${contentId}`, payload), 'Kontent yangilanmadi');
  },
  updateContentStatus: async (courseId: string, contentId: number, status: 'DRAFT' | 'PUBLISHED'): Promise<CourseContent> => {
    return dataOf(await api.patch<ApiResponse<CourseContent>>(`/courses/${courseId}/contents/${contentId}/status`, { status }), 'Kontent holati o\'zgarmadi');
  },
  deleteContent: async (courseId: string, contentId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/contents/${contentId}`);
  },
  getContentRevisions: async (courseId: string, contentId: number): Promise<CourseContentRevision[]> => {
    return dataOf(await api.get<ApiResponse<CourseContentRevision[]>>(`/courses/${courseId}/contents/${contentId}/revisions`), 'Kontent versiyalari yuklanmadi');
  },
  submitContentReview: async (courseId: string, contentId: number): Promise<CourseContentReview> => {
    return dataOf(await api.post<ApiResponse<CourseContentReview>>(`/courses/${courseId}/contents/${contentId}/submit-review`), 'Kontent ekspertizaga yuborilmadi');
  },
  getContentReviews: async (courseId: string, contentId: number): Promise<CourseContentReview[]> => {
    return dataOf(await api.get<ApiResponse<CourseContentReview[]>>(`/courses/${courseId}/contents/${contentId}/reviews`), 'Ekspertiza tarixi yuklanmadi');
  },
  getPendingContentReviews: async (): Promise<CourseContentReview[]> => {
    return dataOf(await api.get<ApiResponse<CourseContentReview[]>>('/content-reviews/pending'), 'Ekspertiza navbati yuklanmadi');
  },
  decideContentReview: async (reviewId: number, decision: 'APPROVED' | 'CHANGES_REQUESTED', comment?: string): Promise<CourseContentReview> => {
    return dataOf(await api.post<ApiResponse<CourseContentReview>>(`/content-reviews/${reviewId}/decision`, { decision, comment: comment?.trim() || undefined }), 'Ekspertiza qarori saqlanmadi');
  },
  getStudents: async (courseId?: string): Promise<TeacherStudent[]> => {
    const res = await api.get<TeacherStudent[]>('/teachers/me/students', {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },
  getAssignments: async (): Promise<TeacherAssignment[]> => {
    const res = await api.get<TeacherAssignment[]>('/teachers/me/assignments');
    return res.data;
  },
  createAssignment: async (payload: TeacherAssignmentPayload): Promise<TeacherAssignment> => {
    const res = await api.post<TeacherAssignment>('/teachers/me/assignments', payload);
    return res.data;
  },
  updateAssignmentStatus: async (assignmentId: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): Promise<TeacherAssignment> => {
    const res = await api.patch<TeacherAssignment>(`/teachers/me/assignments/${assignmentId}/status`, { status });
    return res.data;
  },
  deleteAssignment: async (assignmentId: string): Promise<void> => {
    await api.delete(`/teachers/me/assignments/${assignmentId}`);
  },
  getSubmissions: async (assignmentId?: string): Promise<TeacherSubmission[]> => {
    const res = await api.get<TeacherSubmission[]>('/teachers/me/submissions', {
      params: assignmentId ? { assignmentId } : undefined,
    });
    return res.data;
  },
  gradeSubmission: async (submissionId: string, score: number, feedback?: string): Promise<TeacherSubmission> => {
    const res = await api.post<TeacherSubmission>(`/teachers/me/submissions/${submissionId}/grade`, { score, feedback });
    return res.data;
  },
  downloadSubmissionFile: async (submissionId: string, fileName: string): Promise<void> => {
    const res = await api.get<Blob>(`/submissions/${submissionId}/file`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
  getTests: async (): Promise<TeacherTest[]> => {
    const res = await api.get<TeacherTest[]>('/teachers/me/tests');
    return res.data;
  },
  getAttendance: async (): Promise<TeacherAttendance[]> => {
    const res = await api.get<TeacherAttendance[]>('/teachers/me/attendance');
    return res.data;
  },
  getLearningSessions: async (courseId?: string): Promise<TeacherLearningSession[]> => {
    const res = await api.get<TeacherLearningSession[]>('/teachers/me/sessions', {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },
  createLearningSession: async (payload: TeacherLearningSessionPayload): Promise<TeacherLearningSession> => {
    const res = await api.post<TeacherLearningSession>('/teachers/me/sessions', payload);
    return res.data;
  },
  updateLearningSessionStatus: async (
    sessionId: string,
    status: 'PUBLISHED' | 'CANCELLED' | 'COMPLETED',
  ): Promise<TeacherLearningSession> => {
    const res = await api.patch<TeacherLearningSession>(`/teachers/me/sessions/${sessionId}/status`, { status });
    return res.data;
  },
  deleteLearningSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/teachers/me/sessions/${sessionId}`);
  },
  provisionVideoConference: async (sessionId: string): Promise<VideoConferenceMeeting> => {
    const res = await api.post<VideoConferenceMeeting>(`/teachers/me/sessions/${sessionId}/videoconference`);
    return res.data;
  },
  cancelVideoConference: async (sessionId: string): Promise<VideoConferenceMeeting> => {
    const res = await api.delete<VideoConferenceMeeting>(`/teachers/me/sessions/${sessionId}/videoconference`);
    return res.data;
  },
  createTest: async (payload: TeacherQuizPayload): Promise<TeacherTest> => {
    const res = await api.post<TeacherTest>('/teachers/me/tests', payload);
    return res.data;
  },
  updateTestStatus: async (testId: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): Promise<TeacherTest> => {
    const res = await api.patch<TeacherTest>(`/teachers/me/tests/${testId}/status`, { status });
    return res.data;
  },
  deleteTest: async (testId: string): Promise<void> => {
    await api.delete(`/teachers/me/tests/${testId}`);
  },
  getTestAttempts: async (testId: string): Promise<TeacherQuizAttempt[]> => {
    const res = await api.get<TeacherQuizAttempt[]>(`/teachers/me/tests/${testId}/attempts`);
    return res.data;
  },
  getProctorCandidates: async (): Promise<QuizProctorCandidate[]> => {
    const res = await api.get<QuizProctorCandidate[]>('/teachers/me/proctors');
    return res.data;
  },
  getTestProctors: async (testId: string): Promise<QuizProctorAssignment> => {
    const res = await api.get<QuizProctorAssignment>(`/teachers/me/tests/${testId}/proctors`);
    return res.data;
  },
  updateTestProctors: async (testId: string, userIds: string[]): Promise<QuizProctorAssignment> => {
    const res = await api.put<QuizProctorAssignment>(`/teachers/me/tests/${testId}/proctors`, {
      userIds: userIds.map(Number),
    });
    return res.data;
  },
  getQuestions: async (courseId?: string): Promise<TeacherQuizQuestion[]> => {
    const res = await api.get<TeacherQuizQuestion[]>('/teachers/me/questions', {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },
  createQuestion: async (payload: TeacherQuizQuestionPayload): Promise<TeacherQuizQuestion> => {
    const res = await api.post<TeacherQuizQuestion>('/teachers/me/questions', payload);
    return res.data;
  },
  updateQuestion: async (questionId: string, payload: TeacherQuizQuestionPayload): Promise<TeacherQuizQuestion> => {
    const res = await api.put<TeacherQuizQuestion>(`/teachers/me/questions/${questionId}`, payload);
    return res.data;
  },
  deleteQuestion: async (questionId: string): Promise<void> => {
    await api.delete(`/teachers/me/questions/${questionId}`);
  },
  createAttendanceSession: async (payload: AttendanceSessionPayload): Promise<TeacherAttendance> => {
    const res = await api.post<TeacherAttendance>('/teachers/me/attendance/sessions', payload);
    return res.data;
  },
  deleteAttendanceSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/teachers/me/attendance/sessions/${sessionId}`);
  },
  getGradebook: async (courseId: string): Promise<GradebookEntry[]> => {
    const res = await api.get<GradebookEntry[]>(`/teachers/me/courses/${courseId}/gradebook`);
    return res.data;
  },
  getTodaySchedule: async (): Promise<TodaySchedule[]> => {
    const res = await api.get<TodaySchedule[]>('/teachers/me/schedule/today');
    return res.data;
  },
};
