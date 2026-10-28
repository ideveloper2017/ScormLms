package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportAction
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportApplyRequest
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportComponentDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportHeaderDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportPreviewDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportResultDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportRowDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportSemesterCredit
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportSheetDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumScheduleDto
import uz.scorm.lms.app.v1.curriculum.importer.CurriculumWorkbookParser
import uz.scorm.lms.app.v1.curriculum.importer.ParsedHeader
import uz.scorm.lms.app.v1.curriculum.importer.ParsedPlanRow
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumComponent
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumScheduleRow
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumComponentRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumScheduleRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository

/**
 * Ishchi o'quv rejani Excel'dan import qilish: 1) ko'rib chiqish (fanlar, soatlar, tizimdagi fanga moslik),
 * 2) qo'llash — fanlar har semestr uchun alohida qator, soatlar semestrlarga kredit ulushi bo'yicha bo'linadi.
 */
@Service
class CurriculumImportService(
    private val versions: ProgramCurriculumVersionRepository,
    private val items: ProgramCurriculumSubjectRepository,
    private val subjects: SubjectRepository,
    private val academicPeriodService: AcademicPeriodService,
    private val auditService: AuditService,
    private val curriculumService: ProgramCurriculumService,
    private val components: ProgramCurriculumComponentRepository,
    private val schedule: ProgramCurriculumScheduleRepository,
) {
    @Transactional(readOnly = true)
    fun preview(id: Long, file: MultipartFile, sheet: String?): CurriculumImportPreviewDto {
        val version = requireDraft(id)
        val fileName = file.originalFilename.orEmpty().lowercase()
        require(!file.isEmpty) { "Excel fayl tanlanmagan" }
        require(file.size <= MAX_FILE_SIZE) { "Fayl hajmi 10 MB dan oshmasligi kerak" }
        require(fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) { "Faqat .xlsx yoki .xls fayl qabul qilinadi" }
        val workbook = try {
            file.inputStream.use { CurriculumWorkbookParser.parse(it, sheet) }
        } catch (_: Exception) {
            throw IllegalArgumentException("Excel faylni o'qib bo'lmadi — ishchi o'quv reja fayli ekanini tekshiring")
        }
        val header = workbook.header
        return CurriculumImportPreviewDto(
            sheets = workbook.sheets.map { CurriculumImportSheetDto(it.name, it.rowCount) },
            sheet = workbook.sheet,
            rows = match(version, workbook.rows),
            header = header?.let {
                CurriculumImportHeaderDto(it.programCode, it.programName, it.degree, it.educationForm?.name, it.educationFormText,
                    it.durationYears, it.qualification)
            },
            warnings = header?.let { headerWarnings(version, it) }.orEmpty(),
            components = workbook.components.map { CurriculumImportComponentDto(it.type, it.name, it.semester, it.credits, it.hours, it.weeks) },
            schedule = workbook.schedule.map { CurriculumScheduleDto(it.course, it.weeks) },
        )
    }

    /** Fayl sarlavhasi rejaga mos kelmasa ogohlantiradi: yo'nalish, ta'lim shakli, o'qish muddati (semestrlar soni). */
    private fun headerWarnings(version: ProgramCurriculumVersion, header: ParsedHeader): List<String> = buildList {
        val planCode = version.program.code?.filter(Char::isDigit).orEmpty()
        if (header.programCode != null && planCode.isNotEmpty() && header.programCode != planCode) {
            add("Fayldagi yo'nalish ${header.programCode}${header.programName?.let { " – $it" }.orEmpty()}, " +
                "reja yo'nalishi ${version.program.code} – ${version.program.name}")
        }
        if (header.educationForm != null && header.educationForm != version.educationForm) {
            add("Faylda ta'lim shakli ${FORMS.getValue(header.educationForm)}, rejada ${FORMS.getValue(version.educationForm)}")
        }
        header.durationYears?.takeIf { it * 2 != version.semesterCount }?.let { years ->
            add("Faylda o'qish muddati $years yil (${years * 2} semestr), rejada ${version.semesterCount} semestr")
        }
    }

    @Transactional
    fun apply(id: Long, request: CurriculumImportApplyRequest, actorId: Long): CurriculumImportResultDto {
        val version = requireDraft(id)
        require(request.rows.size <= MAX_ROWS) { "Bir martada $MAX_ROWS tadan ortiq qator import qilinmaydi" }
        var created = 0
        var added = 0
        var skipped = 0
        for (row in request.rows.filter { it.action != CurriculumImportAction.SKIP }) {
            val credits = row.semesterCredits.sortedBy { it.semester }
            require(credits.isNotEmpty()) { "${row.rowNumber} ${row.name}: semestr kreditlari yo'q" }
            val subject = when (row.action) {
                CurriculumImportAction.USE_EXISTING -> existingSubject(version, requireNotNull(row.subjectId) { "${row.name}: tizimdagi fan tanlanmagan" })
                else -> createSubject(row, credits.sumOf { it.credits }).also { created++ }
            }
            val shares = credits.map { it.credits }
            fun split(value: Int) = CurriculumWorkbookParser.splitByCredits(value, shares)
            val lecture = split(row.lectureHours); val practical = split(row.practicalHours)
            val laboratory = split(row.laboratoryHours); val seminar = split(row.seminarHours)
            val courseWork = split(row.courseWorkHours); val auditory = split(row.auditoryHours)
            val selfStudy = split(row.selfStudyHours)
            credits.forEachIndexed { i, (semester, semesterCredits) ->
                require(semester in 1..version.semesterCount) { "${row.name}: $semester-semestr reja chegarasidan tashqarida" }
                require(semesterCredits in 1..60) { "${row.name}: kredit 1..60 oralig'ida bo'lishi kerak" }
                academicPeriodService.requireActiveSemester(semester)
                if (items.existsByCurriculumVersionIdAndSubjectIdAndSemesterAndDeletedFalse(id, requireNotNull(subject.id), semester)) {
                    skipped++
                    return@forEachIndexed
                }
                val typed = lecture[i] + practical[i] + laboratory[i] + seminar[i]
                items.save(ProgramCurriculumSubject(
                    curriculumVersion = version, subject = subject,
                    subjectCodeSnapshot = row.code.trim().take(100), subjectNameSnapshot = row.name.trim().take(500),
                    creditsSnapshot = semesterCredits, semester = semester, planItemType = row.planItemType,
                ).apply {
                    planRowNumber = row.rowNumber.trim().take(20).takeIf { it.isNotEmpty() && it != "-" }
                    lectureHours = lecture[i]; practicalHours = practical[i]
                    laboratoryHours = laboratory[i]; seminarHours = seminar[i]; courseWorkHours = courseWork[i]
                    // Kurs ishi (loyihasi) fan tugaydigan semestrda topshiriladi
                    courseWorkType = row.courseWorkType?.takeIf { i == credits.lastIndex }
                    auditoryHours = if (typed > 0) typed else auditory[i]
                    selfStudyHours = selfStudy[i]
                })
                added++
            }
        }
        val componentsAdded = addComponents(version, request.components)
        if (request.schedule.isNotEmpty()) replaceSchedule(version, request.schedule)
        request.qualification?.trim()?.take(255)?.ifBlank { null }?.takeIf { version.qualification.isNullOrBlank() }?.let {
            version.qualification = it
            versions.save(version)
        }
        auditService.logAction("CURRICULUM_IMPORTED", actorId,
            "curriculum=$id; subjectsCreated=$created; items=$added; skipped=$skipped; components=$componentsAdded; schedule=${request.schedule.size}")
        return CurriculumImportResultDto(created, added, skipped, curriculumService.get(id), componentsAdded)
    }

    /** Malakaviy amaliyot va YaDA: rejada shu tur va semestr bilan qism bo'lmasa qo'shiladi. */
    private fun addComponents(version: ProgramCurriculumVersion, requested: List<CurriculumImportComponentDto>): Int {
        val existing = components.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscTypeAsc(requireNotNull(version.id))
        var added = 0
        requested.forEach { c ->
            val semester = c.semester ?: version.semesterCount
            require(semester in 1..version.semesterCount) { "${c.name}: $semester-semestr reja chegarasidan tashqarida" }
            if (existing.any { it.type == c.type && it.semester == semester }) return@forEach
            components.save(ProgramCurriculumComponent(
                curriculumVersion = version, type = c.type, name = c.name.trim().take(500).ifEmpty { c.type.name }, semester = semester,
                credits = c.credits.coerceIn(0, 60), hours = c.hours.coerceIn(0, 5000), weeks = c.weeks?.coerceIn(0, 52),
            ))
            added++
        }
        return added
    }

    /** O'quv jarayoni jadvali fayldagisi bilan almashtiriladi (kurs qatorlari joyida yangilanadi). */
    private fun replaceSchedule(version: ProgramCurriculumVersion, rows: List<CurriculumScheduleDto>) {
        require(rows.map { it.course }.toSet().size == rows.size && rows.all { it.course in 1..6 }) { "O'quv jarayoni jadvalida kurslar noto'g'ri" }
        require(rows.all { row -> row.weeks.size <= 53 && row.weeks.all { WEEK_CODE.matches(it) } }) { "O'quv jarayoni jadvalida noto'g'ri hafta kodi" }
        val existing = schedule.findAllByCurriculumVersionIdAndDeletedFalseOrderByCourseAsc(requireNotNull(version.id)).associateBy { it.course }
        rows.forEach { row ->
            schedule.save((existing[row.course] ?: ProgramCurriculumScheduleRow(version, row.course, "")).apply { weeks = row.weeks.joinToString(",") })
        }
        schedule.deleteAll(existing.values.filter { old -> rows.none { it.course == old.course } })
    }

    /** Reja qatorini tizimdagi fanga moslash: kod+nom, so'ng nom; topilmasa yangi fan (band kodga qo'shimcha). */
    private fun match(version: ProgramCurriculumVersion, rows: List<ParsedPlanRow>): List<CurriculumImportRowDto> {
        val catalog = subjects.findAll().filter { !it.deleted }
        val eligible = catalog.filter { it.active && (it.program == null || it.program?.id == version.program.id) }
        // Katalogdagi kod va nomlarda ham kirill harflari aralashgan bo'lishi mumkin
        val byCode = eligible.groupBy { it.code?.let { code -> CurriculumWorkbookParser.latinCode(code.trim()).uppercase() } }
        val byName = eligible.groupBy { nameKey(it.name) }
        val usedCodes = catalog.mapNotNull { it.code?.trim()?.uppercase() }.toMutableSet()
        return rows.map { row ->
            val existing = byCode[row.code.uppercase()]?.firstOrNull { nameKey(it.name) == nameKey(row.name) }
                ?: byName[nameKey(row.name)]?.singleOrNull()
            val outside = row.semesterCredits.keys.filter { it !in 1..version.semesterCount }
            val issues = row.issues + listOfNotNull(
                outside.takeIf { it.isNotEmpty() }?.let { "Semestr(lar) ${it.joinToString()} reja chegarasidan (${version.semesterCount}) tashqarida" },
            )
            val base = CurriculumImportRowDto(
                rowNumber = row.rowNumber, code = row.code, name = row.name, planItemType = row.planItemType,
                alternative = row.alternative, totalHours = row.totalHours, auditoryHours = row.auditoryHours,
                lectureHours = row.lectureHours, practicalHours = row.practicalHours, laboratoryHours = row.laboratoryHours,
                seminarHours = row.seminarHours, courseWorkHours = row.courseWorkHours, selfStudyHours = row.selfStudyHours,
                semesterCredits = row.semesterCredits.map { (semester, credits) -> CurriculumImportSemesterCredit(semester, credits) },
                issues = issues, courseWorkType = row.courseWorkType,
            )
            when {
                row.semesterCredits.isEmpty() || outside.isNotEmpty() -> base.copy(action = CurriculumImportAction.SKIP)
                existing != null -> base.copy(action = CurriculumImportAction.USE_EXISTING, subjectId = existing.id,
                    subjectCode = existing.code, subjectName = existing.name)
                else -> {
                    val code = uniqueCode(row.code, usedCodes)
                    usedCodes += code.uppercase()
                    base.copy(action = CurriculumImportAction.CREATE, createCode = code,
                        issues = issues + listOfNotNull("Kod ${row.code} band — yangi fan $code kodi bilan yaratiladi".takeIf { code != row.code }))
                }
            }
        }
    }

    private fun existingSubject(version: ProgramCurriculumVersion, subjectId: Long): Subject {
        val subject = subjects.findById(subjectId).orElseThrow { NoSuchElementException("Fan topilmadi: $subjectId") }
        require(!subject.deleted && subject.active) { "${subject.name}: faqat faol fan rejaga qo'shiladi" }
        require(subject.program == null || subject.program?.id == version.program.id) {
            "${subject.name}: fan boshqa ta'lim dasturiga tegishli"
        }
        return subject
    }

    private fun createSubject(row: CurriculumImportRowDto, credits: Int): Subject {
        val code = (row.createCode ?: row.code).trim()
        require(code.isNotEmpty() && code.length <= 100) { "${row.name}: fan kodi majburiy" }
        require(!subjects.existsByCode(code)) { "Fan kodi $code band — ko'rib chiqishni qayta bajaring" }
        require(row.name.isNotBlank()) { "Fan nomi majburiy" }
        // Umumiy katalog fani (program = null): boshqa yo'nalishlar rejalari ham shu fanga moslanadi
        return subjects.save(Subject(name = row.name.trim().take(500), code = code, credits = credits.coerceIn(1, 60), active = true))
    }

    private fun uniqueCode(code: String, used: Set<String>): String {
        if (code.uppercase() !in used) return code
        return ('A'..'Z').map { "$code-$it" }.firstOrNull { it.uppercase() !in used } ?: "$code-${System.nanoTime() % 10000}"
    }

    /**
     * Nom kaliti: faqat harf va raqamlar ("Dasturlash 1, 2" = "Dasturlash 1,2", apostrof turlari farqlanmaydi,
     * lotin so'z ichidagi kirill harfi — "еng" — lotinga o'tkaziladi).
     */
    private fun nameKey(value: String) =
        CurriculumWorkbookParser.norm(CurriculumWorkbookParser.latinize(value)).replace(Regex("[^\\p{L}\\p{N}]"), "")

    private fun requireDraft(id: Long) = (versions.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Curriculum versiyasi topilmadi: $id")).also {
        require(it.status == CurriculumStatus.DRAFT) { "Faqat DRAFT o'quv rejaga import qilinadi" }
    }

    private companion object {
        const val MAX_FILE_SIZE = 10L * 1024 * 1024
        const val MAX_ROWS = 500
        val WEEK_CODE = Regex("[A-Z]{0,3}")
        val FORMS = mapOf(
            EducationForm.FULL_TIME to "kunduzgi", EducationForm.PART_TIME to "sirtqi",
            EducationForm.EVENING to "kechki", EducationForm.DISTANCE to "masofaviy",
        )
    }
}
