package uz.scorm.lms.app.v1.survey

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import java.math.BigDecimal
import java.math.RoundingMode
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.HexFormat
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Service
class SurveyService(
    private val surveyRepository: SurveyRepository,
    private val questionRepository: SurveyQuestionRepository,
    private val responseRepository: SurveyResponseRepository,
    private val answerRepository: SurveyAnswerRepository,
    private val auditService: AuditService,
    @param:Value("\${app.survey.anonymization-secret}") private val anonymizationSecret: String,
) {
    @Transactional
    fun create(request: CreateSurveyRequest, actorId: Long): SurveyDto {
        validateRequest(request)
        val survey = surveyRepository.save(Survey(
            title = request.title.trim(),
            description = request.description.trim(),
            audience = request.audience,
            startsAt = request.startsAt,
            endsAt = request.endsAt,
            minAggregateSize = request.minAggregateSize,
        ))
        val questions = questionRepository.saveAll(request.questions.mapIndexed { index, item ->
            val options = normalizeOptions(item)
            SurveyQuestion(
                survey = survey,
                prompt = item.prompt.trim(),
                questionType = item.questionType,
                optionValues = options.takeIf { it.isNotEmpty() }?.joinToString("\n"),
                required = item.required,
                position = index + 1,
            )
        })
        auditService.logAction("SURVEY_CREATED", actorId, "survey=${survey.id}; audience=${survey.audience}; questions=${questions.size}")
        return toDto(survey, questions)
    }

    @Transactional(readOnly = true)
    fun listAdmin(): List<SurveyDto> = surveyRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map { survey ->
        toDto(survey, questions(survey), responseCount = responseRepository.countBySurveyIdAndDeletedFalse(requireNotNull(survey.id)))
    }

    @Transactional
    fun publish(id: Long, actorId: Long): SurveyDto {
        val survey = survey(id)
        require(survey.status == SurveyStatus.DRAFT) { "Faqat qoralama so'rov e'lon qilinadi" }
        require(survey.endsAt.isAfter(Instant.now())) { "So'rov tugash vaqti o'tib ketgan" }
        val questions = questions(survey)
        require(questions.isNotEmpty()) { "So'rovda kamida bitta savol bo'lishi kerak" }
        survey.status = SurveyStatus.PUBLISHED
        survey.publishedAt = Instant.now()
        auditService.logAction("SURVEY_PUBLISHED", actorId, "survey=$id")
        return toDto(surveyRepository.save(survey), questions, responseCount = 0)
    }

    @Transactional
    fun close(id: Long, actorId: Long): SurveyDto {
        val survey = survey(id)
        require(survey.status == SurveyStatus.PUBLISHED) { "Faqat e'lon qilingan so'rov yopiladi" }
        survey.status = SurveyStatus.CLOSED
        survey.closedAt = Instant.now()
        auditService.logAction("SURVEY_CLOSED", actorId, "survey=$id")
        return toDto(surveyRepository.save(survey), questions(survey), responseCount = responseRepository.countBySurveyIdAndDeletedFalse(id))
    }

    @Transactional(readOnly = true)
    fun available(userId: Long, role: SurveyRespondentRole): List<SurveyDto> {
        val now = Instant.now()
        return surveyRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
            .filter { it.status == SurveyStatus.PUBLISHED && !now.isBefore(it.startsAt) && now.isBefore(it.endsAt) && accepts(it, role) }
            .map { survey ->
                val id = requireNotNull(survey.id)
                toDto(survey, questions(survey), submitted = responseRepository.existsBySurveyIdAndRespondentHashAndDeletedFalse(id, respondentHash(survey, userId)))
            }
    }

    @Transactional
    fun submit(id: Long, request: SubmitSurveyResponseRequest, userId: Long, role: SurveyRespondentRole): SurveySubmissionDto {
        val survey = survey(id)
        val now = Instant.now()
        require(survey.status == SurveyStatus.PUBLISHED) { "So'rov javob qabul qilmayapti" }
        require(!now.isBefore(survey.startsAt) && now.isBefore(survey.endsAt)) { "So'rov javob berish oynasidan tashqarida" }
        require(accepts(survey, role)) { "So'rov ushbu auditoriya uchun mo'ljallanmagan" }
        val hash = respondentHash(survey, userId)
        require(!responseRepository.existsBySurveyIdAndRespondentHashAndDeletedFalse(id, hash)) { "Bu so'rovga javob allaqachon yuborilgan" }

        val questions = questions(survey)
        val byId = questions.associateBy { requireNotNull(it.id) }
        require(request.answers.map { it.questionId }.distinct().size == request.answers.size) { "Bir savolga takroriy javob yuborilgan" }
        require(request.answers.all { it.questionId in byId }) { "Javobda begona savol mavjud" }
        val supplied = request.answers.associateBy { it.questionId }
        questions.filter { it.required }.forEach { require(supplied.containsKey(requireNotNull(it.id))) { "Barcha majburiy savollarga javob bering" } }

        val response = responseRepository.saveAndFlush(SurveyResponse(survey = survey, respondentHash = hash))
        val answers = request.answers.map { item ->
            val question = byId.getValue(item.questionId)
            when (question.questionType) {
                SurveyQuestionType.RATING -> {
                    require(item.ratingValue in 1..5 && item.optionValue == null) { "Reyting javobi 1 dan 5 gacha bo'lishi kerak" }
                    SurveyAnswer(response = response, question = question, ratingValue = item.ratingValue)
                }
                SurveyQuestionType.SINGLE_CHOICE -> {
                    val option = item.optionValue?.trim().orEmpty()
                    require(item.ratingValue == null && option in options(question)) { "Tanlangan variant mavjud emas" }
                    SurveyAnswer(response = response, question = question, optionValue = option)
                }
            }
        }
        answerRepository.saveAll(answers)
        return SurveySubmissionDto(id, requireNotNull(response.submittedAt))
    }

    @Transactional(readOnly = true)
    fun results(id: Long): SurveyResultsDto {
        val survey = survey(id)
        require(survey.status == SurveyStatus.CLOSED || !Instant.now().isBefore(survey.endsAt)) { "Agregat natija so'rov yopilgandan keyin ochiladi" }
        val count = responseRepository.countBySurveyIdAndDeletedFalse(id)
        val suppressed = count < survey.minAggregateSize
        if (suppressed) return SurveyResultsDto(id, survey.title, count, survey.minAggregateSize, true, emptyList())
        val answersByQuestion = answerRepository.findAllByResponseSurveyIdAndDeletedFalse(id).groupBy { it.question?.id }
        val aggregates = questions(survey).map { question ->
            val answers = answersByQuestion[question.id].orEmpty()
            when (question.questionType) {
                SurveyQuestionType.RATING -> {
                    val values = answers.mapNotNull { it.ratingValue }
                    SurveyQuestionAggregateDto(
                        questionId = requireNotNull(question.id), prompt = question.prompt, questionType = question.questionType,
                        answerCount = values.size.toLong(),
                        averageRating = values.takeIf { it.isNotEmpty() }?.let { BigDecimal(it.sum()).divide(BigDecimal(it.size), 2, RoundingMode.HALF_UP) },
                        ratingDistribution = (1..5).associateWith { rating -> values.count { it == rating }.toLong() },
                    )
                }
                SurveyQuestionType.SINGLE_CHOICE -> {
                    val values = answers.mapNotNull { it.optionValue }
                    val total = values.size.coerceAtLeast(1)
                    SurveyQuestionAggregateDto(
                        questionId = requireNotNull(question.id), prompt = question.prompt, questionType = question.questionType,
                        answerCount = values.size.toLong(),
                        options = options(question).map { option ->
                            val optionCount = values.count { it == option }.toLong()
                            SurveyOptionAggregateDto(option, optionCount, BigDecimal(optionCount * 100).divide(BigDecimal(total), 2, RoundingMode.HALF_UP))
                        },
                    )
                }
            }
        }
        return SurveyResultsDto(id, survey.title, count, survey.minAggregateSize, false, aggregates)
    }

    private fun validateRequest(request: CreateSurveyRequest) {
        require(request.title.isNotBlank() && request.title.trim().length <= 500) { "So'rov nomi majburiy va 500 belgidan oshmasligi kerak" }
        require(request.description.length <= 2000) { "Tavsif 2000 belgidan oshmasligi kerak" }
        require(request.startsAt.isBefore(request.endsAt)) { "Boshlanish tugashdan oldin bo'lishi kerak" }
        require(request.endsAt.isAfter(Instant.now())) { "Tugash vaqti kelajakda bo'lishi kerak" }
        require(request.minAggregateSize in 5..100) { "Minimal agregat guruh hajmi 5 dan 100 gacha bo'lishi kerak" }
        require(request.questions.isNotEmpty() && request.questions.size <= 50) { "So'rovda 1 dan 50 tagacha savol bo'lishi kerak" }
        request.questions.forEach { item ->
            require(item.prompt.isNotBlank() && item.prompt.trim().length <= 1000) { "Savol matni majburiy va 1000 belgidan oshmasligi kerak" }
            normalizeOptions(item)
        }
    }

    private fun normalizeOptions(item: CreateSurveyQuestionRequest): List<String> {
        val values = item.options.map { it.trim() }
        when (item.questionType) {
            SurveyQuestionType.RATING -> require(values.isEmpty()) { "Reyting savolida variantlar bo'lmaydi" }
            SurveyQuestionType.SINGLE_CHOICE -> {
                require(values.size in 2..20) { "Tanlov savolida 2 dan 20 tagacha variant bo'lishi kerak" }
                require(values.all { it.isNotBlank() && it.length <= 500 && !it.contains('\n') }) { "Variant bo'sh, juda uzun yoki ko'p qatorli bo'lishi mumkin emas" }
                require(values.distinct().size == values.size) { "Savol variantlari takrorlanmasligi kerak" }
            }
        }
        return values
    }

    private fun survey(id: Long) = surveyRepository.findByIdAndDeletedFalse(id) ?: throw IllegalArgumentException("So'rov topilmadi")
    private fun questions(survey: Survey) = questionRepository.findAllBySurveyIdAndDeletedFalseOrderByPositionAsc(requireNotNull(survey.id))
    private fun options(question: SurveyQuestion) = question.optionValues?.split('\n')?.filter { it.isNotBlank() }.orEmpty()
    private fun accepts(survey: Survey, role: SurveyRespondentRole) = survey.audience == SurveyAudience.BOTH || survey.audience.name == role.name

    private fun respondentHash(survey: Survey, userId: Long): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec((anonymizationSecret + survey.anonymousSalt).toByteArray(StandardCharsets.UTF_8), "HmacSHA256"))
        return HexFormat.of().formatHex(mac.doFinal(userId.toString().toByteArray(StandardCharsets.UTF_8)))
    }

    private fun toDto(
        survey: Survey,
        questions: List<SurveyQuestion>,
        submitted: Boolean? = null,
        responseCount: Long? = null,
    ) = SurveyDto(
        id = requireNotNull(survey.id), title = survey.title, description = survey.description,
        audience = survey.audience, status = survey.status, startsAt = survey.startsAt, endsAt = survey.endsAt,
        minAggregateSize = survey.minAggregateSize,
        questions = questions.map { SurveyQuestionDto(requireNotNull(it.id), it.prompt, it.questionType, options(it), it.required, it.position) },
        submitted = submitted, responseCount = responseCount,
    )
}
