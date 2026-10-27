package uz.scorm.lms.app.v1.curriculum

import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.curriculum.importer.CurriculumWorkbookParser
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCourseWorkType.COURSE_PROJECT
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCourseWorkType.COURSE_WORK
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType.ELECTIVE
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType.REQUIRED
import uz.scorm.lms.app.v1.student.model.EducationForm
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

/** NamDTU ishchi o'quv reja tuzilishidagi sintetik fayl (ustunlar siljigan holda ham sarlavha bo'yicha topiladi). */
class CurriculumWorkbookParserTest {
    private fun workbook(offset: Int, distance: Boolean = false): ByteArray = XSSFWorkbook().use { wb ->
        wb.createSheet("Eski 2022")
        val sheet = wb.createSheet("1-kurs DI 2025")
        fun put(r: Int, vararg cells: Pair<Int, Any>) {
            val row = sheet.getRow(r) ?: sheet.createRow(r)
            cells.forEach { (c, v) -> row.createCell(c).apply { if (v is Number) setCellValue(v.toDouble()) else setCellValue(v.toString()) } }
        }
        val o = offset
        put(0, 0 to "I. O‘QUV JARAYONI JADVALI")
        put(2, 1 to "T/r", 3 to "Fanning malakaviy kodi", 7 to "O‘quv fanlari, bloklar va faoliyat turlarining nomlari",
            o to "Talabaning o‘quv yuklamasi, soatlarda", o + 18 to "Kreditlarning kurs, semestr va haftalar bo‘yicha taqsimoti")
        put(3, o to "Umumiy yuklama hajmi", o + 4 to "Auditoriya mashg‘ulotlari, soatlarda", o + 16 to "Mustaqil ta’lim")
        put(4, o + 4 to "Jami", o + 6 to "Ma’ruza", o + 8 to "Amaliy", o + 10 to "Laboratoriya", o + 12 to "Seminar", o + 14 to "Kurs ishi (loyihasi)")
        put(6, o + 18 to "Semestrlar")
        put(7, *(1..8).map { o + 16 + it * 2 to it }.toTypedArray())
        put(9, 1 to 1, 3 to 2, 7 to 3, o to 4)
        put(10, 1 to "1.00", 7 to "Majburiy fanlar", o to 4500)
        if (distance) {
            put(11, 1 to "1.09", 3 to "DAS1110", 7 to "Dasturlash 1,2", o to 300, o + 4 to 150, o + 16 to 150, o + 18 to 6, o + 20 to 4)
        } else {
            put(11, 1 to "1.09", 3 to "DAS1110", 7 to "Dasturlash 1,2", o to 300, o + 4 to 120, o + 6 to 30, o + 8 to 45, o + 10 to 45,
                o + 16 to 180, o + 18 to 6, o + 20 to 4)
        }
        put(12, 1 to "1.10", 3 to "AKY1104", 7 to "Akademik yozuv", o to 120, o + 4 to 48, o + 8 to 48, o + 16 to 70, o + 18 to 4)
        put(13, 1 to "2.00", 7 to "Tanlov fanlari", o to 1800)
        put(14, 1 to "2.04", 3 to "PDT2504", 7 to "Python dasturlash tili", o to 120, o + 4 to 48, o + 6 to 24, o + 8 to 24, o + 16 to 72, o + 26 to 4)
        put(15, 3 to "PHPDT2504", 7 to "PHP dasturlash tili")
        put(16, 7 to "Jami:", o to 6300)
        put(17, 7 to "Malakaviy amaliyotlar", o to 900)
        put(18, 7 to "HAMMASI:", o to 7200)
        put(19, 3 to "XXX9999", 7 to "Jadvaldan keyingi qator")
        ByteArrayOutputStream().also(wb::write).toByteArray()
    }

