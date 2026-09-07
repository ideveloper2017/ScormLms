package uz.scorm.lms.app.v1.syllabus.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage

interface SubjectSyllabusRepository : JpaRepository<SubjectSyllabus, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from SubjectSyllabus s where s.id = :id and s.deleted = false")
    fun lockById(id: Long): SubjectSyllabus?
    fun findAllByDeletedFalseOrderByNameAsc(): List<SubjectSyllabus>
    fun findAllBySubjectIdAndDeletedFalseOrderByNameAsc(subjectId: Long): List<SubjectSyllabus>
    fun findByIdAndDeletedFalse(id: Long): SubjectSyllabus?
    fun existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(subjectId: Long, language: SyllabusLanguage, name: String): Boolean
    fun existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalseAndIdNot(subjectId: Long, language: SyllabusLanguage, name: String, id: Long): Boolean
}
