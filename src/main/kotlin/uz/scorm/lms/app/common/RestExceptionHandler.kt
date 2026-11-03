package uz.scorm.lms.app.common

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException

@RestControllerAdvice
class RestExceptionHandler {
    @ExceptionHandler(IllegalArgumentException::class)
    fun badRequest(error: IllegalArgumentException): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.badRequest().body(ApiResponse.error(error.message ?: "So'rov ma'lumotlari yaroqsiz"))

    @ExceptionHandler(NoSuchElementException::class)
    fun notFound(error: NoSuchElementException): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(error.message ?: "Ma'lumot topilmadi"))

    @ExceptionHandler(AccessDeniedException::class)
    fun forbidden(error: AccessDeniedException): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(error.message ?: "Kirish taqiqlangan"))

    /** Unikallik buzilsa (oldindan tekshirilmagan joyda) 500 o'rniga tushunarli 409 */
    @ExceptionHandler(DataIntegrityViolationException::class)
    fun conflict(error: DataIntegrityViolationException): ResponseEntity<ApiResponse<Unit>> {
        val detail = generateSequence<Throwable>(error) { it.cause }.mapNotNull { it.message }.joinToString(" ")
        val message = UNIQUE_MESSAGES.entries.firstOrNull { detail.contains(it.key) }?.value
            ?: "Ma'lumot saqlanmadi: shunday yozuv allaqachon mavjud yoki bog'liq ma'lumot yetishmaydi"
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message))
    }

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun tooLarge(error: MaxUploadSizeExceededException): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiResponse.error("Yuklanayotgan fayl hajmi limitdan katta"))

    private companion object {
        val UNIQUE_MESSAGES = mapOf(
            "users_phone_key" to "Bu telefon raqami boshqa foydalanuvchida bor",
            "users_email_key" to "Bu email boshqa foydalanuvchida bor",
            "users_username_key" to "Bu login band",
            "users_jshshir_key" to "Bu JSHSHIR boshqa foydalanuvchida bor",
        )
    }
}
