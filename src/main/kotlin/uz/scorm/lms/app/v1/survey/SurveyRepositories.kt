package uz.scorm.lms.app.v1.survey

import org.springframework.data.jpa.repository.JpaRepository

interface SurveyRepository : JpaRepository<Survey, Long> {
    fun countByDeletedFalse(): Long
    fun findByIdAndDeletedFalse(id: Long): Survey?
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<Survey>
}

interface SurveyQuestionRepository : JpaRepository<SurveyQuestion, Long> {
    fun findAllBySurveyIdAndDeletedFalseOrderByPositionAsc(surveyId: Long): List<SurveyQuestion>
}

interface SurveyResponseRepository : JpaRepository<SurveyResponse, Long> {
    fun existsBySurveyIdAndRespondentHashAndDeletedFalse(surveyId: Long, respondentHash: String): Boolean
    fun countBySurveyIdAndDeletedFalse(surveyId: Long): Long
}

interface SurveyAnswerRepository : JpaRepository<SurveyAnswer, Long> {
    fun findAllByResponseSurveyIdAndDeletedFalse(surveyId: Long): List<SurveyAnswer>
}
