package uz.scorm.lms.app.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.permission.service.PermissionService
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.service.UserService

@Component
class DataInitializer(
    private val userService: UserService,
    private val roleService: RoleService,
    private val permissionService: PermissionService,
    private val userRepository: UserRepository
) : ApplicationRunner {
    override fun run(args: ApplicationArguments?) {
        // Base permissions for LMS
        runCatching { permissionService.create("USER_READ", "Read users") }.getOrNull()
        runCatching { permissionService.create("USER_WRITE", "Write users") }.getOrNull()
        runCatching { permissionService.create("COURSE_READ", "Read courses") }.getOrNull()
        runCatching { permissionService.create("COURSE_WRITE", "Manage courses") }.getOrNull()

        // Roles: Admin, Instructor, Student
        runCatching { roleService.create("ROLE_ADMIN", "Administrator") }.getOrNull()
        runCatching { roleService.create("ROLE_INSTRUCTOR", "Instructor") }.getOrNull()
        runCatching { roleService.create("ROLE_STUDENT", "Student") }.getOrNull()

        // Assign typical permissions
        runCatching { roleService.addPermissionToRole("ROLE_ADMIN", "USER_READ") }
        runCatching { roleService.addPermissionToRole("ROLE_ADMIN", "USER_WRITE") }
        runCatching { roleService.addPermissionToRole("ROLE_ADMIN", "COURSE_READ") }
        runCatching { roleService.addPermissionToRole("ROLE_ADMIN", "COURSE_WRITE") }

        runCatching { roleService.addPermissionToRole("ROLE_INSTRUCTOR", "COURSE_READ") }
        runCatching { roleService.addPermissionToRole("ROLE_INSTRUCTOR", "COURSE_WRITE") }

        runCatching { roleService.addPermissionToRole("ROLE_STUDENT", "COURSE_READ") }

        // Default admin user
        if (!userRepository.existsByUsername("admin")) {
            val u = userService.register("admin", "admin", listOf("ROLE_ADMIN"))
            u.firstName = "Admin"
            u.lastName = "User"
            u.phone = "+1234567890"  // Make sure to set a valid phone number
            u.email = "admin@example.com"
            u.enabled = true
            userRepository.save(u)
        }

// For instructor user
        if (!userRepository.existsByUsername("instructor")) {
            val u = userService.register("instructor", "instructor123", listOf("ROLE_INSTRUCTOR"))
            u.firstName = "Instructor"
            u.lastName = "User"
            u.phone = "+1234567891"  // Make sure to set a valid phone number
            u.email = "instructor@example.com"
            u.enabled = true
            userRepository.save(u)
        }

// For student user
        if (!userRepository.existsByUsername("student")) {
            val u = userService.register("student", "student123", listOf("ROLE_STUDENT"))
            u.firstName = "Student"
            u.lastName = "User"
            u.phone = "+1234567892"  // Make sure to set a valid phone number
            u.email = "student@example.com"
            u.enabled = true
            userRepository.save(u)
        }
    }
}
