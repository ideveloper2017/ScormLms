package uz.scorm.lms.app.v1.curriculum.controller

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.curriculum.dto.AddCurriculumSubjectRequest
import uz.scorm.lms.app.v1.curriculum.dto.ApproveCurriculumRequest
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumImportApplyRequest
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumComponentRequest
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumVersionRequest
import uz.scorm.lms.app.v1.curriculum.dto.UpdateCurriculumSubjectRequest
import uz.scorm.lms.app.v1.curriculum.service.CurriculumImportService
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.student.model.StudentStatus

@RestController
@RequestMapping("/api/v1/curricula")
class ProgramCurriculumController(
    private val service: ProgramCurriculumService,
    private val importService: CurriculumImportService,
) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list() = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun get(@PathVariable id: Long) = service.get(id)

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun students(
        @PathVariable id: Long,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: StudentStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) semesterNumber: Int?,
        @RequestParam(defaultValue = "false") unassignedOnly: Boolean,
    ) = service.students(id, search, status, page, size, semesterNumber, unassignedOnly)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SaveCurriculumVersionRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveCurriculumVersionRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/subjects")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun addSubject(@PathVariable id: Long, @RequestBody request: AddCurriculumSubjectRequest, @CurrentUser user: User) =
        service.addSubject(id, request, requireNotNull(user.id))

    @PutMapping("/{id}/subjects/{itemId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateSubject(@PathVariable id: Long, @PathVariable itemId: Long, @RequestBody request: UpdateCurriculumSubjectRequest, @CurrentUser user: User) =
        service.updateSubject(id, itemId, request, requireNotNull(user.id))

    @DeleteMapping("/{id}/subjects/{itemId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun removeSubject(@PathVariable id: Long, @PathVariable itemId: Long, @CurrentUser user: User) =
        service.removeSubject(id, itemId, requireNotNull(user.id))

    /** Malakaviy amaliyot / yakuniy davlat attestatsiyasi (fan bo'lmagan reja qismlari) */
    @PostMapping("/{id}/components")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun addComponent(@PathVariable id: Long, @RequestBody request: SaveCurriculumComponentRequest, @CurrentUser user: User) =
        service.addComponent(id, request, requireNotNull(user.id))

    @PutMapping("/{id}/components/{componentId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateComponent(@PathVariable id: Long, @PathVariable componentId: Long, @RequestBody request: SaveCurriculumComponentRequest,
        @CurrentUser user: User) = service.updateComponent(id, componentId, request, requireNotNull(user.id))

    @DeleteMapping("/{id}/components/{componentId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun removeComponent(@PathVariable id: Long, @PathVariable componentId: Long, @CurrentUser user: User) =
        service.removeComponent(id, componentId, requireNotNull(user.id))

    /** Yangi reja formasini ishchi o'quv reja faylidan to'ldirish: sarlavha va kodi bo'yicha yo'nalish (hech narsa saqlanmaydi). */
    @PostMapping("/import/draft", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun importDraft(@RequestParam("file") file: MultipartFile, @RequestParam(required = false) sheet: String?) =
        importService.draft(file, sheet)

    /** Ishchi o'quv reja Excel faylini o'qib, fanlar va tizimdagi fanlarga moslikni ko'rsatadi (hech narsa saqlanmaydi). */
    @PostMapping("/{id}/import/preview", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun importPreview(@PathVariable id: Long, @RequestParam("file") file: MultipartFile, @RequestParam(required = false) sheet: String?) =
        importService.preview(id, file, sheet)

    /** Ko'rib chiqilgan qatorlarni rejaga qo'shadi (kerak bo'lsa katalogda yangi fan yaratadi). */
    @PostMapping("/{id}/import")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun importApply(@PathVariable id: Long, @RequestBody request: CurriculumImportApplyRequest, @CurrentUser user: User) =
        importService.apply(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun approve(@PathVariable id: Long, @RequestBody request: ApproveCurriculumRequest, @CurrentUser user: User) =
        service.approve(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun archive(@PathVariable id: Long, @CurrentUser user: User) = service.archive(id, requireNotNull(user.id))
}
