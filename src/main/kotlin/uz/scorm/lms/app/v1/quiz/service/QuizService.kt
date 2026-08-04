package uz.scorm.lms.app.v1.quiz.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
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
        ))
        quizQuestionRepository.saveAll(questions.mapIndexed { index, question ->
            CourseQuizQuestion(quiz, question, index + 1)
        })
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
        val enrollment = enrollment(quiz, userId, allowCompleted = false)
        val inProgress = attemptRepository.findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollment.id!!,
            QuizAttemptStatus.IN_PROGRESS,
        )
        if (inProgress != null && now.isBefore(inProgress.expiresAt) && now.isBefore(quiz.closesAt)) {
            return sessionDto(inProgress)
        }
        if (inProgress != null) finalizeAttempt(inProgress, timedOut = true)

        val attempts = attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            quizId,
            enrollment.id!!,
        )
        require(attempts.size < quiz.allowedAttempts) { "Ruxsat etilgan urinishlar tugagan" }
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(quizId)
        require(links.isNotEmpty()) { "Test savollari topilmadi" }
        val ids = links.map { it.question.id!! }.let { if (quiz.shuffleQuestions) it.shuffled() else it }
        val expiresAt = minOf(now.plus(Duration.ofMinutes(quiz.durationMinutes.toLong())), quiz.closesAt)
        val attempt = attemptRepository.save(QuizAttempt(
            quiz = quiz,
            enrollment = enrollment,
            attemptNumber = (attempts.maxOfOrNull { it.attemptNumber } ?: 0) + 1,
            startedAt = now,
            expiresAt = expiresAt,
            questionOrder = ids.joinToString(","),
            totalPoints = links.sumOf { it.question.points },
        ))
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
    fun saveAnswer(quizId: Long, questionId: Long, userId: Long, answer: String) {
        val quiz = quiz(quizId)
        val enrollment = enrollment(quiz, userId, allowCompleted = false)
        val attempt = activeAttempt(quizId, enrollment.id!!)
        requireSubmissionOpen(attempt)
        saveAnswer(attempt, questionId, answer)
    }

    @Transactional
    fun submit(quizId: Long, userId: Long, answers: List<QuizAnswerItemRequest>): QuizResultDto {
        val quiz = quiz(quizId)
        val enrollment = enrollment(quiz, userId, allowCompleted = false)
        val attempt = activeAttempt(quizId, enrollment.id!!)
        requireSubmissionOpen(attempt)
        answers.forEach { item ->
            val questionId = item.questionId.toLongOrNull()
                ?: throw IllegalArgumentException("Savol identifikatori yaroqsiz")
            saveAnswer(attempt, questionId, item.answer)
        }
        val finalized = finalizeAttempt(attempt, timedOut = Instant.now().isAfter(attempt.expiresAt))
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
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(attempt.quiz.id!!)
        val question = links.firstOrNull { it.question.id == questionId }?.question
            ?: throw IllegalArgumentException("Savol ushbu testga tegishli emas")
        val answerText = rawAnswer.trim()
        val correct = answerText.isNotEmpty() && normalized(answerText) == normalized(question.correctAnswer)
        val entity = answerRepository.findByAttemptIdAndQuestionIdAndDeletedFalse(attempt.id!!, questionId)
            ?: QuizAnswer(attempt, question, answerText)
        entity.answer = answerText
        entity.correct = correct
        entity.awardedPoints = if (correct) question.points else 0
        entity.answeredAt = Instant.now()
        answerRepository.save(entity)
    }

    private fun finalizeAttempt(attempt: QuizAttempt, timedOut: Boolean): QuizAttempt {
        if (attempt.status != QuizAttemptStatus.IN_PROGRESS) return attempt
        val links = quizQuestionRepository.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(attempt.quiz.id!!)
        val answers = answerRepository.findAllByAttemptIdAndDeletedFalseOrderByIdAsc(attempt.id!!)
        val total = links.sumOf { it.question.points }
        val score = answers.sumOf { it.awardedPoints }.coerceAtMost(total)
        val percentage = if (total == 0) 0.0 else score * 100.0 / total
        val now = Instant.now()
        attempt.score = score
        attempt.totalPoints = total
        attempt.percentage = percentage
        attempt.passed = percentage + 1e-9 >= attempt.quiz.passingPercentage
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
            allowedAttempts = quiz.allowedAttempts,
            passingPercentage = quiz.passingPercentage,
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
            questionCount = links.size,
            totalPoints = links.sumOf { it.question.points },
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
            questions = ids.mapNotNull { links[it]?.question }.map(::studentQuestionDto),
        )
    }

    private fun studentQuestionDto(question: QuizQuestion) = StudentQuizQuestionDto(
        id = question.id.toString(),
        type = when (question.type) {
            QuizQuestionType.SINGLE_CHOICE -> "multiple-choice"
            QuizQuestionType.TRUE_FALSE -> "true-false"
            QuizQuestionType.SHORT_ANSWER -> "short-answer"
        },
        text = question.text,
        points = question.points,
        options = options(question).takeIf { it.isNotEmpty() },
    )

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

    private fun normalized(value: String): String = value.trim().lowercase().replace(Regex("\\s+"), " ")
}
