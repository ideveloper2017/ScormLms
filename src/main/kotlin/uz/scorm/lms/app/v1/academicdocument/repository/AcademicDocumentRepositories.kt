package uz.scorm.lms.app.v1.academicdocument.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.academicdocument.model.FinalExamCallLetter
import uz.scorm.lms.app.v1.academicdocument.model.StudentTranscript

interface FinalExamCallLetterRepository : JpaRepository<FinalExamCallLetter, Long> {
    @EntityGraph(attributePaths = ["student", "student.user", "issuedBy"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<FinalExamCallLetter>

    @EntityGraph(attributePaths = ["student", "student.user", "issuedBy"])
    fun findByIdAndDeletedFalse(id: Long): FinalExamCallLetter?

    fun findByDocumentNumberIgnoreCaseAndDeletedFalse(documentNumber: String): FinalExamCallLetter?
}

interface StudentTranscriptRepository : JpaRepository<StudentTranscript, Long> {
    @EntityGraph(attributePaths = ["student", "student.user", "issuedBy"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<StudentTranscript>

    @EntityGraph(attributePaths = ["student", "student.user", "issuedBy"])
    fun findByIdAndDeletedFalse(id: Long): StudentTranscript?

    fun findByDocumentNumberIgnoreCaseAndDeletedFalse(documentNumber: String): StudentTranscript?
}
