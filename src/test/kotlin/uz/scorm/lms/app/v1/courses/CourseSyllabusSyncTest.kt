package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseContentRevision
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.courses.service.CourseUnitService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.PRACTICAL
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import java.time.Instant
import java.time.LocalDate

class CourseSyllabusSyncTest {
    private val access = mockk<CourseAccessService>()
    private val courses = mockk<CourseRepository>()
    private val modules = mockk<CourseModuleRepository>()
    private val contents = mockk<CourseContentRepository>()
    private val unitRepo = mockk<CourseUnitRepository>()
    private val materialRepo = mockk<SubjectMaterialRepository>()
    private val revisions = mockk<CourseContentRevisionRepository>()
    private val service = CourseSyllabusService(access, courses, modules, contents, unitRepo, CourseUnitService(unitRepo, modules, access),
        materialRepo, revisions)
    private val units = mutableListOf<CourseUnit>()
    private val contentList = mutableListOf<CourseContent>()
    private val materials = mutableListOf<SubjectMaterial>()
    private val savedRevisions = mutableListOf<CourseContentRevision>()

    private val syllabus = SubjectSyllabus(Subject(name = "Fizika", code = "FIZ").apply { id = 3 }, "Fizika dasturi",
        SyllabusLanguage.UZ, "Qisqa", null, "To'liq", status = "APPROVED", revisionNumber = 3).apply {
        id = 31
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kirish", hours = 2).apply { id = 1 }
        topics += SubjectSyllabusTopic(this, THEORETICAL, 2, "Kinematika", hours = 4).apply { id = 2 }
        topics += SubjectSyllabusTopic(this, PRACTICAL, 1, "Tajriba", hours = 4).apply { id = 3 }
    }
    private val course = Course(title = "Fizika 2026", userId = 1, syllabus = syllabus, syllabusRevision = 2).apply { id = 9 }
    // 1-mavzu bo'limi joyida; 2-mavzu bo'limi eski soat bilan; 3-mavzu qo'shilmagan; qo'lda yaratilgan bo'lim ham bor
    private val existing = mutableListOf(
        CourseModule(course, "Kirish", position = 1, topicType = "THEORETICAL", plannedHours = 2, syllabusTopicId = 1).apply { id = 101 },
        CourseModule(course, "Kinematika", position = 2, topicType = "THEORETICAL", plannedHours = 2, syllabusTopicId = 2).apply { id = 102 },
        CourseModule(course, "Qo'shimcha", position = 3).apply { id = 103 },
    )

    init {
        every { access.requireManage(9, 1, false) } returns course
        every { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(9) } answers { existing.filter { !it.deleted }.sortedBy { it.position } }
        every { modules.save(any<CourseModule>()) } answers {
            firstArg<CourseModule>().also { if (it.id == null) { it.id = 200L + existing.size; existing += it } }
        }
        every { courses.save(any()) } answers { firstArg() }
        every { contents.findAllByModuleCourseIdAndDeletedFalseOrderByPositionAsc(9) } answers { contentList.filter { !it.deleted }.sortedBy { it.position } }
        every { contents.save(any<CourseContent>()) } answers {
            firstArg<CourseContent>().also { if (it.id == null) { it.id = 500L + contentList.size; contentList += it } }
        }
        every { materialRepo.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(any()) } answers {
            val ids = firstArg<Collection<Long>>()
            materials.filter { !it.deleted && it.syllabusTopic?.id in ids }.sortedBy { it.topicPosition }
        }
        every { revisions.save(any<CourseContentRevision>()) } answers { firstArg<CourseContentRevision>().also { savedRevisions += it } }
        every { revisions.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(any()) } answers {
            savedRevisions.filter { it.content.id == firstArg<Long>() }.maxByOrNull { it.revisionNumber }
        }
        every { revisions.existsByContentIdAndContentVersionAndDeletedFalse(any(), any()) } answers {
            savedRevisions.any { it.content.id == firstArg<Long>() && it.contentVersion == secondArg<String>() }
        }
        every { unitRepo.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(9) } answers { units.filter { !it.deleted }.sortedBy { it.position } }
        every { unitRepo.save(any<CourseUnit>()) } answers {
            firstArg<CourseUnit>().also { if (it.id == null) { it.id = 300L + units.size; units += it } }
        }
    }

    @Test
    fun `holat qoshilmagan va ozgargan mavzularni korsatadi`() {
        val status = service.status(9, 1, false)

        assertEquals(listOf(101L, 102L, null), status.topics.map { it.moduleId })
        assertEquals(listOf(false, true, false), status.topics.map { it.outdated })
        assertEquals(2, status.pendingCount)
    }

