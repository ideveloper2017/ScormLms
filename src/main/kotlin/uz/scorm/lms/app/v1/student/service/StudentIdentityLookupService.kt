package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.service.HemisDirectoryClient
import uz.scorm.lms.app.v1.student.dto.HemisStudentCandidateDto
import uz.scorm.lms.app.v1.student.dto.StudentIdentityLookupDto
import uz.scorm.lms.app.v1.student.dto.StudentLookupSource
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.time.Instant
import java.time.ZoneId

@Service
class StudentIdentityLookupService(
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val hemisClient: HemisDirectoryClient,
) {
    @Transactional(readOnly = true)
    fun lookup(pinfl: String?, passportSeries: String?, passportNumber: String?): StudentIdentityLookupDto {
        val normalizedPinfl = pinfl.orEmpty().filter(Char::isDigit)
        val normalizedSeries = passportSeries.orEmpty().filter(Char::isLetterOrDigit).uppercase()
        val normalizedNumber = passportNumber.orEmpty().filter(Char::isLetterOrDigit).uppercase()
        val hasPinfl = normalizedPinfl.isNotEmpty()
        val hasPassport = normalizedSeries.isNotEmpty() || normalizedNumber.isNotEmpty()

        require(hasPinfl.xor(hasPassport)) { "JSHSHIR yoki pasport seriya-raqamini kiriting (ikkalasini bir vaqtda emas)" }
        if (hasPinfl) require(normalizedPinfl.length == 14) { "JSHSHIR 14 ta raqamdan iborat bo'lishi kerak" }
        if (hasPassport) {
            require(normalizedSeries.length in 2..10) { "Pasport seriyasi 2-10 belgidan iborat bo'lishi kerak" }
            require(normalizedNumber.length in 5..20) { "Pasport raqami 5-20 belgidan iborat bo'lishi kerak" }
        }

        val local = if (hasPinfl) studentRepository.findByPinfl(normalizedPinfl)
            else studentRepository.findByPassport(normalizedSeries, normalizedNumber).firstOrNull()
        if (local != null) return StudentIdentityLookupDto(
            source = StudentLookupSource.LOCAL,
            localStudent = studentService.toDto(local),
            hemisChecked = false,
            manualEntryAllowed = false,
            message = "Talaba mahalliy bazadan topildi",
        )

        if (!hemisClient.credentialsConfigured()) return notFound(
            hemisChecked = false,
            message = "Mahalliy bazada topilmadi. HEMIS ulanishi sozlanmagan; ma'lumotni qo'lda kiriting.",
        )

        val identity = if (hasPinfl) normalizedPinfl else "$normalizedSeries$normalizedNumber"
        val hemisStudents = runCatching { hemisClient.fetchStudentsByIdentity(identity) }
            .getOrElse {
                return notFound(
                    hemisChecked = false,
                    message = "Mahalliy bazada topilmadi, HEMIS bilan bog'lanib bo'lmadi. Ma'lumotni qo'lda kiritish mumkin.",
                )
            }
        val match = hemisStudents.firstOrNull { source ->
            if (hasPinfl) normalizePinfl(source) == normalizedPinfl
            else normalizePassport(source.passport_number) == "$normalizedSeries$normalizedNumber"
        }
        if (match == null) return notFound(
            hemisChecked = true,
            message = "Talaba mahalliy baza va HEMISdan topilmadi. Ma'lumotni qo'lda kiriting.",
        )

        val candidate = match.toCandidate()
        if (candidate.pinfl.length != 14) return notFound(
            hemisChecked = true,
            message = "Talaba HEMISda topildi, ammo JSHSHIR to'liq emas. Ma'lumotni tekshirib, qo'lda kiriting.",
        )
        return StudentIdentityLookupDto(
            source = StudentLookupSource.HEMIS,
            hemisStudent = candidate,
            hemisChecked = true,
            manualEntryAllowed = true,
            message = "Talaba HEMISdan topildi. Ma'lumotlarni tekshirib saqlang.",
        )
    }

    private fun notFound(hemisChecked: Boolean, message: String) = StudentIdentityLookupDto(
        source = StudentLookupSource.NOT_FOUND,
        hemisChecked = hemisChecked,
        manualEntryAllowed = true,
        message = message,
    )

    private fun normalizePinfl(student: HemisStudent): String =
        (student.pinfl?.takeIf(String::isNotBlank) ?: student.passport_pin).orEmpty().filter(Char::isDigit)

    private fun normalizePassport(value: String?): String =
        value.orEmpty().filter(Char::isLetterOrDigit).uppercase()

    private fun HemisStudent.toCandidate(): HemisStudentCandidateDto {
        val birthMillis = if (birth_date in 1..99_999_999_999L) birth_date * 1000 else birth_date
        val passport = splitPassport(passport_number)
        return HemisStudentCandidateDto(
            hemisId = id,
            pinfl = normalizePinfl(this),
            passportSeries = passport.first,
            passportNumber = passport.second,
            firstName = first_name.trim(),
            lastName = second_name.trim(),
            middleName = third_name.trim().ifBlank { null },
            fullName = full_name.trim(),
            birthDate = runCatching { Instant.ofEpochMilli(birthMillis).atZone(TASHKENT).toLocalDate() }.getOrNull(),
            gender = mapGender(gender?.code, gender?.name),
            citizenship = if (country.name.contains("O'zbekiston", true) || country.name.contains("Uzbekistan", true)) Citizenship.UZBEKISTAN else Citizenship.OTHER,
            studentNumber = student_id_number.trim(),
            email = email?.trim()?.ifBlank { null },
            photoUrl = image,
            faculty = faculty.name,
            group = group.name,
            specialty = specialty.name,
        )
    }

    private fun splitPassport(value: String?): Pair<String?, String?> {
        val normalized = normalizePassport(value)
        if (normalized.isBlank()) return null to null
        val match = PASSPORT_PATTERN.matchEntire(normalized)
        return if (match == null) null to normalized else match.groupValues[1] to match.groupValues[2]
    }

    private fun mapGender(code: String?, name: String?): Gender? {
        val value = "$code $name".lowercase()
        return when {
            value.contains("female") || value.contains("ayol") || value.contains("жен") || code == "12" -> Gender.FEMALE
            value.contains("male") || value.contains("erkak") || value.contains("муж") || code == "11" -> Gender.MALE
            else -> null
        }
    }

    companion object {
        private val TASHKENT = ZoneId.of("Asia/Tashkent")
        private val PASSPORT_PATTERN = Regex("^([A-Z]{2,10})([0-9]{5,20})$")
    }
}
