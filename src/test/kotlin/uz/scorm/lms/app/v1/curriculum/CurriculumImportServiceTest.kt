package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.mock.web.MockMultipartFile
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportAction.CREATE
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportAction.SKIP
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportAction.USE_EXISTING
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportApplyRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCourseWorkType.COURSE_WORK
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.CurriculumImportService
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import java.io.ByteArrayOutputStream
import java.util.Optional

class CurriculumImportServiceTest {
    private val versions = mockk<ProgramCurriculumVersionRepository>()
    private val items = mockk<ProgramCurriculumSubjectRepository>()
    private val subjects = mockk<SubjectRepository>()
    private val curriculum = mockk<ProgramCurriculumService>(relaxed = true)
    private val service = CurriculumImportService(versions, items, subjects, mockk(relaxed = true), mockk(relaxed = true), curriculum)

    private val program = mockk<Program>(relaxed = true).also { every { it.id } returns 77 }
    private val version = mockk<ProgramCurriculumVersion>(relaxed = true).also {
        every { it.id } returns 5
        every { it.status } returns CurriculumStatus.DRAFT
        every { it.semesterCount } returns 8
        every { it.program } returns program
    }
    private val programming = Subject(name = "Dasturlash 1, 2", code = "DAS1110", credits = 10).apply { id = 1 }
    private val writing = Subject(name = "Akademik yozuv", code = "AKY-OLD", credits = 4).apply { id = 2 }
    private val other = Subject(name = "Boshqa fan", code = "PDT2504", credits = 4).apply { id = 3 }

    init {
        every { versions.findByIdAndDeletedFalse(5) } returns version
        every { subjects.findAll() } returns listOf(programming, writing, other)
    }

    /** header — fanlar jadvalidan yuqoridagi sarlavha (yo'nalish, ta'lim shakli, o'qish muddati) */
    private fun excel(header: String? = null): MockMultipartFile = XSSFWorkbook().use { wb ->
        val sheet = wb.createSheet("Reja")
        val top = if (header != null) 2 else 0
        fun put(r: Int, vararg cells: Pair<Int, Any>) {
            val row = sheet.getRow(r + top) ?: sheet.createRow(r + top)
            cells.forEach { (c, v) -> row.createCell(c).apply { if (v is Number) setCellValue(v.toDouble()) else setCellValue(v.toString()) } }
        }
        header?.let { put(-2, 2 to it) }
        put(0, 0 to "T/r", 1 to "Fanning malakaviy kodi", 2 to "O‘quv fanlari nomlari", 3 to "Umumiy yuklama hajmi",
            4 to "Auditoriya mashg‘ulotlari", 9 to "Mustaqil ta’lim")
        put(1, 4 to "Jami", 5 to "Ma’ruza", 6 to "Amaliy", 7 to "Laboratoriya", 8 to "Seminar", 10 to "Semestrlar", 15 to "Kurs ishi (loyihasi)")
        put(2, 10 to 1, 11 to 2, 12 to 3, 13 to 4, 14 to 5)
        put(3, 0 to "1.00", 2 to "Majburiy fanlar")
        put(4, 0 to "1.09", 1 to "DAS1110", 2 to "Dasturlash 1,2", 3 to 300, 4 to 120, 5 to 30, 6 to 45, 7 to 45, 9 to 180, 10 to 6, 11 to 4,
            15 to "KI")
        // "Akademik yozuv" — "о" kirillda: katalogdagi lotin nomga baribir moslanadi
        put(5, 0 to "1.10", 1 to "AKY1104", 2 to "Akademik y\u043ezuv", 3 to 120, 4 to 48, 6 to 48, 9 to 72, 10 to 4)
        put(6, 0 to "2.00", 2 to "Tanlov fanlari")
        put(7, 0 to "2.04", 1 to "PDT2504", 2 to "Python dasturlash tili", 3 to 120, 4 to 48, 5 to 24, 6 to 24, 9 to 72, 14 to 4)
        put(8, 1 to "PHPDT2504", 2 to "PHP dasturlash tili")
        put(9, 0 to "2.05", 1 to "NOS2000", 2 to "Kreditsiz fan", 3 to 120)
        MockMultipartFile("file", "reja.xlsx", null, ByteArrayOutputStream().also(wb::write).toByteArray())
    }

