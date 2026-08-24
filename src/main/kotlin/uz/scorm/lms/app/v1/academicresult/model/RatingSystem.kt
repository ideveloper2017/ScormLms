package uz.scorm.lms.app.v1.academicresult.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "rating_systems")
class RatingSystem(
    @Column(nullable = false, length = 250)
    var name: String,

    @Column(name = "short_name", nullable = false, length = 80)
    var shortName: String,

    @Column(name = "min_score", nullable = false)
    var minScore: Int = 0,

    @Column(name = "max_score", nullable = false)
    var maxScore: Int = 100,

    @Column(name = "pass_score", nullable = false)
    var passScore: Int = 60,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()
