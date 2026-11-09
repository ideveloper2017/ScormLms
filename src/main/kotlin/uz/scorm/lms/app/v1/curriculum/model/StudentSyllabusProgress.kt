package uz.scorm.lms.app.v1.curriculum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

/** Talaba dastur darsi materialini bajargani — fan kurssiz, o'quv dasturidan o'qiladi */
@Entity
@Table(name = "student_syllabus_progress")
class StudentSyllabusProgress(
    @Column(name = "student_id", nullable = false)
    var studentId: Long,
    @Column(name = "material_id", nullable = false)
    var materialId: Long,
    @Column(name = "completed_at", nullable = false)
    var completedAt: Instant = Instant.now(),
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
