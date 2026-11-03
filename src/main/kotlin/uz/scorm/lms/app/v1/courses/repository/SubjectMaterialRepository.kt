package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial

interface SubjectMaterialRepository : JpaRepository<SubjectMaterial, Long> {
    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findAllBySubjectIdInAndActiveTrueAndDeletedFalseOrderByUpdatedAtDesc(subjectIds: Collection<Long>): List<SubjectMaterial>

    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findAllByActiveTrueAndDeletedFalseOrderByUpdatedAtDesc(): List<SubjectMaterial>

    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject"])
    fun findByIdAndActiveTrueAndDeletedFalse(id: Long): SubjectMaterial?

    /** O'quv dasturi darslarining kontenti, dars ichidagi tartibda */
    @EntityGraph(attributePaths = ["subject", "asset", "asset.course", "asset.subject", "syllabusTopic"])
    fun findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(topicIds: Collection<Long>): List<SubjectMaterial>

    @Query(
        "select m.syllabusTopic.id as topicId, count(m) as total from SubjectMaterial m " +
            "where m.syllabusTopic.id in :topicIds and m.deleted = false group by m.syllabusTopic.id"
    )
    fun countBySyllabusTopics(@Param("topicIds") topicIds: Collection<Long>): List<TopicMaterialCount>
}

interface TopicMaterialCount {
    val topicId: Long
    val total: Long
}
