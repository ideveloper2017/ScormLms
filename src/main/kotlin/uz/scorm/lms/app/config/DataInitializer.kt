package uz.scorm.lms.app.config

import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

private val logger = KotlinLogging.logger {}

/** Tizimning asosiy rollari va ularga bog'langan standart akkauntlar (login = rol nomi). */
data class DefaultAccount(val username: String, val role: String, val fullName: String)

val DEFAULT_ACCOUNTS: List<DefaultAccount> = listOf(
    DefaultAccount("superadmin", "super_admin", "Super administrator"),
    DefaultAccount("admin", "admin", "Administrator"),
    DefaultAccount("metodist", "metodist", "Metodist"),
    DefaultAccount("teacher", "teacher", "O'qituvchi"),
    DefaultAccount("student", "student", "Talaba"),
    DefaultAccount("proctor", "proctor", "Proktor"),
    DefaultAccount("monitoring", "monitoring", "Monitoring xodimi"),
)

/**
 * Parol qoidasiga mos (12+ belgi, login nomini o'z ichiga olmaydi, umumiy ro'yxatda yo'q).
 * `APP_SEED_DEFAULT_PASSWORD` bilan almashtiriladi.
 */
const val DEFAULT_ACCOUNT_PASSWORD = "Lms#2026!Kirish"

/**
 * Har ishga tushishda: rollar va standart akkauntlar bo'lmasa yaratiladi (bor bo'lsa tegilmaydi), shunda yangi
 * baza migratsiya qilingan zahoti tizimga kirish mumkin. Standart parol hali o'zgartirilmagan akkauntlar logda
 * ogohlantiriladi.
 */
@Component
@Order(0)
class DataInitializer(
    private val userService: UserService,
    private val roleService: RoleService,
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val passwordEncoder: PasswordEncoder,
    /** false bo'lsa faqat rollar yaratiladi, akkauntlar emas */
    @param:Value("\${app.seed.default-accounts:true}") private val seedDefaultAccounts: Boolean,
    /** Barcha standart akkauntlar uchun boshlang'ich parol */
    @param:Value("\${app.seed.default-password:$DEFAULT_ACCOUNT_PASSWORD}") private val defaultPassword: String,
    /** superadmin va admin uchun alohida boshlang'ich parol (berilsa standart parol o'rniga) */
    @param:Value("\${app.seed.admin-password:}") private val adminPassword: String,
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        DEFAULT_ACCOUNTS.map { it.role }.distinct().forEach(::seedRole)
        if (!seedDefaultAccounts) return

        val created = DEFAULT_ACCOUNTS.filter(::seedAccount).map { it.username }
        if (created.isNotEmpty()) {
            logger.warn {
                "Standart akkauntlar yaratildi: ${created.joinToString()}. Parol: " +
                    (if (defaultPassword == DEFAULT_ACCOUNT_PASSWORD) "standart ($DEFAULT_ACCOUNT_PASSWORD)" else "APP_SEED_DEFAULT_PASSWORD dagi qiymat") +
                    ". Kirgach parollarni almashtiring."
            }
        }
        warnAboutUnchangedDefaultPasswords()
    }

    private fun seedRole(name: String) {
        if (!roleRepository.existsByName(name)) {
            roleService.create(name)
        }
    }

    /** Akkaunt bo'lmasa yaratadi; mavjud akkauntga (paroli, roli) tegilmaydi. Yaratilgan bo'lsa true. */
    private fun seedAccount(account: DefaultAccount): Boolean {
        if (userRepository.existsByUsername(account.username)) return false

        val password = if (account.role in ADMIN_ROLES && adminPassword.isNotBlank()) adminPassword else defaultPassword
        val user = userService.register(account.username, password, account.role)
        user.fullName = account.fullName
        user.email = "${account.username}@example.com"
        user.credentialsInitialized = true
        userRepository.save(user)
        return true
    }

    /** Standart parol bilan qolgan akkauntlar — ayniqsa serverda — xavf: har ishga tushganda eslatiladi. */
    private fun warnAboutUnchangedDefaultPasswords() {
        val unchanged = DEFAULT_ACCOUNTS.mapNotNull { account ->
            userRepository.findByUsername(account.username)
                ?.takeIf { passwordEncoder.matches(DEFAULT_ACCOUNT_PASSWORD, it.password) }
                ?.username
        }
        if (unchanged.isNotEmpty()) {
            logger.warn { "DIQQAT: standart parol hali o'zgartirilmagan: ${unchanged.joinToString()}. Foydalanuvchi sahifasida yangi parol qo'ying." }
        }
    }

    companion object {
        private val ADMIN_ROLES = setOf("super_admin", "admin")
    }
}
