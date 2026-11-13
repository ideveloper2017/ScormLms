package uz.scorm.lms.app.config

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.security.crypto.password.PasswordEncoder
import uz.scorm.lms.app.security.PasswordPolicy
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DataInitializerTest {
    private val userService = mockk<UserService>()
    private val roleService = mockk<RoleService>(relaxed = true)
    private val userRepository = mockk<UserRepository>(relaxed = true)
    private val roleRepository = mockk<RoleRepository>()
    private val passwordEncoder = mockk<PasswordEncoder>(relaxed = true)

    private fun initializer(
        seedAccounts: Boolean = true,
        defaultPassword: String = DEFAULT_ACCOUNT_PASSWORD,
        adminPassword: String = "",
    ) = DataInitializer(userService, roleService, userRepository, roleRepository, passwordEncoder, PasswordPolicy(), seedAccounts, defaultPassword, adminPassword)

    private fun run(initializer: DataInitializer) {
        every { userRepository.save(any<User>()) } answers { firstArg() }
        initializer.run(DefaultApplicationArguments())
    }

    @Test
    fun `standart parol parol qoidasiga mos va hech bir login nomini o'z ichiga olmaydi`() {
        DEFAULT_ACCOUNTS.forEach { PasswordPolicy().validate(DEFAULT_ACCOUNT_PASSWORD, it.username) }
    }

    @Test
    fun `bo'sh bazada har bir rol uchun akkaunt yaratiladi`() {
        every { roleRepository.existsByName(any()) } returns false
        every { userRepository.existsByUsername(any()) } returns false
        every { userService.register(any(), any(), any()) } answers { User(username = firstArg(), password = "x") }

        run(initializer())

        DEFAULT_ACCOUNTS.forEach { account ->
            verify(exactly = 1) { roleService.create(account.role) }
            verify(exactly = 1) { userService.register(account.username, DEFAULT_ACCOUNT_PASSWORD, account.role) }
        }
        verify(exactly = DEFAULT_ACCOUNTS.size) { userRepository.save(any()) }
    }

    @Test
    fun `mavjud akkaunt va rolga tegilmaydi`() {
        every { roleRepository.existsByName(any()) } returns true
        every { userRepository.existsByUsername(any()) } returns true

        run(initializer())

        verify(exactly = 0) { roleService.create(any()) }
        verify(exactly = 0) { userService.register(any(), any(), any()) }
    }

    @Test
    fun `admin paroli alohida berilsa superadmin va admin shu parolni oladi`() {
        every { roleRepository.existsByName(any()) } returns true
        every { userRepository.existsByUsername(any()) } returns false
        val used = mutableMapOf<String, String>()
        every { userService.register(any(), any(), any()) } answers {
            used[firstArg()] = secondArg()
            User(username = firstArg(), password = "x")
        }

        run(initializer(defaultPassword = "Umumiy#Parol2026", adminPassword = "Boshqaruv#Maxsus2026"))

        assertEquals("Boshqaruv#Maxsus2026", used["superadmin"])
        assertEquals("Boshqaruv#Maxsus2026", used["admin"])
        assertEquals("Umumiy#Parol2026", used["metodist"])
        assertEquals("Umumiy#Parol2026", used["student"])
    }

    @Test
    fun `qisqa yoki yaroqsiz boshlang'ich parol ilovani to'xtatmaydi - standart parol ishlatiladi`() {
        every { roleRepository.existsByName(any()) } returns true
        every { userRepository.existsByUsername(any()) } returns false
        val used = mutableMapOf<String, String>()
        every { userService.register(any(), any(), any()) } answers {
            used[firstArg()] = secondArg()
            User(username = firstArg(), password = "x")
        }

        // APP_SEED_ADMIN_PASSWORD=admin123 (qisqa), APP_SEED_DEFAULT_PASSWORD login nomini o'z ichiga oladi
        run(initializer(defaultPassword = "student-parol-2026", adminPassword = "admin123"))

        assertEquals(DEFAULT_ACCOUNT_PASSWORD, used["superadmin"])
        assertEquals(DEFAULT_ACCOUNT_PASSWORD, used["admin"])
        assertEquals(DEFAULT_ACCOUNT_PASSWORD, used["student"])   // "student" nomini o'z ichiga olgani uchun
        assertEquals("student-parol-2026", used["metodist"])      // boshqalar uchun yaroqli
        assertEquals(DEFAULT_ACCOUNTS.size, used.size)
    }

    @Test
    fun `bitta akkaunt yaratilmasa ham qolganlari yaratiladi`() {
        every { roleRepository.existsByName(any()) } returns true
        every { userRepository.existsByUsername(any()) } returns false
        every { userService.register(any(), any(), any()) } answers {
            if (firstArg<String>() == "metodist") throw IllegalStateException("baza xatosi")
            User(username = firstArg(), password = "x")
        }

        run(initializer())

        verify(exactly = DEFAULT_ACCOUNTS.size) { userService.register(any(), any(), any()) }
        verify(exactly = DEFAULT_ACCOUNTS.size - 1) { userRepository.save(any<User>()) }
    }

    @Test
    fun `akkaunt yaratish o'chirilgan bo'lsa faqat rollar yaratiladi`() {
        every { roleRepository.existsByName(any()) } returns false

        run(initializer(seedAccounts = false))

        verify(exactly = DEFAULT_ACCOUNTS.map { it.role }.distinct().size) { roleService.create(any()) }
        verify(exactly = 0) { userService.register(any(), any(), any()) }
        verify(exactly = 0) { userRepository.existsByUsername(any()) }
    }

    @Test
    fun `standart parol bilan qolgan akkauntlar aniqlanadi`() {
        every { roleRepository.existsByName(any()) } returns true
        every { userRepository.existsByUsername(any()) } returns true
        every { userRepository.findByUsername(any()) } answers { User(username = firstArg(), password = "hash-" + firstArg()) }
        every { passwordEncoder.matches(DEFAULT_ACCOUNT_PASSWORD, "hash-admin") } returns true
        every { passwordEncoder.matches(DEFAULT_ACCOUNT_PASSWORD, "hash-student") } returns true

        run(initializer())

        // Ogohlantirish logga yoziladi; bu yerda faqat tekshiruv har akkaunt uchun bajarilgani tasdiqlanadi
        verify(exactly = DEFAULT_ACCOUNTS.size) { passwordEncoder.matches(DEFAULT_ACCOUNT_PASSWORD, any()) }
        assertTrue(true)
    }
}
