package uz.scorm.lms.app.v1.exam.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.exam.dto.ExamAppealRequestDto
import uz.scorm.lms.app.v1.exam.service.ExamResultService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/students/me/exam-appeals")
@PreAuthorize("hasAuthority('STUDENT_READ')")
class StudentExamAppealController(private val service: ExamResultService) {
    @GetMapping fun list(@CurrentUser user: User) = service.studentAppeals(user.id!!)
    @PostMapping fun create(@RequestBody request: ExamAppealRequestDto, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.appeal(request, user.id!!))
}
