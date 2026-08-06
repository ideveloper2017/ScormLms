package uz.scorm.lms.app.v1.quiz.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionDto
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizStatusRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizProctorAssignmentDto
import uz.scorm.lms.app.v1.quiz.dto.QuizProctorAssignmentRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizProctorCandidateDto
import uz.scorm.lms.app.v1.quiz.dto.TeacherQuizAttemptDto
import uz.scorm.lms.app.v1.quiz.dto.TeacherQuizDto
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.quiz.service.QuizProctorAssignmentService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/teachers/me")
@PreAuthorize("hasAuthority('COURSE_WRITE')")
class TeacherQuizController(
    private val quizService: QuizService,
    private val quizProctorAssignmentService: QuizProctorAssignmentService,
) {
    @GetMapping("/proctors")
    fun proctorCandidates(): List<QuizProctorCandidateDto> = quizProctorAssignmentService.candidates()

    @GetMapping("/questions")
    fun questions(
        @RequestParam(required = false) courseId: Long?,
        @CurrentUser user: User,
        authentication: Authentication,
    ): List<QuizQuestionDto> = quizService.teacherQuestions(
        requireNotNull(user.id),
        mayManageAll(authentication),
        courseId,
    )

    @PostMapping("/questions")
    fun createQuestion(
        @RequestBody request: QuizQuestionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<QuizQuestionDto> = ResponseEntity.status(HttpStatus.CREATED).body(
        quizService.createQuestion(request, requireNotNull(user.id), mayManageAll(authentication))
    )

    @PutMapping("/questions/{questionId}")
    fun updateQuestion(
        @PathVariable questionId: Long,
        @RequestBody request: QuizQuestionRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): QuizQuestionDto = quizService.updateQuestion(
        questionId,
        request,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @DeleteMapping("/questions/{questionId}")
    fun deleteQuestion(
        @PathVariable questionId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        quizService.deleteQuestion(questionId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/tests")
    fun quizzes(@CurrentUser user: User, authentication: Authentication): List<TeacherQuizDto> =
        quizService.teacherQuizzes(requireNotNull(user.id), mayManageAll(authentication))

    @PostMapping("/tests")
    fun createQuiz(
        @RequestBody request: QuizRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<TeacherQuizDto> = ResponseEntity.status(HttpStatus.CREATED).body(
        quizService.createQuiz(request, requireNotNull(user.id), mayManageAll(authentication))
    )

    @PatchMapping("/tests/{quizId}/status")
    fun changeStatus(
        @PathVariable quizId: Long,
        @RequestBody request: QuizStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): TeacherQuizDto = quizService.changeStatus(
        quizId,
        request.status,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @DeleteMapping("/tests/{quizId}")
    fun deleteQuiz(
        @PathVariable quizId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        quizService.deleteQuiz(quizId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/tests/{quizId}/attempts")
    fun attempts(
        @PathVariable quizId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): List<TeacherQuizAttemptDto> = quizService.teacherAttempts(
        quizId,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @GetMapping("/tests/{quizId}/proctors")
    fun assignedProctors(
        @PathVariable quizId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): QuizProctorAssignmentDto = quizProctorAssignmentService.assignments(
        quizId,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    @PutMapping("/tests/{quizId}/proctors")
    fun updateProctors(
        @PathVariable quizId: Long,
        @RequestBody request: QuizProctorAssignmentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): QuizProctorAssignmentDto = quizProctorAssignmentService.update(
        quizId,
        request.userIds,
        requireNotNull(user.id),
        mayManageAll(authentication),
    )

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
