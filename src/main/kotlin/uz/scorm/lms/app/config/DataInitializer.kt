package uz.scorm.lms.app.config

import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.permission.repository.PermissionRepository
import uz.scorm.lms.app.v1.permission.service.PermissionService
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

private val logger = KotlinLogging.logger {}

@Component
class DataInitializer(
    private val userService: UserService,
    private val roleService: RoleService,
    private val permissionService: PermissionService,
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val permissionRepository: PermissionRepository,
    private val environment: Environment,
    @Value("\${app.seed.admin-password:}") private val adminPassword: String
) : ApplicationRunner {

    override fun run(args: ApplicationArguments?) {
        // Permissions
        seedPermission("USER_READ", "Read users")
        seedPermission("USER_WRITE", "Write users")
        seedPermission("USER_MANAGE", "Manage users")
        seedPermission("COURSE_READ", "Read courses")
        seedPermission("COURSE_WRITE", "Manage courses")
        seedPermission("ROLE_MANAGE", "Manage roles and permissions")
        seedPermission("AUDIT_READ", "Read audit logs")
        seedPermission("REPORT_READ", "Read reports")
        seedPermission("EXAM_MANAGE", "Manage exams")
        seedPermission("EXAM_TAKE", "Take exams")
        seedPermission("EXAM_PROCTOR", "Proctor exams")
        seedPermission("USER_MONITOR", "Monitor users")
        seedPermission("STAT_READ", "Read statistics")

        // Roles
        seedRole("ROLE_SUPER_ADMIN", "Super Administrator", listOf("USER_MANAGE", "COURSE_WRITE", "ROLE_MANAGE", "AUDIT_READ"))
        seedRole("ROLE_ADMIN", "Administrator", listOf("USER_MANAGE", "COURSE_WRITE", "AUDIT_READ"))
        seedRole("ROLE_METODIST", "Metodist", listOf("COURSE_WRITE", "REPORT_READ"))
        seedRole("ROLE_INSTRUCTOR", "Instructor", listOf("COURSE_READ", "COURSE_WRITE", "EXAM_MANAGE"))
        seedRole("ROLE_STUDENT", "Student", listOf("COURSE_READ", "EXAM_TAKE"))
        seedRole("ROLE_PROCTOR", "Proktor", listOf("EXAM_PROCTOR", "USER_MONITOR"))
        seedRole("ROLE_MONITOR", "Monitoring", listOf("STAT_READ", "AUDIT_READ"))

        seedAdminUser()

        // Demo userlar faqat dev muhitda yaratiladi
        if (isDevProfile()) {
            seedDemoUser("instructor", "instructor123", "ROLE_INSTRUCTOR", "Instructor", "+1234567891")
            seedDemoUser("student", "student123", "ROLE_STUDENT", "Student", "+1234567892")
        }
    }

    private fun isDevProfile(): Boolean =
        environment.acceptsProfiles(Profiles.of("postgresql-dev"))

    private fun seedPermission(code: String, name: String) {
        if (!permissionRepository.existsByCode(code)) {
            permissionService.create(code, name)
        }
    }

    private fun seedRole(code: String, name: String, permissionCodes: List<String>) {
        if (!roleRepository.existsByCode(code)) {
            roleService.create(code, name)
        }
        permissionCodes.forEach { roleService.addPermissionToRole(code, it) }
    }

    private fun seedAdminUser() {
        if (userRepository.existsByUsername("admin")) return

        val password = adminPassword.ifBlank {
            if (isDevProfile()) {
                "admin"
            } else {
                logger.warn {
                    "Default admin yaratilmadi: APP_SEED_ADMIN_PASSWORD env variable berilmagan."
                }
                return
            }
        }

        val u = userService.register("admin", password, listOf("ROLE_SUPER_ADMIN"))
        u.firstName = "Super"
        u.lastName = "Admin"
        u.phone = "+1234567890"
        u.email = "admin@example.com"
        u.emailVerified = true
        u.enabled = true
        userRepository.save(u)
        logger.info { "Super Admin user yaratildi" }
    }

    private fun seedDemoUser(username: String, password: String, role: String, firstName: String, phone: String) {
        if (userRepository.existsByUsername(username)) return
        val u = userService.register(username, password, listOf(role))
        u.firstName = firstName
        u.lastName = "User"
        u.phone = phone
        u.email = "$username@example.com"
        u.emailVerified = true
        u.enabled = true
        userRepository.save(u)
        logger.info { "Demo user yaratildi: $username" }
    }
}
