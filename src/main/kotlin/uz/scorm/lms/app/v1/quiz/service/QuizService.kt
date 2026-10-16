package uz.scorm.lms.app.v1.quiz.service

import tools.jackson.core.type.TypeReference
import tools.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.service.LearningActivityService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.quiz.dto.QuizAnswerItemRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizHistoryDto
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionDto
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizResultDto
import uz.scorm.lms.app.v1.quiz.dto.QuizSessionDto
import uz.scorm.lms.app.v1.quiz.dto.StudentQuizDetailsDto
import uz.scorm.lms.app.v1.quiz.dto.StudentQuizQuestionDto
import uz.scorm.lms.app.v1.quiz.dto.TeacherQuizAttemptDto
import uz.scorm.lms.app.v1.quiz.dto.TeacherQuizDto
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizAnswer
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAnswerRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizQuestionRepository
import uz.scorm.lms.app.v1.student.dto.StudentTestDto
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import kotlin.math.roundToInt

@Service
class QuizService(
    private val questionRepository: QuizQuestionRepository,
    private val quizRepository: CourseQuizRepository,
    private val quizQuestionRepository: CourseQuizQuestionRepository,
    private val attemptRepository: QuizAttemptRepository,
    private val answerRepository: QuizAnswerRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studentRepository: StudentRepository,
    private val courseAccessService: CourseAccessService,
    private val objectMapper: ObjectMapper,
    private val learningActivityService: LearningActivityService,
    private val proctoringService: ProctoringService,
    private val quizProctorAssignmentService: QuizProctorAssignmentService,
) {
    private val listType = object : TypeReference<List<String>>() {}

    @Transactional(readOnly = true)
    fun teacherQuestions(userId: Long, mayManageAll: Boolean, courseId: Long?): List<QuizQuestionDto> {
        if (courseId != null) courseAccessService.requireManage(courseId, userId, mayManageAll)
        val questions = when {
            courseId != null -> questionRepository.findAllByCourseIdAndDeletedFalseOrderByIdDesc(courseId)
            mayManageAll -> questionRepository.findAllByDeletedFalseOrderByIdDesc()
            else -> questionRepository.findAllByCourseUserIdAndDeletedFalseOrderByIdDesc(userId)
        }
        return questions.map(::teacherQuestionDto)
    }

    @Transactional
    fun createQuestion(request: QuizQuestionRequest, userId: Long, mayManageAll: Boolean): QuizQuestionDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        validateQuestion(request)
        val question = QuizQuestion(
            course = course,
            text = request.text.trim(),
            type = request.type,
            difficulty = request.difficulty,
            points = request.points,
            optionsJson = optionsJson(request),
            correctAnswer = request.correctAnswer.trim(),
            explanation = request.explanation?.trim()?.takeIf { it.isNotEmpty() },
        )
        return teacherQuestionDto(questionRepository.save(question))
    }

    @Transactional
    fun updateQuestion(id: Long, request: QuizQuestionRequest, userId: Long, mayManageAll: Boolean): QuizQuestionDto {
        val question = question(id)
        courseAccessService.requireManage(question.course.id!!, userId, mayManageAll)
        require(request.courseId == question.course.id) { "Savol kursini o'zgartirib bo'lmaydi" }
        require(!questionLocked(id)) { "Nashr qilingan testdagi savolni o'zgartirib bo'lmaydi" }
        validateQuestion(request)
        question.text = request.text.trim()
        question.type = request.type
        question.difficulty = request.difficulty
        question.points = request.points
        question.optionsJson = optionsJson(request)
        question.correctAnswer = request.correctAnswer.trim()
        question.explanation = request.explanation?.trim()?.takeIf { it.isNotEmpty() }
        return teacherQuestionDto(questionRepository.save(question))
    }

    @Transactional
    fun deleteQuestion(id: Long, userId: Long, mayManageAll: Boolean) {
        val question = question(id)
        courseAccessService.requireManage(question.course.id!!, userId, mayManageAll)
        require(!questionLocked(id)) { "Nashr qilingan testdagi savolni o'chirib bo'lmaydi" }
        question.deleted = true
        questionRepository.save(question)
    }

    @Transactional(readOnly = true)
    fun teacherQuizzes(userId: Long, mayManageAll: Boolean): List<TeacherQuizDto> {
        val quizzes = if (mayManageAll) quizRepository.findAllByDeletedFalseOrderByOpensAtDesc()
        else quizRepository.findAllByCourseUserIdAndDeletedFalseOrderByOpensAtDesc(userId)
        return quizzes.map(::teacherQuizDto)
    }

    @Transactional
    fun createQuiz(request: QuizRequest, userId: Long, mayManageAll: Boolean): TeacherQuizDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        validateQuiz(request)
        val questions = request.questionIds.distinct().map(::question)
        require(questions.all { it.course.id == course.id }) { "Barcha savollar test kursiga tegishli bo'lishi kerak" }
        val quiz = quizRepository.save(CourseQuiz(
            course = course,
            title = request.title.trim(),
            instructions = request.instructions.trim(),
            opensAt = request.opensAt,
            closesAt = request.closesAt,
            durationMinutes = request.durationMinutes,
            allowedAttempts = request.allowedAttempts,
            passingPercentage = request.passingPercentage,
            shuffleQuestions = request.shuffleQuestions,
            showResult = request.showResult,
            proctoring = request.proctoring,
            status = request.status,
            publishedAt = if (request.status == QuizStatus.PUBLISHED) Instant.now() else null,
            questionsPerAttempt = request.questionsPerAttempt?.takeIf { it < questions.size },
        ))
        quizQuestionRepository.saveAll(questions.mapIndexed { index, question ->
            CourseQuizQuestion(quiz, question, index + 1)
        })
        quizProctorAssignmentService.assignAtCreation(quiz, request.proctorIds)
        return teacherQuizDto(quiz)
    }

    @Transactional
    fun changeStatus(id: Long, status: QuizStatus, userId: Long, mayManageAll: Boolean): TeacherQuizDto {
        val quiz = quiz(id)
        courseAccessService.requireManage(quiz.course.id!!, userId, mayManageAll)
        if (status == QuizStatus.PUBLISHED) {
            require(quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(id).isNotEmpty()) {
                "Savolsiz testni nashr qilib bo'lmaydi"
            }
            if (quiz.status != QuizStatus.PUBLISHED) quiz.publishedAt = Instant.now()
        }
        quiz.status = status
        return teacherQuizDto(quizRepository.save(quiz))
    }

    @Transactional
    fun deleteQuiz(id: Long, userId: Long, mayManageAll: Boolean) {
        val quiz = quiz(id)
        courseAccessService.requireManage(quiz.course.id!!, userId, mayManageAll)
        require(!attemptRepository.existsByQuizIdAndDeletedFalse(id)) { "Urinish mavjud testni o'chirib bo'lmaydi; uni yoping" }
        quiz.deleted = true
        quizRepository.save(quiz)
    }

    @Transactional(readOnly = true)
    fun teacherAttempts(quizId: Long, userId: Long, mayManageAll: Boolean): List<TeacherQuizAttemptDto> {
        val quiz = quiz(quizId)
        courseAccessService.requireManage(quiz.course.id!!, userId, mayManageAll)
        return attemptRepository.findAllByQuizIdAndDeletedFalseOrderByStartedAtDesc(quizId).map(::teacherAttemptDto)
    }

    @Transactional(readOnly = true)
    fun studentQuizzes(userId: Long, status: String? = null, courseId: Long? = null): List<StudentTestDto> {
        val studentId = studentRepository.findByUserId(userId)?.id ?: return emptyList()
        val enrollments = enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            studentId,
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        )
        val enrollmentByCourse = enrollments.associateBy { it.course.id!! }
        if (enrollmentByCourse.isEmpty()) return emptyList()
        return quizRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByOpensAtAsc(
            enrollmentByCourse.keys,
            setOf(QuizStatus.PUBLISHED, QuizStatus.CLOSED),
        ).map { quiz ->
            studentTestDto(quiz, enrollmentByCourse.getValue(quiz.course.id!!).id!!)
        }.filter {
            (status == null || it.status.equals(status, true)) &&
                (courseId == null || it.courseId.toLongOrNull() == courseId)
        }
    }

    @Transactional(readOnly = true)
    fun details(quizId: Long, userId: Long): StudentQuizDetailsDto {
        val quiz = quiz(quizId)
        require(quiz.status != QuizStatus.DRAFT) { "Test hali nashr qilinmagan" }
        val enrollment = enrollment(quiz, userId, allowCompleted = true)
        return studentDetailsDto(quiz, enrollment.id!!)
    }

    @Transactional
    fun start(quizId: Long, userId: Long): QuizSessionDto {
        val quiz = quiz(quizId)
        val now = Instant.now()
        require(quiz.status == QuizStatus.PUBLISHED) { "Test boshlash uchun ochiq emas" }
        require(!now.isBefore(quiz.opensAt) && now.isBefore(quiz.closesAt)) { "Testning vaqt oynasi yopiq" }
        val enrollment = enrollment(quiz, userId, allowCompleted = true)
        val inProgress = attemptRepository.findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollment.id!!,
            QuizAttemptStatus.IN_PROGRESS,
        )
        if (inProgress != null && now.isBefore(inProgress.expiresAt) && now.isBefore(quiz.closesAt)) {
            return sessionDto(inProgress)
        }
        if (inProgress != null) proctoringService.completeAttempt(finalizeAttempt(inProgress, timedOut = true))

        val attempts = attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollment.id!!,
        )
        require(attempts.size < quiz.allowedAttempts) { "Ruxsat etilgan urinishlar tugagan" }
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(quizId)
        require(links.isNotEmpty()) { "Test savollari topilmadi" }
        // Har urinishga bankdan o'z to'plami (questionsPerAttempt), qiyinlik bo'yicha mutanosib.
        val random = java.security.SecureRandom().let { kotlin.random.Random(it.nextLong()) }
        val drawn = QuizQuestionDraw.draw(links.map { it.question }, quiz.questionsPerAttempt, random)
        val ids = drawn.map { it.id!! }.let { if (quiz.shuffleQuestions) it.shuffled(random) else it }
        val expiresAt = minOf(now.plus(Duration.ofMinutes(quiz.durationMinutes.toLong())), quiz.closesAt)
        val attempt = attemptRepository.save(QuizAttempt(
            quiz = quiz,
            enrollment = enrollment,
            attemptNumber = (attempts.maxOfOrNull { it.attemptNumber } ?: 0) + 1,
            startedAt = now,
            expiresAt = expiresAt,
            questionOrder = ids.joinToString(","),
            totalPoints = drawn.sumOf { it.points },
        ))
        proctoringService.consumeRequiredSession(quiz, enrollment, attempt)
        learningActivityService.recordIfEnrolled(
            courseId = quiz.course.id!!,
            userId = userId,
            eventType = LearningActivityType.QUIZ_STARTED,
            sourceType = LearningActivitySource.QUIZ,
            sourceId = quiz.id!!,
        )
        return sessionDto(attempt)
    }

    @Transactional
    fun saveAnswer(quizId: Long, questionId: Long, userId: Long, answer: String, attemptId: Long? = null) {
        val quiz = quiz(quizId)
        val enrollment = enrollment(quiz, userId, allowCompleted = true)
        val attempt = activeAttempt(quizId, enrollment.id!!)
        require(attemptId == null || attempt.id == attemptId) { "Test urinishi o'zgargan; sahifani yangilang" }
        requireSubmissionOpen(attempt)
        saveAnswer(attempt, questionId, answer)
    }

    @Transactional
    fun submit(quizId: Long, userId: Long, answers: List<QuizAnswerItemRequest>): QuizResultDto {
        val quiz = quiz(quizId)
        val enrollment = enrollment(quiz, userId, allowCompleted = true)
        val attempt = activeAttempt(quizId, enrollment.id!!)
        requireSubmissionOpen(attempt)
        answers.forEach { item ->
            val questionId = item.questionId.toLongOrNull()
                ?: throw IllegalArgumentException("Savol identifikatori yaroqsiz")
            saveAnswer(attempt, questionId, item.answer)
        }
        val finalized = finalizeAttempt(attempt, timedOut = Instant.now().isAfter(attempt.expiresAt))
        proctoringService.completeAttempt(finalized)
        learningActivityService.recordIfEnrolled(
            courseId = quiz.course.id!!,
            userId = userId,
            eventType = LearningActivityType.QUIZ_SUBMITTED,
            sourceType = LearningActivitySource.QUIZ,
            sourceId = quiz.id!!,
            durationSeconds = finalized.durationSeconds.coerceAtMost(86_400),
        )
        return resultDto(finalized)
    }

    @Transactional(readOnly = true)
    fun result(quizId: Long, userId: Long): QuizResultDto {
        val quiz = quiz(quizId)
        val enrollment = enrollment(quiz, userId, allowCompleted = true)
        val attempt = attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollment.id!!,
        ).firstOrNull { it.status != QuizAttemptStatus.IN_PROGRESS }
            ?: throw NoSuchElementException("Test natijasi topilmadi")
        return resultDto(attempt)
    }

    @Transactional(readOnly = true)
    fun history(userId: Long): List<QuizHistoryDto> {
        val studentId = studentRepository.findByUserId(userId)?.id ?: return emptyList()
        val courseIds = enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            studentId,
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ).mapNotNull { it.course.id }.toSet()
        if (courseIds.isEmpty()) return emptyList()
        val quizzes = quizRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByOpensAtAsc(
            courseIds,
            setOf(QuizStatus.PUBLISHED, QuizStatus.CLOSED),
        )
        return quizzes.flatMap { quiz ->
            val enrollment = enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
                quiz.course.id!!,
                userId,
                setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
            ) ?: return@flatMap emptyList()
            attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
                quiz.id!!,
                enrollment.id!!,
            ).filter {
                it.status != QuizAttemptStatus.IN_PROGRESS &&
                    (quiz.showResult || !Instant.now().isBefore(quiz.closesAt))
            }.map { attempt ->
                QuizHistoryDto(
                    id = attempt.id.toString(),
                    testId = quiz.id.toString(),
                    testTitle = quiz.title,
                    courseName = quiz.course.title.orEmpty(),
                    score = attempt.score,
                    totalPoints = attempt.totalPoints,
                    percentage = attempt.percentage,
                    passed = attempt.passed,
                    completedAt = requireNotNull(attempt.submittedAt),
                )
            }
        }.sortedByDescending { it.completedAt }
    }

    private fun validateQuestion(request: QuizQuestionRequest) {
        require(request.text.trim().isNotEmpty()) { "Savol matni majburiy" }
        require(request.points in 1..1000) { "Savol balli 1 va 1000 oralig'ida bo'lishi kerak" }
        require(request.correctAnswer.trim().isNotEmpty()) { "To'g'ri javob majburiy" }
        if (request.type == QuizQuestionType.SINGLE_CHOICE) {
            val options = request.options.map(String::trim).filter(String::isNotEmpty).distinct()
            require(options.size >= 2) { "Tanlovli savolda kamida 2 variant bo'lishi kerak" }
            require(options.any { normalized(it) == normalized(request.correctAnswer) }) {
                "To'g'ri javob variantlardan biri bo'lishi kerak"
            }
        }
        if (request.type == QuizQuestionType.TRUE_FALSE) {
            require(normalized(request.correctAnswer) in setOf("true", "false")) {
                "Ha/yo'q savolining javobi true yoki false bo'lishi kerak"
            }
        }
    }

    private fun validateQuiz(request: QuizRequest) {
        require(request.title.trim().isNotEmpty()) { "Test nomi majburiy" }
        require(request.opensAt.isBefore(request.closesAt)) { "Test ochilish va yopilish vaqti noto'g'ri" }
        require(request.durationMinutes in 1..1440) { "Test davomiyligi 1 va 1440 daqiqa oralig'ida bo'lishi kerak" }
        require(request.allowedAttempts in 1..20) { "Urinishlar soni 1 va 20 oralig'ida bo'lishi kerak" }
        require(request.passingPercentage in 0..100) { "O'tish foizi 0 va 100 oralig'ida bo'lishi kerak" }
        require(request.questionIds.isNotEmpty()) { "Testga kamida bitta savol tanlang" }
        require(request.questionsPerAttempt == null || request.questionsPerAttempt in 1..request.questionIds.distinct().size) {
            "Har talabaga tushadigan savollar soni 1 va tanlangan savollar soni oralig'ida bo'lishi kerak"
        }
        require(request.proctoring || request.proctorIds.isEmpty()) { "Proktorlar faqat proktoring yoqilganda tanlanadi" }
    }

    private fun question(id: Long): QuizQuestion = questionRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Savol topilmadi: $id")

    private fun quiz(id: Long): CourseQuiz = quizRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Test topilmadi: $id")

    private fun questionLocked(id: Long) = quizQuestionRepository.existsByQuestionIdAndQuizStatusInAndDeletedFalse(
        id,
        setOf(QuizStatus.PUBLISHED, QuizStatus.CLOSED),
    )

    private fun enrollment(quiz: CourseQuiz, userId: Long, allowCompleted: Boolean) =
        enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            quiz.course.id!!,
            userId,
            if (allowCompleted) setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)
            else setOf(CourseEnrollmentStatus.ACTIVE),
        ) ?: throw IllegalArgumentException("Test kursiga faol biriktirish talab qilinadi")

    private fun activeAttempt(quizId: Long, enrollmentId: Long): QuizAttempt =
        attemptRepository.findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollmentId,
            QuizAttemptStatus.IN_PROGRESS,
        ) ?: throw IllegalArgumentException("Faol test urinish topilmadi")

    private fun requireSubmissionOpen(attempt: QuizAttempt) {
        val now = Instant.now()
        require(!now.isAfter(attempt.expiresAt.plusSeconds(30)) && !now.isAfter(attempt.quiz.closesAt.plusSeconds(30))) {
            "Test vaqti tugagan"
        }
    }

    private fun saveAnswer(attempt: QuizAttempt, questionId: Long, rawAnswer: String) {
        // Faqat shu urinishga tushgan savolga javob qabul qilinadi (bankdan tanlangan to'plam).
        val question = attemptQuestions(attempt).firstOrNull { it.id == questionId }
            ?: throw IllegalArgumentException("Savol ushbu test urinishiga tegishli emas")
        val answerText = rawAnswer.trim()
        val correct = isCorrect(question, answerText)
        val entity = answerRepository.findByAttemptIdAndQuestionIdAndDeletedFalse(attempt.id!!, questionId)
            ?: QuizAnswer(attempt, question, answerText)
        entity.answer = answerText
        entity.correct = correct
        entity.awardedPoints = if (correct) question.points else 0
        entity.answeredAt = Instant.now()
        answerRepository.save(entity)
    }

    /**
     * Muddati o'tib tashlab ketilgan urinishni yopadi ([QuizAttemptExpiryWorker] chaqiradi). Saqlangan
     * javoblar hisoblanadi, qolgan savollar 0 — talaba sahifaga qaytmasa ham natija vedomostga tushadi.
     */
    @Transactional
    fun closeExpiredAttempt(attempt: QuizAttempt): QuizAttempt {
        if (attempt.status != QuizAttemptStatus.IN_PROGRESS) return attempt
        val closed = finalizeAttempt(attempt, timedOut = true)
        proctoringService.completeAttempt(closed)
        return closed
    }

    /**
     * Urinishga tushgan savollar (questionOrder tartibida). Eski urinishlarda tartib bo'sh bo'lsa —
     * testning barcha savollari (bank tanlovi joriy qilinishidan oldingi xatti-harakat).
     */
    /**
     * Javob to'g'rimi — avtomatik baholashning yagona qoidasi (saqlash va qayta baholashda).
     * Qisqa javobda o'qituvchi `|` bilan bir nechta to'g'ri variant beradi: "6 N|6N|6 nyuton".
     */
    internal fun isCorrect(question: QuizQuestion, answer: String): Boolean {
        val given = answer.trim()
        if (given.isEmpty()) return false
        val accepted = if (question.type == QuizQuestionType.SHORT_ANSWER) question.correctAnswer.split('|')
            else listOf(question.correctAnswer)
        return accepted.map(::normalized).filter { it.isNotEmpty() }.any { it == normalized(given) }
    }

    internal fun questionsOf(attempt: QuizAttempt): List<QuizQuestion> = attemptQuestions(attempt)

    internal fun optionsOf(question: QuizQuestion): List<String> = options(question)

    /** Javoblar o'zgargach (qayta/qo'lda baholash) urinish ballini qayta yig'ib saqlaydi. */
    internal fun recalculateAndSave(attempt: QuizAttempt): QuizAttempt {
        recalculate(attempt)
        return attemptRepository.save(attempt)
    }

    /** Kalit tuzatishda ham savol yaratishdagi tekshiruvlar qo'llanadi. */
    internal fun validateKey(request: QuizQuestionRequest) = validateQuestion(request)

    internal fun optionsJsonFor(request: QuizQuestionRequest): String? = optionsJson(request)

    private fun attemptQuestions(attempt: QuizAttempt): List<QuizQuestion> {
        val linked = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(attempt.quiz.id!!)
            .associate { it.question.id!! to it.question }
        val ids = attempt.questionOrder.split(',').mapNotNull { it.trim().toLongOrNull() }
        return if (ids.isEmpty()) linked.values.toList() else ids.mapNotNull { linked[it] }
    }

    /**
     * Urinish ballini javoblardan qayta yig'adi — yakunlashda, kalit tuzatilganda va qo'lda baholashda
     * bir xil qoida. Faqat urinishga tushgan savollar hisobga olinadi.
     */
    private fun recalculate(attempt: QuizAttempt) {
        val questions = attemptQuestions(attempt)
        val ids = questions.mapNotNull { it.id }.toSet()
        val total = questions.sumOf { it.points }
        val score = answerRepository.findAllByAttemptIdAndDeletedFalseOrderByIdAsc(attempt.id!!)
            .filter { it.question.id in ids }
            .sumOf { it.awardedPoints }.coerceIn(0, total)
        val percentage = if (total == 0) 0.0 else score * 100.0 / total
        attempt.score = score
        attempt.totalPoints = total
        attempt.percentage = percentage
        attempt.passed = percentage + 1e-9 >= attempt.quiz.passingPercentage
    }

    private fun finalizeAttempt(attempt: QuizAttempt, timedOut: Boolean): QuizAttempt {
        if (attempt.status != QuizAttemptStatus.IN_PROGRESS) return attempt
        recalculate(attempt)
        val now = Instant.now()
        attempt.submittedAt = now
        attempt.durationSeconds = Duration.between(attempt.startedAt, minOf(now, attempt.expiresAt))
            .seconds.coerceAtLeast(0).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
        attempt.status = if (timedOut) QuizAttemptStatus.TIMED_OUT else QuizAttemptStatus.SUBMITTED
        return attemptRepository.save(attempt)
    }

    private fun optionsJson(request: QuizQuestionRequest): String? = when (request.type) {
        QuizQuestionType.SINGLE_CHOICE -> objectMapper.writeValueAsString(
            request.options.map(String::trim).filter(String::isNotEmpty).distinct()
        )
        QuizQuestionType.TRUE_FALSE -> objectMapper.writeValueAsString(listOf("true", "false"))
        QuizQuestionType.SHORT_ANSWER -> null
    }

    private fun options(question: QuizQuestion): List<String> = question.optionsJson
        ?.let { objectMapper.readValue(it, listType) }
        ?: emptyList()

    private fun teacherQuestionDto(question: QuizQuestion) = QuizQuestionDto(
        id = question.id.toString(),
        courseId = question.course.id.toString(),
        courseTitle = question.course.title.orEmpty(),
        text = question.text,
        type = question.type.name,
        difficulty = question.difficulty.name,
        points = question.points,
        options = options(question),
        correctAnswer = question.correctAnswer,
        explanation = question.explanation,
    )

    private fun teacherQuizDto(quiz: CourseQuiz): TeacherQuizDto {
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(quiz.id!!)
        val attempts = attemptRepository.findAllByQuizIdAndDeletedFalseOrderByStartedAtDesc(quiz.id!!)
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
        val now = Instant.now()
        return TeacherQuizDto(
            id = quiz.id.toString(),
            title = quiz.title,
            courseTitle = quiz.course.title.orEmpty(),
            courseId = quiz.course.id.toString(),
            date = quiz.opensAt,
            duration = quiz.durationMinutes,
            questions = links.size,
            totalPoints = links.sumOf { it.question.points },
            questionsPerAttempt = quiz.questionsPerAttempt,
            allowedAttempts = quiz.allowedAttempts,
            passingPercentage = quiz.passingPercentage,
            proctoring = quiz.proctoring,
            proctorIds = quizProctorAssignmentService.assignedUserIds(requireNotNull(quiz.id)).map(Long::toString).toSet(),
            status = when {
                quiz.status == QuizStatus.DRAFT -> "draft"
                quiz.status == QuizStatus.CLOSED || !now.isBefore(quiz.closesAt) -> "completed"
                now.isBefore(quiz.opensAt) -> "upcoming"
                else -> "active"
            },
            avgScore = attempts.takeIf { it.isNotEmpty() }?.map { it.percentage }?.average()?.roundToInt(),
            participants = attempts.map { it.enrollment.id }.distinct().size,
        )
    }

    private fun studentTestDto(quiz: CourseQuiz, enrollmentId: Long): StudentTestDto {
        val attempts = attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            quiz.id!!,
            enrollmentId,
        )
        val latest = attempts.firstOrNull()
        val finishedAttempts = attempts.count { it.status != QuizAttemptStatus.IN_PROGRESS }
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(quiz.id!!)
        // Bankdan tanlov bo'lsa talabaga tushadigan savollar soni; ball — o'rtacha savol balli bo'yicha.
        val perAttempt = quiz.questionsPerAttempt?.coerceAtMost(links.size) ?: links.size
        val expectedPoints = if (links.isEmpty()) 0
            else (links.sumOf { it.question.points }.toDouble() * perAttempt / links.size).roundToInt()
        val local = quiz.opensAt.atZone(ZoneId.systemDefault())
        val endLocal = quiz.closesAt.atZone(ZoneId.systemDefault())
        val now = Instant.now()
        return StudentTestDto(
            id = quiz.id.toString(),
            title = quiz.title,
            courseId = quiz.course.id.toString(),
            courseName = quiz.course.title.orEmpty(),
            date = local.toLocalDate().toString(),
            startTime = local.toLocalTime().withSecond(0).withNano(0).toString(),
            endTime = endLocal.toLocalTime().withSecond(0).withNano(0).toString(),
            duration = quiz.durationMinutes,
            questionCount = perAttempt,
            totalPoints = expectedPoints,
            proctoring = quiz.proctoring,
            status = when {
                latest?.status == QuizAttemptStatus.IN_PROGRESS && now.isBefore(latest.expiresAt) -> "in-progress"
                latest?.status != null && latest.status != QuizAttemptStatus.IN_PROGRESS &&
                    (finishedAttempts >= quiz.allowedAttempts || quiz.status == QuizStatus.CLOSED || !now.isBefore(quiz.closesAt)) -> "completed"
                latest?.status != null && latest.status != QuizAttemptStatus.IN_PROGRESS -> "upcoming"
                quiz.status == QuizStatus.CLOSED || !now.isBefore(quiz.closesAt) -> "missed"
                else -> "upcoming"
            },
            score = latest?.takeIf { it.status != QuizAttemptStatus.IN_PROGRESS }?.percentage?.roundToInt(),
        )
    }

    private fun studentDetailsDto(quiz: CourseQuiz, enrollmentId: Long): StudentQuizDetailsDto {
        val base = studentTestDto(quiz, enrollmentId)
        val attempts = attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            quiz.id!!,
            enrollmentId,
        )
        return StudentQuizDetailsDto(
            id = base.id,
            title = base.title,
            courseId = base.courseId,
            courseName = base.courseName,
            date = quiz.opensAt,
            startTime = base.startTime,
            endTime = base.endTime,
            duration = base.duration,
            questionCount = base.questionCount,
            totalPoints = base.totalPoints,
            proctoring = base.proctoring,
            status = base.status,
            score = base.score,
            instructions = quiz.instructions,
            allowedAttempts = quiz.allowedAttempts,
            attemptsUsed = attempts.count { it.status != QuizAttemptStatus.IN_PROGRESS },
            passingScore = quiz.passingPercentage,
        )
    }

    private fun sessionDto(attempt: QuizAttempt): QuizSessionDto {
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(attempt.quiz.id!!)
            .associateBy { it.question.id!! }
        val ids = attempt.questionOrder.split(',').mapNotNull(String::toLongOrNull)
        return QuizSessionDto(
            id = attempt.id.toString(),
            testId = attempt.quiz.id.toString(),
            startedAt = attempt.startedAt,
            expiresAt = attempt.expiresAt,
            questions = ids.mapNotNull { links[it]?.question }.map { studentQuestionDto(it, attempt) },
            answers = answerRepository.findAllByAttemptIdAndDeletedFalseOrderByIdAsc(requireNotNull(attempt.id))
                .associate { it.question.id.toString() to it.answer },
        )
    }

    private fun studentQuestionDto(question: QuizQuestion, attempt: QuizAttempt) = StudentQuizQuestionDto(
        id = question.id.toString(),
        type = when (question.type) {
            QuizQuestionType.SINGLE_CHOICE -> "multiple-choice"
            QuizQuestionType.TRUE_FALSE -> "true-false"
            QuizQuestionType.SHORT_ANSWER -> "short-answer"
        },
        text = question.text,
        points = question.points,
        options = options(question)
            .let { if (attempt.quiz.shuffleQuestions && question.type == QuizQuestionType.SINGLE_CHOICE) optionOrder(it, attempt, question) else it }
            .takeIf { it.isNotEmpty() },
    )

    /**
     * Javob variantlari har urinish uchun o'z tartibida — "to'g'ri javob — C" deb uzatib bo'lmasin.
     * Tartib urinish va savol ID'sidan hosil qilinadi: sahifa yangilansa ham o'zgarmaydi, bazaga yozilmaydi.
     * Baholash javob MATNI bo'yicha, shuning uchun tartib natijaga ta'sir qilmaydi.
     */
    internal fun optionOrder(options: List<String>, attempt: QuizAttempt, question: QuizQuestion): List<String> =
        options.shuffled(java.util.Random(requireNotNull(attempt.id) * 1_000_003L + requireNotNull(question.id)))

    private fun resultDto(attempt: QuizAttempt): QuizResultDto {
        val hidden = !attempt.quiz.showResult && Instant.now().isBefore(attempt.quiz.closesAt)
        return QuizResultDto(
            id = attempt.id.toString(),
            testId = attempt.quiz.id.toString(),
            score = if (hidden) 0 else attempt.score,
            totalPoints = attempt.totalPoints,
            percentage = if (hidden) 0.0 else attempt.percentage,
            passed = !hidden && attempt.passed,
            submittedAt = requireNotNull(attempt.submittedAt),
            proctoring = attempt.quiz.proctoring,
            feedback = if (hidden) "Natija test oynasi yopilgandan keyin ko'rsatiladi" else null,
        )
    }

    private fun teacherAttemptDto(attempt: QuizAttempt) = TeacherQuizAttemptDto(
        id = attempt.id.toString(),
        quizId = attempt.quiz.id.toString(),
        studentName = attempt.enrollment.student.user.fullName
            ?: "${attempt.enrollment.student.lastName} ${attempt.enrollment.student.firstName}",
        attemptNumber = attempt.attemptNumber,
        status = attempt.status.name.lowercase(),
        score = attempt.score,
        totalPoints = attempt.totalPoints,
        percentage = attempt.percentage,
        passed = attempt.passed,
        startedAt = attempt.startedAt,
        submittedAt = attempt.submittedAt,
        durationSeconds = attempt.durationSeconds,
    )

    /**
     * Javobni solishtirish uchun shakl: katta-kichik harf, ortiqcha bo'shliq va o'zbek lotin alifbosidagi
     * apostrof variantlari (o' / o‘ / oʻ / o’, g' / g‘ / gʻ) farq qilmaydi — klaviaturaga qarab har xil
     * yoziladi va to'g'ri javob noto'g'ri deb baholanardi.
     */
    internal fun normalized(value: String): String = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFC)
        .trim().lowercase()
        .replace(APOSTROPHES, "'")
        .replace(Regex("\\s+"), " ")

    private companion object {
        val APOSTROPHES = Regex("[ʻʼ‘’`´ʹ′]")
    }
}
