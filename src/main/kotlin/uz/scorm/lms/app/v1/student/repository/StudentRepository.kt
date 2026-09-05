package uz.scorm.lms.app.v1.student.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.Query
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.repository.query.Param
import jakarta.persistence.LockModeType
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.EducationForm

interface StudentRepository : JpaRepository<StudentProfile, Long>, JpaSpecificationExecutor<StudentProfile> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StudentProfile s WHERE s.id = :id")
    fun findByIdForUpdate(id: Long): StudentProfile?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StudentProfile s WHERE s.id IN :ids ORDER BY s.id")
    fun findAllByIdForUpdate(ids: Collection<Long>): List<StudentProfile>

    fun countByStudentStatus(status: StudentStatus): Long
    fun findByUserUsername(username: String): StudentProfile?
    fun findByUserId(userId: Long): StudentProfile?
    fun findByPinfl(pinfl: String): StudentProfile?
    @Query("""
        select s from StudentProfile s
        where upper(trim(s.passportSeries)) = upper(:series)
          and upper(trim(s.passportNumber)) = upper(:number)
    """)
    fun findByPassport(
        @Param("series") series: String,
        @Param("number") number: String,
    ): List<StudentProfile>
    fun findByStudentNumber(studentNumber: String): StudentProfile?
    fun findByHemisId(hemisId: Long): StudentProfile?
    fun existsByPinfl(pinfl: String): Boolean
    fun existsByStudentNumber(studentNumber: String): Boolean

    fun findAllByStudentStatus(status: StudentStatus, pageable: Pageable): Page<StudentProfile>

    @Query("SELECT s FROM StudentProfile s WHERE s.facultyId = :facultyId")
    fun findByFacultyId(facultyId: Long, pageable: Pageable): Page<StudentProfile>

    @Query("SELECT s FROM StudentProfile s WHERE s.groupId = :groupId")
    fun findByGroupId(groupId: Long): List<StudentProfile>

    fun countByEducationFormAndStudentStatus(
        educationForm: EducationForm,
        studentStatus: StudentStatus,
    ): Long

    fun countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
        programId: Long,
        educationForm: EducationForm,
        studentStatus: StudentStatus,
        citizenship: Citizenship,
    ): Long

    fun countByProgramIdAndAcademicYearAndEducationFormAndStudentStatus(
        programId: Long,
        academicYear: String,
        educationForm: EducationForm,
        studentStatus: StudentStatus,
    ): Long

    fun countByProgramIdAndAcademicYearAndEducationForm(
        programId: Long,
        academicYear: String,
        educationForm: EducationForm,
    ): Long

    fun countByProgramIdAndAcademicYearAndEducationFormAndStudentStatusAndCitizenship(
        programId: Long,
        academicYear: String,
        educationForm: EducationForm,
        studentStatus: StudentStatus,
        citizenship: Citizenship,
    ): Long

    fun countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
        programId: Long,
        academicYear: String,
        educationForm: EducationForm,
        citizenship: Citizenship,
    ): Long

    fun findAllByEducationFormAndStudentStatusAndLmsOrientationRequiredTrue(
        educationForm: EducationForm,
        studentStatus: StudentStatus,
    ): List<StudentProfile>

    fun findAllByEducationFormAndStudentStatusOrderByLastNameAsc(
        educationForm: EducationForm,
        studentStatus: StudentStatus,
    ): List<StudentProfile>

    @EntityGraph(attributePaths = ["user"])
    @Query("""
        select student from StudentProfile student
        where student.programId = :programId
          and student.academicYear = :academicYear
          and student.studentStatus <> :unassignedStatus
          and (:status is null or student.studentStatus = :status)
          and (
            :search = ''
            or lower(student.studentNumber) like concat('%', :search, '%')
            or lower(student.lastName) like concat('%', :search, '%')
            or lower(student.firstName) like concat('%', :search, '%')
            or lower(coalesce(student.middleName, '')) like concat('%', :search, '%')
          )
    """)
    fun findCurriculumStudents(
        @Param("programId") programId: Long,
        @Param("academicYear") academicYear: String,
        @Param("unassignedStatus") unassignedStatus: StudentStatus,
        @Param("status") status: StudentStatus?,
        @Param("search") search: String,
        pageable: Pageable,
    ): Page<StudentProfile>

    @EntityGraph(attributePaths = ["user"])
    @Query("""
        select student from StudentProfile student
        where student.programId = :programId
          and student.academicYear = :academicYear
          and student.semesterNumber = :semester
          and student.studentStatus = :status
          and (
            :search = ''
            or lower(student.studentNumber) like concat('%', :search, '%')
            or lower(student.lastName) like concat('%', :search, '%')
            or lower(student.firstName) like concat('%', :search, '%')
            or lower(coalesce(student.middleName, '')) like concat('%', :search, '%')
          )
          and not exists (
            select membership.id from AcademicSubjectGroupMembership membership
            where membership.student.id = student.id
              and membership.curriculumSubject.id = :curriculumSubjectId
          )
    """)
    fun findAcademicSubjectGroupCandidates(
        @Param("programId") programId: Long,
        @Param("academicYear") academicYear: String,
        @Param("semester") semester: Int,
        @Param("status") status: StudentStatus,
        @Param("curriculumSubjectId") curriculumSubjectId: Long,
        @Param("search") search: String,
        pageable: Pageable,
    ): Page<StudentProfile>
}
