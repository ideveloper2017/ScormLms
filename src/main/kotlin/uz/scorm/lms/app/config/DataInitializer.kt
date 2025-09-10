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
            u.fullName = "Administrator"
            u.email = "admin@scromlms.local"
            u.emailVerified = true
            userRepository.save(u)
        }

        // Default instructor user
        if (!userRepository.existsByUsername("instructor")) {
            val u = userService.register("instructor", "instructor", listOf("ROLE_INSTRUCTOR"))
            u.fullName = "Default Instructor"
            u.email = "instructor@scromlms.local"
            u.emailVerified = true
            userRepository.save(u)
        }

        // Default student user
        if (!userRepository.existsByUsername("student")) {
            val u = userService.register("student", "student", listOf("ROLE_STUDENT"))
            u.fullName = "Default Student"
            u.email = "student@scromlms.local"
            // Studentni email tasdiqlash oqimi uchun istasangiz false qoldirish mumkin
            u.emailVerified = true
            userRepository.save(u)
        }
    }
}
