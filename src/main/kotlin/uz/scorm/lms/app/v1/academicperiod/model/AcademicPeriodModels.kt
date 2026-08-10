package uz.scorm.lms.app.v1.academicperiod.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import uz.scorm.lms.app.common.DateAudit
import java.time.LocalDate

@Entity
@Table(name = "academic_year_periods")
class AcademicYearPeriod(
    @Column(nullable = false, unique = true, length = 9)
    var code: String,

    @Column(name = "starts_on", nullable = false)
    var startsOn: LocalDate,

    @Column(name = "ends_on", nullable = false)
    var endsOn: LocalDate,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "is_current", nullable = false)
    var current: Boolean = false,

    @Column(nullable = false)
    var deleted: Boolean = false,

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) : DateAudit()

@Entity
@Table(name = "academic_semester_definitions")
class AcademicSemesterDefinition(
    @Column(name = "semester_number", nullable = false, unique = true)
    var semesterNumber: Int,

    @Column(name = "name_uz", nullable = false, length = 100)
    var nameUz: String,

    @Column(name = "course_number", nullable = false)
    var courseNumber: Int,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(nullable = false)
    var deleted: Boolean = false,

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) : DateAudit()
