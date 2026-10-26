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
import uz.scorm.lms.app.v1.curriculum.service.curriculumHoursMatch
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
    private val service = CurriculumSyllabusService(versions, items, syllabi, models, syllabusService, mockk(relaxed = true), mockk(relaxed = true))

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
    fun `bitta tugma - reja tilidagi mavjud dastur biriktiriladi, bo'lmasa yangisi yaratiladi`() {
        every { version.educationLanguage } returns "ru"
        val uz = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.UZ, "q", null, "t").apply { id = 50 }
        val ru = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.RU, "q", null, "t").apply { id = 51; status = "APPROVED" }
        every { syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(1) } returns listOf(uz, ru)

        assertEquals(51L, service.ensure(5, 11, actorId = 9))
        assertSame(ru, sem1.syllabus)
        // Biriktirilgan bo'lsa o'sha qaytadi
        assertEquals(51L, service.ensure(5, 11, actorId = 9))

        sem1.syllabus = null; sem2.syllabus = null
        every { syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(1) } returns listOf(uz)
        every { models.findFirstBySubjectIdAndLanguageAndDeletedFalse(1, SyllabusLanguage.RU) } returns
            SubjectModelProgram(programming, SyllabusLanguage.RU, "Dasturlash 1,2", "q", null, "t").apply { id = 3 }
        val created = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.RU, "q", null, "t").apply { id = 52 }
        every { syllabusService.createForSubject(any(), any(), any(), any()) } returns created

        assertEquals(52L, service.ensure(5, 11, actorId = 9))
        verify { syllabusService.createForSubject(any(), "Dasturlash 1,2 fanining o'quv dasturi", null, "Dasturlash 1,2 fanining o'quv dasturi") }
    }

    @Test
    fun `mavzu soatlari fanning barcha semestrlari bo'yicha reja soatlariga solishtiriladi`() {
        val syllabus = SubjectSyllabus(programming, "Dasturlash 1,2", SyllabusLanguage.UZ, "Qisqa", null, "To'liq")
        fun add(type: SyllabusTopicType, hours: Int, part: Int) {
            syllabus.topics += SubjectSyllabusTopic(syllabus, type, syllabus.topics.size + 1, "Mavzu", hours = hours).apply { this.part = part }
        }
        add(SyllabusTopicType.THEORETICAL, 30, 1); add(SyllabusTopicType.PRACTICAL, 45, 1); add(SyllabusTopicType.LABORATORY, 44, 2)
        assertFalse(curriculumHoursMatch(syllabus, listOf(sem1, sem2)))
        add(SyllabusTopicType.LABORATORY, 1, 2)
        assertTrue(curriculumHoursMatch(syllabus, listOf(sem1, sem2)))

        // Masofaviy: turlarga bo'linmagan — auditoriya jami bilan solishtiriladi
        val distance = row(13, writing, 1, 0, 0, 0).apply { auditoryHours = 60 }
        val distanceSyllabus = SubjectSyllabus(writing, "Akademik yozuv", SyllabusLanguage.UZ, "q", null, "t")
        distanceSyllabus.topics += SubjectSyllabusTopic(distanceSyllabus, SyllabusTopicType.THEORETICAL, 1, "Mavzu", hours = 60)
        assertTrue(curriculumHoursMatch(distanceSyllabus, listOf(distance)))
    }
}
