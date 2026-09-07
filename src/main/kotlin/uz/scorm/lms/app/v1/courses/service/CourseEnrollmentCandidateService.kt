package uz.scorm.lms.app.v1.courses.service

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupMembershipRepository

data class EnrollmentCandidate(val id: Long, val fullName: String, val studentNumber: String,
    val groupName: String?, val eligible: Boolean, val reason: String?)
data class EnrollmentCandidateGroup(val id: Long, val name: String)
data class EnrollmentCandidates(val items: List<EnrollmentCandidate>, val groups: List<EnrollmentCandidateGroup>,
    val page: Int, val total: Long, val hasNext: Boolean)

@Service
@Transactional(readOnly = true)
class CourseEnrollmentCandidateService(private val em: EntityManager, private val access: CourseAccessService,
    private val compatibility: ContentCompatibilityService, private val memberships: AcademicSubjectGroupMembershipRepository) {
    fun candidates(courseId: Long, actorId: Long, manageAll: Boolean, search: String?, groupId: Long?, page: Int): EnrollmentCandidates {
        require(page in 0..10000) { "Sahifa raqami noto'g'ri" }
        require(groupId == null || groupId > 0) { "Guruh identifikatori noto'g'ri" }
        val course = access.requireManage(courseId, actorId, manageAll)
        val programId = course.subject?.program?.id
            ?: return EnrollmentCandidates(emptyList(), emptyList(), page, 0, false)
        val groups = em.createQuery("select g from Group g where g.deleted = false and g.active = true and g.program.id = :programId order by g.name", Group::class.java)
            .setParameter("programId", programId).resultList
        val groupNames = groups.associate { it.id to it.name }
        val term = search.orEmpty().trim().take(100).lowercase().replace("!", "!!").replace("%", "!%").replace("_", "!_")
        val where = """
            from StudentProfile s where s.user.deleted = false and s.studentStatus = :active
            and s.programId = :programId and (:groupId is null or s.groupId = :groupId)
            and (lower(concat(s.lastName, ' ', s.firstName)) like :term escape '!'
                 or lower(s.studentNumber) like :term escape '!' or exists
                 (select g.id from Group g where g.id = s.groupId and g.deleted = false and lower(g.name) like :term escape '!'))
            and not exists (select e.id from CourseEnrollment e where e.course.id = :courseId and e.student = s
                and e.deleted = false and e.status in :statuses)
        """.trimIndent()
        fun <T> query(select: String, type: Class<T>) = em.createQuery(select, type)
            .setParameter("active", StudentStatus.ACTIVE).setParameter("programId", programId)
            .setParameter("groupId", groupId).setParameter("term", "%$term%").setParameter("courseId", courseId)
            .setParameter("statuses", setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED))
        val total = query("select count(s) $where", Long::class.javaObjectType).singleResult
        val students = query("select s $where order by s.lastName, s.firstName, s.id", StudentProfile::class.java)
            .setFirstResult(page * 25).setMaxResults(25).resultList
        val items = students.map { student ->
            val reason = when {
                course.status == "ARCHIVED" -> "Kurs arxivlangan"
                student.lmsOrientationRequired -> "LMS orientatsiyasi yakunlanmagan"
                course.subjectGroup != null && memberships.findBySubjectGroupIdAndStudentId(course.subjectGroup!!.id!!, student.id!!) == null -> "Kursning fan guruhiga biriktirilmagan"
                else -> try { compatibility.requireEnrollmentCompatible(course, student); null } catch (ex: IllegalArgumentException) { ex.message }
            }
            EnrollmentCandidate(student.id!!, student.fullName, student.studentNumber, groupNames[student.groupId], reason == null, reason)
        }
        return EnrollmentCandidates(items, groups.map { EnrollmentCandidateGroup(it.id!!, it.name) }, page, total, (page + 1) * 25L < total)
    }
}
