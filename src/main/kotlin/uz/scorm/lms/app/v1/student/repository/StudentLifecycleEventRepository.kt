package uz.scorm.lms.app.v1.student.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEvent
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType

interface StudentLifecycleEventRepository : JpaRepository<StudentLifecycleEvent, Long> {
    fun findAllByStudentIdOrderByEffectiveDateDescRecordedAtDesc(studentId: Long): List<StudentLifecycleEvent>
    fun existsByStudentIdAndEventTypeAndOrderNumber(studentId: Long, eventType: StudentLifecycleEventType, orderNumber: String): Boolean
    fun countByEventType(eventType: StudentLifecycleEventType): Long
}
