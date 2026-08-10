package uz.scorm.lms.app.v1.academicperiod.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicperiod.dto.AcademicSemesterDto
import uz.scorm.lms.app.v1.academicperiod.dto.AcademicYearDto
import uz.scorm.lms.app.v1.academicperiod.dto.CreateAcademicYearRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicSemesterRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicYearStateRequest
import uz.scorm.lms.app.v1.academicperiod.model.AcademicYearPeriod
import uz.scorm.lms.app.v1.academicperiod.repository.AcademicSemesterDefinitionRepository
import uz.scorm.lms.app.v1.academicperiod.repository.AcademicYearPeriodRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import java.time.LocalDate

@Service
class AcademicPeriodService(
    private val years: AcademicYearPeriodRepository,
    private val semesters: AcademicSemesterDefinitionRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun listYears(includeInactive: Boolean = false): List<AcademicYearDto> = years
        .findAllByDeletedFalseOrderByCodeDesc()
        .filter { includeInactive || it.active }
        .map(::yearDto)

    @Transactional(readOnly = true)
    fun listSemesters(includeInactive: Boolean = false): List<AcademicSemesterDto> = semesters
        .findAllByDeletedFalseOrderBySemesterNumberAsc()
        .filter { includeInactive || it.active }
        .map(::semesterDto)

    @Transactional
    fun createYear(request: CreateAcademicYearRequest, actorId: Long): AcademicYearDto {
        val code = normalizeYear(request.code)
        require(years.findByCodeAndDeletedFalse(code) == null) { "O'quv yili katalogda mavjud: $code" }
        if (request.current) clearCurrent()
        val start = code.substring(0, 4).toInt()
        val saved = years.save(AcademicYearPeriod(
            code = code,
            startsOn = LocalDate.of(start, 9, 1),
            endsOn = LocalDate.of(start + 1, 8, 31),
            active = request.active || request.current,
            current = request.current,
        ))
        auditService.logAction("ACADEMIC_YEAR_CREATED", actorId, "id=${saved.id}; code=$code; current=${saved.current}")
        return yearDto(saved)
    }

    @Transactional
    fun updateYearState(id: Long, request: UpdateAcademicYearStateRequest, actorId: Long): AcademicYearDto {
        val year = years.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("O'quv yili topilmadi: $id")
        require(request.active || !request.current) { "Joriy o'quv yili faol bo'lishi shart" }
        require(request.active || !year.current) { "Joriy o'quv yilini avval boshqasiga almashtiring" }
        if (request.current) clearCurrent()
        year.active = request.active
        year.current = request.current
        val saved = years.save(year)
        auditService.logAction("ACADEMIC_YEAR_STATE_UPDATED", actorId, "id=$id; active=${saved.active}; current=${saved.current}")
        return yearDto(saved)
    }

    @Transactional
    fun updateSemester(id: Long, request: UpdateAcademicSemesterRequest, actorId: Long): AcademicSemesterDto {
        val semester = semesters.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Semestr topilmadi: $id")
        val name = request.nameUz.trim()
        require(name.length in 3..100) { "Semestr nomi 3-100 belgi bo'lishi kerak" }
        semester.nameUz = name
        semester.active = request.active
        val saved = semesters.save(semester)
        auditService.logAction("ACADEMIC_SEMESTER_UPDATED", actorId, "id=$id; number=${saved.semesterNumber}; active=${saved.active}")
        return semesterDto(saved)
    }

    @Transactional(readOnly = true)
    fun requireActiveYear(code: String): AcademicYearDto {
        val normalized = normalizeYear(code)
        val year = years.findByCodeAndDeletedFalse(normalized)
            ?: throw IllegalArgumentException("O'quv yili faol katalogda topilmadi: $normalized")
        require(year.active) { "O'quv yili faol emas: $normalized" }
        return yearDto(year)
    }

    @Transactional(readOnly = true)
    fun requireActiveSemester(number: Int): AcademicSemesterDto {
        val semester = semesters.findBySemesterNumberAndDeletedFalse(number)
            ?: throw IllegalArgumentException("Semestr katalogda topilmadi: $number")
        require(semester.active) { "Semestr faol emas: $number" }
        return semesterDto(semester)
    }

    private fun clearCurrent() {
        years.findAllForCurrentUpdate().filter { it.current }.forEach {
            it.current = false
            years.save(it)
        }
    }

    private fun normalizeYear(value: String): String {
        val code = value.trim()
        require(code.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val start = code.substring(0, 4).toInt()
        require(code.substring(5).toInt() == start + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        return code
    }

    private fun yearDto(value: AcademicYearPeriod) = AcademicYearDto(
        id = requireNotNull(value.id), code = value.code, startsOn = value.startsOn,
        endsOn = value.endsOn, active = value.active, current = value.current,
    )

    private fun semesterDto(value: uz.scorm.lms.app.v1.academicperiod.model.AcademicSemesterDefinition) = AcademicSemesterDto(
        id = requireNotNull(value.id), semesterNumber = value.semesterNumber, nameUz = value.nameUz,
        courseNumber = value.courseNumber, active = value.active,
    )
}
