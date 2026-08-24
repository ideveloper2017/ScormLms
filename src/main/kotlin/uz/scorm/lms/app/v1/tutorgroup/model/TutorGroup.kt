package uz.scorm.lms.app.v1.tutorgroup.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.faculty.model.Faculty
import uz.scorm.lms.app.v1.teacher.model.Teacher

@Entity
@Table(name = "tutor_groups")
class TutorGroup(
    @Column(nullable = false, length = 180) var name: String = "",
    @Column(nullable = false, length = 60) var code: String = "",
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "faculty_id") var faculty: Faculty? = null,
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "tutor_id") var tutor: Teacher? = null,
    @Column(name = "name_uz", length = 180) var nameUz: String? = null,
    @Column(name = "name_ru", length = 180) var nameRu: String? = null,
    @Column(name = "name_en", length = 180) var nameEn: String? = null,
    @Column(nullable = false) var active: Boolean = true,
) : BaseEntity()
