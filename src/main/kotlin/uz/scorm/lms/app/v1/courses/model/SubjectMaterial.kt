package uz.scorm.lms.app.v1.courses.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.subject.model.Subject

@Entity
@Table(name = "subject_materials")
class SubjectMaterial(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    var subject: Subject,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    var asset: CourseContentAsset? = null,

    @Column(name = "owner_user_id", nullable = false)
    var ownerUserId: Long,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    var contentType: CourseContentType,

    @Column(name = "content_url", length = 2000)
    var contentUrl: String? = null,

    @Column(name = "content_body", columnDefinition = "TEXT")
    var contentBody: String? = null,

    @Column(name = "language_code", nullable = false, length = 35)
    var languageCode: String,

    @Column(name = "author_name", nullable = false)
    var authorName: String,

    @Column(name = "content_version", nullable = false, length = 64)
    var contentVersion: String,

    @Column(name = "source_name", nullable = false, length = 500)
    var sourceName: String,

    @Column(name = "source_url", length = 2000)
    var sourceUrl: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()
