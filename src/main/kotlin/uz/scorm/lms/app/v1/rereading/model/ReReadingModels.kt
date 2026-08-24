package uz.scorm.lms.app.v1.rereading.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.student.model.StudentProfile
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "re_reading_plans")
class ReReadingPlan(
    @Column(nullable = false, length = 180)
    var title: String = "",

    @Column(name = "application_deadline", nullable = false)
    var applicationDeadline: LocalDate = LocalDate.now(),

    @Column(columnDefinition = "TEXT", nullable = false)
    var description: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ReReadingPlanStatus = ReReadingPlanStatus.OPEN,
) : BaseEntity()

@Entity
@Table(name = "re_reading_applications")
class ReReadingApplication(
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    var plan: ReReadingPlan,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Column(name = "contract_number", nullable = false, length = 100)
    var contractNumber: String,

    @Column(name = "total_credits", nullable = false)
    var totalCredits: Int = 0,

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    var totalAmount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    var paidAmount: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ReReadingApplicationStatus = ReReadingApplicationStatus.DRAFT,

    @Column(name = "submitted_at")
    var submittedAt: Instant? = null,
) : BaseEntity()

enum class ReReadingPlanStatus { PLANNED, OPEN, CLOSED }
enum class ReReadingApplicationStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
