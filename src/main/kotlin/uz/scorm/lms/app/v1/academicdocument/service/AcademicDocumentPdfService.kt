package uz.scorm.lms.app.v1.academicdocument.service

import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.common.PDRectangle
import org.apache.pdfbox.pdmodel.font.PDType0Font
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class CallLetterPdfData(
    val documentNumber: String,
    val studentName: String,
    val studentNumber: String,
    val program: String,
    val group: String,
    val semester: Int,
    val orderNumber: String,
    val orderDate: LocalDate,
    val startDate: LocalDate,
    val endDate: LocalDate,
)

data class TranscriptLinePdfData(
    val subject: String,
    val semester: Int,
    val credits: Int,
    val interim: Double?,
    val finalScore: Double?,
    val total: Double?,
    val grade: String?,
)

data class TranscriptPdfData(
    val documentNumber: String,
    val studentName: String,
    val studentNumber: String,
    val educationForm: String,
    val program: String,
    val group: String,
    val academicYear: String,
    val semester: Int,
    val lines: List<TranscriptLinePdfData>,
    val gpa: Double,
    val totalCredits: Int,
)

@Service
class AcademicDocumentPdfService(
    @param:Value("\${app.pdf.font-path:}") private val configuredFontPath: String,
) {
    fun callLetter(data: CallLetterPdfData): ByteArray = create { document, writer ->
        writer.center("NAMANGAN DAVLAT TEXNIKA UNIVERSITETI", 14f, Color(30, 64, 175))
        writer.space(12f)
        writer.center("YAKUNIY NAZORATGA CHAQIRUV QOG'OZI", 18f, Color(15, 23, 42))
        writer.center("№ ${data.documentNumber}", 11f, Color.DARK_GRAY)
        writer.space(18f)
        writer.keyValue("Talaba", data.studentName)
        writer.keyValue("Talaba raqami", data.studentNumber)
        writer.keyValue("Mutaxassislik", data.program.ifBlank { "Ko'rsatilmagan" })
        writer.keyValue("Guruh", data.group.ifBlank { "Ko'rsatilmagan" })
        writer.keyValue("Semestr", data.semester.toString())
        writer.space(14f)
        writer.paragraph(
            "Hurmatli ${data.studentName}, Siz ${format(data.startDate)} sanadan ${format(data.endDate)} sanagacha " +
                "yakuniy nazoratlarda ishtirok etish uchun universitetga chaqirilasiz.",
            12f,
        )
        writer.space(12f)
        writer.keyValue("Asos", "${data.orderNumber}-sonli buyruq, ${format(data.orderDate)}")
        writer.space(30f)
        writer.line()
        writer.text("Mas'ul shaxs imzosi: ____________________", 11f)
        writer.text("Berilgan sana: ${format(LocalDate.now())}", 10f, Color.DARK_GRAY)
    }

    fun transcript(data: TranscriptPdfData): ByteArray = create { _, writer ->
        writer.center("NAMANGAN DAVLAT TEXNIKA UNIVERSITETI", 14f, Color(30, 64, 175))
        writer.space(10f)
        writer.center("AKADEMIK TRANSKRIPT", 18f, Color(15, 23, 42))
        writer.center("№ ${data.documentNumber}", 11f, Color.DARK_GRAY)
        writer.space(14f)
        writer.keyValue("Talaba", data.studentName)
        writer.keyValue("Talaba raqami", data.studentNumber)
        writer.keyValue("Ta'lim turi", data.educationForm)
        writer.keyValue("Mutaxassislik", data.program.ifBlank { "Ko'rsatilmagan" })
        writer.keyValue("Guruh", data.group.ifBlank { "Ko'rsatilmagan" })
        writer.keyValue("O'quv yili", data.academicYear)
        writer.keyValue("Semestrgacha", data.semester.toString())
        writer.space(12f)
        writer.tableHeader(listOf("Fan", "Sem.", "Kredit", "Oraliq", "Yakuniy", "Jami", "Baho"), listOf(220f, 42f, 52f, 55f, 55f, 48f, 45f))
        data.lines.forEachIndexed { index, line ->
            writer.tableRow(
                listOf(line.subject, line.semester.toString(), line.credits.toString(), score(line.interim), score(line.finalScore), score(line.total), line.grade ?: "-"),
                listOf(220f, 42f, 52f, 55f, 55f, 48f, 45f),
                shaded = index % 2 == 1,
            )
        }
        if (data.lines.isEmpty()) writer.paragraph("Baholangan fanlar mavjud emas.", 11f)
        writer.space(14f)
        writer.keyValue("Jami kredit", data.totalCredits.toString())
        writer.keyValue("GPA", String.format("%.2f", data.gpa))
        writer.space(24f)
        writer.line()
        writer.text("Registrator imzosi: ____________________", 11f)
        writer.text("Shakllantirilgan sana: ${format(LocalDate.now())}", 10f, Color.DARK_GRAY)
    }

    private fun create(content: (PDDocument, PdfWriter) -> Unit): ByteArray {
        PDDocument().use { document ->
            val font = loadFont(document)
            val writer = PdfWriter(document, font)
            content(document, writer)
            writer.close()
            return ByteArrayOutputStream().use { output -> document.save(output); output.toByteArray() }
        }
    }

    private fun loadFont(document: PDDocument): PDType0Font {
        val paths = buildList {
            configuredFontPath.trim().takeIf(String::isNotBlank)?.let { add(Path.of(it)) }
            add(Path.of("C:/Windows/Fonts/arial.ttf"))
            add(Path.of("C:/Windows/Fonts/calibri.ttf"))
            add(Path.of("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))
            add(Path.of("/System/Library/Fonts/Supplemental/Arial.ttf"))
            add(Path.of("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
            add(Path.of("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"))
        }
        val path = paths.firstOrNull(Files::isRegularFile)
            ?: throw IllegalStateException("PDF_UNICODE_FONT_NOT_FOUND: app.pdf.font-path ni TTF shriftga sozlang")
        Files.newInputStream(path).use { return PDType0Font.load(document, it) }
    }

    private class PdfWriter(private val document: PDDocument, private val font: PDType0Font) : AutoCloseable {
        private val margin = 39f
        private var pageNumber = 0
        private lateinit var page: PDPage
        private lateinit var stream: PDPageContentStream
        private var y = 0f
        private val usableWidth get() = page.mediaBox.width - margin * 2

        init { newPage() }

        fun center(value: String, size: Float, color: Color = Color.BLACK) {
            ensure(size + 8)
            val width = font.getStringWidth(value) / 1000f * size
            draw(value, margin + (usableWidth - width).coerceAtLeast(0f) / 2f, y, size, color)
            y -= size + 5f
        }

        fun text(value: String, size: Float, color: Color = Color.BLACK) {
            ensure(size + 7)
            draw(fit(value, usableWidth, size), margin, y, size, color)
            y -= size + 5f
        }

        fun paragraph(value: String, size: Float, color: Color = Color.BLACK) {
            wrap(value, usableWidth, size).forEach { line -> text(line, size, color) }
        }

        fun keyValue(key: String, value: String) {
            ensure(22f)
            draw(key, margin, y, 10f, Color(71, 85, 105))
            draw(fit(value, usableWidth - 140f, 11f), margin + 140f, y, 11f, Color(15, 23, 42))
            y -= 20f
            line(Color(226, 232, 240))
        }

        fun tableHeader(values: List<String>, widths: List<Float>) {
            ensure(30f)
            stream.setNonStrokingColor(Color(30, 64, 175))
            stream.addRect(margin, y - 22f, widths.sum(), 26f)
            stream.fill()
            var x = margin + 4f
            values.forEachIndexed { index, value -> draw(fit(value, widths[index] - 8f, 9f), x, y - 12f, 9f, Color.WHITE); x += widths[index] }
            y -= 26f
        }

        fun tableRow(values: List<String>, widths: List<Float>, shaded: Boolean) {
            ensure(28f) { tableHeader(listOf("Fan", "Sem.", "Kredit", "Oraliq", "Yakuniy", "Jami", "Baho"), widths) }
            if (shaded) {
                stream.setNonStrokingColor(Color(248, 250, 252))
                stream.addRect(margin, y - 20f, widths.sum(), 24f)
                stream.fill()
            }
            var x = margin + 4f
            values.forEachIndexed { index, value -> draw(fit(value, widths[index] - 8f, 8.5f), x, y - 11f, 8.5f, Color(15, 23, 42)); x += widths[index] }
            y -= 24f
            line(Color(226, 232, 240))
        }

        fun line(color: Color = Color(148, 163, 184)) {
            stream.setStrokingColor(color)
            stream.setLineWidth(0.5f)
            stream.moveTo(margin, y)
            stream.lineTo(page.mediaBox.width - margin, y)
            stream.stroke()
            y -= 4f
        }

        fun space(value: Float) { y -= value; ensure(1f) }

        fun footer() {
            stream.setStrokingColor(Color(226, 232, 240)); stream.moveTo(margin, 42f); stream.lineTo(page.mediaBox.width - margin, 42f); stream.stroke()
            draw("EduLMS akademik hujjatlar tizimi", margin, 27f, 8f, Color(100, 116, 139))
            val pageText = "$pageNumber-sahifa"
            val width = font.getStringWidth(pageText) / 1000f * 8f
            draw(pageText, page.mediaBox.width - margin - width, 27f, 8f, Color(100, 116, 139))
        }

        private fun ensure(height: Float, afterPageBreak: (() -> Unit)? = null) {
            if (y - height >= 58f) return
            footer(); stream.close(); newPage(); afterPageBreak?.invoke()
        }

        private fun newPage() {
            page = PDPage(PDRectangle.A4)
            document.addPage(page)
            stream = PDPageContentStream(document, page)
            pageNumber += 1
            y = page.mediaBox.height - margin
        }

        private fun draw(value: String, x: Float, y: Float, size: Float, color: Color) {
            stream.beginText(); stream.setFont(font, size); stream.setNonStrokingColor(color); stream.newLineAtOffset(x, y); stream.showText(value); stream.endText()
        }

        private fun fit(value: String, width: Float, size: Float): String {
            if (font.getStringWidth(value) / 1000f * size <= width) return value
            var result = value
            while (result.length > 1 && font.getStringWidth("$result...") / 1000f * size > width) result = result.dropLast(1)
            return "$result..."
        }

        private fun wrap(value: String, width: Float, size: Float): List<String> {
            val lines = mutableListOf<String>(); var current = ""
            value.split(Regex("\\s+")).forEach { word ->
                val candidate = if (current.isBlank()) word else "$current $word"
                if (font.getStringWidth(candidate) / 1000f * size <= width) current = candidate
                else { if (current.isNotBlank()) lines += current; current = word }
            }
            if (current.isNotBlank()) lines += current
            return lines
        }

        override fun close() { footer(); stream.close() }
    }

    companion object {
        private val formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy")
        private fun format(value: LocalDate) = value.format(formatter)
        private fun score(value: Double?) = value?.let { String.format("%.1f", it) } ?: "-"
    }
}
