package uz.scorm.lms.app.v1.student.service

import org.apache.poi.ss.usermodel.BorderStyle
import org.apache.poi.ss.usermodel.FillPatternType
import org.apache.poi.ss.usermodel.HorizontalAlignment
import org.apache.poi.ss.usermodel.IndexedColors
import org.apache.poi.ss.util.CellRangeAddress
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.dto.StudentRegistryExport
import uz.scorm.lms.app.v1.student.dto.StudentRegistryPageDto
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.io.ByteArrayOutputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Service
class StudentRegistryService(
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val programRepository: ProgramRepository,
    private val groupRepository: GroupRepository,
    private val auditService: AuditService,
) {
    companion object {
        private const val MAX_EXPORT_ROWS = 10_000
        private val SORT = Sort.by("lastName").ascending()
            .and(Sort.by("firstName").ascending())
            .and(Sort.by("id").ascending())
    }

    @Transactional(readOnly = true)
    fun search(search: String?, status: StudentStatus?, page: Int, size: Int): StudentRegistryPageDto {
        val query = validateQuery(search, page, size)
        val result = studentRepository.findAll(specification(query, status), PageRequest.of(page, size, SORT))
        return StudentRegistryPageDto(
            items = result.content.map(studentService::toSummary),
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
        )
    }

    @Transactional
    fun export(search: String?, status: StudentStatus?, actorId: Long): StudentRegistryExport {
        val query = validateQuery(search, 0, 100)
        val result = studentRepository.findAll(
            specification(query, status), PageRequest.of(0, MAX_EXPORT_ROWS + 1, SORT),
        )
        require(result.totalElements <= MAX_EXPORT_ROWS) {
            "Eksport $MAX_EXPORT_ROWS qatordan oshmasligi kerak; filtrlarni toraytiring"
        }
        val students = result.content
        val programNames = programRepository.findAllById(students.mapNotNull(StudentProfile::programId).distinct())
            .associate { requireNotNull(it.id) to it.name }
        val groupNames = groupRepository.findAllById(students.mapNotNull(StudentProfile::groupId).distinct())
            .associate { requireNotNull(it.id) to it.name }
        val bytes = workbook(students, programNames, groupNames, query != null, status)
        auditService.logAction(
            "STUDENT_REGISTRY_EXPORTED",
            actorId,
            "status=${status ?: "ALL"}; queryApplied=${query != null}; rows=${students.size}; pii=MASKED",
        )
        return StudentRegistryExport(
            bytes = bytes,
            filename = "student-registry-${LocalDate.now().format(DateTimeFormatter.ISO_DATE)}.xlsx",
        )
    }

    private fun validateQuery(search: String?, page: Int, size: Int): String? {
        require(page >= 0) { "Sahifa raqami manfiy bo'lishi mumkin emas" }
        require(size in 10..100) { "Sahifa hajmi 10-100 oralig'ida bo'lishi kerak" }
        return search?.trim()?.takeIf(String::isNotBlank)?.also {
            require(it.length <= 100) { "Qidiruv matni 100 belgidan oshmasligi kerak" }
        }
    }

    private fun specification(query: String?, status: StudentStatus?): Specification<StudentProfile> =
        Specification { root, _, cb ->
            val predicates = mutableListOf<jakarta.persistence.criteria.Predicate>()
            status?.let { predicates += cb.equal(root.get<StudentStatus>("studentStatus"), it) }
            query?.let {
                val pattern = "%${escapeLike(it.lowercase(Locale.ROOT))}%"
                val fullName = cb.lower(cb.concat(cb.concat(root.get("lastName"), " "), root.get("firstName")))
                predicates += cb.or(
                    cb.like(cb.lower(root.get("lastName")), pattern, '\\'),
                    cb.like(cb.lower(root.get("firstName")), pattern, '\\'),
                    cb.like(cb.lower(root.get("middleName")), pattern, '\\'),
                    cb.like(fullName, pattern, '\\'),
                    cb.like(cb.lower(root.get("studentNumber")), pattern, '\\'),
                    cb.like(root.get("pinfl"), pattern, '\\'),
                )
            }
            cb.and(*predicates.toTypedArray())
        }

    private fun escapeLike(value: String) = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

    private fun workbook(
        students: List<StudentProfile>,
        programNames: Map<Long, String>,
        groupNames: Map<Long, String>,
        queryApplied: Boolean,
        status: StudentStatus?,
    ): ByteArray = ByteArrayOutputStream().use { output ->
        XSSFWorkbook().use { workbook ->
            val sheet = workbook.createSheet("Talabalar")
            sheet.isDisplayGridlines = false
            sheet.createFreezePane(0, 4)

            val titleStyle = workbook.createCellStyle().apply {
                fillForegroundColor = IndexedColors.DARK_TEAL.index
                fillPattern = FillPatternType.SOLID_FOREGROUND
                alignment = HorizontalAlignment.LEFT
                setFont(workbook.createFont().apply { bold = true; color = IndexedColors.WHITE.index; fontHeightInPoints = 16 })
            }
            val noteStyle = workbook.createCellStyle().apply {
                fillForegroundColor = IndexedColors.LIGHT_TURQUOISE.index
                fillPattern = FillPatternType.SOLID_FOREGROUND
                wrapText = true
            }
            val headerStyle = workbook.createCellStyle().apply {
                fillForegroundColor = IndexedColors.TEAL.index
                fillPattern = FillPatternType.SOLID_FOREGROUND
                alignment = HorizontalAlignment.CENTER
                setFont(workbook.createFont().apply { bold = true; color = IndexedColors.WHITE.index })
                borderBottom = BorderStyle.MEDIUM
            }

            val headers = listOf(
                "№", "Talaba raqami", "F.I.Sh.", "JSHSHIR (maskalangan)", "Telefon (maskalangan)",
                "Email (maskalangan)", "Holat", "O'quv yili", "Ta'lim dasturi", "Daraja",
                "Ta'lim shakli", "Semestr", "Kurs", "Guruh", "Ta'lim tili",
            )
            sheet.addMergedRegion(CellRangeAddress(0, 0, 0, headers.lastIndex))
            sheet.createRow(0).apply { heightInPoints = 28f; createCell(0).apply { setCellValue("Talabalar reyestri"); cellStyle = titleStyle } }
            sheet.addMergedRegion(CellRangeAddress(1, 1, 0, headers.lastIndex))
            sheet.createRow(1).apply {
                createCell(0).apply {
                    setCellValue("Eksport sanasi: ${LocalDate.now()}; holat: ${statusLabel(status)}; qidiruv filtri: ${if (queryApplied) "qo'llangan" else "yo'q"}")
                    cellStyle = noteStyle
                }
            }
            sheet.addMergedRegion(CellRangeAddress(2, 2, 0, headers.lastIndex))
            sheet.createRow(2).apply {
                heightInPoints = 30f
                createCell(0).apply {
                    setCellValue("Maxfiylik: JSHSHIR, telefon va email maskalangan; pasport hamda manzil ma'lumotlari eksport qilinmaydi.")
                    cellStyle = noteStyle
                }
            }
            sheet.createRow(3).also { row -> headers.forEachIndexed { index, value -> row.createCell(index).apply { setCellValue(value); cellStyle = headerStyle } } }

            students.forEachIndexed { index, student ->
                sheet.createRow(index + 4).apply {
                    createCell(0).setCellValue((index + 1).toDouble())
                    createCell(1).setCellValue(safeExcelText(student.studentNumber))
                    createCell(2).setCellValue(safeExcelText(student.fullName))
                    createCell(3).setCellValue(maskPinfl(student.pinfl))
                    createCell(4).setCellValue(maskPhone(student.phoneNumber))
                    createCell(5).setCellValue(maskEmail(student.email))
                    createCell(6).setCellValue(statusLabel(student.studentStatus))
                    createCell(7).setCellValue(student.academicYear.orEmpty())
                    createCell(8).setCellValue(safeExcelText(student.programId?.let(programNames::get).orEmpty()))
                    createCell(9).setCellValue(student.degreeLevel?.name.orEmpty())
                    createCell(10).setCellValue(student.educationForm?.name.orEmpty())
                    student.semesterNumber?.let { createCell(11).setCellValue(it.toDouble()) } ?: createCell(11)
                    student.courseNumber.takeIf { student.studentStatus != StudentStatus.REGISTERED }?.let { createCell(12).setCellValue(it.toDouble()) } ?: createCell(12)
                    createCell(13).setCellValue(safeExcelText(student.groupId?.let(groupNames::get).orEmpty()))
                    createCell(14).setCellValue(student.educationLanguage.takeIf { student.studentStatus != StudentStatus.REGISTERED }.orEmpty())
                }
            }
            val lastRow = (students.size + 3).coerceAtLeast(3)
            sheet.setAutoFilter(CellRangeAddress(3, lastRow, 0, headers.lastIndex))
            val widths = intArrayOf(6, 18, 32, 22, 22, 28, 18, 16, 32, 16, 18, 12, 10, 22, 14)
            widths.forEachIndexed { index, width -> sheet.setColumnWidth(index, width * 256) }
            workbook.write(output)
        }
        output.toByteArray()
    }

    private fun safeExcelText(value: String): String =
        if (value.firstOrNull() in setOf('=', '+', '-', '@')) "'$value" else value

    private fun maskPinfl(value: String): String = "*".repeat((value.length - 4).coerceAtLeast(4)) + value.takeLast(4)

    private fun maskPhone(value: String?): String {
        val last = value.orEmpty().filter(Char::isDigit).takeLast(2)
        return if (last.isBlank()) "" else "+*** ** *** ** $last"
    }

    private fun maskEmail(value: String?): String {
        val email = value?.trim().orEmpty()
        val separator = email.indexOf('@')
        return if (separator <= 0 || separator == email.lastIndex) "" else "${email.first()}***${email.substring(separator)}"
    }

    private fun statusLabel(status: StudentStatus?): String = when (status) {
        StudentStatus.REGISTERED -> "Qabul qilinmagan"
        StudentStatus.ACTIVE -> "Faol"
        StudentStatus.SUSPENDED -> "To'xtatilgan"
        StudentStatus.EXPELLED -> "Chetlashtirilgan"
        StudentStatus.GRADUATED -> "Bitirgan"
        null -> "Barchasi"
    }
}
