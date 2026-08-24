package uz.scorm.lms.app.v1.systemcatalog.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveNationalityRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveReferenceLabelRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveTranslationMessageRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.UpdateSystemSettingRequest
import uz.scorm.lms.app.v1.systemcatalog.service.SystemCatalogService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/reference-data")
class ReferenceDataController(private val service: SystemCatalogService) {
    @GetMapping("/labels")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun labels() = service.listLabels()

    @PostMapping("/labels")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createLabel(@RequestBody request: SaveReferenceLabelRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createLabel(request, requireNotNull(user.id)))

    @PutMapping("/labels/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateLabel(@PathVariable id: Long, @RequestBody request: SaveReferenceLabelRequest, @CurrentUser user: User) =
        service.updateLabel(id, request, requireNotNull(user.id))

    @DeleteMapping("/labels/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteLabel(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.deleteLabel(id, requireNotNull(user.id))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/nationalities")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun nationalities() = service.listNationalities()

    @PostMapping("/nationalities")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createNationality(@RequestBody request: SaveNationalityRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createNationality(request, requireNotNull(user.id)))

    @PutMapping("/nationalities/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateNationality(@PathVariable id: Long, @RequestBody request: SaveNationalityRequest, @CurrentUser user: User) =
        service.updateNationality(id, request, requireNotNull(user.id))

    @DeleteMapping("/nationalities/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteNationality(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.deleteNationality(id, requireNotNull(user.id))
        return ResponseEntity.noContent().build()
    }
}

@RestController
@RequestMapping("/api/v1/system-settings")
@PreAuthorize("hasAuthority('USER_MANAGE')")
class SystemSettingsController(private val service: SystemCatalogService) {
    @GetMapping("/configs")
    fun configs() = service.listSettings()

    @PutMapping("/configs/{id}")
    fun updateConfig(@PathVariable id: Long, @RequestBody request: UpdateSystemSettingRequest, @CurrentUser user: User) =
        service.updateSetting(id, request, requireNotNull(user.id))

    @GetMapping("/languages")
    fun languages() = service.listLanguages()

    @GetMapping("/translations")
    fun translations() = service.listTranslations()

    @PostMapping("/translations")
    fun createTranslation(@RequestBody request: SaveTranslationMessageRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createTranslation(request, requireNotNull(user.id)))

    @PutMapping("/translations/{id}")
    fun updateTranslation(@PathVariable id: Long, @RequestBody request: SaveTranslationMessageRequest, @CurrentUser user: User) =
        service.updateTranslation(id, request, requireNotNull(user.id))

    @DeleteMapping("/translations/{id}")
    fun deleteTranslation(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.deleteTranslation(id, requireNotNull(user.id))
        return ResponseEntity.noContent().build()
    }
}
