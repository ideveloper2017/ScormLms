package uz.scorm.lms.app.v1.subjectcategory

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryCreateRequest
import uz.scorm.lms.app.v1.subjectcategory.model.SubjectCategory
import uz.scorm.lms.app.v1.subjectcategory.repository.SubjectCategoryRepository
import uz.scorm.lms.app.v1.subjectcategory.service.SubjectCategoryService

class SubjectCategoryServiceTest {
    private val repository = mockk<SubjectCategoryRepository>()
    private val service = SubjectCategoryService(repository)

    @Test
    fun `fan guruhi nomi va kodi normallashtirib yaratiladi`() {
        every { repository.existsByCodeIgnoreCase("MATH") } returns false
        every { repository.save(any()) } answers {
            firstArg<SubjectCategory>().apply { id = 7 }
        }

        val result = service.create(SubjectCategoryCreateRequest("  Oliy matematika  ", " math "))

        assertEquals(7, result.id)
        assertEquals("Oliy matematika", result.name)
        assertEquals("MATH", result.code)
    }

    @Test
    fun `takroriy fan guruhi kodi rad etiladi`() {
        every { repository.existsByCodeIgnoreCase("MATH") } returns true

        assertThrows<IllegalArgumentException> {
            service.create(SubjectCategoryCreateRequest("Matematika", "math"))
        }
    }

    @Test
    fun `ochirish tarixiy boglanishlar uchun soft delete qiladi`() {
        val category = SubjectCategory("Fizika", "PHYS").apply { id = 9 }
        every { repository.findByIdAndDeletedFalse(9) } returns category
        every { repository.save(category) } returns category

        service.delete(9)

        assertFalse(category.active)
        assertEquals(true, category.deleted)
    }
}
