package uz.scorm.lms.app.common

import io.swagger.v3.oas.annotations.media.Schema


@Schema(description = "Standard API response wrapper for all endpoints")
data class ApiResponse<T>(
    @Schema(description = "Indicates if the request was successful", example = "true")
    val success: Boolean,

    @Schema(description = "Contains the response data when the request is successful")
    val data: T? = null,

    @Schema(description = "A success or informational message", example = "Operation completed successfully")
    val message: String? = null,

    @Schema(description = "Error details when the request fails", example = "Invalid input provided")
    val error: String? = null
) {
    companion object {
        fun <T> success(data: T): ApiResponse<T> {
            return ApiResponse(success = true, data = data)
        }
        
        fun <T> success(message: String, data: T? = null): ApiResponse<T> {
            return ApiResponse(success = true, data = data, message = message)
        }
        
        fun <T> error(message: String, error: String? = null): ApiResponse<T> {
            return ApiResponse(success = false, message = message, error = error)
        }
    }
}
