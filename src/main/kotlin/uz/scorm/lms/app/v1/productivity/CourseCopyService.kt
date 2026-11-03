package uz.scorm.lms.app.v1.productivity

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.*
import uz.scorm.lms.app.v1.courses.repository.*
import uz.scorm.lms.app.v1.courses.service.*

@Service
class CourseCopyService(
    private val access: CourseAccessService,
    private val courses: CourseService,
    private val modules: CourseModuleService,
    private val contents: CourseContentService,
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
    private val assets: CourseContentAssetService,
    private val units: CourseUnitService,
    private val unitRepository: CourseUnitRepository,
) {
    @Transactional
    fun copy(sourceId: Long, userId: Long, mayManageAll: Boolean, teacher: Boolean): CourseDto {
        val source = access.requireManage(sourceId, userId, mayManageAll)
        val created = courses.create(CourseCreateRequest(title = source.title.orEmpty().take(235) + " (nusxa)",
            shortDescription = source.shortDescription, description = source.description, subjectId = source.subject?.id,
            language = source.language, level = source.level,
            requirements = source.requirements, outcomes = source.outcomes, faqs = source.faqs), userId, teacher)
        val target = access.course(created.id)
        val assetIds = mutableMapOf<Long, Long>()
        // Nusxa dasturga bog'lanmaydi: modullar oddiy (qo'shimcha) modul sifatida ko'chadi
        val unitIds = unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(sourceId).associate { unit ->
            requireNotNull(unit.id) to units.create(created.id, CourseUnitRequest(unit.title, unit.description), userId, false).id
        }
        for (module in moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(sourceId)) {
            val copied = modules.create(created.id, CourseModuleRequest(module.title, module.description, module.position, module.topicType,
                module.plannedHours, unitId = module.unit?.id?.let(unitIds::get)), userId, false)
            for (content in contentRepository.findAllByModuleIdAndDeletedFalseOrderByPositionAsc(requireNotNull(module.id))) {
                val assetId = content.asset?.let { asset -> assetIds.getOrPut(requireNotNull(asset.id)) { assets.copyForCourse(asset, target, userId) } }
                contents.create(created.id, copied.id, CourseContentRequest(title = content.title, description = content.description,
                    contentType = content.contentType, contentUrl = content.contentUrl, contentBody = content.contentBody,
                    assetId = assetId, durationMinutes = content.durationMinutes, position = content.position,
                    languageCode = content.languageCode, authorName = content.authorName, contentVersion = content.contentVersion,
                    sourceName = content.sourceName, sourceUrl = content.sourceUrl, validFrom = content.validFrom,
                    validUntil = content.validUntil), userId, false)
            }
        }
        return courses.get(created.id, userId, false)
    }
}
