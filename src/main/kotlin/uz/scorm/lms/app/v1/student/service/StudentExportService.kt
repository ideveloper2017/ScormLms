package uz.scorm.lms.app.v1.student.service

import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.academicdocument.service.AcademicDocumentPdfService
import uz.scorm.lms.app.v1.student.dto.StudentTranscriptDto
import uz.scorm.lms.app.v1.student.dto.StudentReportDto
import java.io.ByteArrayOutputStream

enum class StudentExportFormat { PDF, XLSX }

@Service
class StudentExportService(private val pdf: AcademicDocumentPdfService) {
    fun transcript(data: StudentTranscriptDto, format: StudentExportFormat): ByteArray {
        val summary = listOf("GPA: ${if (data.assessedCredits > 0) data.cumulativeGPA else "Baholanmagan"}",
            "Jami kredit: ${data.totalCredits} · Baholangan: ${data.assessedCredits} · O'zlashtirilgan: ${data.completedCredits}",
            "GPA testlar o'rtachasi va e'lon qilingan yakuniy nazorat asosida kreditga vaznlanadi. Topshiriqlar GPAga kirmaydi.")
        if (format == StudentExportFormat.PDF) return pdf.studentExtract("TRANSKRIPT", data.studentName,
            listOf("Umumiy natija" to summary) + data.semesters.map { term ->
                "${term.academicYear} · ${term.semester}-semestr · GPA: ${if (term.assessedCredits > 0) term.semesterGPA else "Baholanmagan"}" to
                    term.courses.map { "${it.courseName} · ${it.credits} kredit · ${it.score?.let { score -> "$score / 100 · ${it.gradeLetter}" } ?: "Baholanmagan"}" }
            })
        return workbook(listOf(
            "Umumiy" to (listOf(listOf<Any?>("Talaba", data.studentName)) + summary.map { listOf<Any?>(it) }),
            "Transkript" to (listOf(listOf<Any?>("O'quv yili", "Semestr", "Kurs", "O'qituvchi", "Kredit", "Ball", "Baho", "GPA ball", "Holat")) +
                data.semesters.flatMap { term -> term.courses.map { course -> listOf<Any?>(term.academicYear, term.semester,
                    course.courseName, course.instructor, course.credits, course.score, course.gradeLetter.takeUnless { it == "N/A" },
                    course.gradePoints.takeIf { course.score != null }, course.status) } }),
        ))
    }

    fun report(data: StudentReportDto, studentName: String, format: StudentExportFormat): ByteArray {
        val summary = listOf("Davr: ${data.from} — ${data.to}", "Davrdagi baholar: ${data.gradeCount} · O'rtacha: ${if (data.gradeCount > 0) data.stats.avgScore else "Baholanmagan"}",
            "Kurslar: ${data.stats.coursesActive} faol, ${data.stats.coursesCompleted} yakunlangan. Kurs bajarilishi joriy holatni ko'rsatadi.")
        if (format == StudentExportFormat.PDF) return pdf.studentExtract("O'QISH HISOBOTI", studentName, listOf(
            "Umumiy" to summary,
            "Oylar bo'yicha" to data.monthly.map { "${it.month}: ${it.gradeCount} baho · O'rtacha: ${if (it.gradeCount > 0) it.avgScore else "—"} · Davomat: ${if (it.attendanceCount > 0) "${it.attendance}%" else "—"} (${it.attendanceCount} dars) · ${it.completedCourses} kurs yakunlangan" },
            "Kurslar" to data.courses.map { "${it.courseTitle} · ${it.completion}% bajarilgan · ${it.gradeCount} baho · O'rtacha: ${if (it.gradeCount > 0) it.avgScore else "—"}" },
        ))
        return workbook(listOf(
            "Umumiy" to (listOf(listOf<Any?>("Talaba", studentName)) + summary.map { listOf<Any?>(it) }),
            "Oylar" to (listOf(listOf<Any?>("Oy", "O'rtacha ball", "Baholar soni", "Davomat %", "Darslar soni", "Yakunlangan kurslar")) + data.monthly.map {
                listOf<Any?>(it.month, it.avgScore.takeIf { _ -> it.gradeCount > 0 }, it.gradeCount, it.attendance.takeIf { _ -> it.attendanceCount > 0 }, it.attendanceCount, it.completedCourses) }),
            "Kurslar" to (listOf(listOf<Any?>("Kurs", "Bajarilish %", "O'rtacha ball", "Baholar soni")) + data.courses.map {
                listOf<Any?>(it.courseTitle, it.completion, it.avgScore.takeIf { _ -> it.gradeCount > 0 }, it.gradeCount) }),
        ))
    }

    private fun workbook(sheets: List<Pair<String, List<List<Any?>>>>): ByteArray = XSSFWorkbook().use { book ->
        val header = book.createCellStyle().apply { setFont(book.createFont().apply { bold = true }) }
        sheets.forEach { (name, rows) ->
            val sheet = book.createSheet(name)
            rows.forEachIndexed { i, values ->
                val row = sheet.createRow(i)
                values.forEachIndexed { j, value -> row.createCell(j).apply {
                    when (value) { is Number -> setCellValue(value.toDouble()); null -> setBlank(); else -> setCellValue(value.toString()) }
                    if (i == 0) cellStyle = header
                } }
            }
            sheet.createFreezePane(0, 1)
            repeat(rows.maxOfOrNull { it.size } ?: 0) { sheet.autoSizeColumn(it); sheet.setColumnWidth(it, sheet.getColumnWidth(it).coerceAtMost(18000)) }
        }
        ByteArrayOutputStream().use { book.write(it); it.toByteArray() }
    }
}
