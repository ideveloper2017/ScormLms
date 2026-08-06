package uz.scorm.lms.app.v1.survey

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
import org.hibernate.annotations.CreationTimestamp
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant
import java.util.UUID

enum class SurveyAudience { STUDENT, TEACHER, BOTH }
enum class SurveyStatus { DRAFT, PUBLISHED, CLOSED }
enum class SurveyQuestionType { RATING, SINGLE_CHOICE }
enum class SurveyRespondentRole { STUDENT, TEACHER }

@Entity
@Table(name = "surveys")
class Survey(
    @Column(nullable = false, length = 500)
    var title: String = "",
    @Column(nullable = false, length = 2000)
    var description: String = "",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var audience: SurveyAudience = SurveyAudience.BOTH,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: SurveyStatus = SurveyStatus.DRAFT,
    @Column(name = "starts_at", nullable = false)
    var startsAt: Instant = Instant.now(),
    @Column(name = "ends_at", nullable = false)
    var endsAt: Instant = Instant.now().plusSeconds(86_400),
    @Column(name = "min_aggregate_size", nullable = false)
    var minAggregateSize: Int = 5,
    @Column(name = "anonymous_salt", nullable = false, length = 64)
    var anonymousSalt: String = UUID.randomUUID().toString().replace("-", ""),
    @Column(name = "published_at")
    var publishedAt: Instant? = null,
    @Column(name = "closed_at")
    var closedAt: Instant? = null,
) : BaseEntity()

@Entity
@Table(name = "survey_questions")
class SurveyQuestion(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    var survey: Survey? = null,
    @Column(nullable = false, length = 1000)
    var prompt: String = "",
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    var questionType: SurveyQuestionType = SurveyQuestionType.RATING,
    @Column(name = "option_values", columnDefinition = "TEXT")
    var optionValues: String? = null,
    @Column(nullable = false)
    var required: Boolean = true,
    @Column(nullable = false)
    var position: Int = 0,
) : BaseEntity()

@Entity
@Table(name = "survey_responses")
class SurveyResponse(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    var survey: Survey? = null,
    @Column(name = "respondent_hash", nullable = false, length = 64)
    var respondentHash: String = "",
    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    var submittedAt: Instant? = null,
    @Column(nullable = false)
    var deleted: Boolean = false,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}

@Entity
@Table(name = "survey_answers")
class SurveyAnswer(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "response_id", nullable = false)
    var response: SurveyResponse? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    var question: SurveyQuestion? = null,
    @Column(name = "rating_value")
    var ratingValue: Int? = null,
    @Column(name = "option_value", length = 500)
    var optionValue: String? = null,
    @Column(nullable = false)
    var deleted: Boolean = false,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
