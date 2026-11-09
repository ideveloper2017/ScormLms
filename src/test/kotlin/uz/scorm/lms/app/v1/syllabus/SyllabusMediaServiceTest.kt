package uz.scorm.lms.app.v1.syllabus

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind
import uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaService
import java.nio.file.Path

class SyllabusMediaServiceTest {
    @TempDir lateinit var dir: Path
    private val syllabi = mockk<SubjectSyllabusRepository>()
    private val syllabus = SubjectSyllabus(subject = Subject(name = "Mexanika").apply { id = 3 }, name = "Mexanika", language = SyllabusLanguage.UZ,
        shortDescription = "Qisqa", requirements = null, fullDescription = "To'liq", active = true).apply { id = 40 }

    private fun service(): SyllabusMediaService {
        every { syllabi.lockById(40) } returns syllabus
        every { syllabi.findByIdAndDeletedFalse(40) } returns syllabus
        every { syllabi.save(any()) } answers { firstArg() }
        return SyllabusMediaService(syllabi, dir.toString())
    }

    @Test
    fun `qoralamaga muqova va video yuklanadi, o'qiladi va o'chiriladi`() {
        val service = service()
        service.upload(40, SyllabusMediaKind.COVER, MockMultipartFile("file", "muqova.png", "image/png", byteArrayOf(1, 2, 3)))
        service.upload(40, SyllabusMediaKind.VIDEO, MockMultipartFile("file", "kirish.mp4", "video/mp4", byteArrayOf(4, 5)))

        val cover = service.open(40, SyllabusMediaKind.COVER)
        assertEquals("image/png", cover.mediaType)
        assertEquals(3L, cover.sizeBytes)
        cover.resource.inputStream.close()
        val video = service.open(40, SyllabusMediaKind.VIDEO)
        assertEquals("kirish.mp4", video.fileName)
        video.resource.inputStream.close()

        service.remove(40, SyllabusMediaKind.VIDEO)
        assertNull(syllabus.introVideo)
        assertThrows<NoSuchElementException> { service.open(40, SyllabusMediaKind.VIDEO) }
    }

    @Test
    fun `noto'g'ri tur va tasdiqlangan dastur rad etiladi`() {
        val service = service()
        assertThrows<IllegalArgumentException> {
            service.upload(40, SyllabusMediaKind.COVER, MockMultipartFile("file", "a.exe", "application/octet-stream", byteArrayOf(1)))
        }
        syllabus.status = "APPROVED"
        assertThrows<IllegalArgumentException> {
            service.upload(40, SyllabusMediaKind.VIDEO, MockMultipartFile("file", "a.mp4", "video/mp4", byteArrayOf(1)))
        }
    }
}