    @Test
    fun `ko'rib chiqishda fanlar katalogga kod+nom, nom bo'yicha moslanadi, band kodga qo'shimcha beriladi`() {
        val rows = service.preview(5, excel(), null).rows

        assertEquals(listOf(USE_EXISTING, USE_EXISTING, CREATE, CREATE, SKIP), rows.map { it.action })
        assertEquals(1L, rows[0].subjectId) // kod + nom (apostrof/bo'shliq farqi hisobga olinmaydi)
        assertEquals(2L, rows[1].subjectId) // faqat nom bo'yicha
        assertEquals("PDT2504-A", rows[2].createCode) // PDT2504 boshqa fanga tegishli
        assertEquals("PHPDT2504", rows[3].createCode)
        assertEquals(true, rows[3].alternative)
        assertNull(rows[4].subjectId)
    }

    @Test
    fun `qo'llashda har semestr alohida qator, soatlar kredit ulushida bo'linadi, mavjud qator o'tkazib yuboriladi`() {
        val rows = service.preview(5, excel(), null).rows
        every { subjects.findById(1) } returns Optional.of(programming)
        every { subjects.findById(2) } returns Optional.of(writing)
        every { subjects.existsByCode(any()) } returns false
        every { subjects.save(any()) } answers { firstArg<Subject>().apply { id = 100 + name.length.toLong() } }
        every { items.existsByCurriculumVersionIdAndSubjectIdAndSemesterAndDeletedFalse(5, any(), any()) } returns false
        every { items.existsByCurriculumVersionIdAndSubjectIdAndSemesterAndDeletedFalse(5, 2, 1) } returns true
        val saved = mutableListOf<ProgramCurriculumSubject>()
        every { items.save(capture(saved)) } answers { firstArg() }

        val result = service.apply(5, CurriculumImportApplyRequest(rows), actorId = 9)

        assertEquals(2, result.subjectsCreated)
        assertEquals(4, result.itemsAdded) // Dasturlash 1- va 2-semestr, Python, PHP
        assertEquals(1, result.itemsSkipped) // Akademik yozuv allaqachon rejada
        val (first, second) = saved.filter { it.subject === programming }
        assertEquals(listOf(1, 6, 18, 27, 27, 72, 108), listOf(first.semester, first.creditsSnapshot, first.lectureHours,
            first.practicalHours, first.laboratoryHours, first.auditoryHours, first.selfStudyHours))
        assertEquals(listOf(2, 4, 12, 18, 18, 48, 72), listOf(second.semester, second.creditsSnapshot, second.lectureHours,
            second.practicalHours, second.laboratoryHours, second.auditoryHours, second.selfStudyHours))
        assertEquals("1.09", first.planRowNumber)
        assertEquals("DAS1110", first.subjectCodeSnapshot)
        // Kurs ishi fan tugaydigan (oxirgi) semestrga yoziladi
        assertEquals(listOf(null, COURSE_WORK), listOf(first.courseWorkType, second.courseWorkType))
        verify { subjects.save(match { it.code == "PDT2504-A" && it.name == "Python dasturlash tili" && it.credits == 4 && it.program == null }) }
    }

    @Test
    fun `fayl sarlavhasi o'qiladi va rejaga mos kelmasa ogohlantiriladi`() {
        every { program.code } returns "60610400"
        every { program.name } returns "Dasturiy injiniring"
        every { version.educationForm } returns EducationForm.FULL_TIME
        val preview = service.preview(5, excel(
            "Ta’lim yo‘nalishi: 60610300 - Kompyuter injiniringi\nTa’lim shakli - masofaviy\nO‘qish muddati - 4 yil",
        ), null)

        assertEquals("60610300", preview.header?.programCode)
        assertEquals("DISTANCE", preview.header?.educationForm)
        assertEquals(listOf(
            "Fayldagi yo'nalish 60610300 – Kompyuter injiniringi, reja yo'nalishi 60610400 – Dasturiy injiniring",
            "Faylda ta'lim shakli masofaviy, rejada kunduzgi",
        ), preview.warnings) // 4 yil = 8 semestr — muddat mos
        assertEquals(5, preview.rows.size)
    }

    @Test
    fun `tasdiqlangan rejaga import qilinmaydi`() {
        every { version.status } returns CurriculumStatus.APPROVED
        assertThrows<IllegalArgumentException> { service.preview(5, excel(), null) }
    }
}
