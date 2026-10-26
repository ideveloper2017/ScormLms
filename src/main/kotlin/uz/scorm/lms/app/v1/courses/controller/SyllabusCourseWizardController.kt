package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.service.SyllabusCourseWizardService
import uz.scorm.lms.app.v1.courses.service.SyllabusLinkedCourseDto
import uz.scorm.lms.app.v1.courses.service.SyllabusTopicsWithCoursesDto
import uz.scorm.lms.app.v1.courses.service.SyllabusWithCourseDto
import uz.scorm.lms.app.v1.courses.service.WorkProgramRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.user.model.User

/** "Fan dasturi va kurs": dastur, mavzular va kursni birga yaratish va moslash. */
@RestController
@RequestMapping("/api/v1/syllabus-courses")
class SyllabusCourseWizardController(private val service: SyllabusCourseWizardService) {
    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE') and hasAuthority('COURSE_WRITE')")
    fun create(
        @RequestBody request: WorkProgramRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SyllabusWithCourseDto>> =
        ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(request, requireNotNull(user.id))))

    @GetMapping("/{syllabusId}/courses")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun linkedCourses(@PathVariable syllabusId: Long): ApiResponse<List<SyllabusLinkedCourseDto>> =
        ApiResponse.success(service.linkedCourses(syllabusId))

    /** Mavzularni saqlash: qoralama kurslar bo'limlari ham avtomatik moslanadi. */
    @PutMapping("/{syllabusId}/topics")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateTopics(
        @PathVariable syllabusId: Long,
        @RequestBody topics: List<SyllabusTopicRequest>,
    ): ApiResponse<SyllabusTopicsWithCoursesDto> = ApiResponse.success(service.updateTopics(syllabusId, topics))
}
