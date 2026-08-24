package uz.scorm.lms.app.v1.rereading.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.rereading.model.ReReadingApplication
import uz.scorm.lms.app.v1.rereading.model.ReReadingPlan

interface ReReadingPlanRepository : JpaRepository<ReReadingPlan, Long> {
    fun findAllByDeletedFalseOrderByApplicationDeadlineDesc(): List<ReReadingPlan>
    fun findByIdAndDeletedFalse(id: Long): ReReadingPlan?
}

interface ReReadingApplicationRepository : JpaRepository<ReReadingApplication, Long> {
    @EntityGraph(attributePaths = ["plan", "student"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<ReReadingApplication>

    @EntityGraph(attributePaths = ["plan", "student"])
    fun findByIdAndDeletedFalse(id: Long): ReReadingApplication?

    fun existsByPlanIdAndStudentIdAndDeletedFalse(planId: Long, studentId: Long): Boolean
}
