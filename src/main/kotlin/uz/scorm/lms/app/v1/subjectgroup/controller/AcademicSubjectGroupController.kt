package uz.scorm.lms.app.v1.subjectgroup.controller

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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.subjectgroup.dto.AssignAcademicSubjectGroupStudentsRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.AssignAcademicSubjectGroupTeacherRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.CreateAcademicSubjectGroupRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.UpdateAcademicSubjectGroupRequest
import uz.scorm.lms.app.v1.subjectgroup.service.AcademicSubjectGroupService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/subject-groups")
class AcademicSubjectGroupController(private val service: AcademicSubjectGroupService) {
    @GetMapping("/teaching-options")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun teachingOptions(@CurrentUser user: User) = service.teachingOptions(requireNotNull(user.id))

    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(
        @RequestParam(required = false) curriculumId: Long?,
        @RequestParam(required = false) academicYear: String?,
        @RequestParam(required = false) semester: Int?,
        @RequestParam(required = false) subjectId: Long?,
        @RequestParam(required = false) active: Boolean?,
    ) = service.list(curriculumId, academicYear, semester, subjectId, active)

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun get(@PathVariable id: Long) = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: CreateAcademicSubjectGroupRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateAcademicSubjectGroupRequest,
        @CurrentUser user: User,
    ) = service.update(id, request, requireNotNull(user.id))

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun members(@PathVariable id: Long) = service.members(id)

    @GetMapping("/{id}/candidates")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun candidates(
        @PathVariable id: Long,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ) = service.candidates(id, search, page, size)

    @PostMapping("/{id}/students")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun assign(
        @PathVariable id: Long,
        @RequestBody request: AssignAcademicSubjectGroupStudentsRequest,
        @CurrentUser user: User,
    ) = service.assign(id, request, requireNotNull(user.id))

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun removeStudent(@PathVariable id: Long, @PathVariable studentId: Long, @CurrentUser user: User) =
        service.removeStudent(id, studentId, requireNotNull(user.id))

    @GetMapping("/{id}/teachers")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun teachers(@PathVariable id: Long) = service.assignedTeachers(id)

    @GetMapping("/{id}/teacher-candidates")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun teacherCandidates(@PathVariable id: Long) = service.teacherCandidates(id)

    @PostMapping("/{id}/teachers")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun assignTeacher(
        @PathVariable id: Long,
        @RequestBody request: AssignAcademicSubjectGroupTeacherRequest,
        @CurrentUser user: User,
    ) = service.assignTeacher(id, request, requireNotNull(user.id))

    @DeleteMapping("/{id}/teachers/{teacherId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun removeTeacher(@PathVariable id: Long, @PathVariable teacherId: Long, @CurrentUser user: User) =
        service.removeTeacher(id, teacherId, requireNotNull(user.id))
}
