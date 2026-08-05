package uz.scorm.lms.app.v1.attestation.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(
    name = "attestation_grades",
    indexes = [
        Index(name = "idx_attestation_grade_defense", columnList = "student_defense_id"),
        Index(name = "idx_attestation_grade_grader", columnList = "graded_by"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_attestation_grade", columnNames = ["student_defense_id", "graded_by"]),
    ],
)
class AttestationGrade(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_defense_id", nullable = false)
    var studentDefense: StudentDefense,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "graded_by", nullable = false)
    var gradedBy: User,

    @Column(nullable = false)
    var score: BigDecimal = BigDecimal.ZERO,

    @Column(name = "criteria_scores", columnDefinition = "TEXT")
    var criteriaScores: String? = null,

    @Column(columnDefinition = "TEXT")
    var comments: String? = null,

    @Column(name = "grading_date", nullable = false)
    var gradingDate: Instant,
) : BaseEntity()