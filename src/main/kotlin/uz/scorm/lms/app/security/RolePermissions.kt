package uz.scorm.lms.app.security

/**
 * Single source of truth for role → permission mapping.
 * Used by both CustomUserDetailsService (Spring Security) and UserMapper (API response).
 */
object RolePermissions {

    // All permission codes used in the system
    const val USER_READ     = "USER_READ"
    const val USER_WRITE    = "USER_WRITE"
    const val USER_MANAGE   = "USER_MANAGE"    // password reset, block/unblock
    const val USER_MONITOR  = "USER_MONITOR"
    const val COURSE_READ   = "COURSE_READ"
    const val COURSE_WRITE  = "COURSE_WRITE"
    const val ROLE_MANAGE   = "ROLE_MANAGE"
    const val AUDIT_READ    = "AUDIT_READ"
    const val REPORT_READ   = "REPORT_READ"
    const val STAT_READ     = "STAT_READ"
    const val EXAM_MANAGE   = "EXAM_MANAGE"
    const val EXAM_PROCTOR  = "EXAM_PROCTOR"
    const val EXAM_TAKE     = "EXAM_TAKE"
    const val ACADEMIC_READ  = "ACADEMIC_READ"   // faculties/departments/programs/groups/subjects
    const val ACADEMIC_WRITE = "ACADEMIC_WRITE"
    const val TEACHER_READ   = "TEACHER_READ"
    const val TEACHER_WRITE  = "TEACHER_WRITE"
    const val STUDENT_READ   = "STUDENT_READ"
    const val STUDENT_WRITE  = "STUDENT_WRITE"

    private val MATRIX: Map<String, List<String>> = mapOf(
        "super_admin" to listOf(
            USER_READ, USER_WRITE, USER_MANAGE,
            COURSE_READ, COURSE_WRITE,
            ROLE_MANAGE, AUDIT_READ, REPORT_READ,
            EXAM_MANAGE, EXAM_PROCTOR, EXAM_TAKE,
            USER_MONITOR, STAT_READ,
            ACADEMIC_READ, ACADEMIC_WRITE, TEACHER_READ, TEACHER_WRITE
        ),
        "admin" to listOf(
            USER_READ, USER_WRITE, USER_MANAGE,
            COURSE_READ, COURSE_WRITE,
            AUDIT_READ, REPORT_READ, STAT_READ, EXAM_MANAGE,
            ACADEMIC_READ, ACADEMIC_WRITE, TEACHER_READ, TEACHER_WRITE
        ),
        "metodist" to listOf(
            USER_READ,
            COURSE_READ, COURSE_WRITE,
            REPORT_READ, STAT_READ,
            ACADEMIC_READ, ACADEMIC_WRITE, TEACHER_READ, TEACHER_WRITE
        ),
        "teacher" to listOf(
            COURSE_READ, COURSE_WRITE,
            EXAM_MANAGE, REPORT_READ,
            ACADEMIC_READ, TEACHER_READ
        ),
        "student" to listOf(
            COURSE_READ, EXAM_TAKE, STUDENT_READ, STUDENT_WRITE
        ),
        "proctor" to listOf(
            EXAM_PROCTOR, USER_MONITOR
        ),
        "monitoring" to listOf(
            USER_READ, AUDIT_READ, REPORT_READ, STAT_READ
        )
    )

    /** Returns all permission codes for the given role name. */
    fun forRole(roleName: String?): List<String> =
        MATRIX[roleName?.lowercase()] ?: emptyList()

    /** Full matrix for display / documentation purposes. */
    val allPermissions: List<String> = listOf(
        USER_READ, USER_WRITE, USER_MANAGE, USER_MONITOR,
        COURSE_READ, COURSE_WRITE,
        ROLE_MANAGE, AUDIT_READ, REPORT_READ, STAT_READ,
        EXAM_MANAGE, EXAM_PROCTOR, EXAM_TAKE,
        ACADEMIC_READ, ACADEMIC_WRITE, TEACHER_READ, TEACHER_WRITE,
        STUDENT_READ, STUDENT_WRITE
    )

    val allRoles: List<String> = MATRIX.keys.toList()
}
