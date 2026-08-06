package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.quiz.dto.QuizProctorAssignmentDto
import uz.scorm.lms.app.v1.quiz.dto.QuizProctorCandidateDto
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizProctor
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizProctorRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository

@Service
class QuizProctorAssignmentService(
    private val assignmentRepository: CourseQuizProctorRepository,
    private val quizRepository: CourseQuizRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
) {
    @Transactional(readOnly = true)
    fun candidates(): List<QuizProctorCandidateDto> = userRepository
        .findAllByRoleNameIgnoreCaseAndStatusAndDeletedFalseOrderByFullNameAsc("proctor", UserStatus.ACTIVE)
        .map(::candidate)

    @Transactional(readOnly = true)
    fun assignments(quizId: Long, managerId: Long, mayManageAll: Boolean): QuizProctorAssignmentDto {
        val quiz = quiz(quizId)
        courseAccessService.requireManage(quiz.course.id, managerId, mayManageAll)
        return dto(quiz)
    }

    @Transactional
    fun update(
        quizId: Long,
        userIds: Set<Long>,
        managerId: Long,
        mayManageAll: Boolean,
    ): QuizProctorAssignmentDto {
        val quiz = quiz(quizId)
        courseAccessService.requireManage(quiz.course.id, managerId, mayManageAll)
        require(quiz.proctoring || userIds.isEmpty()) { "Proktor faqat proktoring yoqilgan testga biriktiriladi" }
        replace(quiz, userIds)
        return dto(quiz)
    }

    @Transactional
    fun assignAtCreation(quiz: CourseQuiz, userIds: Set<Long>) {
        require(quiz.proctoring || userIds.isEmpty()) { "Proktor faqat proktoring yoqilgan testga biriktiriladi" }
        replace(quiz, userIds)
    }

    @Transactional(readOnly = true)
    fun assignedUserIds(quizId: Long): Set<Long> = assignmentRepository
        .findAllByQuizIdAndDeletedFalse(quizId)
        .mapNotNull { it.user.id }
        .toSet()

    private fun replace(quiz: CourseQuiz, requestedIds: Set<Long>) {
        val ids = requestedIds.toSet()
        val users = ids.map { id ->
            userRepository.findById(id).orElseThrow { IllegalArgumentException("Proktor topilmadi: $id") }
        }
        require(users.all {
            !it.deleted && it.status == UserStatus.ACTIVE && it.role?.name.equals("proctor", ignoreCase = true)
        }) { "Faqat faol PROCTOR foydalanuvchisi biriktiriladi" }

        val existing = assignmentRepository.findAllByQuizId(requireNotNull(quiz.id)).associateBy { it.user.id }
        existing.values.forEach { assignment -> assignment.deleted = assignment.user.id !in ids }
        users.forEach { user ->
            val assignment = existing[user.id] ?: CourseQuizProctor(quiz, user)
            assignment.deleted = false
            assignmentRepository.save(assignment)
        }
        assignmentRepository.saveAll(existing.values)
    }

    private fun dto(quiz: CourseQuiz) = QuizProctorAssignmentDto(
        quizId = requireNotNull(quiz.id).toString(),
        proctors = assignmentRepository.findAllByQuizIdAndDeletedFalseOrderByUserFullNameAsc(requireNotNull(quiz.id))
            .map { candidate(it.user) },
    )

    private fun candidate(user: uz.scorm.lms.app.v1.user.model.User) = QuizProctorCandidateDto(
        id = requireNotNull(user.id).toString(),
        username = user.username,
        fullName = user.fullName?.takeIf(String::isNotBlank) ?: user.username,
    )

    private fun quiz(id: Long): CourseQuiz = quizRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Test topilmadi: $id")
}
