package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial

interface SubjectMaterialRepository : JpaRepository<SubjectMaterial, Long> {
    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findAllBySubjectIdInAndActiveTrueAndDeletedFalseOrderByUpdatedAtDesc(subjectIds: Collection<Long>): List<SubjectMaterial>

    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findAllByActiveTrueAndDeletedFalseOrderByUpdatedAtDesc(): List<SubjectMaterial>

    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findByIdAndActiveTrueAndDeletedFalse(id: Long): SubjectMaterial?
}
