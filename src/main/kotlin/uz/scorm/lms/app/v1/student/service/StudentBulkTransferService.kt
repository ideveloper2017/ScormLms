package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.student.dto.StudentBulkTransferItemDto
import uz.scorm.lms.app.v1.student.dto.StudentBulkTransferRequest
import uz.scorm.lms.app.v1.student.dto.StudentBulkTransferResultDto
import uz.scorm.lms.app.v1.student.dto.StudentLifecycleRequest
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.repository.StudentRepository

@Service
class StudentBulkTransferService(
    private val studentRepository: StudentRepository,
    private val lifecycleService: StudentLifecycleService,
    private val auditService: AuditService,
) {
    @Transactional
    fun transfer(request: StudentBulkTransferRequest, actorId: Long): StudentBulkTransferResultDto {
        require(request.studentIds.size in 2..MAX_BATCH_SIZE) {
            "Ommaviy ko'chirish uchun 2-$MAX_BATCH_SIZE ta talaba tanlanishi shart"
        }
        require(request.studentIds.all { it > 0 }) { "Talaba ID qiymatlari musbat bo'lishi shart" }
        require(request.studentIds.distinct().size == request.studentIds.size) {
            "Ommaviy ko'chirish ro'yxatida takroriy talaba mavjud"
        }
        val orderedIds = request.studentIds.sorted()
        val locked = studentRepository.findAllByIdForUpdate(orderedIds)
        val foundIds = locked.mapNotNull { it.id }.toSet()
        val missingIds = orderedIds.filterNot(foundIds::contains)
        require(missingIds.isEmpty()) { "Talaba topilmadi: ${missingIds.joinToString(",")}" }

        val command = StudentLifecycleRequest(
            eventType = StudentLifecycleEventType.TRANSFER,
            orderNumber = request.orderNumber,
            orderDate = request.orderDate,
            effectiveDate = request.effectiveDate,
            legalBasis = request.legalBasis,
            reason = request.reason,
            targetProgramId = request.targetProgramId,
            targetGroupId = request.targetGroupId,
            academicYear = request.academicYear,
        )
        orderedIds.forEach { studentId ->
            try {
                lifecycleService.validateTransferCandidate(studentId, command)
            } catch (error: IllegalArgumentException) {
                throw IllegalArgumentException("Talaba $studentId: ${error.message}", error)
            }
        }
        val items = orderedIds.map { studentId ->
            val result = try {
                lifecycleService.transition(studentId, command, actorId)
            } catch (error: IllegalArgumentException) {
                throw IllegalArgumentException("Talaba $studentId: ${error.message}", error)
            }
            StudentBulkTransferItemDto(
                studentId = studentId,
                studentNumber = result.student.studentNumber,
                studentName = result.student.fullName,
                studentStatus = requireNotNull(result.student.studentStatus),
                eventId = result.event.id,
                fromProgramId = result.event.fromProgramId,
                toProgramId = result.event.toProgramId,
                fromGroupId = result.event.fromGroupId,
                toGroupId = result.event.toGroupId,
            )
        }
        auditService.logAction(
            "STUDENT_BULK_TRANSFER_COMPLETED",
            actorId,
            "count=${items.size}; order=${request.orderNumber.trim()}; program=${request.targetProgramId}; group=${request.targetGroupId}",
        )
        return StudentBulkTransferResultDto(
            orderNumber = request.orderNumber.trim(),
            processedCount = items.size,
            targetProgramId = request.targetProgramId,
            targetGroupId = request.targetGroupId,
            items = items,
        )
    }

    companion object {
        const val MAX_BATCH_SIZE = 200
    }
}
