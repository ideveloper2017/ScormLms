package uz.scorm.lms.app.common

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

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun tooLarge(error: MaxUploadSizeExceededException): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiResponse.error("Yuklanayotgan fayl hajmi limitdan katta"))
}
