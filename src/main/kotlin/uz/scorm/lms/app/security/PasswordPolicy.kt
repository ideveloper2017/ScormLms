package uz.scorm.lms.app.security

import org.springframework.stereotype.Component

@Component
class PasswordPolicy {
    fun validate(password: String, username: String? = null) {
        require(password.length in 12..128) { "Parol 12 dan 128 tagacha belgidan iborat bo'lishi kerak" }
        require(password.none(Char::isISOControl)) { "Parolda boshqaruv belgilaridan foydalanib bo'lmaydi" }
        username?.trim()?.takeIf { it.length >= 4 }?.let {
            require(!password.contains(it, ignoreCase = true)) { "Parol login nomini o'z ichiga olmasligi kerak" }
        }
        require(password.lowercase() !in setOf(
            "password1234", "administrator", "qwerty123456", "student@1234", "teacher@1234",
        )) { "Keng tarqalgan paroldan foydalanib bo'lmaydi" }
    }
}
