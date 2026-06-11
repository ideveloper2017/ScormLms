package uz.scorm.lms.app.v1.student.model

import jakarta.persistence.*
import uz.scorm.lms.app.v1.user.model.User
import java.time.LocalDate

@Entity
@Table(name = "students")
class StudentProfile(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(nullable = false)
    var jshshir: String,

    var faculty: String? = null,
    var educationPath: String? = null,
    var groupName: String? = null,
    var course: Int = 1,
    var semester: Int = 1,
    var language: String = "uz",

    @Enumerated(EnumType.STRING)
    var status: StudentStatus = StudentStatus.ACTIVE
)

enum class StudentStatus {
    ACTIVE, GRADUATED, EXPELLED, TRANSFERRED, REINSTATED, ARCHIVED
}
