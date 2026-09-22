package uz.scorm.lms.app.v1.curriculum.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.student.model.StudentProfile
import java.time.LocalDate

@Entity
@Table(name = "curriculum_semester_periods")
class CurriculumSemesterPeriod(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    var curriculumVersion: ProgramCurriculumVersion,
    @Column(name = "semester_number", nullable = false)
    var semesterNumber: Int,
    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,
    @Column(name = "starts_on", nullable = false)
    var startsOn: LocalDate,
    @Column(name = "ends_on", nullable = false)
    var endsOn: LocalDate,
    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()

@Entity
@Table(name = "curriculum_student_assignments")
class CurriculumStudentAssignment(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    var curriculumVersion: ProgramCurriculumVersion,
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,
    @Column(name = "academic_year", nullable = false, length = 20)
    var academicYear: String,
    @Column(name = "semester_number", nullable = false)
    var semesterNumber: Int,
    @Column(name = "starts_on", nullable = false)
    var startsOn: LocalDate,
    @Column(name = "ends_on", nullable = false)
    var endsOn: LocalDate,
    @Column(nullable = false)
    var active: Boolean = true,
    // Nullable on purpose: additive migration (V76), not yet backed by a NOT NULL
    // constraint. academicYear/startsOn/endsOn above still duplicate this row's
    // data and remain the fields actually read -- this is the single-source-of-truth
    // reference new code should populate and, eventually, read from instead.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    var period: CurriculumSemesterPeriod? = null,
) : BaseEntity()
