package uz.scorm.lms.app.v1.courses.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(
    name = "course_content_assets",
    indexes = [Index(name = "idx_course_content_asset_course", columnList = "course_id,deleted")],
)
class CourseContentAsset(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(name = "storage_key", nullable = false, unique = true, length = 64)
    var storageKey: String,

    @Column(name = "original_file_name", nullable = false, length = 500)
    var originalFileName: String,

    @Column(name = "media_type", nullable = false, length = 255)
    var mediaType: String,

    @Column(name = "size_bytes", nullable = false)
    var sizeBytes: Long,

    @Column(nullable = false, length = 64)
    var sha256: String,

    @Column(name = "uploaded_by", nullable = false)
    var uploadedBy: Long,
) : BaseEntity()
