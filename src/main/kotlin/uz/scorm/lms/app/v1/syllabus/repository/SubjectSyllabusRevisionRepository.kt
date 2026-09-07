package uz.scorm.lms.app.v1.syllabus.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusRevision

interface SubjectSyllabusRevisionRepository : JpaRepository<SubjectSyllabusRevision, Long> {
    fun findAllBySyllabusIdOrderByRevisionNumberDesc(syllabusId: Long): List<SubjectSyllabusRevision>
}