    @Test
    fun `fanlar, soatlar, semestr kreditlari, bloklar va tanlov muqobillari o'qiladi`() {
        val result = CurriculumWorkbookParser.parse(ByteArrayInputStream(workbook(offset = 26)))

        assertEquals("1-kurs DI 2025", result.sheet)
        assertEquals(listOf(0, 4), result.sheets.map { it.rowCount })
        assertEquals(listOf("DAS1110", "AKY1104", "PDT2504", "PHPDT2504"), result.rows.map { it.code })

        val programming = result.rows[0]
        assertEquals("1.09", programming.rowNumber)
        assertEquals(REQUIRED, programming.planItemType)
        assertEquals(listOf(300, 120, 30, 45, 45, 0, 180), with(programming) {
            listOf(totalHours, auditoryHours, lectureHours, practicalHours, laboratoryHours, seminarHours, selfStudyHours)
        })
        assertEquals(mapOf(1 to 6, 2 to 4), programming.semesterCredits)
        assertTrue(programming.issues.isEmpty())

        // Auditoriya + mustaqil umumiy yuklamaga teng emas — ogohlantirish
        assertTrue(result.rows[1].issues.single().contains("umumiy yuklamaga"))

        val (python, php) = result.rows.drop(2)
        assertEquals(ELECTIVE, python.planItemType)
        assertEquals(mapOf(5 to 4), python.semesterCredits)
        assertTrue(php.alternative)
        assertEquals("2.04", php.rowNumber)
        assertEquals(python.semesterCredits, php.semesterCredits)
        assertEquals(python.lectureHours, php.lectureHours)
    }

    @Test
    fun `ustunlar siljigan va masofaviy (turlarga bo'linmagan) reja ham o'qiladi`() {
        val result = CurriculumWorkbookParser.parse(ByteArrayInputStream(workbook(offset = 29, distance = true)), "1-kurs DI 2025")

        val programming = result.rows.first()
        assertEquals(150, programming.auditoryHours)
        assertEquals(0, programming.lectureHours + programming.practicalHours + programming.laboratoryHours + programming.seminarHours)
        assertEquals(mapOf(1 to 6, 2 to 4), programming.semesterCredits)
    }

    /**
     * 1-kurs masofaviy KI 2025 faylidagi kabi: yashirin eski varaq, sarlavha (bitta katakda yoki qo'shni kataklarda),
     * kirill harfi aralash kod va nom, "2.01." T/r, kurs ishi ustunida KI/KL belgilari.
     */
    private fun ki2025(headerInOneCell: Boolean): ByteArray = XSSFWorkbook().use { wb ->
        val o = 26
        fun org.apache.poi.ss.usermodel.Sheet.put(r: Int, vararg cells: Pair<Int, Any>) {
            val row = getRow(r) ?: createRow(r)
            cells.forEach { (c, v) -> row.createCell(c).apply { if (v is Number) setCellValue(v.toDouble()) else setCellValue(v.toString()) } }
        }
        fun org.apache.poi.ss.usermodel.Sheet.table(code: String) {
            put(6, 1 to "T/r", 3 to "Fanning malakaviy kodi", 7 to "O‘quv fanlari, bloklar va faoliyat turlarining nomlari",
                o to "Talabaning o‘quv yuklamasi, soatlarda")
            put(7, o to "Umumiy yuklama hajmi", o + 4 to "Auditoriya mashg‘ulotlari, soatlarda", o + 16 to "Mustaqil ta’lim")
            put(8, o + 4 to "Jami", o + 6 to "Ma’ruza", o + 8 to "Amaliy", o + 10 to "Laboratoriya", o + 12 to "Seminar", o + 14 to "Kurs ishi (loyihasi)")
            put(10, o + 18 to "Semestrlar")
            put(11, *(1..8).map { o + 16 + it * 2 to it }.toTypedArray())
            put(12, 1 to "1.00", 7 to "Majburiy fanlar")
            put(13, 1 to "1.01", 3 to code, 7 to "O'zbekistonning еng yangi tarixi", o to 120, o + 4 to 48, o + 6 to 24, o + 12 to 24, o + 16 to 72, o + 18 to 4)
            put(14, 1 to "1.11", 3 to "MAB1306", 7 to "Ma'lumotlar bazasi", o to 180, o + 4 to 72, o + 6 to 24, o + 8 to 24, o + 10 to 24,
                o + 14 to "KI", o + 16 to 108, o + 22 to 6)
            put(15, 1 to "1.22", 3 to "КМА1606", 7 to "Kompyuter arxitekturasi", o to 180, o + 4 to 72, o + 6 to 24, o + 8 to 24,
                o + 10 to 24, o + 14 to "KL", o + 16 to 108, o + 28 to 6)
            put(16, 1 to "2.00", 7 to "Tanlov fanlari")
            put(17, 1 to "2.01.", 3 to "ET2504", 7 to "Energiya tejamkorligi", o to 120, o + 4 to 48, o + 6 to 24, o + 12 to 24, o + 16 to 72, o + 26 to 4)
            put(18, 3 to "PP2504", 7 to "Pedagogika va psixologiya")
            put(19, 7 to "HAMMASI")
        }
        wb.createSheet("1-курс ААТ- 2022").table("ESKI2022")
        wb.setSheetHidden(0, true)
        val sheet = wb.createSheet("1-курс_KI_2025 ")
        if (headerInOneCell) {
            sheet.put(1, 22 to "Ta’lim yo‘nalishi: 60610300 - Kompyuter injiniringi\n",
                51 to "Akademik daraja - BAKALAVR \nO‘qish shakli - kredit tizimi     \nTa’lim shakli - masofaviy\n" +
                    "O‘qish muddati - 4 yil\nKvalifikatsiya - Kompyuter \n                          tizimlari muhandisi  ")
        } else {
            sheet.put(1, 24 to "Ta’lim yo‘nalishi: \n60610300 - Kompyuter injiniringi", 49 to "Akademik daraja", 55 to "-", 56 to "BAKALAVR")
            sheet.put(2, 49 to "O‘qish shakli", 55 to "-", 56 to "kredit tizimi")
            sheet.put(3, 49 to "Ta’lim shakli", 55 to "-", 56 to "масофавий")
            sheet.put(4, 49 to "O‘qish muddati", 55 to "-", 56 to "4 yil")
            sheet.put(5, 49 to "Kvalifikatsiya", 55 to "-", 56 to "Kompyuter tizimlari muhandisi")
        }
        sheet.table("UEY1104")
        ByteArrayOutputStream().also(wb::write).toByteArray()
    }

