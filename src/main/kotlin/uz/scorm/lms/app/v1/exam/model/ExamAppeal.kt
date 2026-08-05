package uz.scorm.lms.app.v1.exam.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(
    name = "exam_appeals",
    indexes = [
        Index(name = "idx_exam_appeal_result", columnList = "exam_result_id,status"),
        Index(name = "idx_exam_appeal_student", columnList = "student_id,status"),
        Index(name = "idx_exam_appeal_date", columnList = "appeal_date,status"),
    ],
)
class ExamAppeal(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_result_id", nullable = false)
    var examResult: ExamResult,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: User,

    @Column(name = "appeal_date", nullable = false)
    var appealDate: Instant,

    @Column(nullable = false, columnDefinition = "TEXT")
    var reason: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AppealStatus = AppealStatus.PENDING,

    @Column(name = "review_date")
    var reviewDate: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    var reviewedBy: User? = null,

    @Column(columnDefinition = "TEXT")
    var decision: String? = null,

    @Column(name = "new_score")
    var newScore: BigDecimal? = null,
) : BaseEntity()

enum class AppealStatus {
    PENDING,   // Appeal is pending review
    APPROVED,  // Appeal has been approved
    REJECTED,  // Appeal has been rejected
    PARTIAL,   // Appeal has been partially approved
}