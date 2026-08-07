package uz.scorm.lms.app.v1.foreignteacher.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "foreign_teacher_engagements",
    indexes = [
        Index(name = "idx_foreign_teacher_year_status", columnList = "academic_year,status"),
        Index(name = "idx_foreign_teacher_teacher_period", columnList = "teacher_id,engagement_start_date,engagement_end_date"),
    ],
)
class ForeignTeacherEngagement(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    var teacher: Teacher,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(name = "citizenship_country_code", nullable = false, length = 2)
    var citizenshipCountryCode: String,

    @Column(name = "citizenship_evidence_reference", nullable = false, length = 1000)
    var citizenshipEvidenceReference: String,

    @Column(name = "qualification_reference", nullable = false, length = 1000)
    var qualificationReference: String,

    @Column(name = "contract_number", nullable = false, length = 200)
    var contractNumber: String,

    @Column(name = "contract_date", nullable = false)
    var contractDate: LocalDate,

    @Column(name = "engagement_order_number", nullable = false, length = 200)
    var engagementOrderNumber: String,

    @Column(name = "engagement_order_date", nullable = false)
    var engagementOrderDate: LocalDate,

    @Column(name = "engagement_start_date", nullable = false)
    var engagementStartDate: LocalDate,

    @Column(name = "engagement_end_date", nullable = false)
    var engagementEndDate: LocalDate,

    @Column(name = "remote_teaching_confirmed", nullable = false)
    var remoteTeachingConfirmed: Boolean,

    @Column(name = "evidence_reference", nullable = false, length = 1000)
    var evidenceReference: String,

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "foreign_teacher_engagement_courses",
        joinColumns = [JoinColumn(name = "engagement_id")],
        inverseJoinColumns = [JoinColumn(name = "course_id")],
    )
    var courses: MutableSet<Course> = linkedSetOf(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ForeignTeacherEngagementStatus = ForeignTeacherEngagementStatus.DRAFT,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "verified_at")
    var verifiedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    var verifiedByUser: User? = null,

    @Column(name = "verification_note", length = 2000)
    var verificationNote: String? = null,

    @Column(name = "rejected_at")
    var rejectedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_user_id")
    var rejectedByUser: User? = null,

    @Column(name = "rejection_reason", length = 2000)
    var rejectionReason: String? = null,
) : BaseEntity()

enum class ForeignTeacherEngagementStatus { DRAFT, VERIFIED, REJECTED }
