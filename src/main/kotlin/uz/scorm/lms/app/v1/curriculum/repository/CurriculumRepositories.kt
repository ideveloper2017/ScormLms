package uz.scorm.lms.app.v1.curriculum.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import java.time.LocalDate

interface ProgramCurriculumVersionRepository : JpaRepository<ProgramCurriculumVersion, Long> {
    fun findByIdAndDeletedFalse(id: Long): ProgramCurriculumVersion?
    fun findAllByDeletedFalseOrderByAcademicYearDescVersionCodeAsc(): List<ProgramCurriculumVersion>
    fun existsByProgramIdAndVersionCodeAndDeletedFalse(programId: Long, versionCode: String): Boolean
    fun existsByProgramIdAndAcademicYearAndStatusAndDeletedFalse(programId: Long, academicYear: String, status: CurriculumStatus): Boolean
    fun countByStatusAndDeletedFalse(status: CurriculumStatus): Long

    @Query("""
        select count(c) from ProgramCurriculumVersion c
        where c.status = :status and c.deleted = false
          and c.validFrom <= :onDate and c.validUntil >= :onDate
          and c.program.deleted = false and c.program.active = true and c.program.distanceEnabled = true
    """)
    fun countCurrentApproved(@Param("status") status: CurriculumStatus, @Param("onDate") onDate: LocalDate): Long
}

interface ProgramCurriculumSubjectRepository : JpaRepository<ProgramCurriculumSubject, Long> {
    fun findByIdAndDeletedFalse(id: Long): ProgramCurriculumSubject?
    fun findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscSubjectNameSnapshotAsc(curriculumVersionId: Long): List<ProgramCurriculumSubject>
    fun existsByCurriculumVersionIdAndSubjectIdAndDeletedFalse(curriculumVersionId: Long, subjectId: Long): Boolean
}
