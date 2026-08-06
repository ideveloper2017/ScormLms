package uz.scorm.lms.app.v1.quiz.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.quiz.dto.QuizAnswerRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizResultDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringChallengeDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringVerificationDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchResponse
import uz.scorm.lms.app.v1.quiz.dto.StartQuizResponse
import uz.scorm.lms.app.v1.quiz.dto.StudentQuizDetailsDto
import uz.scorm.lms.app.v1.quiz.dto.SubmitQuizRequest
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.quiz.service.ProctoringService
import uz.scorm.lms.app.v1.quiz.service.ProctoringEventService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/tests")
class QuizController(
    private val quizService: QuizService,
    private val proctoringService: ProctoringService,
    private val proctoringEventService: ProctoringEventService,
) {
    @GetMapping("/{quizId}")
    fun details(@PathVariable quizId: Long, @CurrentUser user: User): ApiResponse<StudentQuizDetailsDto> =
        ApiResponse.success(quizService.details(quizId, requireNotNull(user.id)))

    @PostMapping("/{quizId}/start")
    fun start(@PathVariable quizId: Long, @CurrentUser user: User): ApiResponse<StartQuizResponse> =
        ApiResponse.success(StartQuizResponse(quizService.start(quizId, requireNotNull(user.id))))

    @PostMapping("/{quizId}/proctoring/challenge")
    fun proctoringChallenge(
        @PathVariable quizId: Long,
        @CurrentUser user: User,
    ): ApiResponse<ProctoringChallengeDto> = ApiResponse.success(
        proctoringService.issueChallenge(quizId, requireNotNull(user.id))
    )

    @PostMapping("/{quizId}/proctoring/{sessionId}/verify", consumes = ["multipart/form-data"])
    fun verifyProctoringChallenge(
        @PathVariable quizId: Long,
        @PathVariable sessionId: Long,
        @RequestParam nonce: String,
        @RequestParam centerFrame: MultipartFile,
        @RequestParam challengeFrame: MultipartFile,
        @CurrentUser user: User,
    ): ApiResponse<ProctoringVerificationDto> {
        requireImage(centerFrame, "centerFrame")
        requireImage(challengeFrame, "challengeFrame")
        return ApiResponse.success(
            proctoringService.verify(
                quizId = quizId,
                sessionId = sessionId,
                userId = requireNotNull(user.id),
                nonce = nonce,
                centerFrame = centerFrame.bytes,
                challengeFrame = challengeFrame.bytes,
            )
        )
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/proctoring/events")
    fun recordProctoringEvents(
        @PathVariable quizId: Long,
        @PathVariable attemptId: Long,
        @RequestBody request: ProctoringEventBatchRequest,
        @CurrentUser user: User,
    ): ApiResponse<ProctoringEventBatchResponse> = ApiResponse.success(
        proctoringEventService.recordClientEvents(
            quizId = quizId,
            attemptId = attemptId,
            userId = requireNotNull(user.id),
            request = request,
        )
    )

    @PostMapping("/{quizId}/questions/{questionId}/answer")
    fun answer(
        @PathVariable quizId: Long,
        @PathVariable questionId: Long,
        @RequestBody request: QuizAnswerRequest,
        @CurrentUser user: User,
    ): ApiResponse<Unit> {
        quizService.saveAnswer(quizId, questionId, requireNotNull(user.id), request.answer)
        return ApiResponse.success("Javob saqlandi", Unit)
    }

    @PostMapping("/{quizId}/submit")
    fun submit(
        @PathVariable quizId: Long,
        @RequestBody request: SubmitQuizRequest,
        @CurrentUser user: User,
    ): ApiResponse<QuizResultDto> = ApiResponse.success(
        quizService.submit(quizId, requireNotNull(user.id), request.answers)
    )

    @GetMapping("/{quizId}/results")
    fun result(@PathVariable quizId: Long, @CurrentUser user: User): ApiResponse<QuizResultDto> =
        ApiResponse.success(quizService.result(quizId, requireNotNull(user.id)))

    private fun requireImage(file: MultipartFile, field: String) {
        require(!file.isEmpty) { "$field bo'sh" }
        require(file.contentType in setOf("image/jpeg", "image/png", "image/webp")) {
            "$field faqat JPEG, PNG yoki WebP bo'lishi mumkin"
        }
    }
}
