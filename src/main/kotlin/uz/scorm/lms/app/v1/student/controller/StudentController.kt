package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.HttpStatus
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.student.service.StudentLifecycleService
import uz.scorm.lms.app.v1.student.service.StudentRegistryService
import uz.scorm.lms.app.v1.student.service.StudentAccountService
import uz.scorm.lms.app.v1.student.service.StudentBulkTransferService
import uz.scorm.lms.app.v1.student.service.StudentMovementReportService
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/students")
class StudentController(
    private val studentService: StudentService,
    private val lifecycleService: StudentLifecycleService,
    private val registryService: StudentRegistryService,
    private val accountService: StudentAccountService,
    private val bulkTransferService: StudentBulkTransferService,
    private val movementReportService: StudentMovementReportService,
) {

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    fun list(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: StudentStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): StudentRegistryPageDto = registryService.search(search, status, page, size)

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('USER_READ') and hasAuthority('REPORT_READ')")
    fun export(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: StudentStatus?,
        @CurrentUser user: User,
    ): ResponseEntity<ByteArray> {
        val export = registryService.export(search, status, requireNotNull(user.id))
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${export.filename}\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .contentType(MediaType.parseMediaType(export.contentType))
            .body(export.bytes)
    }

    @GetMapping("/reinstatements/subjects-report")
    @PreAuthorize("hasAuthority('USER_READ') and hasAuthority('ACADEMIC_READ') and hasAuthority('REPORT_READ')")
    fun reinstatementSubjectsReport(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) academicYear: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ReinstatementSubjectReportPageDto =
        movementReportService.reinstatementSubjects(search, academicYear, page, size)

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    fun getById(@PathVariable id: Long): StudentDto = studentService.getById(id)

    @GetMapping("/by-number/{studentNumber}")
    @PreAuthorize("hasAuthority('USER_READ')")
    fun getByStudentNumber(@PathVariable studentNumber: String): StudentDto =
        studentService.getByStudentNumber(studentNumber)

    @PostMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun create(
        @RequestBody req: StudentRegistrationRequest,
        @CurrentUser user: User,
    ): ResponseEntity<StudentDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(studentService.register(req, requireNotNull(user.id)))

    @PostMapping("/{id}/admission")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun admit(
        @PathVariable id: Long,
        @RequestBody req: StudentAcademicAdmissionRequest,
        @CurrentUser user: User,
    ): StudentLifecycleResultDto = lifecycleService.admitRegistered(id, req, requireNotNull(user.id))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun update(@PathVariable id: Long, @RequestBody req: StudentUpdateRequest): StudentDto =
        studentService.update(id, req)

    @PutMapping("/{id}/personal-profile")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun updatePersonalProfile(
        @PathVariable id: Long,
        @RequestBody req: StudentPersonalProfileUpdateRequest,
        @CurrentUser user: User,
    ): StudentDto = studentService.updatePersonalProfile(id, req, requireNotNull(user.id))

    @GetMapping("/{id}/lifecycle")
    @PreAuthorize("hasAuthority('USER_READ') and hasAuthority('ACADEMIC_READ')")
    fun lifecycle(@PathVariable id: Long): List<StudentLifecycleEventDto> = lifecycleService.history(id)

    @PostMapping("/{id}/lifecycle")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun transition(
        @PathVariable id: Long,
        @RequestBody req: StudentLifecycleRequest,
        @CurrentUser user: User,
    ): StudentLifecycleResultDto = lifecycleService.transition(id, req, requireNotNull(user.id))

    @PostMapping("/bulk-transfer")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun bulkTransfer(
        @RequestBody req: StudentBulkTransferRequest,
        @CurrentUser user: User,
    ): StudentBulkTransferResultDto = bulkTransferService.transfer(req, requireNotNull(user.id))

    @PatchMapping("/{id}/promote")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun promote(@PathVariable id: Long): StudentDto = studentService.promote(id)

    @PatchMapping("/{id}/account-access")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun changeAccountAccess(
        @PathVariable id: Long,
        @RequestBody req: StudentAccountAccessRequest,
        @CurrentUser user: User,
    ): StudentSummaryDto = accountService.changeAccess(id, req, requireNotNull(user.id))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        studentService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
