package uz.scorm.lms.app.v1.student.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.Immutable
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

enum class StudentLifecycleEventType {
    ADMISSION, SUSPENSION, REINSTATEMENT, TRANSFER, EXPULSION, GRADUATION
}

@Entity
@Table(name = "student_lifecycle_events")
@Immutable
class StudentLifecycleEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    var eventType: StudentLifecycleEventType,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    var fromStatus: StudentStatus? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    var toStatus: StudentStatus,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_program_id")
    var fromProgram: Program? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_program_id")
    var toProgram: Program? = null,

    @Column(name = "from_program_name_snapshot", length = 500)
    var fromProgramNameSnapshot: String? = null,

    @Column(name = "to_program_name_snapshot", length = 500)
    var toProgramNameSnapshot: String? = null,

    @Column(name = "from_group_id")
    var fromGroupId: Long? = null,

    @Column(name = "to_group_id")
    var toGroupId: Long? = null,

    @Column(name = "order_number", nullable = false, length = 200)
    var orderNumber: String,

    @Column(name = "order_date", nullable = false)
    var orderDate: LocalDate,

    @Column(name = "effective_date", nullable = false)
    var effectiveDate: LocalDate,

    @Column(name = "legal_basis", nullable = false, length = 1000)
    var legalBasis: String,

    @Column(name = "reason", nullable = false, length = 2000)
    var reason: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_user_id", nullable = false)
    var recordedBy: User,

    @Column(name = "recorded_at", nullable = false)
    var recordedAt: Instant = Instant.now(),
)
