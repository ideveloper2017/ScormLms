package uz.scorm.lms.app.v1.curriculum.importer

import org.apache.poi.ss.usermodel.Cell
import org.apache.poi.ss.usermodel.CellType
import org.apache.poi.ss.usermodel.DataFormatter
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.ss.usermodel.WorkbookFactory
import uz.scorm.lms.app.v1.curriculum.model.CurriculumComponentType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCourseWorkType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import uz.scorm.lms.app.v1.student.model.EducationForm
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
    /** "Kurs ishi (loyihasi)" ustunidagi KI / KL belgisi */
    val courseWorkType: CurriculumCourseWorkType? = null,
)

data class ParsedSheet(val name: String, val rowCount: Int)

/** Reja sarlavhasi (fanlar jadvalidan yuqorida): "Ta'lim yo'nalishi: 60610300 - ...", "Ta'lim shakli - masofaviy" va h.k. */
data class ParsedHeader(
    val programCode: String? = null,
    val programName: String? = null,
    val degree: String? = null,
    val educationFormText: String? = null,
    val educationForm: EducationForm? = null,
    val durationYears: Int? = null,
    val qualification: String? = null,
)

/** Fan bo'lmagan reja qismi (malakaviy amaliyot, YaDA): semestr va hafta o'quv jarayoni jadvalidan aniqlanishi mumkin. */
data class ParsedComponent(
    val type: CurriculumComponentType,
    val name: String,
    val semester: Int?,
    val credits: Int,
    val hours: Int,
    val weeks: Int? = null,
)

/** "I. O'quv jarayoni jadvali" qatori: kurs va haftalar kodlari (1-haftadan; "" — nazariy ta'lim). */
data class ParsedScheduleRow(val course: Int, val weeks: List<String>)

