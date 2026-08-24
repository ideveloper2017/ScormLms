package uz.scorm.lms.app.v1.academicdocument.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

enum class CallLetterStatus { DRAFT, GENERATED, CONFIRMED }

@Entity
@Table(name = "final_exam_call_letters")
class FinalExamCallLetter(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Column(name = "document_number", nullable = false, length = 80)
    var documentNumber: String,

    @Column(nullable = false)
    var semester: Int,

    @Column(name = "order_number", nullable = false, length = 120)
    var orderNumber: String,

    @Column(name = "order_date", nullable = false)
    var orderDate: LocalDate,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: CallLetterStatus = CallLetterStatus.DRAFT,

    @Column(name = "generated_at")
    var generatedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    var issuedBy: User? = null,
) : BaseEntity()

@Entity
@Table(name = "student_transcripts")
class StudentTranscript(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Column(name = "document_number", nullable = false, length = 80)
    var documentNumber: String,

    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,

    @Column(nullable = false)
    var semester: Int,

    @Column(name = "generated_at")
    var generatedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    var issuedBy: User? = null,
) : BaseEntity()
