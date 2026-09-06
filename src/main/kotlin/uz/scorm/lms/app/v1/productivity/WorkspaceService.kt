package uz.scorm.lms.app.v1.productivity

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.courses.model.*
import uz.scorm.lms.app.v1.courses.repository.*
import uz.scorm.lms.app.v1.courses.service.CourseContentService
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.student.model.StudentProfile
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

data class WorkspaceItem(val id: String, val title: String, val detail: String, val kind: String, val url: String, val dueAt: Instant? = null)
data class SetupStep(val title: String, val done: Boolean, val url: String)

@Service
class WorkspaceService(
    private val em: EntityManager,
    private val enrollments: CourseEnrollmentRepository,
    private val contents: CourseContentService,
    private val progress: CourseContentProgressRepository,
    private val assignments: AssignmentService,
    private val submissions: AssignmentSubmissionRepository,
    private val attempts: QuizAttemptRepository,
) {
    private val activeStatuses = setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)
    private fun queryTerm(term: String) = "%" + term.lowercase().replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%"
    private fun encoded(value: String) = URLEncoder.encode(value, StandardCharsets.UTF_8)

    @Transactional(readOnly = true)
    fun search(userId: Long, term: String, allCourses: Boolean, readCourses: Boolean, allStudents: Boolean, teacher: Boolean, student: Boolean): List<WorkspaceItem> {
        val clean = term.trim().take(100)
        if (clean.length < 2) return emptyList()
        val found = mutableListOf<WorkspaceItem>()
        if (readCourses) {
            val courses = em.createQuery("""
                select c from Course c where c.deleted = false and lower(c.title) like :term escape '!'
                and (:all = true or c.userId = :userId or (c.status = 'PUBLISHED' and exists (
                    select e.id from CourseEnrollment e where e.course = c and e.deleted = false
                    and e.student.user.id = :userId and e.status in :statuses))) order by c.title
            """.trimIndent(), Course::class.java)
                .setParameter("term", queryTerm(clean)).setParameter("all", allCourses)
                .setParameter("userId", userId).setParameter("statuses", activeStatuses).setMaxResults(8).resultList
            found += courses.map { c -> WorkspaceItem("course-${c.id}", c.title.orEmpty(), c.subjectName.orEmpty(), "Kurs",
                if (student) "/student/courses/${c.id}/learn" else "/teacher/courses/${c.id}/contents") }
        }
        if (allStudents || teacher) {
            val students = em.createQuery("""
                select s from StudentProfile s where s.user.deleted = false
                and (lower(s.firstName) like :term escape '!' or lower(s.lastName) like :term escape '!' or lower(s.studentNumber) like :term escape '!')
                and (:all = true or exists (select e.id from CourseEnrollment e where e.student = s
                    and e.deleted = false and e.course.deleted = false and e.course.userId = :userId and e.status in :statuses))
                order by s.lastName, s.firstName
            """.trimIndent(), StudentProfile::class.java)
                .setParameter("term", queryTerm(clean)).setParameter("all", allStudents)
                .setParameter("userId", userId).setParameter("statuses", activeStatuses).setMaxResults(8).resultList
            found += students.map { s -> WorkspaceItem("student-${s.id}", s.fullName, s.studentNumber, "Talaba",
                if (allStudents) "/students-management?search=${encoded(s.studentNumber)}" else "/teacher/students?search=${encoded(s.studentNumber)}") }
        }
        return found
    }

    @Transactional
    fun viewed(userId: Long, courseId: Long, contentId: Long) {
        require(contents.list(courseId, userId, false).any { it.id == contentId }) { "Darsga kirish ruxsati yo'q" }
        val enrollment = enrollments.findFirstByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(courseId, userId, activeStatuses)
            ?: throw IllegalArgumentException("Kursga biriktirish topilmadi")
        val item = progress.findByEnrollmentIdAndContentIdAndDeletedFalse(requireNotNull(enrollment.id), contentId)
            ?: CourseContentProgress(enrollment, em.getReference(CourseContent::class.java, contentId))
        item.lastAccessedAt = Instant.now()
        progress.save(item)
    }

    @Transactional(readOnly = true)
    fun resume(userId: Long): WorkspaceItem? {
        val recent = em.createQuery("""
            select p from CourseContentProgress p join fetch p.content c join fetch c.module m
            join fetch p.enrollment e join fetch e.course where p.deleted = false and e.deleted = false
            and e.student.user.id = :userId and e.status in :statuses and e.course.deleted = false
            and e.course.status = 'PUBLISHED' and c.deleted = false and m.deleted = false
            order by p.lastAccessedAt desc
        """.trimIndent(), CourseContentProgress::class.java).setParameter("userId", userId)
            .setParameter("statuses", activeStatuses).setMaxResults(50).resultList
        val available = mutableMapOf<Long, Set<Long>>()
        return recent.firstOrNull { p ->
            val courseId = requireNotNull(p.enrollment.course.id)
            p.content.id in available.getOrPut(courseId) { contents.list(courseId, userId, false).map { it.id }.toSet() }
        }?.let { p -> WorkspaceItem("content-${p.content.id}", p.content.title, p.enrollment.course.title.orEmpty(), "Dars",
            "/student/courses/${p.enrollment.course.id}/learn?content=${p.content.id}") }
    }

    @Transactional(readOnly = true)
    fun tasks(userId: Long, student: Boolean): List<WorkspaceItem> {
        val now = Instant.now()
        val until = LocalDate.now(ZoneId.of("Asia/Tashkent")).plusDays(8).atStartOfDay(ZoneId.of("Asia/Tashkent")).toInstant()
        val result = mutableListOf<WorkspaceItem>()
        if (student) {
            val actionableIds = em.createQuery("""
                select a.id from CourseAssignment a where a.deleted = false and a.status = :status
                and a.course.deleted = false and a.course.status = 'PUBLISHED' and exists (
                    select e.id from CourseEnrollment e where e.course = a.course and e.deleted = false
                    and e.student.user.id = :userId and e.status = :enrollmentStatus)
            """.trimIndent(), java.lang.Long::class.java)
                .setParameter("status", uz.scorm.lms.app.v1.assignment.model.AssignmentStatus.PUBLISHED)
                .setParameter("userId", userId).setParameter("enrollmentStatus", CourseEnrollmentStatus.ACTIVE)
                .resultList.map { it.toString() }.toSet()
            result += assignments.studentAssignments(userId).filter { it.status in setOf("pending", "overdue") }
                .filter { it.id in actionableIds }
                .map { WorkspaceItem("assignment-${it.id}", it.title, it.courseName, "Topshiriq",
                    "/student/assignments?assignment=${it.id}", Instant.parse(it.dueDate)) }
        } else {
            result += submissions.findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(userId)
                .filter { it.status == SubmissionStatus.SUBMITTED && !it.assignment.deleted && !it.assignment.course.deleted }
                .map { WorkspaceItem("submission-${it.id}", it.assignment.title, it.enrollment.student.fullName, "Baholash",
                    "/teacher/assignments/${it.assignment.id}/submissions?submission=${it.id}", it.submittedAt) }
        }
        val courseIds = if (student) em.createQuery("""
            select e.course.id from CourseEnrollment e where e.student.user.id = :userId and e.deleted = false
            and e.course.deleted = false and e.course.status = 'PUBLISHED' and e.status in :statuses
        """.trimIndent(), java.lang.Long::class.java).setParameter("userId", userId).setParameter("statuses", activeStatuses).resultList.map { it.toLong() }
        else em.createQuery("select c.id from Course c where c.userId = :userId and c.deleted = false", java.lang.Long::class.java)
            .setParameter("userId", userId).resultList.map { it.toLong() }
        if (courseIds.isNotEmpty()) {
            if (student) {
                val quizzes = em.createQuery("select q from CourseQuiz q where q.course.id in :ids and q.deleted = false and q.status = :status and q.closesAt > :now and q.opensAt < :until", CourseQuiz::class.java)
                    .setParameter("ids", courseIds).setParameter("status", QuizStatus.PUBLISHED).setParameter("now", now).setParameter("until", until).resultList
                for (q in quizzes) {
                    val enrollment = enrollments.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(q.course.id!!, userId, activeStatuses) ?: continue
                    val history = attempts.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(q.id!!, enrollment.id!!)
                    if (history.any { it.status != QuizAttemptStatus.IN_PROGRESS }) continue
                    result += WorkspaceItem("test-${q.id}", q.title, q.course.title.orEmpty(), "Test", "/student/tests?test=${q.id}", if (q.opensAt > now) q.opensAt else q.closesAt)
                }
            }
            result += em.createQuery("select s from CourseLearningSession s where s.course.id in :ids and s.deleted = false and s.status = :status and s.endsAt > :now and s.startsAt < :until", CourseLearningSession::class.java)
                .setParameter("ids", courseIds).setParameter("status", LearningSessionStatus.PUBLISHED)
                .setParameter("now", now).setParameter("until", until).resultList.map { s ->
                    WorkspaceItem("session-${s.id}", s.title, s.course.title.orEmpty(), "Dars", if (student) "/student/schedule" else "/teacher/sessions", s.startsAt)
                }
        }
        return result.filter { it.dueAt == null || it.dueAt < until }.sortedBy { it.dueAt }
    }

    @Transactional(readOnly = true)
    fun setup(): List<SetupStep> {
        fun exists(entity: String, condition: String = "") = em.createQuery("select count(e) from $entity e where e.deleted = false $condition", java.lang.Long::class.java).singleResult.toLong() > 0
        return listOf(
            SetupStep("1. Universitet va fakultetni kiriting", exists("University") && exists("Faculty"), "/admin/faculties"),
            SetupStep("2. Yo'nalish va fanlarni kiriting", exists("Program") && exists("Subject"), "/admin/programs"),
            SetupStep("3. Guruh va talaba qabulini tayyorlang", em.createQuery("select count(s) from StudentProfile s where s.groupId is not null and s.user.deleted = false and s.studentStatus = :status", java.lang.Long::class.java)
                .setParameter("status", uz.scorm.lms.app.v1.student.model.StudentStatus.ACTIVE).singleResult.toLong() > 0, "/students-management"),
            SetupStep("4. O'qituvchiga fan yoki fan oqimini biriktiring", em.createQuery("select count(t) from Teacher t where t.deleted = false and t.active = true and (t.subjects is not empty or exists (select a.id from AcademicSubjectGroupTeacherAssignment a where a.teacher = t and a.active = true and a.subjectGroup.active = true))", java.lang.Long::class.java).singleResult.toLong() > 0, "/teachers-management"),
            SetupStep("5. Birinchi kursni nashr qiling", exists("Course", "and e.status = 'PUBLISHED'"), "/courses"),
        )
    }
}
