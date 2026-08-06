package uz.scorm.lms.app.v1.attestation.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.attestation.service.GraduationCertificateService
import uz.scorm.lms.app.v1.attestation.service.StudentDefenseService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/students/me/attestations")
@PreAuthorize("hasAuthority('STUDENT_READ')")
class StudentAttestationController(
    private val defenseService: StudentDefenseService,
    private val certificateService: GraduationCertificateService,
) {
    @GetMapping fun list(@CurrentUser user: User) = defenseService.getMyAttestations(user.id!!)
    @GetMapping("/certificates") fun certificates(@CurrentUser user: User) = certificateService.getMyCertificates(user.id!!)
}
