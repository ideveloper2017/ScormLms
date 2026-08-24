package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.curriculum.dto.*
import uz.scorm.lms.app.v1.curriculum.model.*
import uz.scorm.lms.app.v1.curriculum.repository.*
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.model.StudentStatus

@Service
class CurriculumOperationService(
    private val curricula: ProgramCurriculumVersionRepository,
    private val periods: CurriculumSemesterPeriodRepository,
    private val assignments: CurriculumStudentAssignmentRepository,
    private val students: StudentRepository,
    private val academicPeriods: AcademicPeriodService,
) {
    @Transactional(readOnly = true)
    fun periods(curriculumId: Long) = periods.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAsc(curriculumId).map(::periodDto)

    @Transactional
    fun savePeriod(curriculumId: Long, request: CurriculumSemesterPeriodRequest): CurriculumSemesterPeriodDto {
        val curriculum = requireCurriculum(curriculumId)
        require(curriculum.status != CurriculumStatus.ARCHIVED) { "Arxivlangan o'quv reja semestri o'zgartirilmaydi" }
        academicPeriods.requireActiveSemester(request.semesterNumber)
        require(request.endsOn > request.startsOn) { "Semestr tugash sanasi boshlanishidan keyin bo'lishi kerak" }
        require(!request.startsOn.isBefore(curriculum.validFrom) && !request.endsOn.isAfter(curriculum.validUntil)) {
            "Semestr sanalari o'quv reja amal qilish muddatida bo'lishi kerak"
        }
        val value = periods.findByCurriculumVersionIdAndSemesterNumberAndDeletedFalse(curriculumId, request.semesterNumber)
            ?: CurriculumSemesterPeriod(curriculum, request.semesterNumber, curriculum.academicYear, request.startsOn, request.endsOn)
        value.startsOn = request.startsOn
        value.endsOn = request.endsOn
        value.active = request.active
        return periodDto(periods.save(value))
    }

    @Transactional(readOnly = true)
    fun assignments(curriculumId: Long) = assignments
        .findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterNumberAscStudentLastNameAsc(curriculumId).map(::assignmentDto)

    @Transactional
    fun assign(curriculumId: Long, request: AssignCurriculumStudentsRequest): List<CurriculumStudentAssignmentDto> {
        val curriculum = requireCurriculum(curriculumId)
        require(curriculum.status == CurriculumStatus.APPROVED) { "Talaba faqat tasdiqlangan o'quv rejaga biriktiriladi" }
        require(request.studentIds.isNotEmpty() && request.studentIds.size <= 200) { "1-200 talaba tanlanishi kerak" }
        val period = periods.findByCurriculumVersionIdAndSemesterNumberAndDeletedFalse(curriculumId, request.semesterNumber)
            ?: throw IllegalArgumentException("O'quv reja uchun ${request.semesterNumber}-semestr muddati kiritilmagan")
        require(period.active) { "Semestr faol emas" }
        val selected = students.findAllByIdForUpdate(request.studentIds)
        require(selected.size == request.studentIds.size) { "Tanlangan talabalar to'liq topilmadi" }
        val existingByStudentId = selected.mapNotNull { student ->
            val studentId = requireNotNull(student.id)
            assignments.findByCurriculumVersionIdAndStudentIdAndSemesterNumber(curriculumId, studentId, request.semesterNumber)
                ?.let { studentId to it }
        }.toMap()
        selected.forEach { student ->
            require(student.studentStatus == StudentStatus.ACTIVE) { "Faqat faol talaba o'quv rejaga biriktiriladi: ${student.studentNumber}" }
            require(student.programId == curriculum.program.id) { "Talaba mutaxassisligi o'quv rejaga mos emas: ${student.studentNumber}" }
            require(student.academicYear == curriculum.academicYear) { "Talaba o'quv yili o'quv rejaga mos emas: ${student.studentNumber}" }
            require(student.semesterNumber == request.semesterNumber) { "Talaba semestri mos emas: ${student.studentNumber}" }
            require(existingByStudentId[requireNotNull(student.id)]?.deleted != false) {
                "Talaba ushbu semestrga avval biriktirilgan: ${student.studentNumber}"
            }
        }
        return assignments.saveAll(selected.map { student ->
            (existingByStudentId[requireNotNull(student.id)] ?: CurriculumStudentAssignment(
                curriculumVersion = curriculum, student = student, academicYear = curriculum.academicYear,
                semesterNumber = request.semesterNumber, startsOn = period.startsOn, endsOn = period.endsOn,
            )).also {
                it.academicYear = curriculum.academicYear
                it.startsOn = period.startsOn
                it.endsOn = period.endsOn
                it.active = true
                it.deleted = false
            }
        }).map(::assignmentDto)
    }

    @Transactional
    fun remove(curriculumId: Long, assignmentId: Long) {
        val value = assignments.findByIdAndCurriculumVersionIdAndDeletedFalse(assignmentId, curriculumId)
            ?: throw NoSuchElementException("O'quv reja talaba biriktirishi topilmadi: $assignmentId")
        value.active = false
        value.deleted = true
        assignments.save(value)
    }

    private fun requireCurriculum(id: Long) = curricula.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("O'quv reja topilmadi: $id")

    private fun periodDto(v: CurriculumSemesterPeriod) = CurriculumSemesterPeriodDto(
        requireNotNull(v.id), requireNotNull(v.curriculumVersion.id), v.academicYear, v.semesterNumber,
        v.startsOn, v.endsOn, v.active,
    )
    private fun assignmentDto(v: CurriculumStudentAssignment) = CurriculumStudentAssignmentDto(
        requireNotNull(v.id), requireNotNull(v.curriculumVersion.id), requireNotNull(v.student.id),
        v.student.studentNumber, v.student.fullName, v.student.groupId, v.academicYear, v.semesterNumber,
        v.startsOn, v.endsOn, v.active,
    )
}
