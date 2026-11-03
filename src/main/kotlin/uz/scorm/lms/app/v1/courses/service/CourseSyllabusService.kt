package uz.scorm.lms.app.v1.courses.service

import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusTopicDto
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.service.SyllabusApprovedEvent
import java.time.Instant
import java.time.LocalDate

/** Dasturga bog'langan kurs va mavzular bilan moslash natijasi. */
data class SyllabusLinkedCourseDto(
    val id: Long,
    val title: String,
    val status: String,
    /** Qoralama kurs mavzular o'zgarganda avtomatik yangilanadi; nashr qilingani — kurs sahifasida sinxronlanadi */
    val autoSync: Boolean,
    val added: Int = 0,
    val updated: Int = 0,
    /** Dasturdan o'chirilgan darslarning bo'sh bo'limlari olib tashlandi */
    val removed: Int = 0,
    /** Dars kontenti (dastur materiallari) bo'yicha o'zgarishlar */
    val materials: Int = 0,
    /** Dars testlari (Test va Savol/Javob) bo'yicha o'zgarishlar */
    val quizzes: Int = 0,
)

/**
 * Kurs bo'limlarini u asos qilingan o'quv dasturi mavzulari bilan moslash:
 * qaysi mavzu kursga qo'shilgan/qo'shilmaganini ko'rsatish va dastur bilan sinxronlash.
 */