    @Test
    fun `sinxronlash yangi mavzuni qoshadi va ozgarganini yangilaydi, boshqa bolimlarga tegmaydi`() {
        val result = service.sync(9, 1, false)

        assertEquals(1, result.added)
        assertEquals(1, result.updated)
        assertEquals(0, result.status.pendingCount)
        assertEquals(4, existing[1].plannedHours)
        val added = existing.last()
        assertEquals("Tajriba", added.title)
        // Dastur darslari dastur tartibida, qo'lda qo'shilgan bo'lim ulardan keyin
        assertEquals(3, added.position)
        assertEquals(4, existing.first { it.title == "Qo'shimcha" }.position)
        assertEquals("PRACTICAL", added.topicType)
        assertEquals(3L, added.syllabusTopicId)
        assertTrue(added.fromSyllabus)
        assertEquals(3, course.syllabusRevision)
        assertTrue(existing.none { it.deleted })
    }

    @Test
    fun `bolimlar dastur modullari tartibida, ochirilgan darsning bosh bolimi olib tashlanadi kontentlisi qoladi`() {
        // Dastur: 2-modul (Termodinamika) 1-modul (Mexanika) dan keyin, Tajriba Mexanikada birinchi dars
        val mechanics = SubjectSyllabusModule(syllabus, 1, "Mexanika").apply { id = 61 }
        val thermo = SubjectSyllabusModule(syllabus, 2, "Termodinamika").apply { id = 62 }
        syllabus.modules += listOf(mechanics, thermo)
        syllabus.topics.first { it.id == 3L }.apply { module = mechanics; lessonOrder = 1 }
        syllabus.topics.first { it.id == 2L }.apply { module = mechanics; lessonOrder = 2 }
        syllabus.topics.first { it.id == 1L }.apply { module = thermo; lessonOrder = 1 }
        // Dasturdan o'chirilgan darslarning bo'limlari: biri bo'sh, birida kontent bor
        existing += CourseModule(course, "Eski bo'sh", position = 4, topicType = "THEORETICAL", fromSyllabus = true).apply { id = 104 }
        existing += CourseModule(course, "Eski kontentli", position = 5, topicType = "THEORETICAL", fromSyllabus = true).apply { id = 105 }
        contentList += content(existing.first { it.id == 105L }, "O'qituvchi videosi").apply { id = 601 }

        val result = service.sync(9, 1, false)

        assertEquals(1, result.removed)
        assertTrue(existing.first { it.id == 104L }.deleted)
        assertTrue(!existing.first { it.id == 105L }.deleted)
        val order = existing.filter { !it.deleted }.sortedBy { it.position }.map { it.title }
        assertEquals(listOf("Tajriba", "Kinematika", "Kirish", "Qo'shimcha", "Eski kontentli"), order)
        assertEquals(listOf("Mexanika", "Mexanika", "Termodinamika"), result.status.topics.map { it.syllabusModuleName })
        // Dastur modullari kurs modullariga aylandi, darslar o'z modulida; qo'lda qo'shilganlar modulsiz
        assertEquals(listOf("Mexanika" to 61L, "Termodinamika" to 62L), units.map { it.title to it.syllabusModuleId })
        val unitOf = existing.filter { !it.deleted }.associate { it.title to it.unit?.title }
        assertEquals(mapOf("Tajriba" to "Mexanika", "Kinematika" to "Mexanika", "Kirish" to "Termodinamika",
            "Qo'shimcha" to null, "Eski kontentli" to null), unitOf)
    }

    @Test
    fun `dasturdan olingan modul nomi yangilanadi, bosh qolgan eski modul olib tashlanadi, qoshimcha modul darslari bilan saqlanadi`() {
        val mechanics = SubjectSyllabusModule(syllabus, 1, "Mexanika").apply { id = 61 }
        syllabus.modules += mechanics
        syllabus.topics.forEachIndexed { index, topic -> topic.module = mechanics; topic.lessonOrder = index + 1 }
        val renamed = CourseUnit(course, "Eski nom", position = 2, syllabusModuleId = 61).apply { id = 401 }
        val removedModule = CourseUnit(course, "O'chirilgan modul", position = 1, syllabusModuleId = 99).apply { id = 402 }
        val extra = CourseUnit(course, "Takrorlash", position = 3).apply { id = 403 }
        units += listOf(renamed, removedModule, extra)
        existing.first { it.title == "Qo'shimcha" }.unit = extra

        service.sync(9, 1, false)

        assertEquals("Mexanika", renamed.title)
        assertTrue(removedModule.deleted)
        assertEquals(listOf("Mexanika", "Takrorlash"), units.filter { !it.deleted }.sortedBy { it.position }.map { it.title })
        assertTrue(existing.filter { it.syllabusTopicId != null }.all { it.unit === renamed })
        // Umumiy tartib modullarga ergashadi: Mexanika darslari, keyin Takrorlash moduli darslari
        assertEquals(listOf("Kirish", "Kinematika", "Tajriba", "Qo'shimcha"), existing.sortedBy { it.position }.map { it.title })
    }

