package uz.scorm.lms.app.v1.academicperiod.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.academicperiod.dto.CreateAcademicYearRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicSemesterRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicYearStateRequest
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/academic-periods")
class AcademicPeriodController(private val service: AcademicPeriodService) {
    @GetMapping("/years")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun years(@RequestParam(defaultValue = "false") includeInactive: Boolean) = service.listYears(includeInactive)

    @GetMapping("/semesters")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun semesters(@RequestParam(defaultValue = "false") includeInactive: Boolean) = service.listSemesters(includeInactive)

    @PostMapping("/years")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createYear(@RequestBody request: CreateAcademicYearRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createYear(request, requireNotNull(user.id)))

    @PutMapping("/years/{id}/state")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateYearState(@PathVariable id: Long, @RequestBody request: UpdateAcademicYearStateRequest, @CurrentUser user: User) =
        service.updateYearState(id, request, requireNotNull(user.id))

    @PutMapping("/semesters/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateSemester(@PathVariable id: Long, @RequestBody request: UpdateAcademicSemesterRequest, @CurrentUser user: User) =
        service.updateSemester(id, request, requireNotNull(user.id))
}
