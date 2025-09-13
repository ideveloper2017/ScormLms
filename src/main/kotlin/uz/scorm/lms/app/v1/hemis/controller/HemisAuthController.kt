package uz.scorm.lms.app.v1.hemis.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.v1.auth.dto.LoginRequest
import uz.scorm.lms.app.v1.hemis.dto.HemisStudentResponse
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

@RestController
@RequestMapping("/auth/hemis")
class HemisAuthController(
    private val hemisService: HemisService,
    private val userService: UserService,
    private val userRepository: UserRepository,
    private val roleService: RoleService,
    private val userDetailsService: UserDetailsService,
    private val jwtService: JwtService
) {
    data class HemisLoginRequest(
        val login: String? = null,
        val password: String? = null
    )

    data class TokenResponse(
        val username: String,
        val roles: List<String>,
        val permissions: List<String>,
        val accessToken: String
    )

    @PostMapping("/login")
    fun login(@RequestBody req: HemisLoginRequest): ResponseEntity<String?> {

       val token = hemisService.singInHemis(req);
        val student: HemisStudent = hemisService.fetchStudentByToken(token)

//        require(!(req.hemisToken == null && req.hemisId == null)) { "hemisToken or hemisId is required" }
//
//        val hemisStudent = if (req.hemisToken != null)
//            hemisService.fetchStudentByToken(req.hemisToken)
//        else
//            hemisService.fetchStudentById(req.hemisId!!)
//
//        // find or create user by hemisId/username
//        val existing = userRepository.findByUsername(hemisStudent.username)
//        val user = if (existing == null) {
//            // Register as STUDENT with hemis data
//            val u = userService.register(hemisStudent.username, "Hemis@TempPass1", listOf("STUDENT"))
//            u.hemisId = hemisStudent.hemisId
//            u.fullName = hemisStudent.fullName
//            u.email = hemisStudent.email
//            userRepository.save(u)
//        } else {
//            existing.apply {
//                hemisId = hemisStudent.hemisId
//                fullName = hemisStudent.fullName
//                email = hemisStudent.email
//            }
//            userRepository.save(existing)
//        }
//
//        val userDetails: UserDetails = userDetailsService.loadUserByUsername(user.username)
//        val authorities = userDetails.authorities.map { it.authority }
//        val roles = authorities.filter { it.startsWith("ROLE_") }.map { it.removePrefix("ROLE_") }
//        val permissions = authorities.filterNot { it.startsWith("ROLE_") }
//        val access = jwtService.generateToken(userDetails)
//
//        return ResponseEntity.ok(
//            TokenResponse(
//                username = user.username,
//                roles = roles,
//                permissions = permissions,
//                accessToken = access
//            )
//        )
        return ResponseEntity.ok("");
    }
}
