package uz.scorm.lms.app.v1.quality.model

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
import java.time.Instant

@Entity
@Table(
    name = "quality_monitoring_studies",
    indexes = [
        Index(name = "idx_quality_study_status_date", columnList = "status,starts_at"),
        Index(name = "idx_quality_study_method_year", columnList = "method,academic_year"),
        Index(name = "idx_quality_study_survey", columnList = "related_survey_id"),
    ],
)
class QualityMonitoringStudy(
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var method: QualityMonitoringMethod,

    @Column(nullable = false, length = 500)
    var title: String,

    @Column(nullable = false, length = 2000)
    var objective: String,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(name = "starts_at", nullable = false)
    var startsAt: Instant,

    @Column(name = "ends_at", nullable = false)
    var endsAt: Instant,

    @Column(name = "location_description", nullable = false, length = 500)
    var locationDescription: String,

    @Column(name = "population_scope", nullable = false, length = 1000)
    var populationScope: String,

    @Column(name = "related_survey_id")
    var relatedSurveyId: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facilitator_user_id", nullable = false)
    var facilitator: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: QualityMonitoringStatus = QualityMonitoringStatus.DRAFT,

    @Column(name = "participant_count")
    var participantCount: Int? = null,

    @Column(columnDefinition = "TEXT")
    var summary: String? = null,

    @Column(columnDefinition = "TEXT")
    var findings: String? = null,

    @Column(columnDefinition = "TEXT")
    var recommendations: String? = null,

    @Column(name = "evidence_reference", length = 1000)
    var evidenceReference: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_user_id")
    var completedBy: User? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    var approvedBy: User? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    var cancelledBy: User? = null,
) : BaseEntity()

enum class QualityMonitoringMethod {
    FOCUS_GROUP, INTERVIEW, OBSERVATION, DOCUMENT_ANALYSIS
}

enum class QualityMonitoringStatus {
    DRAFT, COMPLETED, APPROVED, CANCELLED
}

