package uz.scorm.lms.app.v1.productivity

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/workspace")
@PreAuthorize("isAuthenticated()")
class WorkspaceController(private val service: WorkspaceService) {
    @GetMapping("/search")
    fun search(@RequestParam q: String, @CurrentUser user: User, authentication: Authentication): ApiResponse<List<WorkspaceItem>> {
        val permissions = authentication.authorities.map { it.authority }.toSet()
        return ApiResponse.success(service.search(requireNotNull(user.id), q,
            permissions.any { it in setOf("USER_MANAGE", "ACADEMIC_WRITE") }, "COURSE_READ" in permissions,
            "USER_READ" in permissions && user.role?.name?.lowercase() in setOf("super_admin", "admin", "metodist"),
            user.role?.name.equals("teacher", true) && "COURSE_READ" in permissions,
            user.role?.name.equals("student", true)))
    }
    @GetMapping("/resume")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun resume(@CurrentUser user: User): ApiResponse<WorkspaceItem?> = ApiResponse.success(service.resume(requireNotNull(user.id)))

    @PostMapping("/courses/{courseId}/contents/{contentId}/view")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun viewed(@PathVariable courseId: Long, @PathVariable contentId: Long, @CurrentUser user: User): ApiResponse<Unit> {
        service.viewed(requireNotNull(user.id), courseId, contentId)
        return ApiResponse.success(Unit)
    }
    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')")
    fun tasks(@CurrentUser user: User): ApiResponse<List<WorkspaceItem>> = ApiResponse.success(service.tasks(requireNotNull(user.id), user.role?.name.equals("student", true)))

    @GetMapping("/setup")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun setup(): ApiResponse<List<SetupStep>> = ApiResponse.success(service.setup())
}
