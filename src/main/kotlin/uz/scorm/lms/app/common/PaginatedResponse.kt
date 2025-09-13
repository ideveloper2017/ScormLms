package uz.scorm.lms.app.common

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "Paginated response wrapper for list endpoints")
data class PaginatedResponse<T>(
    @Schema(description = "The data content of the page")
    val content: List<T>,

    @Schema(description = "The current page number (zero-based)", example = "0")
    val page: Int,

    @Schema(description = "The page size", example = "20")
    val size: Int,

    @Schema(description = "Total number of elements across all pages", example = "42")
    val totalElements: Long,

    @Schema(description = "Total number of pages", example = "3")
    val totalPages: Int,
    val isFirst: Boolean = page == 0,
    val isLast: Boolean = page >= totalPages - 1
)
