package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.curriculum.dto.CreateCurriculumSyllabusRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.CurriculumSyllabusService
import uz.scorm.lms.app.v1.curriculum.service.curriculumTopicsComplete
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType
import uz.scorm.lms.app.v1.syllabus.repository.SubjectModelProgramRepository
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class CurriculumSyllabusServiceTest {
    private val versions = mockk<ProgramCurriculumVersionRepository>()
    private val items = mockk<ProgramCurriculumSubjectRepository>()
    private val syllabi = mockk<SubjectSyllabusRepository>()
    private val models = mockk<SubjectModelProgramRepository>()
    private val syllabusService = mockk<SubjectSyllabusService>()
    private val materials = mockk<uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository>()
    private val service = CurriculumSyllabusService(versions, items, syllabi, models, syllabusService, mockk(relaxed = true), mockk(relaxed = true), materials)

    private val version = mockk<ProgramCurriculumVersion>(relaxed = true).also {
        every { it.id } returns 5
        every { it.status } returns CurriculumStatus.APPROVED
    }
    private val programming = Subject(name = "Dasturlash 1,2", code = "DAS1110").apply { id = 1 }
    private val writing = Subject(name = "Akademik yozuv", code = "AKY1104").apply { id = 2 }
    private fun row(id: Long, subject: Subject, semester: Int, lecture: Int, practical: Int, laboratory: Int) =
        ProgramCurriculumSubject(version, subject, subject.code!!, subject.name, 5, semester, CurriculumPlanItemType.REQUIRED).apply {
            this.id = id; lectureHours = lecture; practicalHours = practical; laboratoryHours = laboratory
            auditoryHours = lecture + practical + laboratory
        }
    private val sem1 = row(10, programming, 1, 18, 27, 27)
    private val sem2 = row(11, programming, 2, 12, 18, 18)
    private val other = row(12, writing, 1, 0, 48, 0)

    init {
        every { versions.findByIdAndDeletedFalse(5) } returns version
        every { items.findByIdAndDeletedFalse(11) } returns sem2
        every { items.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscSubjectNameSnapshotAsc(5) } returns listOf(sem1, other, sem2)
        every { items.save(any()) } answers { firstArg() }
    }

    @Test
    fun `mavjud dastur ko'p semestrli fanning barcha qatorlariga biriktiriladi, boshqa fan dasturi rad etiladi`() {
        val syllabus = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply { id = 40 }
        every { syllabi.findByIdAndDeletedFalse(40) } returns syllabus

        service.attach(5, 11, 40, actorId = 9)

        assertSame(syllabus, sem1.syllabus)
        assertSame(syllabus, sem2.syllabus)
        assertEquals(null, other.syllabus)

        every { syllabi.findByIdAndDeletedFalse(41) } returns SubjectSyllabus(writing, "Akademik yozuv", SyllabusLanguage.UZ, "q", null, "t").apply { id = 41 }
        assertThrows<IllegalArgumentException> { service.attach(5, 11, 41, actorId = 9) }

        service.detach(5, 11, actorId = 9)
        assertEquals(null, sem1.syllabus)
    }

    @Test
    fun `fansiz yaratilgan dastur birinchi biriktirilganda shu fanga va uning dars materiallariga yoziladi`() {
        val syllabus = SubjectSyllabus(null, "Mexanika kursi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply { id = 43 }
        syllabus.topics += SubjectSyllabusTopic(syllabus, SyllabusTopicType.THEORETICAL, 1, "Kinematika").apply { id = 70 }
        val material = uz.scorm.lms.app.v1.courses.model.SubjectMaterial(null, null, 9, "Ma'ruza", null,
            uz.scorm.lms.app.v1.courses.model.CourseContentType.TEXT, contentBody = "<p>x</p>", languageCode = "uz",
            authorName = "Kafedra", contentVersion = "1.0", sourceName = "Dastur")
        every { syllabi.findByIdAndDeletedFalse(43) } returns syllabus
        every { syllabi.save(any()) } answers { firstArg() }
        every { materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(70L)) } returns listOf(material)
        every { materials.save(any()) } answers { firstArg() }

        service.attach(5, 11, 43, actorId = 9)

        assertSame(programming, syllabus.subject)
        assertSame(programming, material.subject)
        assertSame(syllabus, sem1.syllabus)
    }

    @Test
    fun `yangi dastur fan nomi bilan yaratiladi, namunaviy dastur bo'lmasa u ham yaratiladi`() {
        every { models.findFirstBySubjectIdAndLanguageAndDeletedFalse(1, SyllabusLanguage.RU) } returns null
        every { models.save(any()) } answers { firstArg<SubjectModelProgram>().apply { id = 3 } }
        val created = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.RU, "Qisqa", null, "To'liq").apply { id = 42 }
        every { syllabusService.createForSubject(any(), "Qisqa", null, "To'liq") } returns created

        service.createAndAttach(5, 11, CreateCurriculumSyllabusRequest(SyllabusLanguage.RU, "Qisqa", null, "To'liq"), actorId = 9)

        verify { models.save(match { it.subject === programming && it.language == SyllabusLanguage.RU && it.name == "Dasturlash 1,2" }) }
        assertSame(created, sem1.syllabus)
        assertSame(created, sem2.syllabus)
    }

    @Test
    fun `rejada soati bor har bir turga har bir semestr qismida mavzu kiritilgani tekshiriladi, soat solishtirilmaydi`() {
        val syllabus = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.UZ, "Qisqa", null, "To'liq")
        fun add(type: SyllabusTopicType, part: Int) {
            syllabus.topics += SubjectSyllabusTopic(syllabus, type, syllabus.topics.size + 1, "Mavzu").apply { this.part = part }
        }
        assertFalse(curriculumTopicsComplete(syllabus, listOf(sem1, sem2)))
        add(SyllabusTopicType.THEORETICAL, 1); add(SyllabusTopicType.PRACTICAL, 1); add(SyllabusTopicType.LABORATORY, 1)
        // 2-qismda (2-semestr) hali mavzu yo'q
        assertFalse(curriculumTopicsComplete(syllabus, listOf(sem1, sem2)))
        add(SyllabusTopicType.THEORETICAL, 2); add(SyllabusTopicType.PRACTICAL, 2); add(SyllabusTopicType.LABORATORY, 2)
        assertTrue(curriculumTopicsComplete(syllabus, listOf(sem1, sem2)))

        // Masofaviy: turlarga bo'linmagan — istalgan turdagi mavzu yetarli
        val distance = row(13, writing, 1, 0, 0, 0).apply { auditoryHours = 60 }
        val distanceSyllabus = SubjectSyllabus(writing, "Akademik yozuv", SyllabusLanguage.UZ, "q", null, "t")
        assertFalse(curriculumTopicsComplete(distanceSyllabus, listOf(distance)))
        distanceSyllabus.topics += SubjectSyllabusTopic(distanceSyllabus, SyllabusTopicType.THEORETICAL, 1, "Mavzu")
        assertTrue(curriculumTopicsComplete(distanceSyllabus, listOf(distance)))
    }
}
