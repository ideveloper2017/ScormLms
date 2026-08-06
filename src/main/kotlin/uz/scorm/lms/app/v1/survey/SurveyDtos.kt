package uz.scorm.lms.app.v1.survey

import java.math.BigDecimal
import java.time.Instant

data class CreateSurveyQuestionRequest(
    val prompt: String,
    val questionType: SurveyQuestionType,
    val options: List<String> = emptyList(),
    val required: Boolean = true,
)

data class CreateSurveyRequest(
    val title: String,
    val description: String = "",
    val audience: SurveyAudience,
    val startsAt: Instant,
    val endsAt: Instant,
    val minAggregateSize: Int = 5,
    val questions: List<CreateSurveyQuestionRequest>,
)

data class SurveyQuestionDto(
    val id: Long,
    val prompt: String,
    val questionType: SurveyQuestionType,
    val options: List<String>,
    val required: Boolean,
    val position: Int,
)

data class SurveyDto(
    val id: Long,
    val title: String,
    val description: String,
    val audience: SurveyAudience,
    val status: SurveyStatus,
    val startsAt: Instant,
    val endsAt: Instant,
    val minAggregateSize: Int,
    val questions: List<SurveyQuestionDto>,
    val submitted: Boolean? = null,
    val responseCount: Long? = null,
)

data class SubmitSurveyAnswerRequest(
    val questionId: Long,
    val ratingValue: Int? = null,
    val optionValue: String? = null,
)

data class SubmitSurveyResponseRequest(val answers: List<SubmitSurveyAnswerRequest>)

data class SurveySubmissionDto(val surveyId: Long, val submittedAt: Instant, val accepted: Boolean = true)

data class SurveyOptionAggregateDto(val option: String, val count: Long, val percentage: BigDecimal)

data class SurveyQuestionAggregateDto(
    val questionId: Long,
    val prompt: String,
    val questionType: SurveyQuestionType,
    val answerCount: Long,
    val averageRating: BigDecimal? = null,
    val ratingDistribution: Map<Int, Long> = emptyMap(),
    val options: List<SurveyOptionAggregateDto> = emptyList(),
)

data class SurveyResultsDto(
    val surveyId: Long,
    val title: String,
    val responseCount: Long,
    val minAggregateSize: Int,
    val suppressed: Boolean,
    val questions: List<SurveyQuestionAggregateDto>,
)
