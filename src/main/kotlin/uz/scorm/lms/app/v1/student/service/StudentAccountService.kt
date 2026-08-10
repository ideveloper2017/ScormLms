package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.student.dto.StudentAccountAccessRequest
import uz.scorm.lms.app.v1.student.dto.StudentCredentialSetupRequest
import uz.scorm.lms.app.v1.student.dto.StudentSummaryDto
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.service.UserService

@Service
class StudentAccountService(
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val userService: UserService,
    private val auditService: AuditService,
) {
    @Transactional
    fun setupCredentials(studentId: Long, request: StudentCredentialSetupRequest, actorId: Long): StudentSummaryDto {
        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        userService.initializePassword(student.user, request.newPassword)
        student.user.status = if (student.studentStatus == StudentStatus.ACTIVE) UserStatus.ACTIVE else UserStatus.INACTIVE
        val saved = studentRepository.save(student)
        auditService.logAction(
            "STUDENT_ACCOUNT_CREDENTIALS_INITIALIZED",
            actorId,
            "student=$studentId; accountStatus=${student.user.status}",
        )
        return studentService.toSummary(saved)
    }

    @Transactional
    fun changeAccess(studentId: Long, request: StudentAccountAccessRequest, actorId: Long): StudentSummaryDto {
        val reason = request.reason.trim()
        require(reason.length in 5..500) { "Akkaunt holatini o'zgartirish sababi 5-500 belgi bo'lishi shart" }

        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        val previous = student.user.status
        val target = if (request.enabled) {
            require(student.user.credentialsInitialized) { "Avval talaba akkaunti uchun parol o'rnatilishi kerak" }
            require(student.studentStatus == StudentStatus.ACTIVE) {
                "Faqat akademik holati ACTIVE bo'lgan talaba akkaunti qayta yoqiladi"
            }
            UserStatus.ACTIVE
        } else {
            UserStatus.BLOCKED
        }
        require(previous != target) { "Talaba akkaunti allaqachon ${target.name} holatida" }

        student.user.status = target
        val saved = studentRepository.save(student)
        val safeReason = reason.replace(Regex("[\\r\\n]+"), " ")
        auditService.logAction(
            if (request.enabled) "STUDENT_ACCOUNT_ENABLED" else "STUDENT_ACCOUNT_BLOCKED",
            actorId,
            "student=$studentId; ${previous.name}->${target.name}; reason=$safeReason",
        )
        return studentService.toSummary(saved)
    }
}
