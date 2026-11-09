package uz.scorm.lms.app.v1.syllabus.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.subject.model.Subject

@Entity
@Table(name = "subject_syllabi")
class SubjectSyllabus(
    /** Fan — o'quv reja taxtasida dastur biriktirilganda yoziladi (yangi dastur fansiz yaratiladi) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    var subject: Subject?,

    @Column(nullable = false, length = 500)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var language: SyllabusLanguage,

    @Column(name = "short_description", nullable = false, length = 2000)
    var shortDescription: String,

    @Column(columnDefinition = "TEXT")
    var requirements: String? = null,

    @Column(name = "full_description", nullable = false, columnDefinition = "TEXT")
    var fullDescription: String,

    @Column(nullable = false)
    var active: Boolean = true,
    @Column(nullable = false, length = 20)
    var status: String = "DRAFT",
    @Column(name = "revision_number", nullable = false)
    var revisionNumber: Int = 1,
) : BaseEntity() {
    /** Fan dasturi (ishchi dastur) qaysi o'quv dasturidan (namunaviy) va qaysi davr uchun yaratilgan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_program_id")
    var modelProgram: SubjectModelProgram? = null

    @Column(name = "academic_year", length = 20)
    var academicYear: String? = null

    @Column
    var semester: Int? = null

    /** Mavzular: avval nazariy, keyin amaliy, har biri o'z tartibida. */
    @OneToMany(mappedBy = "syllabus", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("type ASC, sortOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    var topics: MutableList<SubjectSyllabusTopic> = mutableListOf()

    /** Dastur tuzilmasi: modullar (darslari — topics, module orqali) */
    @OneToMany(mappedBy = "syllabus", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    var modules: MutableList<SubjectSyllabusModule> = mutableListOf()

    /** Fanni o'rganib talaba nimalarga erishadi — har biri yangi qatordan */
    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    var learningOutcomes: String? = null

    /** Muqova rasmi (saqlash kaliti; fayl — syllabus-media/{id}/) */
    @Column(name = "cover_image", length = 64)
    var coverImage: String? = null

    /** Tanishtiruv videosi fayli (saqlash kaliti) va asl nomi */
    @Column(name = "intro_video", length = 64)
    var introVideo: String? = null

    @Column(name = "intro_video_name", length = 500)
    var introVideoName: String? = null

    /** Yoki tanishtiruv videosi havolasi (YouTube, Vimeo, MP4) */
    @Column(name = "intro_video_url", length = 1000)
    var introVideoUrl: String? = null

    /**
     * Darslar o'qitish tartibida: dastur modullari tartibi, modul ichida dars tartibi; modulga biriktirilmagan (eski)
     * darslar oxirida — mashg'ulot turi va tur ichidagi tartib bo'yicha. Kurs bo'limlari shu tartibda bo'ladi.
     */
    fun orderedLessons(): List<SubjectSyllabusTopic> = topics.sortedWith(
        compareBy<SubjectSyllabusTopic>({ it.module == null }, { it.module?.sortOrder ?: 0 }, { it.lessonOrder ?: Int.MAX_VALUE }, { it.type }, { it.sortOrder }),
    )
}

enum class SyllabusLanguage { UZ, EN, RU, KAA, UZ_CYRILLIC }
