package uz.scorm.lms.app.v1.curriculum.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.curriculum.model.CurriculumSemesterPeriod
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStudentAssignment

interface CurriculumSemesterPeriodRepository : JpaRepository<CurriculumSemesterPeriod, Long> {
    fun findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAsc(curriculumId: Long): List<CurriculumSemesterPeriod>
    fun findByCurriculumVersionIdAndSemesterNumberAndDeletedFalse(curriculumId: Long, semesterNumber: Int): CurriculumSemesterPeriod?
    fun findAllByDeletedFalse(): List<CurriculumSemesterPeriod>
}

interface CurriculumStudentAssignmentRepository : JpaRepository<CurriculumStudentAssignment, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = ["curriculumVersion", "curriculumVersion.ratingSystem"])
    fun findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(studentId: Long, academicYear: String, semesterNumber: Int): List<CurriculumStudentAssignment>
    fun findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAscStudentLastNameAsc(curriculumId: Long): List<CurriculumStudentAssignment>
    fun findByIdAndCurriculumVersionIdAndDeletedFalse(id: Long, curriculumId: Long): CurriculumStudentAssignment?
    fun findByCurriculumVersionIdAndStudentIdAndSemesterNumber(curriculumId: Long, studentId: Long, semesterNumber: Int): CurriculumStudentAssignment?
    fun existsByCurriculumVersionIdAndStudentIdAndSemesterNumberAndDeletedFalse(curriculumId: Long, studentId: Long, semesterNumber: Int): Boolean

    /** Barcha rejalar bo'yicha biriktirilgan talabalar ("O'quv rejaga biriktirilgan talabalar" jadvali) */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = ["student", "curriculumVersion", "curriculumVersion.program"])
    @org.springframework.data.jpa.repository.Query("""
        select assignment from CurriculumStudentAssignment assignment
        where assignment.deleted = false
          and assignment.curriculumVersion.deleted = false
          and (:academicYear is null or assignment.academicYear = :academicYear)
          and (:curriculumId is null or assignment.curriculumVersion.id = :curriculumId)
          and (:semester is null or assignment.semesterNumber = :semester)
          and (:groupId is null or assignment.student.groupId = :groupId)
        order by assignment.academicYear desc, assignment.semesterNumber asc, assignment.student.lastName asc
    """)
    fun search(
        @org.springframework.data.repository.query.Param("academicYear") academicYear: String?,
        @org.springframework.data.repository.query.Param("curriculumId") curriculumId: Long?,
        @org.springframework.data.repository.query.Param("semester") semester: Int?,
        @org.springframework.data.repository.query.Param("groupId") groupId: Long?,
    ): List<CurriculumStudentAssignment>
}
