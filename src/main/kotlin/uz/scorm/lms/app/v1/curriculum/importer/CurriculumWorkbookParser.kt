package uz.scorm.lms.app.v1.curriculum.importer

import org.apache.poi.ss.usermodel.Cell
import org.apache.poi.ss.usermodel.CellType
import org.apache.poi.ss.usermodel.DataFormatter
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.ss.usermodel.WorkbookFactory
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import java.io.InputStream
import kotlin.math.roundToInt

/** Ishchi o'quv rejadagi bitta fan qatori (tanlov muqobillari raqamli qatorning soat/kreditlarini oladi). */
data class ParsedPlanRow(
    val rowNumber: String,
    val code: String,
    val name: String,
    val planItemType: CurriculumPlanItemType,
    val alternative: Boolean,
    val totalHours: Int,
    val auditoryHours: Int,
    val lectureHours: Int,
    val practicalHours: Int,
    val laboratoryHours: Int,
    val seminarHours: Int,
    val courseWorkHours: Int,
    val selfStudyHours: Int,
    /** semestr -> kredit */
    val semesterCredits: Map<Int, Int>,
    val issues: List<String>,
)

data class ParsedSheet(val name: String, val rowCount: Int)

data class ParsedWorkbook(val sheets: List<ParsedSheet>, val sheet: String?, val rows: List<ParsedPlanRow>)

/**
 * NamDTU ishchi o'quv reja Excel faylidan "II. O'QUV REJASI" bo'limini o'qiydi.
 * Ustunlar sarlavha matni bo'yicha topiladi (fayllarda joylashuvi har xil), 1 kredit = 30 soat.
 */
object CurriculumWorkbookParser {
    const val HOURS_PER_CREDIT = 30
    private val formatter = DataFormatter()

    private data class Columns(
        val headerRow: Int,
        val rowNo: Int?,
        val code: Int,
        val name: Int,
        val total: Int?,
        val auditory: Int?,
        val lecture: Int?,
        val practical: Int?,
        val laboratory: Int?,
        val seminar: Int?,
        val courseWork: Int?,
        val selfStudy: Int?,
        val semesters: Map<Int, Int>,
    )

    fun parse(input: InputStream, sheetName: String? = null): ParsedWorkbook = WorkbookFactory.create(input).use { workbook ->
        val parsed = (0 until workbook.numberOfSheets).map { workbook.getSheetAt(it) }
            .associate { sheet -> sheet.sheetName to (findColumns(sheet)?.let { readRows(sheet, it) } ?: emptyList()) }
        val sheets = parsed.map { (name, rows) -> ParsedSheet(name, rows.size) }
        val selected = sheetName?.takeIf { it in parsed } ?: sheets.firstOrNull { it.rowCount > 0 }?.name
        ParsedWorkbook(sheets, selected, selected?.let { parsed.getValue(it) } ?: emptyList())
    }

    /** Soatni semestrlarga kredit ulushi bo'yicha bo'ladi (eng katta qoldiq usuli) — yig'indi saqlanadi. */
    fun splitByCredits(value: Int, credits: List<Int>): List<Int> {
        val total = credits.sum()
        if (total <= 0 || credits.size <= 1) return credits.map { if (credits.size == 1) value else 0 }
        val exact = credits.map { value.toDouble() * it / total }
        val result = exact.map { it.toInt() }.toMutableList()
        var remainder = value - result.sum()
        exact.withIndex().sortedByDescending { it.value - it.value.toInt() }.forEach {
            if (remainder > 0) { result[it.index]++; remainder-- }
        }
        return result
    }

    private fun findColumns(sheet: Sheet): Columns? {
        val header = sheet.firstOrNull { row -> row.any { norm(text(it)).contains("malakaviy kodi") } } ?: return null
        val r0 = header.rowNum
        fun find(predicate: (String) -> Boolean, from: Int = r0, to: Int = r0 + 8, minCol: Int = 0, maxCol: Int = Int.MAX_VALUE): Int? {
            for (r in from..to) {
                val row = sheet.getRow(r) ?: continue
                row.firstOrNull { it.columnIndex in minCol until maxCol && predicate(norm(text(it))) }?.let { return it.columnIndex }
            }
            return null
        }
        val code = find({ it.contains("malakaviy kodi") }, r0, r0) ?: return null
        val name = find({ it.contains("fanlari") || it.contains("nomlari") }, r0, r0) ?: return null
        val selfStudy = find({ it.startsWith("mustaqil") })
        val auditoryGroup = find({ it.startsWith("auditoriya") })
        val auditory = auditoryGroup?.let { group -> find({ it == "jami" }, r0 + 1, r0 + 3, group, selfStudy ?: Int.MAX_VALUE) }
        val semesters = mutableMapOf<Int, Int>()
        for (r in r0..r0 + 8) {
            val row = sheet.getRow(r) ?: continue
            if (row.none { norm(text(it)) == "semestrlar" }) continue
            val next = sheet.getRow(r + 1) ?: break
            next.forEach { cell -> number(cell)?.takeIf { it in 1..12 && cell.columnIndex > name }?.let { semesters[cell.columnIndex] = it } }
            break
        }
        if (semesters.isEmpty()) return null
        return Columns(
            headerRow = r0,
            rowNo = find({ it == "t/r" || it == "№" }, r0, r0),
            code = code,
            name = name,
            total = find({ it.startsWith("umumiy yuklama") }),
            auditory = auditory,
            lecture = find({ it.startsWith("ma'ruza") }),
            practical = find({ it == "amaliy" }),
            laboratory = find({ it.startsWith("laboratoriya") }),
            seminar = find({ it == "seminar" }),
            courseWork = find({ it.startsWith("kurs ishi") || it.startsWith("kurs loyihasi") }),
            selfStudy = selfStudy,
            semesters = semesters,
        )
    }

