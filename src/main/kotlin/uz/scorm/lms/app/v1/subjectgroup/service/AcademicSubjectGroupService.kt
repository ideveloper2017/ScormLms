package uz.scorm.lms.app.v1.subjectgroup.service

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subjectgroup.dto.AcademicSubjectGroupCandidatePageDto
import uz.scorm.lms.app.v1.subjectgroup.dto.AcademicSubjectGroupDto
import uz.scorm.lms.app.v1.subjectgroup.dto.AcademicSubjectGroupStudentDto
import uz.scorm.lms.app.v1.subjectgroup.dto.AssignAcademicSubjectGroupStudentsRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.CreateAcademicSubjectGroupRequest
import uz.scorm.lms.app.v1.subjectgroup.dto.UpdateAcademicSubjectGroupRequest
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroup
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroupMembership
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupMembershipRepository
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupRepository

@Service
class AcademicSubjectGroupService(
    private val groups: AcademicSubjectGroupRepository,
    private val memberships: AcademicSubjectGroupMembershipRepository,
    private val curriculumSubjects: ProgramCurriculumSubjectRepository,
    private val students: StudentRepository,
    private val academicPeriods: AcademicPeriodService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(
        curriculumId: Long?,
        academicYear: String?,
        semester: Int?,
        subjectId: Long?,
        active: Boolean?,
    ): List<AcademicSubjectGroupDto> {
        return groups.search(curriculumId, academicYear, semester, subjectId, active).map(::toDto)
    }

    @Transactional(readOnly = true)
    fun get(id: Long): AcademicSubjectGroupDto = toDto(requireGroup(id))

    @Transactional
    fun create(request: CreateAcademicSubjectGroupRequest, actorId: Long): AcademicSubjectGroupDto {
        val item = curriculumSubjects.findByIdAndDeletedFalse(request.curriculumSubjectId)
            ?: throw NoSuchElementException("Curriculum fan bandi topilmadi: ${request.curriculumSubjectId}")
        val curriculum = item.curriculumVersion
        require(curriculum.status == CurriculumStatus.APPROVED) { "Fan guruhi faqat tasdiqlangan curriculum uchun yaratiladi" }
        academicPeriods.requireActiveYear(curriculum.academicYear)
        academicPeriods.requireActiveSemester(item.semester)
        val code = normalizeCode(request.code)
        val name = normalizeName(request.name)
        require(request.capacity in 1..500) { "Fan guruhi sig'imi 1-500 oralig'ida bo'lishi kerak" }
        require(!groups.existsByCurriculumSubjectIdAndCodeIgnoreCaseAndDeletedFalse(request.curriculumSubjectId, code)) {
            "Ushbu curriculum fani uchun fan guruhi kodi mavjud"
        }
        val saved = groups.save(AcademicSubjectGroup(
            curriculumSubject = item,
            code = code,
            name = name,
            capacity = request.capacity,
            active = request.active,
        ))
        auditService.logAction(
            "ACADEMIC_SUBJECT_GROUP_CREATED",
            actorId,
            "group=${saved.id}; curriculum=${curriculum.id}; curriculumSubject=${item.id}; code=$code",
        )
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: UpdateAcademicSubjectGroupRequest, actorId: Long): AcademicSubjectGroupDto {
        val group = requireGroup(id)
        val code = normalizeCode(request.code)
        val name = normalizeName(request.name)
        require(request.capacity in 1..500) { "Fan guruhi sig'imi 1-500 oralig'ida bo'lishi kerak" }
        require(request.capacity >= memberships.countBySubjectGroupId(id)) { "Sig'im biriktirilgan talabalar sonidan kam bo'lishi mumkin emas" }
        if (!code.equals(group.code, ignoreCase = true)) {
            require(!groups.existsByCurriculumSubjectIdAndCodeIgnoreCaseAndDeletedFalse(
                requireNotNull(group.curriculumSubject.id), code,
            )) { "Ushbu curriculum fani uchun fan guruhi kodi mavjud" }
        }
        if (request.active) requireOperational(group)
        group.code = code
        group.name = name
        group.capacity = request.capacity
        group.active = request.active
        groups.save(group)
        auditService.logAction("ACADEMIC_SUBJECT_GROUP_UPDATED", actorId, "group=$id; active=${group.active}; capacity=${group.capacity}")
        return toDto(group)
    }

    @Transactional(readOnly = true)
    fun members(id: Long): List<AcademicSubjectGroupStudentDto> {
        requireGroup(id)
        return memberships.findAllBySubjectGroupIdOrderByStudentLastNameAscStudentFirstNameAsc(id)
            .map { studentDto(it.student) }
    }

    @Transactional(readOnly = true)
    fun candidates(id: Long, search: String?, page: Int, size: Int): AcademicSubjectGroupCandidatePageDto {
        require(page >= 0) { "Sahifa manfiy bo'lishi mumkin emas" }
        require(size in 10..100) { "Sahifa hajmi 10-100 oralig'ida bo'lishi shart" }
        val normalizedSearch = search?.trim()?.lowercase().orEmpty()
        require(normalizedSearch.length <= 100) { "Qidiruv matni 100 belgidan oshmasligi kerak" }
        val group = requireGroup(id)
        require(group.active) { "Nofaol fan guruhi uchun nomzodlar olinmaydi" }
        requireOperational(group)
        val item = group.curriculumSubject
        val curriculum = item.curriculumVersion
        val result = students.findAcademicSubjectGroupCandidates(
            programId = requireNotNull(curriculum.program.id),
            academicYear = curriculum.academicYear,
            semester = item.semester,
            status = StudentStatus.ACTIVE,
            curriculumSubjectId = requireNotNull(item.id),
            search = normalizedSearch,
            pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName", "id")),
        )
        return AcademicSubjectGroupCandidatePageDto(
            items = result.content.map(::studentDto), page = result.number, size = result.size,
            totalElements = result.totalElements, totalPages = result.totalPages,
        )
    }

    @Transactional
    fun assign(id: Long, request: AssignAcademicSubjectGroupStudentsRequest, actorId: Long): AcademicSubjectGroupDto {
        require(request.studentIds.isNotEmpty() && request.studentIds.size <= 100) { "Bir amalda 1-100 talaba tanlanishi kerak" }
        val group = groups.findByIdForUpdate(id) ?: throw NoSuchElementException("Fan guruhi topilmadi: $id")
        require(group.active) { "Nofaol fan guruhiga talaba biriktirilmaydi" }
        requireOperational(group)
        val currentCount = memberships.countBySubjectGroupId(id)
        require(currentCount + request.studentIds.size <= group.capacity) { "Fan guruhi sig'imi yetarli emas" }
        val selected = students.findAllById(request.studentIds)
        require(selected.size == request.studentIds.size) { "Tanlangan talabalardan biri topilmadi" }
        selected.forEach { validateStudent(group, it) }
        memberships.saveAll(selected.map { AcademicSubjectGroupMembership(group, group.curriculumSubject, it) })
        auditService.logAction(
            "ACADEMIC_SUBJECT_GROUP_STUDENTS_ASSIGNED",
            actorId,
            "group=$id; curriculumSubject=${group.curriculumSubject.id}; count=${selected.size}",
        )
        return toDto(group)
    }

    @Transactional
    fun removeStudent(id: Long, studentId: Long, actorId: Long): AcademicSubjectGroupDto {
        val group = requireGroup(id)
        val membership = memberships.findBySubjectGroupIdAndStudentId(id, studentId)
            ?: throw NoSuchElementException("Talaba ushbu fan guruhiga biriktirilmagan")
        memberships.delete(membership)
        memberships.flush()
        auditService.logAction("ACADEMIC_SUBJECT_GROUP_STUDENT_REMOVED", actorId, "group=$id; student=$studentId")
        return toDto(group)
    }

    private fun validateStudent(group: AcademicSubjectGroup, student: StudentProfile) {
        val item = group.curriculumSubject
        val curriculum = item.curriculumVersion
        require(student.studentStatus == StudentStatus.ACTIVE) { "Faqat ACTIVE talaba fan guruhiga biriktiriladi: ${student.studentNumber}" }
        require(student.programId == curriculum.program.id) { "Talaba fan guruhi dasturiga mos emas: ${student.studentNumber}" }
        require(student.academicYear == curriculum.academicYear) { "Talaba o'quv yili fan guruhiga mos emas: ${student.studentNumber}" }
        require(student.semesterNumber == item.semester) { "Talaba semestri fan guruhiga mos emas: ${student.studentNumber}" }
        require(!memberships.existsByStudentIdAndCurriculumSubjectId(
            requireNotNull(student.id), requireNotNull(item.id),
        )) { "Talaba ushbu curriculum fani bo'yicha boshqa guruhga biriktirilgan: ${student.studentNumber}" }
    }

    private fun requireOperational(group: AcademicSubjectGroup) {
        val item = group.curriculumSubject
        val curriculum = item.curriculumVersion
        require(!item.deleted && !curriculum.deleted && curriculum.status == CurriculumStatus.APPROVED) {
            "Fan guruhi curriculum holati operatsion emas"
        }
        academicPeriods.requireActiveYear(curriculum.academicYear)
        academicPeriods.requireActiveSemester(item.semester)
    }

    private fun requireGroup(id: Long) = groups.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Fan guruhi topilmadi: $id")

    private fun normalizeCode(value: String): String {
        val code = value.trim().uppercase()
        require(code.length in 2..100 && code.matches(Regex("[A-Z0-9._-]+"))) {
            "Fan guruhi kodi 2-100 belgi va A-Z, 0-9, nuqta, chiziq formatida bo'lishi kerak"
        }
        return code
    }

    private fun normalizeName(value: String) = value.trim().also {
        require(it.length in 3..200) { "Fan guruhi nomi 3-200 belgi bo'lishi kerak" }
    }

    private fun toDto(group: AcademicSubjectGroup): AcademicSubjectGroupDto {
        val item = group.curriculumSubject
        val curriculum = item.curriculumVersion
        return AcademicSubjectGroupDto(
            id = requireNotNull(group.id), code = group.code, name = group.name, capacity = group.capacity,
            active = group.active, memberCount = memberships.countBySubjectGroupId(requireNotNull(group.id)),
            curriculumId = requireNotNull(curriculum.id), curriculumVersionCode = curriculum.versionCode,
            programId = requireNotNull(curriculum.program.id), programName = curriculum.program.name,
            academicYear = curriculum.academicYear, curriculumSubjectId = requireNotNull(item.id),
            subjectId = item.subject?.id, subjectCode = item.subjectCodeSnapshot, subjectName = item.subjectNameSnapshot,
            semester = item.semester,
        )
    }

    private fun studentDto(student: StudentProfile) = AcademicSubjectGroupStudentDto(
        studentId = requireNotNull(student.id), studentNumber = student.studentNumber, fullName = student.fullName,
        status = student.studentStatus, semesterNumber = student.semesterNumber, primaryGroupId = student.groupId,
    )
}
