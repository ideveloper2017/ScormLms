package uz.scorm.lms.app.v1.attestation.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "graduation_certificates",
    indexes = [
        Index(name = "idx_graduation_certificate_number", columnList = "certificate_number"),
        Index(name = "idx_graduation_certificate_token", columnList = "verification_token"),
        Index(name = "idx_graduation_certificate_issued_by", columnList = "issued_by,issue_date"),
    ],
)
class GraduationCertificate(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_defense_id", nullable = false, unique = true)
    var studentDefense: StudentDefense,

    @Column(name = "certificate_number", nullable = false, unique = true, length = 50)
    var certificateNumber: String,

    @Column(name = "issue_date", nullable = false)
    var issueDate: LocalDate,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issued_by", nullable = false)
    var issuedBy: User,

    @Column(length = 255)
    var specialization: String? = null,

    @Column(name = "gpa_final")
    var gpaFinal: BigDecimal? = null,

    @Column(name = "certificate_file_url", length = 500)
    var certificateFileUrl: String? = null,

    @Column(name = "certificate_file_name", length = 255)
    var certificateFileName: String? = null,

    @Column(name = "qr_code_url", length = 500)
    var qrCodeUrl: String? = null,

    @Column(name = "verification_token", length = 100)
    var verificationToken: String? = null,
) : BaseEntity()