    @Test
    fun `yashirin varaq o'qilmaydi, kirill harflari lotinga o'tadi, T r nuqtasi tozalanadi, KI va KL taniladi`() {
        val result = CurriculumWorkbookParser.parse(ByteArrayInputStream(ki2025(headerInOneCell = true)))

        assertEquals(listOf("1-курс_KI_2025 "), result.sheets.map { it.name })
        assertEquals(listOf("UEY1104", "MAB1306", "KMA1606", "ET2504", "PP2504"), result.rows.map { it.code })
        assertEquals("O'zbekistonning eng yangi tarixi", result.rows[0].name)
        assertEquals(listOf("2.01", "2.01"), result.rows.takeLast(2).map { it.rowNumber })
        assertEquals(COURSE_WORK, result.rows[1].courseWorkType)
        assertEquals(COURSE_PROJECT, result.rows[2].courseWorkType)
        assertTrue(result.rows.all { it.issues.isEmpty() })
        // To'liq kirill so'zlar o'zgarmaydi
        assertEquals("Ўзбекистон тарихи", CurriculumWorkbookParser.latinize("Ўзбекистон тарихи"))
    }

    @Test
    fun `sarlavha bitta katakda ham, qo'shni kataklarda ham o'qiladi`() {
        listOf(true, false).forEach { oneCell ->
            val header = requireNotNull(CurriculumWorkbookParser.parse(ByteArrayInputStream(ki2025(oneCell))).header)
            assertEquals("60610300", header.programCode)
            assertEquals("Kompyuter injiniringi", header.programName)
            assertEquals("BAKALAVR", header.degree)
            assertEquals(EducationForm.DISTANCE, header.educationForm)
            assertEquals(4, header.durationYears)
            assertEquals("Kompyuter tizimlari muhandisi", header.qualification)
        }
    }

    @Test
    fun `soatlar semestrlarga kredit ulushi bo'yicha bo'linadi, yig'indi saqlanadi`() {
        assertEquals(listOf(18, 12), CurriculumWorkbookParser.splitByCredits(30, listOf(6, 4)))
        assertEquals(listOf(14, 10), CurriculumWorkbookParser.splitByCredits(24, listOf(6, 4)))
        assertEquals(listOf(45), CurriculumWorkbookParser.splitByCredits(45, listOf(5)))
        assertEquals(listOf(0, 0), CurriculumWorkbookParser.splitByCredits(0, listOf(4, 4)))
        assertEquals(7, CurriculumWorkbookParser.splitByCredits(7, listOf(1, 1, 1)).sum())
    }
}
