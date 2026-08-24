package uz.scorm.lms.app.v1.university.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

enum class UniversityLanguage {
    EN,
    UZ_LATIN,
    KAA,
    RU,
    UZ_CYRILLIC,
}

@Entity
@Table(name = "universities")
class University(
    @Column(nullable = false, length = 500)
    var name: String,

    @Column(nullable = false, length = 250)
    var rector: String,

    @Column(nullable = false, length = 1000)
    var address: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "default_language", nullable = false, length = 30)
    var defaultLanguage: UniversityLanguage = UniversityLanguage.UZ_LATIN,

    @Column(nullable = false, length = 32)
    var phone: String,

    @Column(name = "bank_details", nullable = false, columnDefinition = "TEXT")
    var bankDetails: String,

    @Column(name = "chief_accountant", nullable = false, length = 250)
    var chiefAccountant: String,

    @Column(name = "legal_counsel", nullable = false, length = 250)
    var legalCounsel: String,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()
