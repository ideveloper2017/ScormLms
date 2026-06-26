package uz.scorm.lms.app.v1.hemis.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.JwtService
import uz.scorm.lms.app.v1.hemis.dto.HemisLoginResponse
import uz.scorm.lms.app.v1.hemis.dto.HemisLoginUser
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

@RestController
@RequestMapping("/auth/hemis")
class HemisAuthController(
    private val hemisService: HemisService,
    private val userService: UserService,
    private val userRepository: UserRepository,
    private val studentService: StudentService,
    private val studentRepository: StudentRepository,
    private val userDetailsService: UserDetailsService,
    private val jwtService: JwtService,
) {
    data class HemisLoginRequest(
        val login: String? = null,
        val password: String? = null,
    )

    /**
     * POST /auth/hemis/login
     *
     * Talaba HEMIS login/parolini kiritadi → tizim HEMISga autentifikatsiya qiladi,
     * talabaning profilini oladi, DB da mavjud bo'lmasa akkaunt yaratadi,
     * JWT juftini qaytaradi.
     */
    @PostMapping("/login")
    fun login(@RequestBody req: HemisLoginRequest): ResponseEntity<ApiResponse<HemisLoginResponse>> {
        require(!req.login.isNullOrBlank() && !req.password.isNullOrBlank()) {
            "login va password majburiy"
        }

        // 1. HEMISda autentifikatsiya
        val hemisToken   = hemisService.signInHemis(req)
        val hemisStudent = hemisService.fetchStudentByToken(hemisToken)

        // 2. DB da mavjudligini tekshirish
        val existing = userRepository.findByUsername(hemisStudent.student_id_number)

        val user = if (existing != null) {
            // Mavjud akkaunt — ma'lumotlarni yangilaymiz
            existing.apply {
                fullName = hemisStudent.full_name
                email    = hemisStudent.email
            }
            userRepository.save(existing)
        } else {
            // Yangi talaba — StudentProfile ham yaratamiz
            with(hemisService) {
                val createReq: StudentCreateRequest = hemisStudent.toCreateRequest()
                // PINFL takrorlanmasligini tekshiramiz — agar talaba oldin qo'shilgan bo'lsa, PINFL=studentNumber bo'ladi
                if (!studentRepository.existsByStudentNumber(createReq.studentNumber)) {
                    studentService.create(createReq)
                }
            }
            userRepository.findByUsername(hemisStudent.student_id_number)
                ?: error("Akkaunt yaratib bo'lmadi: ${hemisStudent.student_id_number}")
        }

        // 3. JWT juftini generatsiya qilamiz
        val userDetails  = userDetailsService.loadUserByUsername(user.username)
        val accessToken  = jwtService.generateAccessToken(userDetails)
        val refreshToken = jwtService.generateRefreshToken(userDetails)
        val roles        = userDetails.authorities.map { it.authority }

        return ResponseEntity.ok(
            ApiResponse.success(
                HemisLoginResponse(
                    accessToken  = accessToken,
                    refreshToken = refreshToken,
                    user = HemisLoginUser(
                        username = user.username,
                        fullName = user.fullName,
                        roles    = roles,
                    ),
                )
            )
        )
    }
}
