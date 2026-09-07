package uz.scorm.lms.app.v1.student.service

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.courses.model.CourseContentProgress
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.student.dto.StudentActivityItemDto
import java.time.Instant

@Service
@Transactional(readOnly = true)
class StudentActivityService(private val em: EntityManager, private val grades: StudentGradeService, private val assignments: AssignmentService) {
    fun recent(userId: Long): List<StudentActivityItemDto> {
        val lessons = em.createQuery("""
            select p from CourseContentProgress p join fetch p.content c join fetch p.enrollment e
            where p.deleted = false and e.deleted = false and e.course.deleted = false
            and e.student.user.id = :userId and e.status in :statuses
            and c.deleted = false and c.module.deleted = false
            and c.status = 'PUBLISHED' and c.module.status = 'PUBLISHED' and e.course.status = 'PUBLISHED'
            order by p.lastAccessedAt desc
        """.trimIndent(), CourseContentProgress::class.java).setParameter("userId", userId)
            .setParameter("statuses", setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)).setMaxResults(10).resultList
            .flatMap { p -> buildList {
                add(StudentActivityItemDto("view-${p.id}", "course", "Dars ochildi", "${p.enrollment.course.title}: ${p.content.title}", p.lastAccessedAt.toString()))
                p.completedAt?.let { add(StudentActivityItemDto("complete-${p.id}", "course", "Dars yakunlandi", "${p.enrollment.course.title}: ${p.content.title}", it.toString())) }
            } }
        val marks = grades.grades(userId).take(10).map { grade ->
            StudentActivityItemDto("grade-${grade.id}", "grade", "Baho qo'yildi",
                "${grade.courseName}: ${grade.assignmentName ?: grade.testName} — ${grade.earnedScore}/${grade.maxScore}", grade.date)
        }
        val submitted = assignments.studentAssignments(userId).mapNotNull { assignment -> assignment.submittedAt?.let {
            StudentActivityItemDto("assignment-${assignment.id}", "assignment", "Topshiriq yuborildi", "${assignment.courseName}: ${assignment.title}", it)
        } }
        return (lessons + marks + submitted).sortedByDescending { Instant.parse(it.timestamp) }.take(10)
    }
}
