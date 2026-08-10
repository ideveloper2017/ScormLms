package uz.scorm.lms.app.v1.classifier.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.classifier.dto.*
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierService
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierImportService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/classifiers")
@PreAuthorize("isAuthenticated()")
class GeographyClassifierController(
    private val service: GeographyClassifierService,
    private val importService: GeographyClassifierImportService,
) {
    @GetMapping("/countries") fun countries() = service.listCountries()
    @GetMapping("/regions") fun regions() = service.listRegions()
    @GetMapping("/regions/{regionId}/districts") fun districts(@PathVariable regionId: Long) = service.listDistricts(regionId)

    @GetMapping("/admin/countries") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun adminCountries() = service.listCountries(true)
    @GetMapping("/admin/regions") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun adminRegions() = service.listRegions(true)
    @GetMapping("/admin/regions/{regionId}/districts") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun adminDistricts(@PathVariable regionId: Long) = service.listDistricts(regionId, true)
    @GetMapping("/admin/import/status") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun importStatus() = importService.status()

    @PostMapping("/admin/countries") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun createCountry(@RequestBody req: ClassifierUpsertRequest, @CurrentUser user: User) = service.createCountry(req, requireNotNull(user.id))
    @PutMapping("/admin/countries/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun updateCountry(@PathVariable id: Long, @RequestBody req: ClassifierUpsertRequest, @CurrentUser user: User) = service.updateCountry(id, req, requireNotNull(user.id))
    @PostMapping("/admin/regions") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun createRegion(@RequestBody req: ClassifierUpsertRequest, @CurrentUser user: User) = service.createRegion(req, requireNotNull(user.id))
    @PutMapping("/admin/regions/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun updateRegion(@PathVariable id: Long, @RequestBody req: ClassifierUpsertRequest, @CurrentUser user: User) = service.updateRegion(id, req, requireNotNull(user.id))
    @PostMapping("/admin/districts") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun createDistrict(@RequestBody req: DistrictClassifierUpsertRequest, @CurrentUser user: User) = service.createDistrict(req, requireNotNull(user.id))
    @PutMapping("/admin/districts/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun updateDistrict(@PathVariable id: Long, @RequestBody req: DistrictClassifierUpsertRequest, @CurrentUser user: User) = service.updateDistrict(id, req, requireNotNull(user.id))
    @PostMapping("/admin/import/bundled") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun importBundled(@CurrentUser user: User) = importService.importBundledDataset(requireNotNull(user.id))
}
