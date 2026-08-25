package uz.scorm.lms.app.config

import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

private val logger = KotlinLogging.logger {}

@Component
class DataInitializer(
    private val userService: UserService,
    private val roleService: RoleService,
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val environment: Environment,
    @param:Value("\${app.seed.admin-password:}") private val adminPassword: String,
    @param:Value("\${app.seed.teacher-password:}") private val teacherPassword: String,
    @param:Value("\${app.seed.student-password:}") private val studentPassword: String
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        seedRole("super_admin")
        seedRole("admin")
        seedRole("metodist")
        seedRole("teacher")
        seedRole("student")
        seedRole("proctor")
        seedRole("monitoring")

        seedAdminUser()

        if (isDevProfile()) {
            seedDemoUserIfConfigured("teacher", teacherPassword, "teacher")
            seedDemoUserIfConfigured("student", studentPassword, "student")
        }
    }

    private fun isDevProfile(): Boolean =
        environment.acceptsProfiles(Profiles.of("postgresql-dev"))

    private fun seedRole(name: String) {
        if (!roleRepository.existsByName(name)) {
            roleService.create(name)
        }
    }

    private fun seedAdminUser() {
        if (userRepository.existsByUsername("admin")) return

        if (adminPassword.isBlank()) {
            logger.warn { "Default admin yaratilmadi: APP_SEED_ADMIN_PASSWORD env variable berilmagan." }
            return
        }

        val u = userService.register("admin", adminPassword, "super_admin")
        u.fullName = "Super Admin"
        u.email = "admin@example.com"
        u.phone = "+998901234567"
        userRepository.save(u)
        logger.info { "Super Admin user yaratildi" }
    }

    private fun seedDemoUserIfConfigured(username: String, password: String, roleName: String) {
        if (password.isBlank()) return
        if (userRepository.existsByUsername(username)) return
        userService.register(username, password, roleName)
        logger.info { "Demo user yaratildi: $username" }
    }
}
