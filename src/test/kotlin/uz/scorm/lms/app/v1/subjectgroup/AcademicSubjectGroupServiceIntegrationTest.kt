package uz.scorm.lms.app.v1.subjectgroup

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.curriculum.dto.AddCurriculumSubjectRequest
import uz.scorm.lms.app.v1.curriculum.dto.ApproveCurriculumRequest
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumVersionRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCredentialType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumNormativeBasisType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.subjectgroup.dto.AssignAcademicSubjectGroupStudentsRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.CreateAcademicSubjectGroupRequest
import uz.scorm.lms.app.v1.subjectgroup.service.AcademicSubjectGroupService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AcademicSubjectGroupServiceIntegrationTest {
    @Autowired private lateinit var service: AcademicSubjectGroupService
    @Autowired private lateinit var curricula: ProgramCurriculumService
    @Autowired private lateinit var programs: ProgramRepository
    @Autowired private lateinit var subjects: SubjectRepository
    @Autowired private lateinit var students: StudentRepository
    @Autowired private lateinit var users: UserRepository

    @Test
    fun `subject group derives program year semester and subject from approved curriculum`() {
        val fixture = approvedCurriculum()
        val group = service.create(CreateAcademicSubjectGroupRequest(
            curriculumSubjectId = fixture.curriculumSubjectId,
            code = " dast-a ",
            name = "Dasturlash A guruhi",
            capacity = 25,
        ), fixture.authorId)

        assertEquals("DAST-A", group.code)
        assertEquals(fixture.program.id, group.programId)
        assertEquals("2026-2027", group.academicYear)
        assertEquals(3, group.semester)
        assertEquals(fixture.subject.id, group.subjectId)
        assertEquals(0, group.memberCount)
    }

    @Test
    fun `student is assigned later only when academic placement matches`() {
        val fixture = approvedCurriculum()
        val first = service.create(CreateAcademicSubjectGroupRequest(
            fixture.curriculumSubjectId, "DAST-A", "Dasturlash A", 2,
        ), fixture.authorId)
        val second = service.create(CreateAcademicSubjectGroupRequest(
            fixture.curriculumSubjectId, "DAST-B", "Dasturlash B", 2,
        ), fixture.authorId)
        val eligible = student(fixture.program, "Mos", semester = 3)
        val wrongSemester = student(fixture.program, "Boshqa semestr", semester = 4)

        assertEquals(1, service.candidates(first.id, null, 0, 10).totalElements)
        val assigned = service.assign(first.id, AssignAcademicSubjectGroupStudentsRequest(setOf(requireNotNull(eligible.id))), fixture.authorId)
        assertEquals(1, assigned.memberCount)
        assertEquals(1, service.members(first.id).size)
        assertEquals(0, service.candidates(first.id, null, 0, 10).totalElements)

        val duplicate = assertThrows<IllegalArgumentException> {
            service.assign(second.id, AssignAcademicSubjectGroupStudentsRequest(setOf(requireNotNull(eligible.id))), fixture.authorId)
        }
        assertTrue(duplicate.message.orEmpty().contains("boshqa guruhga"))

        val mismatch = assertThrows<IllegalArgumentException> {
            service.assign(first.id, AssignAcademicSubjectGroupStudentsRequest(setOf(requireNotNull(wrongSemester.id))), fixture.authorId)
        }
        assertTrue(mismatch.message.orEmpty().contains("semestri"))

        service.removeStudent(first.id, requireNotNull(eligible.id), fixture.authorId)
        assertEquals(0, service.members(first.id).size)
        assertEquals(1, service.assign(second.id, AssignAcademicSubjectGroupStudentsRequest(setOf(requireNotNull(eligible.id))), fixture.authorId).memberCount)
    }

    @Test
    fun `draft curriculum cannot open an operational subject group`() {
        val author = user("subject-group-draft-author")
        val program = program()
        val subject = subject(program)
        val draft = curricula.create(curriculumRequest(requireNotNull(program.id)), requireNotNull(author.id))
        val withSubject = curricula.addSubject(draft.id, AddCurriculumSubjectRequest(
            requireNotNull(subject.id), 3, CurriculumPlanItemType.REQUIRED,
        ), requireNotNull(author.id))

        val error = assertThrows<IllegalArgumentException> {
            service.create(CreateAcademicSubjectGroupRequest(withSubject.subjects.single().id, "DRAFT-A", "Draft guruhi"), requireNotNull(author.id))
        }
        assertTrue(error.message.orEmpty().contains("tasdiqlangan curriculum"))
    }

    private fun approvedCurriculum(): Fixture {
        val author = user("subject-group-author")
        val approver = user("subject-group-approver")
        val program = program()
        val subject = subject(program)
        val draft = curricula.create(curriculumRequest(requireNotNull(program.id)), requireNotNull(author.id))
        val withSubject = curricula.addSubject(draft.id, AddCurriculumSubjectRequest(
            requireNotNull(subject.id), 3, CurriculumPlanItemType.REQUIRED,
        ), requireNotNull(author.id))
        curricula.approve(draft.id, ApproveCurriculumRequest("BUYRUQ-${System.nanoTime()}", LocalDate.now()), requireNotNull(approver.id))
        return Fixture(program, subject, withSubject.subjects.single().id, requireNotNull(author.id))
    }

    private fun curriculumRequest(programId: Long) = SaveCurriculumVersionRequest(
        programId = programId,
        versionCode = "CUR-SG-${System.nanoTime()}",
        academicYear = "2026-2027",
        credentialType = CurriculumCredentialType.STATE_DIPLOMA,
        normativeBasisType = CurriculumNormativeBasisType.STATE_EDUCATION_STANDARD,
        standardReference = "DTS-2026/17",
        qualificationRequirementsReference = "MT-2026/09",
        validFrom = LocalDate.of(2026, 9, 1),
        validUntil = LocalDate.of(2027, 8, 31),
    )

    private fun program() = programs.save(Program(
        name = "Fan guruhi dasturi ${System.nanoTime()}",
        code = "SG-${System.nanoTime()}",
        degreeLevel = "BACHELOR",
        active = true,
        distanceEnabled = true,
        fullTimeAvailable = true,
        fullTimeBasisReference = "BUYRUQ-3/2026",
    ))

    private fun subject(program: Program) = subjects.save(Subject(
        name = "Dasturlash",
        code = "DAST-${System.nanoTime()}",
        credits = 6,
        active = true,
        program = program,
    ))

    private fun student(program: Program, lastName: String, semester: Int) = students.save(StudentProfile(
        user = user("subject-group-student"),
        pinfl = System.nanoTime().toString().takeLast(14).padStart(14, '6'),
        lastName = lastName,
        firstName = "Ali",
        birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE,
        studentNumber = "SG-ST-${System.nanoTime()}",
        programId = program.id,
        academicYear = "2026-2027",
        semesterNumber = semester,
        courseNumber = 2,
        studentStatus = StudentStatus.ACTIVE,
    ))

    private fun user(prefix: String) = users.save(User(
        username = "$prefix-${System.nanoTime()}",
        password = "encoded-password",
        fullName = prefix,
    ))

    private data class Fixture(
        val program: Program,
        val subject: Subject,
        val curriculumSubjectId: Long,
        val authorId: Long,
    )
}
