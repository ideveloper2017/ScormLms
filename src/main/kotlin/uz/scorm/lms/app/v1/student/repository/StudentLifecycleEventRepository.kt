package uz.scorm.lms.app.v1.student.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEvent
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType

interface StudentLifecycleEventRepository : JpaRepository<StudentLifecycleEvent, Long> {
    fun findAllByStudentIdOrderByEffectiveDateDescRecordedAtDesc(studentId: Long): List<StudentLifecycleEvent>
    fun existsByStudentIdAndEventTypeAndOrderNumber(studentId: Long, eventType: StudentLifecycleEventType, orderNumber: String): Boolean
    fun countByEventType(eventType: StudentLifecycleEventType): Long

    @EntityGraph(attributePaths = ["student", "student.user", "toProgram"])
    @Query("""
        select event from StudentLifecycleEvent event
        where event.eventType = :eventType
          and event.id = (
              select max(latest.id) from StudentLifecycleEvent latest
              where latest.student.id = event.student.id and latest.eventType = :eventType
          )
          and (
              :search = ''
              or lower(event.student.studentNumber) like concat('%', :search, '%')
              or lower(event.student.lastName) like concat('%', :search, '%')
              or lower(event.student.firstName) like concat('%', :search, '%')
              or lower(coalesce(event.student.middleName, '')) like concat('%', :search, '%')
          )
          and (:academicYear is null or event.student.academicYear = :academicYear)
    """)
    fun findLatestReinstatements(
        @Param("eventType") eventType: StudentLifecycleEventType,
        @Param("search") search: String,
        @Param("academicYear") academicYear: String?,
        pageable: Pageable,
    ): Page<StudentLifecycleEvent>
}
