package uz.scorm.lms.app.v1.student.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.DateAudit
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "students",
    indexes = [
        Index(name = "idx_student_pinfl",         columnList = "pinfl",          unique = true),
        Index(name = "idx_student_number",         columnList = "student_number", unique = true),
        Index(name = "idx_student_passport",       columnList = "passport_series, passport_number"),
        Index(name = "idx_student_faculty",        columnList = "faculty_id"),
        Index(name = "idx_student_department",     columnList = "department_id"),
        Index(name = "idx_student_group",          columnList = "group_id"),
        Index(name = "idx_student_status",         columnList = "student_status"),
    ]
)
class StudentProfile(

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @OneToOne(fetch = FetchType.LAZY, cascade = [CascadeType.MERGE])
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    var user: User,

    // ── Shaxsiy ma'lumotlar ───────────────────────────────────────────────────
    @Column(name = "pinfl", length = 14, unique = true, nullable = false)
    var pinfl: String,

    @Column(name = "last_name", nullable = false)
    var lastName: String,

    @Column(name = "first_name", nullable = false)
    var firstName: String,

    @Column(name = "middle_name")
    var middleName: String? = null,

    @Column(name = "birth_date", nullable = false)
    var birthDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    var gender: Gender,

    @Enumerated(EnumType.STRING)
    @Column(name = "citizenship", nullable = false, length = 20)
    var citizenship: Citizenship = Citizenship.UZBEKISTAN,

    // ── Pasport ───────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "passport_type", length = 25)
    var passportType: PassportType? = null,

    @Column(name = "passport_series", length = 10)
    var passportSeries: String? = null,

    @Column(name = "passport_number", length = 20)
    var passportNumber: String? = null,

    @Column(name = "passport_issued_date")
    var passportIssuedDate: LocalDate? = null,

    @Column(name = "passport_expiry_date")
    var passportExpiryDate: LocalDate? = null,

    @Column(name = "passport_issued_by", length = 300)
    var passportIssuedBy: String? = null,

    @Column(name = "photo_url", length = 500)
    var photoUrl: String? = null,

    // ── Aloqa ─────────────────────────────────────────────────────────────────
    @Column(name = "phone_number", length = 20)
    var phoneNumber: String? = null,

    @Column(name = "student_email", length = 150)
    var email: String? = null,

    // ── Doimiy yashash manzili ────────────────────────────────────────────────
    @Column(name = "permanent_region", length = 100)
    var permanentRegion: String? = null,

    @Column(name = "permanent_district", length = 100)
    var permanentDistrict: String? = null,

    @Column(name = "permanent_address", length = 500)
    var permanentAddress: String? = null,

    // ── Hozirgi yashash manzili ───────────────────────────────────────────────
    @Column(name = "current_region", length = 100)
    var currentRegion: String? = null,

    @Column(name = "current_district", length = 100)
    var currentDistrict: String? = null,

    @Column(name = "current_address", length = 500)
    var currentAddress: String? = null,

    // ── Ta'lim ma'lumotlari ───────────────────────────────────────────────────
    @Column(name = "student_number", unique = true, nullable = false, length = 50)
    var studentNumber: String,

    @Column(name = "university_id")
    var universityId: Long? = null,

    @Column(name = "faculty_id")
    var facultyId: Long? = null,

    @Column(name = "department_id")
    var departmentId: Long? = null,

    @Column(name = "program_id")
    var programId: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "degree_level", nullable = false, length = 15)
    var degreeLevel: DegreeLevel = DegreeLevel.BACHELOR,

    @Enumerated(EnumType.STRING)
    @Column(name = "education_form", nullable = false, length = 15)
    var educationForm: EducationForm = EducationForm.FULL_TIME,

    @Column(name = "education_language", length = 10)
    var educationLanguage: String = "uz",

    @Column(name = "course_number")
    var courseNumber: Int = 1,

    @Column(name = "group_id")
    var groupId: Long? = null,

    @Column(name = "academic_year", length = 20)
    var academicYear: String? = null,

    @Column(name = "admission_date")
    var admissionDate: LocalDate? = null,

    @Column(name = "admission_order_number", length = 100)
    var admissionOrderNumber: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "student_status", nullable = false, length = 20)
    var studentStatus: StudentStatus = StudentStatus.ACTIVE,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", length = 15)
    var paymentType: PaymentType? = null,

    @Column(name = "contract_number", length = 100)
    var contractNumber: String? = null,

    @Column(name = "contract_amount", precision = 14, scale = 2)
    var contractAmount: BigDecimal? = null,

) : DateAudit()

enum class StudentStatus {
    ACTIVE, SUSPENDED, EXPELLED, GRADUATED
}
