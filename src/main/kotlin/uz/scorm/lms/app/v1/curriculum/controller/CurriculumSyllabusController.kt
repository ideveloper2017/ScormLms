package uz.scorm.lms.app.v1.curriculum.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.curriculum.dto.CreateCurriculumSyllabusRequest
import uz.scorm.lms.app.v1.curriculum.service.CurriculumSyllabusService
import uz.scorm.lms.app.v1.user.model.User

/** O'quv rejadagi fanga o'quv dasturini biriktirish / yaratish / ajratish. */
@RestController
@RequestMapping("/api/v1/curricula/{id}/subjects/{itemId}/syllabus")
class CurriculumSyllabusController(private val service: CurriculumSyllabusService) {
    @PutMapping("/{syllabusId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun attach(@PathVariable id: Long, @PathVariable itemId: Long, @PathVariable syllabusId: Long, @CurrentUser user: User) =
        service.attach(id, itemId, syllabusId, requireNotNull(user.id))

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@PathVariable id: Long, @PathVariable itemId: Long, @RequestBody request: CreateCurriculumSyllabusRequest, @CurrentUser user: User) =
        service.createAndAttach(id, itemId, request, requireNotNull(user.id))

    @DeleteMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun detach(@PathVariable id: Long, @PathVariable itemId: Long, @CurrentUser user: User) =
        service.detach(id, itemId, requireNotNull(user.id))
}
