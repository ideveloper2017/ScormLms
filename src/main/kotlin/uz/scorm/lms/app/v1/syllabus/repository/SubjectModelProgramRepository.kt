package uz.scorm.lms.app.v1.syllabus.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage

interface SubjectModelProgramRepository : JpaRepository<SubjectModelProgram, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<SubjectModelProgram>
    fun findByIdAndDeletedFalse(id: Long): SubjectModelProgram?
    fun findFirstBySubjectIdAndLanguageAndDeletedFalse(subjectId: Long, language: SyllabusLanguage): SubjectModelProgram?
    fun existsBySubjectIdAndLanguageAndDeletedFalse(subjectId: Long, language: SyllabusLanguage): Boolean
    fun existsBySubjectIdAndLanguageAndDeletedFalseAndIdNot(subjectId: Long, language: SyllabusLanguage, id: Long): Boolean
}