data class ParsedWorkbook(
    val sheets: List<ParsedSheet>,
    val sheet: String?,
    val rows: List<ParsedPlanRow>,
    val header: ParsedHeader? = null,
    val components: List<ParsedComponent> = emptyList(),
    val schedule: List<ParsedScheduleRow> = emptyList(),
)

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
        // Yashirin varaqlar (eski nusxalar, ma'lumotnomalar) o'qilmaydi
        val parsed = (0 until workbook.numberOfSheets)
            .filterNot { workbook.isSheetHidden(it) || workbook.isSheetVeryHidden(it) }
            .map { workbook.getSheetAt(it) }
            .associate { sheet -> sheet.sheetName to findColumns(sheet)?.let { columns -> columns to readRows(sheet, columns) } }
        val sheets = parsed.map { (name, table) -> ParsedSheet(name, table?.second?.rows?.size ?: 0) }
        val selected = sheetName?.takeIf { it in parsed } ?: sheets.firstOrNull { it.rowCount > 0 }?.name
        val table = selected?.let { parsed[it] } ?: return@use ParsedWorkbook(sheets, selected, emptyList())
        val sheet = workbook.getSheet(selected)
        val schedule = readSchedule(sheet, table.first.headerRow)
        ParsedWorkbook(
            sheets, selected, table.second.rows, readHeader(sheet, table.first.headerRow),
            withSchedule(table.second.components, schedule), schedule,
        )
    }

    private data class PlanTable(val rows: List<ParsedPlanRow>, val components: List<ParsedComponent>)

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

    private fun readRows(sheet: Sheet, c: Columns): PlanTable {
        val rows = mutableListOf<ParsedPlanRow>()
        val components = mutableListOf<ParsedComponent>()
        var block = CurriculumPlanItemType.REQUIRED
        var primary: ParsedPlanRow? = null
        for (r in (c.headerRow + 1)..sheet.lastRowNum) {
            val row = sheet.getRow(r) ?: continue
            fun cell(col: Int?) = col?.let { row.getCell(it) }
            val rowNo = text(cell(c.rowNo)).replace("..", ".").trimEnd('.')
            val code = latinCode(text(cell(c.code)).replace(" ", ""))
            val name = latinize(text(cell(c.name)).replace(Regex("\\s+"), " "))
            val nameKey = norm(name)
            if (nameKey.startsWith("hammasi") || norm(rowNo).startsWith("izoh")) break
            // Blok sarlavhasi: "1.00 Majburiy fanlar" / "2.00 Tanlov fanlari"
            if (code.isEmpty() && nameKey.contains("fanlar")) {
                block = if (nameKey.contains("tanlov") || rowNo.startsWith("2")) CurriculumPlanItemType.ELECTIVE else CurriculumPlanItemType.REQUIRED
                primary = null
                continue
            }
            // Fan bo'lmagan qismlar: "Malakaviy amaliyot ...", "Yakuniy davlat attestatsiyasi"
            componentType(nameKey)?.takeIf { code.isEmpty() }?.let { type ->
                val credits = c.semesters.mapNotNull { (col, semester) -> number(row.getCell(col))?.takeIf { it > 0 }?.let { semester to it } }
                components += ParsedComponent(type, name, credits.minOfOrNull { it.first }, credits.sumOf { it.second },
                    number(cell(c.total)) ?: number(cell(c.selfStudy)) ?: 0)
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
            val courseWorkType = courseWorkType(courseWorkText)
            val issues = buildList {
                if (credits.isEmpty()) add("Semestrlar bo'yicha kredit topilmadi — qator import qilinmaydi")
                val creditHours = credits.values.sum() * HOURS_PER_CREDIT
                if (credits.isNotEmpty() && total != creditHours) add("Umumiy yuklama $total soat, kredit bo'yicha ${creditHours} soat bo'lishi kerak")
                if (auditory + selfStudy != total) add("Auditoriya ($auditory) + mustaqil ta'lim ($selfStudy) umumiy yuklamaga ($total) teng emas")
                if (typed > 0 && typed != auditory) add("Mashg'ulot turlari yig'indisi ($typed) auditoriya jamiga ($auditory) teng emas")
                if (courseWorkText.isNotEmpty() && number(cell(c.courseWork)) == null && courseWorkType == null) {
                    add("Kurs ishi ustunidagi \"$courseWorkText\" tushunilmadi (KI — kurs ishi, KL — kurs loyihasi) — e'tiborga olinmadi")
                }
            }
            val parsed = ParsedPlanRow(
                rowNumber = rowNo.ifEmpty { "-" }, code = code, name = name,
                planItemType = if (rowNo.startsWith("2")) CurriculumPlanItemType.ELECTIVE else block,
                alternative = false, totalHours = total, auditoryHours = auditory,
                lectureHours = lecture, practicalHours = practical, laboratoryHours = laboratory, seminarHours = seminar,
                courseWorkHours = number(cell(c.courseWork)) ?: 0, selfStudyHours = selfStudy,
                semesterCredits = credits.toSortedMap(), issues = issues, courseWorkType = courseWorkType,
            )
            rows += parsed
            primary = parsed
        }
        return PlanTable(rows, components)
    }

    private fun componentType(nameKey: String): CurriculumComponentType? = when {
        nameKey.startsWith("malakaviy amaliyot") -> CurriculumComponentType.PRACTICE
        "davlat attesta" in nameKey -> CurriculumComponentType.STATE_ATTESTATION
        else -> null
    }

    /**
     * "I. O'quv jarayoni jadvali": haftalar raqamlari (1..52) qatori, undan keyingi kurs qatorlari (I, II, III, IV)
     * har bir hafta kodini beradi. Oxirgi koddan keyingi bo'sh haftalar o'quv yiliga kirmaydi.
     */
    private fun readSchedule(sheet: Sheet, untilRow: Int): List<ParsedScheduleRow> {
        val weekRow = (0 until untilRow).mapNotNull(sheet::getRow).firstOrNull { row ->
            row.mapNotNull { number(it)?.takeIf { n -> n in 1..53 } }.let { it.size >= 40 && it == it.sorted() }
        } ?: return emptyList()
        val weekCols = weekRow.mapNotNull { cell -> number(cell)?.takeIf { it in 1..53 }?.let { cell.columnIndex to it } }.toMap()
        val firstWeekCol = weekCols.keys.min()
        val result = mutableListOf<ParsedScheduleRow>()
        for (r in weekRow.rowNum + 1 until untilRow) {
            val row = sheet.getRow(r) ?: continue
            val label = row.filter { it.columnIndex < firstWeekCol }.map(::text).firstOrNull(String::isNotEmpty) ?: continue
            val course = ROMAN[latinCode(label).uppercase()] ?: continue
            val byWeek = weekCols.entries.associate { (col, week) ->
                week to latinCode(text(row.getCell(col))).uppercase().replace(Regex("[^A-Z]"), "").take(3)
            }
            val last = byWeek.filterValues(String::isNotEmpty).keys.maxOrNull() ?: continue
            result += ParsedScheduleRow(course, (1..last).map { byWeek[it].orEmpty() })
        }
        return result
    }

    /** Amaliyot (M) va YaDA (B) haftalari; kredit ko'rsatilmagan bo'lsa semestr ham jadvaldagi joyidan olinadi. */
    private fun withSchedule(components: List<ParsedComponent>, schedule: List<ParsedScheduleRow>) = components.map { component ->
        val code = if (component.type == CurriculumComponentType.PRACTICE) "M" else "B"
        val rows = schedule.filter { code in it.weeks }
        val semester = component.semester ?: rows.lastOrNull()?.let { row ->
            // 1–21-haftalar (sentyabr–yanvar) — kuzgi semestr, qolgani bahorgi
            if (row.weeks.indexOf(code) < AUTUMN_WEEKS) row.course * 2 - 1 else row.course * 2
        }
        component.copy(semester = semester, weeks = rows.sumOf { row -> row.weeks.count { it == code } }.takeIf { it > 0 })
    }

    private val ROMAN = mapOf("I" to 1, "II" to 2, "III" to 3, "IV" to 4, "V" to 5, "VI" to 6)
    private const val AUTUMN_WEEKS = 21

    /**
     * Fanlar jadvalidan yuqoridagi sarlavha. Ikki xil yoziladi: bitta katakda qatorma-qator ("Ta'lim shakli - masofaviy")
     * yoki yorliq va qiymat qo'shni kataklarda ("Ta'lim shakli" | "-" | "масофавий").
     */
    private fun readHeader(sheet: Sheet, untilRow: Int): ParsedHeader {
        // Kataklar " | " bilan, qatorlar ROW belgisi bilan ajratiladi (katak ichidagi qator — "\n")
        val text = (0 until untilRow).mapNotNull(sheet::getRow).joinToString(ROW) { row ->
            row.map(::text).filter(String::isNotEmpty).joinToString(" | ")
        }.replace(Regex("[‘’ʻʼ`´]"), "'")
        fun value(label: String, wholeCell: Boolean = false): String? {
            val stop = if (wholeCell) "|$ROW" else "|$ROW\\n"
            return Regex("$label[\\s|:–-]*([^$stop]+)", RegexOption.IGNORE_CASE).find(text)?.groupValues?.get(1)
                ?.replace(Regex("\\s+"), " ")?.trim()?.ifEmpty { null }
        }
        val program = Regex("yo'nalishi[\\s|:–-]*(\\d{8})\\s*[–-]?\\s*([^|$ROW\\n]*)", RegexOption.IGNORE_CASE).find(text)
        val form = value("ta'lim shakli")
        return ParsedHeader(
            programCode = program?.groupValues?.get(1),
            programName = program?.groupValues?.get(2)?.replace(Regex("\\s+"), " ")?.trim()?.ifEmpty { null },
            degree = value("akademik daraja"),
            educationFormText = form,
            educationForm = form?.let(::educationForm),
            durationYears = value("o'qish muddati")?.let { Regex("\\d+").find(it)?.value?.toIntOrNull() },
            // Kvalifikatsiya katak ichida bir necha qatorga bo'linishi mumkin
            qualification = value("kvalifikatsiya", wholeCell = true),
        )
    }

    /** Ta'lim shakli matni (lotin yoki kirill) -> qiymat. */
    private fun educationForm(value: String): EducationForm? {
        val v = value.lowercase()
        return when {
            "masof" in v || "масоф" in v -> EducationForm.DISTANCE
            "kunduz" in v || "кундуз" in v -> EducationForm.FULL_TIME
            "sirtq" in v || "сиртқ" in v || "сиртк" in v -> EducationForm.PART_TIME
            "kechki" in v || "кечки" in v -> EducationForm.EVENING
            else -> null
        }
    }

    /** "Kurs ishi (loyihasi)" ustunidagi belgi: KI — kurs ishi, KL — kurs loyihasi (kirillda ham). */
    private fun courseWorkType(value: String): CurriculumCourseWorkType? =
        when (latinCode(value).uppercase().replace(Regex("[^\\p{L}]"), "")) {
            "KI", "KИ" -> CurriculumCourseWorkType.COURSE_WORK
            "KL", "KЛ" -> CurriculumCourseWorkType.COURSE_PROJECT
            else -> null
        }

    /** Fan kodi lotinda bo'ladi: unga tushib qolgan kirill harflari ("КМА1606") lotinga almashtiriladi. */
    fun latinCode(value: String): String = value.map { HOMOGLYPHS[it] ?: it }.joinToString("")

    /** Lotin yozuvidagi so'z ichiga tushib qolgan kirill harflari ("еng") lotinga almashtiriladi; to'liq kirill so'zlar o'zgarmaydi. */
    fun latinize(value: String): String = Regex("\\S+").replace(value) { match ->
        val word = match.value
        if (word.any { it in 'a'..'z' || it in 'A'..'Z' } && word.any { it in HOMOGLYPHS }) latinCode(word) else word
    }

    /** Ko'rinishi lotin harfiga o'xshash kirill harflari */
    private val HOMOGLYPHS = mapOf(
        'а' to 'a', 'е' to 'e', 'о' to 'o', 'р' to 'p', 'с' to 'c', 'у' to 'y', 'х' to 'x', 'к' to 'k', 'м' to 'm', 'т' to 't',
        'А' to 'A', 'В' to 'B', 'Е' to 'E', 'К' to 'K', 'М' to 'M', 'Н' to 'H', 'О' to 'O', 'Р' to 'P', 'С' to 'C', 'Т' to 'T',
        'У' to 'Y', 'Х' to 'X',
    )

    private const val ROW = "\u0001"

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
