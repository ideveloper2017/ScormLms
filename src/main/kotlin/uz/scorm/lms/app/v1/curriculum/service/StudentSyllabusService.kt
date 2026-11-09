package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.courses.service.CourseContentAssetService
import uz.scorm.lms.app.v1.courses.service.CourseContentDownload
import uz.scorm.lms.app.v1.courses.service.SyllabusQuizSync
import uz.scorm.lms.app.v1.curriculum.model.StudentSyllabusProgress
import uz.scorm.lms.app.v1.curriculum.repository.StudentSyllabusProgressRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository

data class StudentLessonMaterialDto(
    val id: Long,
    val topicId: Long,
    val position: Int?,
    val title: String,
    val description: String?,
    val contentType: String,
    val contentUrl: String?,
    val contentBody: String?,
    val asset: CourseContentAssetDto?,
    val authorName: String,
    val languageCode: String,
    val sourceName: String,
    val contentVersion: String,
    val durationSeconds: Int? = null,
)

data class StudentLessonQuizDto(
    val id: Long,
    val topicId: Long,
    val kind: String,
    val title: String,
    val questionCount: Int,
    val durationMinutes: Int,
    val allowedAttempts: Int,
    val passingPercentage: Int,
)

data class StudentSyllabusLessonsDto(
    val syllabusId: Long,
    val materials: List<StudentLessonMaterialDto>,
    val quizzes: List<StudentLessonQuizDto>,
    val completedMaterialIds: List<Long>,
)

/**
 * Talaba fanni kurssiz, tasdiqlangan o'quv dasturidan o'qiydi: dars materiallari, testlar ro'yxati va bajarganlari.
 * Ruxsat — dastur talabaning o'quv rejasidagi fanga biriktirilgan va tasdiqlangan bo'lsa.
 */
@Service
class StudentSyllabusService(
    private val curriculum: StudentCurriculumService,
    private val students: StudentRepository,
    private val materials: SubjectMaterialRepository,
    private val quizzes: SyllabusLessonQuizRepository,
    private val quizSync: SyllabusQuizSync,
    private val progress: StudentSyllabusProgressRepository,
    private val assets: CourseContentAssetService,
    private val media: uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaService,
) {
    /** Dastur muqovasi/videosi — faqat talabaning rejasidagi tasdiqlangan dastur */
    fun media(userId: Long, syllabusId: Long, kind: uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind) =
        topicIdsOf(userId, syllabusId).let { media.open(syllabusId, kind) }

    @Transactional(readOnly = true)
    fun lessons(userId: Long, syllabusId: Long): StudentSyllabusLessonsDto {
        val topicIds = topicIdsOf(userId, syllabusId)
        val items = materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(topicIds).filter { it.active }
        val studentId = studentId(userId)
        val done = if (items.isEmpty()) emptyList()
            else progress.findAllByStudentIdAndMaterialIdIn(studentId, items.mapNotNull { it.id }).map { it.materialId }
        return StudentSyllabusLessonsDto(
            syllabusId = syllabusId,
            materials = items.map(::materialDto),
            quizzes = quizzes.findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(topicIds).map {
                StudentLessonQuizDto(requireNotNull(it.id), requireNotNull(it.topic.id), it.kind.name, it.title,
                    quizSync.questionsOf(it).size, it.durationMinutes, it.allowedAttempts, it.passingPercentage)
            },
            completedMaterialIds = done,
        )
    }

    @Transactional
    fun complete(userId: Long, syllabusId: Long, materialId: Long): List<Long> {
        material(userId, syllabusId, materialId)
        val studentId = studentId(userId)
        if (!progress.existsByStudentIdAndMaterialId(studentId, materialId)) progress.save(StudentSyllabusProgress(studentId, materialId))
        return lessons(userId, syllabusId).completedMaterialIds
    }

    @Transactional(readOnly = true)
    fun file(userId: Long, syllabusId: Long, materialId: Long): CourseContentDownload {
        val asset = material(userId, syllabusId, materialId).asset ?: throw NoSuchElementException("Materialga fayl biriktirilmagan")
        return assets.open(asset)
    }

    private fun material(userId: Long, syllabusId: Long, materialId: Long): SubjectMaterial {
        val topicIds = topicIdsOf(userId, syllabusId)
        return materials.findById(materialId)
            .filter { !it.deleted && it.active && it.syllabusTopic?.id in topicIds }
            .orElseThrow { NoSuchElementException("Material topilmadi: $materialId") }
    }

    /** Dastur talabaning o'quv rejasida va tasdiqlangan — uning darslari */
    private fun topicIdsOf(userId: Long, syllabusId: Long): Set<Long> {
        val syllabus = curriculum.mine(userId).syllabi.firstOrNull { it.id == syllabusId }
            ?: throw NoSuchElementException("O'quv dasturi topilmadi yoki sizning rejangizda emas")
        return syllabus.topics.mapNotNull { it.id }.toSet()
    }

    private fun studentId(userId: Long) = requireNotNull(students.findByUserId(userId)?.id) { "Talaba kartasi topilmadi" }

    private fun materialDto(item: SubjectMaterial) = StudentLessonMaterialDto(
        id = requireNotNull(item.id), topicId = requireNotNull(item.syllabusTopic?.id), position = item.topicPosition,
        title = item.title, description = item.description, contentType = item.contentType.name.lowercase(),
        contentUrl = item.contentUrl, contentBody = item.contentBody, asset = item.asset?.let(assets::toDto),
        authorName = item.authorName, languageCode = item.languageCode, sourceName = item.sourceName,
        contentVersion = item.contentVersion, durationSeconds = item.durationSeconds,
    )
}