    private fun readRows(sheet: Sheet, c: Columns): List<ParsedPlanRow> {
        val rows = mutableListOf<ParsedPlanRow>()
        var block = CurriculumPlanItemType.REQUIRED
        var primary: ParsedPlanRow? = null
        for (r in (c.headerRow + 1)..sheet.lastRowNum) {
            val row = sheet.getRow(r) ?: continue
            fun cell(col: Int?) = col?.let { row.getCell(it) }
            val rowNo = text(cell(c.rowNo)).replace("..", ".")
            val code = text(cell(c.code)).replace(" ", "")
            val name = text(cell(c.name)).replace(Regex("\\s+"), " ")
            val nameKey = norm(name)
            if (nameKey.startsWith("hammasi") || norm(rowNo).startsWith("izoh")) break
            // Blok sarlavhasi: "1.00 Majburiy fanlar" / "2.00 Tanlov fanlari"
            if (code.isEmpty() && nameKey.contains("fanlar")) {
                block = if (nameKey.contains("tanlov") || rowNo.startsWith("2")) CurriculumPlanItemType.ELECTIVE else CurriculumPlanItemType.REQUIRED
                primary = null
                continue
            }
            if (!code.any(Char::isLetter) || !name.any(Char::isLetter)) continue
            val base = primary
            if (rowNo.isEmpty() && base != null) {
                // Tanlov muqobili: raqamli qatorning soat va kreditlarini oladi
                rows += base.copy(code = code, name = name, alternative = true, issues = emptyList())
                continue
            }
            val num = { col: Int? -> number(cell(col)) ?: 0 }
            val lecture = num(c.lecture); val practical = num(c.practical)
            val laboratory = num(c.laboratory); val seminar = num(c.seminar)
            val typed = lecture + practical + laboratory + seminar
            val auditory = number(cell(c.auditory)) ?: typed
            val selfStudy = num(c.selfStudy)
            val total = number(cell(c.total)) ?: (auditory + selfStudy)
            val credits = c.semesters.mapNotNull { (col, semester) -> number(row.getCell(col))?.takeIf { it > 0 }?.let { semester to it } }.toMap()
            val courseWorkText = text(cell(c.courseWork))
            val issues = buildList {
                if (credits.isEmpty()) add("Semestrlar bo'yicha kredit topilmadi — qator import qilinmaydi")
                val creditHours = credits.values.sum() * HOURS_PER_CREDIT
                if (credits.isNotEmpty() && total != creditHours) add("Umumiy yuklama $total soat, kredit bo'yicha ${creditHours} soat bo'lishi kerak")
                if (auditory + selfStudy != total) add("Auditoriya ($auditory) + mustaqil ta'lim ($selfStudy) umumiy yuklamaga ($total) teng emas")
                if (typed > 0 && typed != auditory) add("Mashg'ulot turlari yig'indisi ($typed) auditoriya jamiga ($auditory) teng emas")
                if (courseWorkText.isNotEmpty() && number(cell(c.courseWork)) == null) add("Kurs ishi ustunidagi \"$courseWorkText\" soat emas — e'tiborga olinmadi")
            }
            val parsed = ParsedPlanRow(
                rowNumber = rowNo.ifEmpty { "-" }, code = code, name = name,
                planItemType = if (rowNo.startsWith("2")) CurriculumPlanItemType.ELECTIVE else block,
                alternative = false, totalHours = total, auditoryHours = auditory,
                lectureHours = lecture, practicalHours = practical, laboratoryHours = laboratory, seminarHours = seminar,
                courseWorkHours = number(cell(c.courseWork)) ?: 0, selfStudyHours = selfStudy,
                semesterCredits = credits.toSortedMap(), issues = issues,
            )
            rows += parsed
            primary = parsed
        }
        return rows
    }

    private fun text(cell: Cell?): String = cell?.let { formatter.formatCellValue(it).trim() }.orEmpty()

    private fun number(cell: Cell?): Int? {
        cell ?: return null
        val type = if (cell.cellType == CellType.FORMULA) cell.cachedFormulaResultType else cell.cellType
        return when (type) {
            CellType.NUMERIC -> cell.numericCellValue.roundToInt()
            CellType.STRING -> cell.stringCellValue.trim().replace(',', '.').toDoubleOrNull()?.roundToInt()
            else -> null
        }
    }

    /** Taqqoslash uchun: kichik harf, apostroflar bir xil, bo'shliqlar bitta. */
    fun norm(value: String): String = value.lowercase()
        .replace(Regex("[‘’ʻʼ`´]"), "'")
        .replace(Regex("\\s+"), " ")
        .trim()
}
