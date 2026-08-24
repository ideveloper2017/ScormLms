package uz.scorm.lms.app.v1.academicdocument.service

import org.apache.pdfbox.Loader
import org.apache.pdfbox.rendering.ImageType
import org.apache.pdfbox.rendering.PDFRenderer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import javax.imageio.ImageIO

class AcademicDocumentPdfServiceTest {
    private val service = AcademicDocumentPdfService("")

    @Test
    fun `chaqiruv va transkript unicode PDF sifatida yaratiladi`() {
        val callLetter = service.callLetter(CallLetterPdfData(
            documentNumber = "CHQ-2026-000001",
            studentName = "O'tkir G'ulomov Shavkat o'g'li",
            studentNumber = "NAMDTU-2026-001",
            program = "Dasturiy injiniring",
            group = "DI-21-01",
            semester = 8,
            orderNumber = "117-A",
            orderDate = LocalDate.of(2026, 8, 15),
            startDate = LocalDate.of(2026, 8, 24),
            endDate = LocalDate.of(2026, 9, 5),
        ))
        val transcript = service.transcript(TranscriptPdfData(
            documentNumber = "TR-2026-000001",
            studentName = "O'tkir G'ulomov Shavkat o'g'li",
            studentNumber = "NAMDTU-2026-001",
            educationForm = "KUNDUZGI",
            program = "Dasturiy injiniring",
            group = "DI-21-01",
            academicYear = "2025-2026",
            semester = 8,
            lines = listOf(
                TranscriptLinePdfData("Dasturlash asoslari", 1, 6, 86.0, 91.0, 88.5, "B+"),
                TranscriptLinePdfData("Ma'lumotlar bazasi", 3, 5, 90.0, 94.0, 92.0, "A"),
                TranscriptLinePdfData("Sun'iy intellekt", 7, 6, 84.0, 89.0, 86.5, "B+"),
            ),
            gpa = 3.67,
            totalCredits = 17,
        ))

        assertPdf(callLetter)
        assertPdf(transcript)

        System.getenv("PDF_PREVIEW_DIR")?.takeIf(String::isNotBlank)?.let { directory ->
            val output = Path.of(directory)
            Files.createDirectories(output)
            Files.write(output.resolve("yakuniy-nazorat-chaqiruv-namuna.pdf"), callLetter)
            Files.write(output.resolve("akademik-transkript-namuna.pdf"), transcript)
        }
        System.getenv("PDF_RENDER_DIR")?.takeIf(String::isNotBlank)?.let { directory ->
            val output = Path.of(directory)
            Files.createDirectories(output)
            render(callLetter, output.resolve("yakuniy-nazorat-chaqiruv-1.png"))
            render(transcript, output.resolve("akademik-transkript-1.png"))
        }
    }

    private fun assertPdf(bytes: ByteArray) {
        assertTrue(bytes.size > 2_000)
        assertEquals("%PDF", bytes.copyOfRange(0, 4).toString(Charsets.US_ASCII))
        Loader.loadPDF(bytes).use { document -> assertTrue(document.numberOfPages >= 1) }
    }

    private fun render(bytes: ByteArray, target: Path) {
        Loader.loadPDF(bytes).use { document ->
            val image = PDFRenderer(document).renderImageWithDPI(0, 150f, ImageType.RGB)
            ImageIO.write(image, "png", target.toFile())
        }
    }
}
