package uz.scorm.lms.app.v1.face.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import uz.scorm.lms.app.security.UserDetailsImpl
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@RestController
@RequestMapping("/auth/face")
@EnableWebMvc
@Tag(name = "Face Recognition", description = "APIs for face recognition and verification")
class FaceController(
    private val faceService: FaceService,
    private val userRepository: UserRepository
) {
    data class FaceResponse(
        val verified: Boolean,
        val verifiedAt: Instant? = null,
        val message: String? = null
    )

    private fun currentUsername(): String {
        val auth: Authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found in security context")
        return auth.name
    }

    @Operation(
        summary = "Enroll user's face",
        description = "Upload an image to create a face template for the authenticated user"
    )
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "201",
                description = "Face template created successfully",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = FaceResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid file provided",
                content = [Content()]
            ),
            ApiResponse(
                responseCode = "401",
                description = "Authentication required",
                content = [Content()]
            )
        ]
    )
    @PostMapping(
        value = ["/enroll"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @ResponseStatus(HttpStatus.CREATED)
    fun enroll(
        @Parameter(
            description = "Image file containing user's face",
            required = true,
            content = [
                Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    schema = Schema(type = "string", format = "binary")
                )
            ]
        )
        @RequestPart("file") file: MultipartFile
    ): ResponseEntity<FaceResponse> {
        if (file.isEmpty) {
            return ResponseEntity.badRequest().body(
                FaceResponse(
                    verified = false,
                    message = "No file provided"
                )
            )
        }

        return try {
            val username = currentUsername()
            val user = userRepository.findByUsername(username)
                ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    FaceResponse(
                        verified = false,
                        message = "User not found"
                    )
                )

            val template = faceService.generateTemplate(file.bytes)
            user.faceTemplate = template
            user.faceVerified = true
            user.lastFaceVerifiedAt = Instant.now()
            userRepository.save(user)

            ResponseEntity.ok(
                FaceResponse(
                    verified = true,
                    verifiedAt = user.lastFaceVerifiedAt,
                    message = "Face enrolled successfully"
                )
            )
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                FaceResponse(
                    verified = false,
                    message = "Error processing face enrollment: ${e.message}"
                )
            )
        }
    }

    @Operation(
        summary = "Verify user's face",
        description = "Upload an image to verify against the enrolled face template"
    )
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Face verification successful",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = FaceResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid file or no face template found",
                content = [Content()]
            ),
            ApiResponse(
                responseCode = "401",
                description = "Authentication required",
                content = [Content()]
            ),
            ApiResponse(
                responseCode = "403",
                description = "Face verification failed",
                content = [Content()]
            )
        ]
    )
    @PostMapping(
        value = ["/verify"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @ResponseStatus(HttpStatus.OK)
    fun verify(
        @Parameter(
            description = "Image file containing user's face for verification",
            required = true,
            content = [
                Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    schema = Schema(type = "string", format = "binary")
                )
            ]
        )
        @RequestPart("file") file: MultipartFile
    ): ResponseEntity<FaceResponse> {

        val template = faceService.generateTemplate(file.bytes)
        print("Template "+template)

        if (file.isEmpty) {
            return ResponseEntity.badRequest().body(
                FaceResponse(
                    verified = false,
                    message = "Fayl yuklanmadi"
                )
            )
        }

        return try {
            // Get authentication from security context

            val authentication = SecurityContextHolder.getContext().authentication
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    FaceResponse(
                        verified = false,
                        message = "Avtorizatsiya talab qilinadi"
                    )
                )

            // Get username from authentication

            val username = authentication.principal as UserDetails
            val user = userRepository.findByUsername(username.username)
                ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    FaceResponse(
                        verified = false,
                        message = "Foydalanuvchi topilmadi"
                    )
                )

            // Check if user has a face template
            val storedTemplate = user.faceTemplate
                ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    FaceResponse(
                        verified = false,
                        message = "Yuz ma'lumoti topilmadi. Avval ro'yxatdan o'ting."
                    )
                )

            // Verify the face
            val isMatch = faceService.matches(storedTemplate, file.bytes)

            if (isMatch) {
                // Update user verification status
                user.faceVerified = true
                user.lastFaceVerifiedAt = Instant.now()
                userRepository.save(user)

                ResponseEntity.ok(
                    FaceResponse(
                        verified = true,
                        verifiedAt = user.lastFaceVerifiedAt,
                        message = "Yuz muvaffaqiyatli tasdiqlandi"
                    )
                )
            } else {
                // Face didn't match
                ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    FaceResponse(
                        verified = false,
                        message = "Yuz mos kelmadi. Iltimos, qaytadan urinib ko'ring."
                    )
                )
            }
        } catch (e: Exception) {
            // Handle any unexpected errors
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                FaceResponse(
                    verified = false,
                    message = "Xatolik yuz berdi: ${e.message}"
                )
            )
        }
    }
}
