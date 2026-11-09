package uz.scorm.lms.app.v1.curriculum.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.curriculum.service.CurriculumTeacherService
import uz.scorm.lms.app.v1.user.model.User

/** O'quv rejadagi fanga (semestr qatoriga) mas'ul o'qituvchini biriktirish / olib tashlash. */
@RestController
@RequestMapping("/api/v1/curricula/{id}/subjects/{itemId}/teacher")
class CurriculumTeacherController(private val service: CurriculumTeacherService) {
    @PutMapping("/{teacherId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun assign(@PathVariable id: Long, @PathVariable itemId: Long, @PathVariable teacherId: Long, @CurrentUser user: User) =
        service.assign(id, itemId, teacherId, requireNotNull(user.id))

    @DeleteMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun remove(@PathVariable id: Long, @PathVariable itemId: Long, @CurrentUser user: User) =
        service.assign(id, itemId, null, requireNotNull(user.id))
}
