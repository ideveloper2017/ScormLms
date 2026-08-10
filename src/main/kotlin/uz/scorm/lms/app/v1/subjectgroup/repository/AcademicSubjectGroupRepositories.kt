package uz.scorm.lms.app.v1.subjectgroup.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroup
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroupMembership

interface AcademicSubjectGroupRepository : JpaRepository<AcademicSubjectGroup, Long> {
    fun findByIdAndDeletedFalse(id: Long): AcademicSubjectGroup?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select subjectGroup from AcademicSubjectGroup subjectGroup where subjectGroup.id = :id and subjectGroup.deleted = false")
    fun findByIdForUpdate(@Param("id") id: Long): AcademicSubjectGroup?

    fun existsByCurriculumSubjectIdAndCodeIgnoreCaseAndDeletedFalse(curriculumSubjectId: Long, code: String): Boolean

    @Query("""
        select subjectGroup from AcademicSubjectGroup subjectGroup
        join subjectGroup.curriculumSubject curriculumSubject
        join curriculumSubject.curriculumVersion curriculum
        where subjectGroup.deleted = false
          and curriculumSubject.deleted = false
          and curriculum.deleted = false
          and (:curriculumId is null or curriculum.id = :curriculumId)
          and (:academicYear is null or curriculum.academicYear = :academicYear)
          and (:semester is null or curriculumSubject.semester = :semester)
          and (:subjectId is null or curriculumSubject.subject.id = :subjectId)
          and (:active is null or subjectGroup.active = :active)
        order by curriculum.academicYear desc, curriculumSubject.semester asc, subjectGroup.code asc
    """)
    fun search(
        @Param("curriculumId") curriculumId: Long?,
        @Param("academicYear") academicYear: String?,
        @Param("semester") semester: Int?,
        @Param("subjectId") subjectId: Long?,
        @Param("active") active: Boolean?,
    ): List<AcademicSubjectGroup>
}

interface AcademicSubjectGroupMembershipRepository : JpaRepository<AcademicSubjectGroupMembership, Long> {
    fun findAllBySubjectGroupIdOrderByStudentLastNameAscStudentFirstNameAsc(subjectGroupId: Long): List<AcademicSubjectGroupMembership>
    fun countBySubjectGroupId(subjectGroupId: Long): Long
    fun findBySubjectGroupIdAndStudentId(subjectGroupId: Long, studentId: Long): AcademicSubjectGroupMembership?
    fun existsByStudentIdAndCurriculumSubjectId(studentId: Long, curriculumSubjectId: Long): Boolean
}
