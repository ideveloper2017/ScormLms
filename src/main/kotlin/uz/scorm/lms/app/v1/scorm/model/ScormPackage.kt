package uz.scorm.lms.app.v1.scorm.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course

enum class ScormVersion { SCORM_1_2, SCORM_2004 }
enum class ScormPackageStatus { PROCESSING, READY, FAILED }

@Entity
@Table(
    name = "scorm_packages",
    indexes = [Index(name = "idx_scorm_package_course", columnList = "course_id")],
)
class ScormPackage(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false)
    var title: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var version: ScormVersion,

    @Column(name = "manifest_identifier", length = 300)
    var manifestIdentifier: String? = null,

    @Column(name = "entry_point", nullable = false, length = 1000)
    var entryPoint: String,

    @Column(name = "storage_key", nullable = false, unique = true, length = 64)
    var storageKey: String,

    @Column(name = "sha256", nullable = false, length = 64)
    var sha256: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ScormPackageStatus = ScormPackageStatus.READY,

    @Column(name = "imported_by", nullable = false, length = 150)
    var importedBy: String,
) : BaseEntity()
