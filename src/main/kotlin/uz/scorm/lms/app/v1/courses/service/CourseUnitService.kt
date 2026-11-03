package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseUnitDto
import uz.scorm.lms.app.v1.courses.dto.CourseUnitRequest
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
import java.time.Instant

/**
 * Kurs modullari (modul -> dars -> material). Dastur modulidan yaratilganlari dastur bilan sinxronlanadi
 * ([CourseSyllabusService]); o'qituvchi dasturda yo'q qo'shimcha modul ham qo'sha oladi.
 */
@Service
class CourseUnitService(
    private val unitRepository: CourseUnitRepository,
    private val moduleRepository: CourseModuleRepository,
    private val accessService: CourseAccessService,
) {
    @Transactional(readOnly = true)
    fun list(courseId: Long, userId: Long, mayManageAll: Boolean): List<CourseUnitDto> {
        accessService.requireRead(courseId, userId, mayManageAll)
        val lessons = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        return unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId).map { unit ->
            toDto(unit, lessons.filter { it.unit?.id == unit.id })
        }
    }

    @Transactional
    fun create(courseId: Long, request: CourseUnitRequest, userId: Long, mayManageAll: Boolean): CourseUnitDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        val position = (unitRepository.findFirstByCourseIdAndDeletedFalseOrderByPositionDesc(courseId)?.position ?: 0) + 1
        val unit = unitRepository.save(CourseUnit(course, validTitle(request.title), request.description?.trim()?.ifBlank { null }, position))
        return toDto(unit, emptyList())
    }

    @Transactional
    fun update(courseId: Long, unitId: Long, request: CourseUnitRequest, userId: Long, mayManageAll: Boolean): CourseUnitDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val unit = ownedUnit(courseId, unitId)
        require(unit.syllabusModuleId == null) { "Dastur moduli nomi o'quv dasturida o'zgartiriladi" }
        unit.title = validTitle(request.title)
        unit.description = request.description?.trim()?.ifBlank { null }
        return toDto(unitRepository.save(unit), lessonsOf(courseId, unitId))
    }

    /** Modul o'chirilsa darslari va materiallari saqlanadi — ular "modulga biriktirilmagan" bo'lib qoladi */
    @Transactional
    fun delete(courseId: Long, unitId: Long, userId: Long, mayManageAll: Boolean) {
        accessService.requireManage(courseId, userId, mayManageAll)
        val unit = ownedUnit(courseId, unitId)
        require(unit.syllabusModuleId == null) { "Dastur moduli o'quv dasturidan o'chirilgach kursdan ham olib tashlanadi" }
        lessonsOf(courseId, unitId).forEach {
            it.unit = null
            moduleRepository.save(it)
        }
        unit.deleted = true
        unitRepository.save(unit)
        normalize(courseId)
    }

    /** Modulni nashr qilish/yashirish — uning barcha darslari bilan */
    @Transactional
    fun changeStatus(courseId: Long, unitId: Long, status: LearningItemStatus, userId: Long, mayManageAll: Boolean): CourseUnitDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val unit = ownedUnit(courseId, unitId)
        val lessons = lessonsOf(courseId, unitId)
        lessons.forEach {
            it.status = status.name
            it.publishedAt = if (status == LearningItemStatus.PUBLISHED) it.publishedAt ?: Instant.now() else null
            moduleRepository.save(it)
        }
        return toDto(unit, lessons)
    }

    /**
     * Darslarning kursdagi umumiy tartibi modullar tartibiga ergashadi (talaba ko'rinishi va kontent ro'yxati
     * shu tartibda): modul ichida nisbiy tartib saqlanadi, modulga biriktirilmaganlar oxirida.
     */
    fun normalize(courseId: Long) {
        val units = unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        val lessons = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        val unitIds = units.mapNotNull { it.id }.toSet()
        val ordered = units.flatMap { unit -> lessons.filter { it.unit?.id == unit.id } } +
            lessons.filter { it.unit?.id !in unitIds }
        ordered.forEachIndexed { index, lesson ->
            if (lesson.position != index + 1) {
                lesson.position = index + 1
                moduleRepository.save(lesson)
            }
        }
    }

    fun ownedUnit(courseId: Long, unitId: Long): CourseUnit = unitRepository.findById(unitId)
        .filter { !it.deleted && it.course.id == courseId }
        .orElseThrow { NoSuchElementException("Kurs moduli topilmadi: $unitId") }

    private fun lessonsOf(courseId: Long, unitId: Long) =
        moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId).filter { it.unit?.id == unitId }

    private fun toDto(unit: CourseUnit, lessons: List<CourseModule>) = CourseUnitDto(
        id = requireNotNull(unit.id),
        courseId = requireNotNull(unit.course.id),
        title = unit.title,
        description = unit.description,
        position = unit.position,
        syllabusModuleId = unit.syllabusModuleId,
        fromSyllabus = unit.fromSyllabus,
        lessonCount = lessons.size,
        publishedLessonCount = lessons.count { it.status == LearningItemStatus.PUBLISHED.name },
    )

    private fun validTitle(value: String): String = value.trim().also {
        require(it.length in 3..255) { "Modul nomi 3-255 belgi bo'lishi kerak" }
    }
}
