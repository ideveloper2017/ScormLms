package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.student.dto.StudentProfileResponse
import uz.scorm.lms.app.v1.student.dto.UpdateStudentProfileRequest
import uz.scorm.lms.app.v1.student.service.StudentPortalService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/student")
class StudentPortalController(private val studentPortalService: StudentPortalService) {

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    fun getMyProfile(@CurrentUser currentUser: User): ResponseEntity<StudentProfileResponse> =
        ResponseEntity.ok(studentPortalService.getProfile(currentUser))

    @PutMapping("/me")
    @PreAuthorize("hasAuthority('STUDENT_WRITE')")
    fun updateMyProfile(
        @CurrentUser currentUser: User,
        @RequestBody req: UpdateStudentProfileRequest
    ): ResponseEntity<StudentProfileResponse> =
        ResponseEntity.ok(studentPortalService.updateProfile(currentUser, req))
}