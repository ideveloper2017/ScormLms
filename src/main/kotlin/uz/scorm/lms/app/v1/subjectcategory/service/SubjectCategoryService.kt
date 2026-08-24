package uz.scorm.lms.app.v1.subjectcategory.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryCreateRequest
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryDto
import uz.scorm.lms.app.v1.subjectcategory.dto.SubjectCategoryUpdateRequest
import uz.scorm.lms.app.v1.subjectcategory.model.SubjectCategory
import uz.scorm.lms.app.v1.subjectcategory.repository.SubjectCategoryRepository

@Service
class SubjectCategoryService(
    private val categories: SubjectCategoryRepository,
) {
    @Transactional(readOnly = true)
    fun list(): List<SubjectCategoryDto> = categories.findAllByDeletedFalseOrderByNameAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun getEntity(id: Long): SubjectCategory = categories.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Fan guruhi topilmadi: $id")

    @Transactional
    fun create(request: SubjectCategoryCreateRequest): SubjectCategoryDto {
        val name = normalizeName(request.name)
        val code = normalizeCode(request.code)
        require(code == null || !categories.existsByCodeIgnoreCase(code)) {
            "Fan guruhi kodi mavjud: $code"
        }
        return toDto(categories.save(SubjectCategory(
            name = name, code = code, active = request.active,
            nameEn = clean(request.nameEn), nameRu = clean(request.nameRu),
            nameKaa = clean(request.nameKaa), nameUzCyrillic = clean(request.nameUzCyrillic),
        )))
    }

    @Transactional
    fun update(id: Long, request: SubjectCategoryUpdateRequest): SubjectCategoryDto {
        val category = getEntity(id)
        request.name?.let { category.name = normalizeName(it) }
        if (request.clearTranslations) {
            category.nameEn = null
            category.nameRu = null
            category.nameKaa = null
            category.nameUzCyrillic = null
        }
        if (request.clearCode) {
            category.code = null
        } else request.code?.let {
            val code = normalizeCode(it)
            require(code == null || !categories.existsByCodeIgnoreCaseAndIdNot(code, id)) {
                "Fan guruhi kodi mavjud: $code"
            }
            category.code = code
        }
        request.active?.let { category.active = it }
        request.nameEn?.let { category.nameEn = clean(it) }
        request.nameRu?.let { category.nameRu = clean(it) }
        request.nameKaa?.let { category.nameKaa = clean(it) }
        request.nameUzCyrillic?.let { category.nameUzCyrillic = clean(it) }
        return toDto(categories.save(category))
    }

    @Transactional
    fun delete(id: Long) {
        val category = getEntity(id)
        category.active = false
        category.deleted = true
        categories.save(category)
    }

    private fun normalizeName(value: String): String = value.trim().also {
        require(it.length in 3..200) { "Fan guruhi nomi 3-200 belgi bo'lishi kerak" }
    }

    private fun clean(value: String?): String? = value?.trim()?.takeIf(String::isNotEmpty)

    private fun normalizeCode(value: String?): String? = value?.trim()?.uppercase()?.takeIf(String::isNotEmpty)?.also {
        require(it.length in 2..50 && it.matches(Regex("[A-Z0-9._-]+"))) {
            "Fan guruhi kodi 2-50 belgi va A-Z, 0-9, nuqta, chiziq formatida bo'lishi kerak"
        }
    }

    private fun toDto(value: SubjectCategory) = SubjectCategoryDto(
        id = requireNotNull(value.id),
        name = value.name,
        code = value.code,
        nameEn = value.nameEn,
        nameRu = value.nameRu,
        nameKaa = value.nameKaa,
        nameUzCyrillic = value.nameUzCyrillic,
        active = value.active,
        createdAt = value.createdAt,
        updatedAt = value.updatedAt,
    )
}
