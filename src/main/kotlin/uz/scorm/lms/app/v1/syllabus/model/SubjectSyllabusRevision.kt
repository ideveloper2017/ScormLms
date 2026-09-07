package uz.scorm.lms.app.v1.syllabus.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

@Entity
@Table(name = "subject_syllabus_revisions")
class SubjectSyllabusRevision(
    @Column(name = "syllabus_id", nullable = false) var syllabusId: Long,
    @Column(name = "revision_number", nullable = false) var revisionNumber: Int,
    @Column(nullable = false, columnDefinition = "TEXT") var content: String,
    @Column(name = "approved_by_name", nullable = false) var approvedByName: String,
    @Column(name = "approved_at", nullable = false) var approvedAt: Instant,
) : BaseEntity()
