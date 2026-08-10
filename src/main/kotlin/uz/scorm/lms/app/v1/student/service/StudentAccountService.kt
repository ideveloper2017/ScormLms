package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.student.dto.StudentAccountAccessRequest
import uz.scorm.lms.app.v1.student.dto.StudentSummaryDto
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.UserStatus

@Service
class StudentAccountService(
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val auditService: AuditService,
) {
    @Transactional
    fun changeAccess(studentId: Long, request: StudentAccountAccessRequest, actorId: Long): StudentSummaryDto {
        val reason = request.reason.trim()
        require(reason.length in 5..500) { "Akkaunt holatini o'zgartirish sababi 5-500 belgi bo'lishi shart" }

        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        val previous = student.user.status
        val target = if (request.enabled) {
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
