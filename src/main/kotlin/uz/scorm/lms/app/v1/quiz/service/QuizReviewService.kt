package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicresult.service.CourseScorePolicy
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.quiz.dto.AnswerKeyRequest
import uz.scorm.lms.app.v1.quiz.dto.ManualGradeRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizAttemptReviewDto
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizReviewItemDto
import uz.scorm.lms.app.v1.quiz.dto.RegradeResultDto
import uz.scorm.lms.app.v1.quiz.model.QuizAnswer
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAnswerRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizQuestionRepository
import java.time.Instant

/**
 * Test natijalarini tekshirish va tuzatish:
 *  - kalitni tuzatish va qayta baholash — avval nashr qilingan testdagi noto'g'ri kalitni umuman tuzatib
 *    bo'lmasdi (savol qulflangan), talabalar noto'g'ri baholangancha qolardi;
 *  - o'qituvchi urinishni savolma-savol ko'radi va javobga qo'lda ball/izoh qo'yadi;
 *  - talaba test TUGAGACH (boshqalar hali topshirayotganda javoblar oshkor bo'lmasin) xatolarini ko'radi.
 */
@Service
class QuizReviewService(
    private val quizService: QuizService,
    private val questionRepository: QuizQuestionRepository,
    private val quizRepository: uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository,
    private val quizQuestionRepository: CourseQuizQuestionRepository,
    private val attemptRepository: QuizAttemptRepository,
    private val answerRepository: QuizAnswerRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {
    @Transactional
    fun updateAnswerKey(questionId: Long, request: AnswerKeyRequest, userId: Long, mayManageAll: Boolean): RegradeResultDto {
        val question = questionRepository.findByIdAndDeletedFalse(questionId)
            ?: throw NoSuchElementException("Savol topilmadi: $questionId")
        courseAccessService.requireManage(question.course.id!!, userId, mayManageAll)

        val options = request.options.takeIf { it.isNotEmpty() } ?: quizService.optionsOf(question)
        val asRequest = QuizQuestionRequest(
            courseId = question.course.id!!,
            text = question.text,
            type = question.type,
            difficulty = question.difficulty,
            points = request.points ?: question.points,
            options = options,
            correctAnswer = request.correctAnswer,
            explanation = request.explanation ?: question.explanation,
        )
        quizService.validateKey(asRequest)
        val before = "key=${question.correctAnswer}; points=${question.points}"
        question.correctAnswer = asRequest.correctAnswer.trim()
        question.points = asRequest.points
        if (question.type == QuizQuestionType.SINGLE_CHOICE) question.optionsJson = quizService.optionsJsonFor(asRequest)
        question.explanation = asRequest.explanation?.trim()?.takeIf { it.isNotEmpty() }
        questionRepository.save(question)

        var regraded = 0
        var manualKept = 0
        val answers = answerRepository.findAllByQuestionIdAndDeletedFalse(questionId)
        answers.forEach { answer ->
            if (answer.manuallyGraded) {
                // O'qituvchi qo'ygan ball saqlanadi — faqat yangi maksimaldan oshmasin.
                answer.awardedPoints = answer.awardedPoints.coerceAtMost(question.points)
                manualKept++
            } else {
                answer.correct = quizService.isCorrect(question, answer.answer)
                answer.awardedPoints = if (answer.correct) question.points else 0
                regraded++
            }
        }
        answerRepository.saveAll(answers)

        // Ball o'zgarsa javob berilmagan urinishlarning ham umumiy bali o'zgaradi — savol ishlatilgan
        // testlarning barcha yakunlangan urinishlari qayta yig'iladi (davom etayotgani yakunda hisoblanadi).
        val quizIds = quizQuestionRepository.findAllByQuestionIdAndDeletedFalse(questionId).mapNotNull { it.quiz.id }.toSet()
        var recalculated = 0
        var changed = 0
        quizIds.flatMap { attemptRepository.findAllByQuizIdAndDeletedFalseOrderByStartedAtDesc(it) }
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
            .filter { attempt -> quizService.questionsOf(attempt).any { it.id == questionId } }
            .forEach { attempt ->
                val previous = attempt.percentage
                quizService.recalculateAndSave(attempt)
                recalculated++
                if (kotlin.math.abs(previous - attempt.percentage) > 1e-9) changed++
            }

        auditService.logAction(
            "QUIZ_ANSWER_KEY_CORRECTED", userId,
            "question=$questionId; before=[$before]; after=[key=${question.correctAnswer}; points=${question.points}]; " +
                "regraded=$regraded; manualKept=$manualKept; attempts=$recalculated; changed=$changed",
        )
        return RegradeResultDto(questionId.toString(), regraded, manualKept, recalculated, changed)
    }

    @Transactional(readOnly = true)
    fun teacherAttemptReview(quizId: Long, attemptId: Long, userId: Long, mayManageAll: Boolean): QuizAttemptReviewDto {
        val attempt = managedAttempt(quizId, attemptId, userId, mayManageAll)
        return review(attempt)
    }

    @Transactional
    fun gradeAnswer(
        quizId: Long,
        attemptId: Long,
        questionId: Long,
        request: ManualGradeRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): QuizAttemptReviewDto {
        val attempt = managedAttempt(quizId, attemptId, userId, mayManageAll)
        require(attempt.status != QuizAttemptStatus.IN_PROGRESS) { "Yakunlanmagan urinishni baholab bo'lmaydi" }
        val question = quizService.questionsOf(attempt).firstOrNull { it.id == questionId }
            ?: throw IllegalArgumentException("Savol ushbu urinishga tegishli emas")
        require(request.points in 0..question.points) { "Ball 0 va ${question.points} oralig'ida bo'lishi kerak" }
        val comment = request.comment?.trim()?.takeIf { it.isNotEmpty() }
        require(comment == null || comment.length <= 2000) { "Izoh 2000 belgidan oshmasligi kerak" }

        val answer = answerRepository.findByAttemptIdAndQuestionIdAndDeletedFalse(attemptId, questionId)
            ?: QuizAnswer(attempt, question, "")
        val previous = answer.awardedPoints
        answer.awardedPoints = request.points
        answer.correct = request.points == question.points
        answer.manuallyGraded = true
        answer.graderComment = comment
        answer.gradedById = userId
        answer.gradedAt = Instant.now()
        answerRepository.save(answer)
        quizService.recalculateAndSave(attempt)
        auditService.logAction(
            "QUIZ_ANSWER_MANUALLY_GRADED", userId,
            "quiz=$quizId; attempt=$attemptId; question=$questionId; points=$previous->${request.points}",
        )
        return review(attempt)
    }

    /**
     * Talaba o'z urinishini savolma-savol ko'radi — faqat test tugagach (yopilish vaqti o'tgan yoki o'qituvchi
     * yopgan): ochiq paytda to'g'ri javoblar hali topshirayotganlarga tarqalmasin.
     */
    @Transactional(readOnly = true)
    fun studentReview(quizId: Long, userId: Long, attemptId: Long?): QuizAttemptReviewDto {
        val attempts = finishedAttemptsOf(quizId, userId)
        val attempt = if (attemptId != null) attempts.firstOrNull { it.id == attemptId }
            ?: throw NoSuchElementException("Test urinishi topilmadi")
        else attempts.firstOrNull() ?: throw NoSuchElementException("Yakunlangan test urinishi topilmadi")
        require(CourseScorePolicy.isOver(attempt.quiz, Instant.now())) {
            "Javoblar tahlili test yopilgandan keyin ko'rsatiladi"
        }
        return review(attempt)
    }

    private fun finishedAttemptsOf(quizId: Long, userId: Long): List<QuizAttempt> {
        val quizCourseId = quizRepository.findByIdAndDeletedFalse(quizId)?.course?.id
            ?: throw NoSuchElementException("Test topilmadi: $quizId")
        val enrollment = enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            quizCourseId, userId, setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ) ?: throw IllegalArgumentException("Test kursiga faol biriktirish talab qilinadi")
        return attemptRepository.findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(quizId, enrollment.id!!)
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
    }

    private fun managedAttempt(quizId: Long, attemptId: Long, userId: Long, mayManageAll: Boolean): QuizAttempt {
        val attempt = attemptRepository.findByIdAndDeletedFalse(attemptId)
            ?: throw NoSuchElementException("Test urinishi topilmadi: $attemptId")
        require(attempt.quiz.id == quizId) { "Urinish ushbu testga tegishli emas" }
        courseAccessService.requireManage(attempt.quiz.course.id!!, userId, mayManageAll)
        return attempt
    }

    private fun review(attempt: QuizAttempt): QuizAttemptReviewDto {
        val answers = answerRepository.findAllByAttemptIdAndDeletedFalseOrderByIdAsc(attempt.id!!)
            .associateBy { it.question.id }
        val items = quizService.questionsOf(attempt).mapIndexed { index, question ->
            val answer = answers[question.id]
            QuizReviewItemDto(
                questionId = question.id.toString(),
                position = index + 1,
                text = question.text,
                type = question.type.name,
                points = question.points,
                options = quizService.optionsOf(question).takeIf { it.isNotEmpty() },
                answer = answer?.answer?.takeIf { it.isNotEmpty() },
                correctAnswer = question.correctAnswer,
                correct = answer?.correct == true,
                awardedPoints = answer?.awardedPoints ?: 0,
                manuallyGraded = answer?.manuallyGraded == true,
                graderComment = answer?.graderComment,
                explanation = question.explanation,
            )
        }
        val student = attempt.enrollment.student
        return QuizAttemptReviewDto(
            attemptId = attempt.id.toString(),
            quizId = attempt.quiz.id.toString(),
            quizTitle = attempt.quiz.title,
            studentName = student.user.fullName ?: "${student.lastName} ${student.firstName}",
            attemptNumber = attempt.attemptNumber,
            status = attempt.status.name.lowercase(),
            score = attempt.score,
            totalPoints = attempt.totalPoints,
            percentage = attempt.percentage,
            passed = attempt.passed,
            submittedAt = attempt.submittedAt,
            items = items,
        )
    }
}
