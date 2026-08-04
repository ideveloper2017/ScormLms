package uz.scorm.lms.app.v1.quiz.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.quiz.dto.QuizAnswerRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizResultDto
import uz.scorm.lms.app.v1.quiz.dto.StartQuizResponse
import uz.scorm.lms.app.v1.quiz.dto.StudentQuizDetailsDto
import uz.scorm.lms.app.v1.quiz.dto.SubmitQuizRequest
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/tests")
class QuizController(
    private val quizService: QuizService,
) {
    @GetMapping("/{quizId}")
    fun details(@PathVariable quizId: Long, @CurrentUser user: User): ApiResponse<StudentQuizDetailsDto> =
        ApiResponse.success(quizService.details(quizId, requireNotNull(user.id)))

    @PostMapping("/{quizId}/start")
    fun start(@PathVariable quizId: Long, @CurrentUser user: User): ApiResponse<StartQuizResponse> =
        ApiResponse.success(StartQuizResponse(quizService.start(quizId, requireNotNull(user.id))))

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
}
