package uz.scorm.lms.app.v1.classifier.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

enum class ClassifierImportStatus { RUNNING, COMPLETED }

@Entity
@Table(name = "classifier_import_runs")
class ClassifierImportRun(
    @Column(name = "dataset_id", nullable = false, length = 80) var datasetId: String,
    @Column(name = "dataset_version", nullable = false, length = 180) var datasetVersion: String,
    @Column(name = "manifest_sha256", nullable = false, length = 64) var manifestSha256: String,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) var status: ClassifierImportStatus = ClassifierImportStatus.RUNNING,
    @Column(name = "started_by_user_id", nullable = false) var startedByUserId: Long,
    @Column(name = "countries_total", nullable = false) var countriesTotal: Int = 0,
    @Column(name = "regions_total", nullable = false) var regionsTotal: Int = 0,
    @Column(name = "districts_total", nullable = false) var districtsTotal: Int = 0,
    @Column(name = "created_count", nullable = false) var createdCount: Int = 0,
    @Column(name = "updated_count", nullable = false) var updatedCount: Int = 0,
    @Column(name = "unchanged_count", nullable = false) var unchangedCount: Int = 0,
    @Column(name = "deactivated_count", nullable = false) var deactivatedCount: Int = 0,
    @Column(name = "started_at", nullable = false) var startedAt: Instant = Instant.now(),
    @Column(name = "finished_at") var finishedAt: Instant? = null,
) : BaseEntity()

@Entity
@Table(name = "classifier_import_control")
class ClassifierImportControl(
    @Id var id: Long = 1,
    @Version var version: Long = 0,
)
