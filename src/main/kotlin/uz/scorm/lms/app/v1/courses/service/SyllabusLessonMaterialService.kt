package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialRequest
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository

/** Dars kontentini kiritish: material nomi, turi va mazmuni (matn, havola, fayl yoki URL) */
data class SyllabusLessonMaterialRequest(
    val title: String,
    val description: String? = null,
    val contentType: CourseContentType,
    val contentUrl: String? = null,
    val contentBody: String? = null,
    val assetId: Long? = null,
)

/** Dars kontenti va shu o'zgarish bilan moslangan qoralama kurslar */
data class SyllabusLessonMaterialsDto(val materials: List<SubjectMaterialDto>, val courses: List<SyllabusLinkedCourseDto>)

/**
 * O'quv dasturi darsining kontenti (Everest: Dasturlar -> modul -> dars -> resurslar). Material fan bankida
 * saqlanadi va darsga bog'lanadi; dasturdan kurs yaratilganda va sinxronlashda kurs darsiga ko'chadi.
 * Faqat qoralama dasturda tahrirlanadi; har o'zgarishdan keyin bog'langan qoralama kurslar moslanadi.
 */
@Service
class SyllabusLessonMaterialService(
    private val syllabi: SubjectSyllabusRepository,
    private val materials: SubjectMaterialRepository,
    private val materialService: SubjectMaterialService,
    private val assetService: CourseContentAssetService,
    private val courseSyllabusService: CourseSyllabusService,
) {
    @Transactional(readOnly = true)
    fun list(syllabusId: Long, topicId: Long): List<SubjectMaterialDto> {
        val syllabus = syllabi.findByIdAndDeletedFalse(syllabusId) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $syllabusId")
        topic(syllabus, topicId)
        return lessonMaterials(topicId)
    }

    @Transactional
    fun upload(syllabusId: Long, file: MultipartFile, userId: Long): CourseContentAssetDto =
        assetService.uploadForSubject(draft(syllabusId).subject, file, userId)

    @Transactional
    fun create(syllabusId: Long, topicId: Long, request: SyllabusLessonMaterialRequest, userId: Long): SyllabusLessonMaterialsDto {
        val syllabus = draft(syllabusId)
        val topic = topic(syllabus, topicId)
        val position = (materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(topicId))
            .maxOfOrNull { it.topicPosition ?: 0 } ?: 0) + 1
        materials.save(materialService.build(syllabus.subject, bankRequest(syllabus, request), userId).apply {
            syllabusTopic = topic
            topicPosition = position
        })
        return changed(syllabusId, topicId)
    }

    @Transactional
    fun update(syllabusId: Long, topicId: Long, materialId: Long, request: SyllabusLessonMaterialRequest): SyllabusLessonMaterialsDto {
        val syllabus = draft(syllabusId)
        topic(syllabus, topicId)
        materialService.change(lessonMaterial(topicId, materialId), bankRequest(syllabus, request))
        return changed(syllabusId, topicId)
    }

    /** Darsdan olib tashlanadi; kursdagi nusxasi sinxronlashda o'chiriladi */
    @Transactional
    fun delete(syllabusId: Long, topicId: Long, materialId: Long): SyllabusLessonMaterialsDto {
        topic(draft(syllabusId), topicId)
        lessonMaterial(topicId, materialId).apply {
            deleted = true
            active = false
        }
        return changed(syllabusId, topicId)
    }

    @Transactional
    fun reorder(syllabusId: Long, topicId: Long, materialIds: List<Long>): SyllabusLessonMaterialsDto {
        topic(draft(syllabusId), topicId)
        val current = materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(topicId))
        require(materialIds.size == current.size && materialIds.toSet() == current.mapNotNull { it.id }.toSet()) {
            "Tartib darsning barcha materiallarini o'z ichiga olishi kerak"
        }
        materialIds.forEachIndexed { index, id -> current.first { it.id == id }.topicPosition = index + 1 }
        return changed(syllabusId, topicId)
    }

    private fun changed(syllabusId: Long, topicId: Long): SyllabusLessonMaterialsDto {
        materials.flush()
        return SyllabusLessonMaterialsDto(lessonMaterials(topicId), courseSyllabusService.syncDraftCourses(syllabusId))
    }

    private fun lessonMaterials(topicId: Long) =
        materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(topicId)).map(materialService::toDto)

    private fun lessonMaterial(topicId: Long, materialId: Long) =
        materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(topicId)).firstOrNull { it.id == materialId }
            ?: throw NoSuchElementException("Material ushbu darsga tegishli emas: $materialId")

    private fun draft(syllabusId: Long): SubjectSyllabus {
        val syllabus = syllabi.lockById(syllabusId) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $syllabusId")
        require(syllabus.status == "DRAFT") { "Dars kontenti faqat qoralama dasturda tahrirlanadi. Avval yangi versiya oching." }
        return syllabus
    }

    private fun topic(syllabus: SubjectSyllabus, topicId: Long) =
        syllabus.topics.firstOrNull { it.id == topicId } ?: throw NoSuchElementException("Dars ushbu dasturga tegishli emas: $topicId")

    private fun bankRequest(syllabus: SubjectSyllabus, request: SyllabusLessonMaterialRequest) = SubjectMaterialRequest(
        subjectId = requireNotNull(syllabus.subject.id), title = request.title, description = request.description,
        contentType = request.contentType, contentUrl = request.contentUrl, contentBody = request.contentBody,
        assetId = request.assetId,
        languageCode = when (syllabus.language) {
            SyllabusLanguage.RU -> "ru"
            SyllabusLanguage.EN -> "en"
            else -> "uz"
        },
    )
}
