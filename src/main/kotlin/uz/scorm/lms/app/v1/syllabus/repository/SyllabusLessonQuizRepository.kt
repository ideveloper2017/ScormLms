package uz.scorm.lms.app.v1.syllabus.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.courses.repository.TopicMaterialCount
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLessonQuiz

interface SyllabusLessonQuizRepository : JpaRepository<SyllabusLessonQuiz, Long> {
    @EntityGraph(attributePaths = ["topic"])
    fun findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(topicIds: Collection<Long>): List<SyllabusLessonQuiz>

    @Query(
        "select q.topic.id as topicId, count(q) as total from SyllabusLessonQuiz q " +
            "where q.topic.id in :topicIds and q.deleted = false group by q.topic.id"
    )
    fun countByTopics(@Param("topicIds") topicIds: Collection<Long>): List<TopicMaterialCount>
}