@Service
class CourseSyllabusService(
    private val accessService: CourseAccessService,
    private val courseRepository: CourseRepository,
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
    private val unitRepository: CourseUnitRepository,
    private val unitService: CourseUnitService,
    private val materialRepository: SubjectMaterialRepository,
    private val revisionRepository: CourseContentRevisionRepository,
    private val quizSync: SyllabusQuizSync,
) {
    @Transactional(readOnly = true)
    fun status(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusStatusDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        return status(course, requireSyllabus(course))
    }

    /**
     * Qo'shilmagan darslar yangi bo'lim (qoralama) sifatida dastur tartibida qo'shiladi, bog'langan bo'limlarning
     * nomi, turi va soati dasturdagiga moslanadi. Kontent kiritilgan bo'lim hech qachon o'chirilmaydi.
     */
    @Transactional
    fun sync(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusSyncResult {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        val syllabus = requireSyllabus(course)
        require(syllabus.status == "APPROVED") {
            "O'quv dasturining yangi versiyasi hali tasdiqlanmagan — tasdiqlangandan keyin sinxronlang"
        }
        val counts = applySync(course, syllabus)
        return CourseSyllabusSyncResult(counts.added, counts.updated, status(course, syllabus), counts.removed, counts.materials, counts.quizzes)
    }

    /** Dasturga bog'langan kurslar (dastur mavzulari oynasida ko'rsatiladi). */
    @Transactional(readOnly = true)
    fun linkedCourses(syllabusId: Long): List<SyllabusLinkedCourseDto> =
        courseRepository.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(syllabusId).map { linked(it) }

    /**
     * Mavzular o'zgargandan keyin: hali nashr qilinmagan (qoralama) kurslar bo'limlari avtomatik moslanadi.
     * Nashr qilingan kurslarda talabalar o'qiyotgani uchun ularga jimgina tegilmaydi.
     */
    @Transactional
    fun syncDraftCourses(syllabusId: Long): List<SyllabusLinkedCourseDto> =
        courseRepository.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(syllabusId).map { course ->
            if (course.status == CourseStatus.DRAFT.name) linked(course, applySync(course, requireSyllabus(course)))
            else linked(course)
        }

    /**
     * Dastur tasdiqlanganda bog'langan barcha kurslar (nashr qilinganlari ham) moslanadi: tasdiqlangan dastur kontenti
     * talabaga ochiladi. Tasdiqlash — ekspert qarori, shuning uchun nashr qilingan kursga "jimgina" tegish emas.
     */
    @EventListener
    @Transactional
    fun onSyllabusApproved(event: SyllabusApprovedEvent) {
        courseRepository.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(event.syllabusId).forEach { course ->
            applySync(course, requireSyllabus(course))
        }
    }

    /**
     * Kurs tuzilmasini dasturga moslaydi: dastur moduli — kurs moduli, dastur darsi — shu moduldagi kurs darsi,
     * dastur tartibida; o'qituvchi qo'shgan darslar o'z modulida dastur darslaridan keyin. Dasturdan o'chirilgan
     * dars yoki modulning bo'sh qolgani olib tashlanadi, material kiritilgani (o'qituvchi ishi) saqlanadi.
     * Kurs yaratilganda ham shu chaqiriladi.
     */
    fun applySync(course: Course, syllabus: SubjectSyllabus): SyncCounts {
        val courseId = requireNotNull(course.id)
        val units = syncUnits(course, syllabus)
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        val lessons = syllabus.orderedLessons()
        val lessonIds = lessons.mapNotNull { it.id }.toSet()
        var removed = 0
        val contents = contentRepository.findAllByModuleCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        val kept = modules.filter { module ->
            val orphan = module.fromSyllabus && (module.syllabusTopicId == null || module.syllabusTopicId !in lessonIds)
            // Dastur materiallarining nusxasi o'qituvchi ishi hisoblanmaydi — ular dars bilan birga ketadi
            if (orphan && contents.none { it.module.id == module.id && !it.fromSyllabus }) {
                module.deleted = true
                moduleRepository.save(module)
                removed++
                false
            } else true
        }
        val linked = kept.filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        var added = 0
        var updated = 0
        val changed = mutableSetOf<CourseModule>()
        val lessonSections = lessons.map { topic ->
            val unit = topic.module?.id?.let(units::get)
            linked[topic.id]?.also { module ->
                if (outdated(module, topic)) {
                    module.title = topic.title.take(255)
                    module.topicType = topic.type.name
                    module.plannedHours = topic.hours
                    changed += module
                    updated++
                }
                if (module.unit?.id != unit?.id) {
                    module.unit = unit
                    changed += module
                }
            } ?: CourseModule(
                course = course, title = topic.title.take(255), description = topic.description,
                position = 0, topicType = topic.type.name, plannedHours = topic.hours, syllabusTopicId = topic.id,
                unit = unit,
            ).also { changed += it; added++ }
        }
        val others = kept.filter { module -> lessonSections.none { it === module } }
        (lessonSections + others).forEachIndexed { index, module ->
            if (module.position != index + 1) {
                module.position = index + 1
                changed += module
            }
        }
        changed.forEach(moduleRepository::save)
        val materials = syncMaterials(lessonSections + others, contents, lessonIds)
        if (syllabus.status == "APPROVED") publishApproved(courseId, lessonIds)
        val quizzes = quizSync.sync(course, lessonSections + others, lessonIds)
        removeEmptyOrphanUnits(courseId, units.values)
        // Umumiy tartib: modullar tartibida, har modul ichida dastur darslari, keyin qo'shimchalari
        unitService.normalize(courseId)
        course.syllabusRevision = syllabus.revisionNumber
        courseRepository.save(course)
        return SyncCounts(added, updated, removed, materials, quizzes)
    }

    /**
     * Dastur darsining kontenti kurs darsiga nusxa bo'ladi (dastur tartibida, o'qituvchi materiallaridan oldin):
     * yangisi qo'shiladi, dasturda o'zgargani yangilanadi (qayta ekspertizaga tushadi), olib tashlangani o'chiriladi.
     * Qaytgan son — o'zgargan materiallar.
     */
    private fun syncMaterials(lessons: List<CourseModule>, contents: List<CourseContent>, lessonIds: Set<Long>): Int {
        val byTopic = materialRepository.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(lessonIds)
            .groupBy { it.syllabusTopic?.id }
        val byLesson = contents.groupBy { it.module.id }
        val now = Instant.now()
        var changed = 0
        lessons.forEach { lesson ->
            val desired = lesson.syllabusTopicId?.takeIf { it in lessonIds }?.let(byTopic::get).orEmpty()
            val current = byLesson[lesson.id].orEmpty()
            val copies = current.filter { it.fromSyllabus }
            copies.filter { copy -> desired.none { it.id == copy.subjectMaterial?.id } }.forEach {
                it.deleted = true
                contentRepository.save(it)
                changed++
            }
            val synced = desired.map { material ->
                copies.find { it.subjectMaterial?.id == material.id }?.also { copy ->
                    if (refreshCopy(copy, material, now)) changed++
                } ?: copyOf(lesson, material, now).also { changed++ }
            }
            (synced + current.filter { !it.fromSyllabus }).forEachIndexed { index, content ->
                if (content.id == null || content.position != index + 1) {
                    val isNew = content.id == null
                    content.position = index + 1
                    val saved = contentRepository.save(content)
                    if (isNew) revisionRepository.save(contentRevision(saved, 1, material(saved).ownerUserId, now))
                }
            }
        }
        return changed
    }

    /**
     * Tasdiqlangan dastur kontenti dastur bilan birga ekspertizadan o'tgan: kursdagi qoralama nusxalari tasdiqlangan
     * va nashr qilingan, dastur darslari nashr qilingan bo'ladi — talabaga ko'rinadi. O'qituvchi materiallariga
     * (o'z ekspertizasi bor) tegilmaydi. Qoralama dasturdan kelgan nusxa esa qoralama qoladi.
     */
    private fun publishApproved(courseId: Long, lessonIds: Set<Long>) {
        val now = Instant.now()
        moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
            .filter { it.syllabusTopicId in lessonIds && it.status == LearningItemStatus.DRAFT.name }
            .forEach {
                it.status = LearningItemStatus.PUBLISHED.name
                it.publishedAt = now
                moduleRepository.save(it)
            }
        contentRepository.findAllByModuleCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
            .filter { it.fromSyllabus && it.status == LearningItemStatus.DRAFT.name }
            .forEach { copy ->
                copy.reviewStatus = ContentReviewStatus.APPROVED.name
                copy.approvedRevisionNumber =
                    revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(requireNotNull(copy.id))?.revisionNumber
                copy.status = LearningItemStatus.PUBLISHED.name
                copy.publishedAt = now
                contentRepository.save(copy)
            }
    }

    private fun copyOf(lesson: CourseModule, material: SubjectMaterial, now: Instant) = CourseContent(
        module = lesson, title = material.title, description = material.description, contentType = material.contentType,
        contentUrl = material.contentUrl, contentBody = material.contentBody, asset = material.asset, subjectMaterial = material,
        position = 0, languageCode = material.languageCode, authorName = material.authorName,
        contentVersion = material.contentVersion, sourceName = material.sourceName, sourceUrl = material.sourceUrl,
        validFrom = LocalDate.now(), metadataUpdatedAt = now,
    ).apply { fromSyllabus = true }

    /** Dasturdagi material o'zgargan bo'lsa nusxa yangilanadi: yangi versiya, qoralama va qayta ekspertiza */
    private fun refreshCopy(copy: CourseContent, material: SubjectMaterial, now: Instant): Boolean {
        val same = copy.title == material.title && copy.description == material.description &&
            copy.contentType == material.contentType && copy.contentUrl == material.contentUrl &&
            copy.contentBody == material.contentBody && copy.asset?.id == material.asset?.id
        if (same) return false
        val contentId = requireNotNull(copy.id)
        val revision = (revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId)?.revisionNumber ?: 0) + 1
        copy.title = material.title
        copy.description = material.description
        copy.contentType = material.contentType
        copy.contentUrl = material.contentUrl
        copy.contentBody = material.contentBody
        copy.asset = material.asset
        copy.contentVersion = material.contentVersion.takeUnless {
            revisionRepository.existsByContentIdAndContentVersionAndDeletedFalse(contentId, it)
        } ?: "${material.contentVersion}.$revision"
        copy.metadataUpdatedAt = now
        copy.status = LearningItemStatus.DRAFT.name
        copy.publishedAt = null
        copy.reviewStatus = ContentReviewStatus.DRAFT.name
        copy.approvedRevisionNumber = null
        revisionRepository.save(contentRevision(contentRepository.save(copy), revision, material.ownerUserId, now))
        return true
    }

    private fun material(content: CourseContent) = requireNotNull(content.subjectMaterial)

    /** Dastur moduli -> kurs moduli (nomi va tartibi dasturdan); o'qituvchi modullari ulardan keyin. */
    private fun syncUnits(course: Course, syllabus: SubjectSyllabus): Map<Long, CourseUnit> {
        val existing = unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
        val bySyllabusModule = existing.filter { it.syllabusModuleId != null }.associateBy { it.syllabusModuleId }
        val synced = syllabus.modules.sortedBy { it.sortOrder }.associate { module ->
            val title = module.name.take(255)
            val unit = bySyllabusModule[module.id]?.also {
                it.title = title
                it.description = module.description
            } ?: CourseUnit(course, title, module.description, syllabusModuleId = module.id)
            requireNotNull(module.id) to unit
        }
        val others = existing.filter { unit -> synced.values.none { it === unit } }
        (synced.values + others).forEachIndexed { index, unit ->
            unit.position = index + 1
            unitRepository.save(unit)
        }
        return synced
    }

    /** Dasturdan o'chirilgan modulning kurs moduli: darsi qolmagan bo'lsa olib tashlanadi */
    private fun removeEmptyOrphanUnits(courseId: Long, synced: Collection<CourseUnit>) {
        val lessons = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
            .filter { unit -> unit.fromSyllabus && synced.none { it.id == unit.id } && lessons.none { it.unit?.id == unit.id } }
            .forEach {
                it.deleted = true
                unitRepository.save(it)
            }
    }

    /** materials va quizzes — kurs darslariga qo'shilgan, yangilangan yoki olib tashlangan dastur materiallari va testlari */
    data class SyncCounts(val added: Int, val updated: Int, val removed: Int, val materials: Int = 0, val quizzes: Int = 0)

    private fun linked(course: Course, counts: SyncCounts = SyncCounts(0, 0, 0)) = SyllabusLinkedCourseDto(
        id = requireNotNull(course.id), title = course.title.orEmpty(), status = course.status.orEmpty().lowercase(),
        autoSync = course.status == CourseStatus.DRAFT.name, added = counts.added, updated = counts.updated,
        removed = counts.removed, materials = counts.materials, quizzes = counts.quizzes,
    )

    private fun status(course: Course, syllabus: SubjectSyllabus): CourseSyllabusStatusDto {
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
            .filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        val topics = syllabus.orderedLessons().map { topic ->
            val module = modules[topic.id]
            CourseSyllabusTopicDto(
                topicId = requireNotNull(topic.id), type = topic.type.name, sortOrder = topic.sortOrder,
                title = topic.title, hours = topic.hours, moduleId = module?.id, moduleTitle = module?.title,
                outdated = module != null && outdated(module, topic), syllabusModuleName = topic.module?.name,
            )
        }
        return CourseSyllabusStatusDto(
            syllabusId = requireNotNull(syllabus.id), syllabusName = syllabus.name, syllabusStatus = syllabus.status,
            syllabusRevision = syllabus.revisionNumber, courseSyllabusRevision = course.syllabusRevision,
            topics = topics, pendingCount = topics.count { it.moduleId == null || it.outdated },
        )
    }

    private fun requireSyllabus(course: Course) = requireNotNull(course.syllabus) { "Kurs o'quv dasturiga bog'lanmagan" }

    private fun outdated(module: CourseModule, topic: SubjectSyllabusTopic) =
        module.title != topic.title.take(255) || module.topicType != topic.type.name || module.plannedHours != topic.hours
}
