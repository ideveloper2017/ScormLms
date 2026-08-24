package uz.scorm.lms.app.v1.curriculum.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.curriculum.model.CurriculumSemesterPeriod
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStudentAssignment

interface CurriculumSemesterPeriodRepository : JpaRepository<CurriculumSemesterPeriod, Long> {
    fun findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAsc(curriculumId: Long): List<CurriculumSemesterPeriod>
    fun findByCurriculumVersionIdAndSemesterNumberAndDeletedFalse(curriculumId: Long, semesterNumber: Int): CurriculumSemesterPeriod?
}

interface CurriculumStudentAssignmentRepository : JpaRepository<CurriculumStudentAssignment, Long> {
    fun findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAscStudentLastNameAsc(curriculumId: Long): List<CurriculumStudentAssignment>
    fun findByIdAndCurriculumVersionIdAndDeletedFalse(id: Long, curriculumId: Long): CurriculumStudentAssignment?
    fun findByCurriculumVersionIdAndStudentIdAndSemesterNumber(curriculumId: Long, studentId: Long, semesterNumber: Int): CurriculumStudentAssignment?
    fun existsByCurriculumVersionIdAndStudentIdAndSemesterNumberAndDeletedFalse(curriculumId: Long, studentId: Long, semesterNumber: Int): Boolean
}