    @Test
    fun `mavzular ozgarganda faqat qoralama kurslar avtomatik moslanadi`() {
        syllabus.status = "DRAFT"
        val published = Course(title = "Fizika 2025", userId = 1, syllabus = syllabus, status = "PUBLISHED").apply { id = 10 }
        course.status = "DRAFT"
        every { courses.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(31) } returns listOf(course, published)

        val result = service.syncDraftCourses(31)

        assertEquals(listOf(true, false), result.map { it.autoSync })
        assertEquals(1, result[0].added)
        assertEquals(1, result[0].updated)
        assertEquals(0, result[1].added)
        verify(exactly = 0) { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(10) }
    }

    @Test
    fun `dastur darsining materiallari kurs darsiga kochadi, ozgargani yangilanadi, olib tashlangani ochiriladi`() {
        val lecture = syllabus.topics.first { it.id == 1L }
        val text = material(1, lecture, "Kirish matni", 1)
        val video = material(2, lecture, "Kirish videosi", 2, CourseContentType.VIDEO)
        val dropped = material(9, lecture, "Eski material", 3).apply { deleted = true }
        val kirish = existing.first { it.id == 101L }
        contentList += content(kirish, "O'qituvchi izohi", position = 1).apply { id = 701 }
        contentList += content(kirish, "Eski material", position = 2, fromSyllabus = dropped).apply { id = 702 }

        val first = service.sync(9, 1, false)

        val lesson = contentList.filter { it.module.id == 101L && !it.deleted }.sortedBy { it.position }
        // Dastur materiallari dastur tartibida, o'qituvchi materiali ulardan keyin; olib tashlangani o'chirildi
        assertEquals(listOf("Kirish matni", "Kirish videosi", "O'qituvchi izohi"), lesson.map { it.title })
        assertEquals(listOf(text.id, video.id, null), lesson.map { it.subjectMaterial?.id })
        assertTrue(contentList.first { it.id == 702L }.deleted)
        assertEquals(3, first.materials)
        assertEquals(listOf(1, 1), savedRevisions.map { it.revisionNumber })
        assertEquals(listOf(7L, 7L), savedRevisions.map { it.changedBy })

        text.title = "Kirish: asosiy tushunchalar"
        text.contentVersion = "2.0"
        val copy = lesson.first()
        copy.status = "PUBLISHED"
        copy.reviewStatus = "APPROVED"

        val second = service.sync(9, 1, false)

        assertEquals(1, second.materials)
        assertEquals("Kirish: asosiy tushunchalar", copy.title)
        assertEquals("2.0", copy.contentVersion)
        // O'zgargan nusxa qayta ekspertizaga: qoralama va yangi versiya
        assertEquals("DRAFT", copy.status)
        assertEquals("DRAFT", copy.reviewStatus)
        assertEquals(2, savedRevisions.last().revisionNumber)
    }

    @Test
    fun `ochirilgan darsning faqat dastur materiallari bolsa dars ham olib tashlanadi`() {
        existing += CourseModule(course, "Eski dars", position = 4, topicType = "THEORETICAL", syllabusTopicId = 77, fromSyllabus = true).apply { id = 106 }
        contentList += content(existing.last(), "Eski nusxa", fromSyllabus = material(5, null, "Eski nusxa", 1)).apply { id = 703 }

        val result = service.sync(9, 1, false)

        assertEquals(1, result.removed)
        assertTrue(existing.first { it.id == 106L }.deleted)
    }

    @Test
    fun `tasdiqlanmagan versiya bilan sinxronlash rad etiladi`() {
        syllabus.status = "DRAFT"
        assertThrows<IllegalArgumentException> { service.sync(9, 1, false) }
    }

    private fun material(id: Long, topic: SubjectSyllabusTopic?, title: String, position: Int, type: CourseContentType = CourseContentType.TEXT) =
        SubjectMaterial(syllabus.subject, null, 7, title, null, type,
            contentUrl = if (type == CourseContentType.TEXT) null else "https://video.example/$id",
            contentBody = if (type == CourseContentType.TEXT) "<p>$title</p>" else null,
            languageCode = "uz", authorName = "Kafedra", contentVersion = "1.0", sourceName = "Fizika").apply {
            this.id = id
            syllabusTopic = topic
            topicPosition = position
        }.also { materials += it }

    private fun content(module: CourseModule, title: String, position: Int = 1, fromSyllabus: SubjectMaterial? = null) =
        CourseContent(module, title, contentType = CourseContentType.TEXT, contentBody = "<p>$title</p>", subjectMaterial = fromSyllabus,
            position = position, languageCode = "uz", authorName = "O'qituvchi", contentVersion = "1.0", sourceName = "Fizika",
            validFrom = LocalDate.now(), metadataUpdatedAt = Instant.now()).apply { this.fromSyllabus = fromSyllabus != null }
}
