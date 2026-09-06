package uz.scorm.lms.app.v1.assignment.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.assignment.dto.AssignmentRequest
import uz.scorm.lms.app.v1.assignment.dto.GradeSubmissionRequest
import uz.scorm.lms.app.v1.assignment.dto.StudentAssignmentDetailsDto
import uz.scorm.lms.app.v1.assignment.dto.StudentSubmissionDto
import uz.scorm.lms.app.v1.assignment.dto.SubmissionFileResource
import uz.scorm.lms.app.v1.assignment.dto.TeacherAssignmentDto
import uz.scorm.lms.app.v1.assignment.dto.TeacherSubmissionDto
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmission
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmissionType
import uz.scorm.lms.app.v1.assignment.model.CourseAssignment
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.student.dto.StudentAssignmentDto
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.Instant
import java.util.UUID

@Service
class AssignmentService(
    private val assignmentRepository: CourseAssignmentRepository,
    private val submissionRepository: AssignmentSubmissionRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studentRepository: StudentRepository,
    private val courseAccessService: CourseAccessService,
    @Value("\${app.assignment.storage-dir:./private/assignments}") storageDir: String,
    @Value("\${app.assignment.max-file-bytes:10485760}") private val maxFileBytes: Long,
) {
    private val storageRoot: Path = Paths.get(storageDir).toAbsolutePath().normalize()
    private val allowedExtensions = setOf("pdf", "doc", "docx", "txt", "zip", "rar")

    @Transactional(readOnly = true)
    fun teacherAssignments(userId: Long, mayManageAll: Boolean): List<TeacherAssignmentDto> {
        val assignments = if (mayManageAll) {
            assignmentRepository.findAllByDeletedFalseOrderByDueAtDesc()
        } else {
            assignmentRepository.findAllByCourseUserIdAndDeletedFalseOrderByDueAtDesc(userId)
        }
        return assignments.map(::teacherAssignmentDto)
    }

    @Transactional
    fun create(request: AssignmentRequest, userId: Long, mayManageAll: Boolean): TeacherAssignmentDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        validate(request)
        val assignment = CourseAssignment(
            course = course,
            title = request.title.trim(),
            description = request.description.trim(),
            instructions = request.instructions.trim(),
            dueAt = request.dueDate,
            maxScore = request.maxScore,
            priority = request.priority,
            submissionType = request.submissionType,
            status = request.status,
            publishedAt = if (request.status == AssignmentStatus.PUBLISHED) Instant.now() else null,
        )
        return teacherAssignmentDto(assignmentRepository.save(assignment))
    }

    @Transactional
    fun update(id: Long, request: AssignmentRequest, userId: Long, mayManageAll: Boolean): TeacherAssignmentDto {
        val assignment = assignment(id)
        courseAccessService.requireManage(assignment.course.id!!, userId, mayManageAll)
        require(request.courseId == assignment.course.id) { "Topshiriq kursini o'zgartirib bo'lmaydi" }
        validate(request)
        val highestScore = submissionRepository.findAllByAssignmentIdAndDeletedFalseOrderBySubmittedAtDesc(id)
            .mapNotNull { it.score }
            .maxOrNull()
        require(highestScore == null || request.maxScore >= highestScore) {
            "Maksimal ball mavjud bahodan kichik bo'lishi mumkin emas"
        }
        assignment.title = request.title.trim()
        assignment.description = request.description.trim()
        assignment.instructions = request.instructions.trim()
        assignment.dueAt = request.dueDate
        assignment.maxScore = request.maxScore
        assignment.priority = request.priority
        assignment.submissionType = request.submissionType
        changeStatus(assignment, request.status)
        return teacherAssignmentDto(assignmentRepository.save(assignment))
    }

    @Transactional
    fun updateStatus(id: Long, status: AssignmentStatus, userId: Long, mayManageAll: Boolean): TeacherAssignmentDto {
        val assignment = assignment(id)
        courseAccessService.requireManage(assignment.course.id!!, userId, mayManageAll)
        changeStatus(assignment, status)
        return teacherAssignmentDto(assignmentRepository.save(assignment))
    }

    @Transactional
    fun deleteAssignment(id: Long, userId: Long, mayManageAll: Boolean) {
        val assignment = assignment(id)
        courseAccessService.requireManage(assignment.course.id!!, userId, mayManageAll)
        assignment.deleted = true
        assignmentRepository.save(assignment)
    }

    @Transactional(readOnly = true)
    fun teacherSubmissions(userId: Long, mayManageAll: Boolean, assignmentId: Long? = null): List<TeacherSubmissionDto> {
        val all = when {
            assignmentId != null -> {
                val assignment = assignment(assignmentId)
                courseAccessService.requireManage(assignment.course.id!!, userId, mayManageAll)
                submissionRepository.findAllByAssignmentIdAndDeletedFalseOrderBySubmittedAtDesc(assignmentId)
            }
            mayManageAll -> submissionRepository.findAllByDeletedFalseOrderBySubmittedAtDesc()
            else -> submissionRepository.findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(userId)
        }
        return latestAttempts(all).map(::teacherSubmissionDto)
    }

    @Transactional
    fun grade(
        submissionId: Long,
        request: GradeSubmissionRequest,
        graderId: Long,
        mayManageAll: Boolean,
    ): TeacherSubmissionDto {
        val submission = submission(submissionId)
        courseAccessService.requireManage(submission.assignment.course.id!!, graderId, mayManageAll)
        require(request.score in 0..submission.assignment.maxScore) {
            "Ball 0 va ${submission.assignment.maxScore} oralig'ida bo'lishi kerak"
        }
        require(!submission.deleted) { "Topshiriq topshirig'i o'chirilgan" }
        submission.score = request.score
        submission.feedback = request.feedback?.trim()?.takeIf { it.isNotEmpty() }
        submission.status = SubmissionStatus.GRADED
        submission.gradedAt = Instant.now()
        submission.gradedBy = graderId
        return teacherSubmissionDto(submissionRepository.save(submission))
    }

    @Transactional(readOnly = true)
    fun studentAssignments(
        userId: Long,
        status: String? = null,
        courseId: Long? = null,
        priority: String? = null,
    ): List<StudentAssignmentDto> {
        val enrollments = enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            studentIdForUser(userId),
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        )
        val enrollmentByCourse = enrollments.associateBy { it.course.id!! }
        if (enrollmentByCourse.isEmpty()) return emptyList()
        return assignmentRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByDueAtAsc(
            enrollmentByCourse.keys,
            setOf(AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED),
        ).map { assignment ->
            val enrollment = enrollmentByCourse.getValue(assignment.course.id!!)
            studentAssignmentDto(assignment, latestSubmission(assignment.id!!, enrollment.id!!))
        }.filter { dto ->
            (status == null || dto.status.equals(status, ignoreCase = true)) &&
                (courseId == null || dto.courseId.toLongOrNull() == courseId) &&
                (priority == null || dto.priority.equals(priority, ignoreCase = true))
        }
    }

    @Transactional(readOnly = true)
    fun details(id: Long, userId: Long, mayManageAll: Boolean): StudentAssignmentDetailsDto {
        val assignment = assignment(id)
        val course = courseAccessService.requireRead(assignment.course.id!!, userId, mayManageAll)
        val isManager = mayManageAll || course.userId == userId
        require(isManager || assignment.status != AssignmentStatus.DRAFT) { "Topshiriq hali nashr qilinmagan" }
        val submission = if (isManager) null else enrollmentFor(assignment, userId, allowCompleted = true)
            .let { latestSubmission(id, it.id!!) }
        return studentDetailsDto(assignment, submission)
    }

    @Transactional
    fun submit(id: Long, userId: Long, answer: String?, file: MultipartFile?): StudentSubmissionDto {
        val assignment = assignment(id)
        require(assignment.status == AssignmentStatus.PUBLISHED) { "Topshiriq topshirish uchun ochiq emas" }
        val enrollment = enrollmentFor(assignment, userId, allowCompleted = false)
        val cleanAnswer = answer?.trim()?.takeIf { it.isNotEmpty() }
        val hasFile = file != null && !file.isEmpty
        when (assignment.submissionType) {
            AssignmentSubmissionType.FILE -> require(hasFile) { "Fayl majburiy" }
            AssignmentSubmissionType.TEXT -> require(cleanAnswer != null) { "Matn javob majburiy" }
            AssignmentSubmissionType.BOTH -> require(hasFile || cleanAnswer != null) { "Fayl yoki matn javob talab qilinadi" }
        }
        val prior = submissionRepository.findAllByAssignmentIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            id,
            enrollment.id!!,
        )
        require(prior.firstOrNull()?.status != SubmissionStatus.GRADED) {
            "Baholangan topshiriqni qayta topshirib bo'lmaydi"
        }

        var storedKey: String? = null
        try {
            val stored = if (hasFile) store(file!!) else null
            storedKey = stored?.key
            val now = Instant.now()
            val submission = AssignmentSubmission(
                assignment = assignment,
                enrollment = enrollment,
                attemptNumber = (prior.maxOfOrNull { it.attemptNumber } ?: 0) + 1,
                answer = cleanAnswer,
                storageKey = stored?.key,
                originalFileName = stored?.name,
                contentType = stored?.contentType,
                fileSize = stored?.size,
                submittedAt = now,
                late = now.isAfter(assignment.dueAt),
            )
            return studentSubmissionDto(submissionRepository.save(submission))
        } catch (error: Exception) {
            storedKey?.let { Files.deleteIfExists(storagePath(it)) }
            throw error
        }
    }

    @Transactional(readOnly = true)
    fun submissionHistory(assignmentId: Long, userId: Long): List<StudentSubmissionDto> {
        val assignment = assignment(assignmentId)
        val enrollment = enrollmentFor(assignment, userId, allowCompleted = true)
        return submissionRepository.findAllByAssignmentIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            assignmentId,
            enrollment.id!!,
        ).map(::studentSubmissionDto)
    }

    @Transactional
    fun deleteSubmission(submissionId: Long, userId: Long) {
        val submission = submission(submissionId)
        require(submission.enrollment.student.user.id == userId) { "Faqat o'z topshirig'ingizni o'chira olasiz" }
        require(submission.status != SubmissionStatus.GRADED) { "Baholangan topshiriqni o'chirib bo'lmaydi" }
        submission.deleted = true
        submissionRepository.save(submission)
    }

    @Transactional(readOnly = true)
    fun file(submissionId: Long, userId: Long, mayManageAll: Boolean): SubmissionFileResource {
        val submission = submission(submissionId)
        val course = submission.assignment.course
        val isOwner = submission.enrollment.student.user.id == userId
        val canManage = mayManageAll || course.userId == userId
        require(isOwner || canManage) { "Faylga kirish ruxsati yo'q" }
        val key = submission.storageKey ?: throw NoSuchElementException("Topshirilgan fayl mavjud emas")
        val path = storagePath(key)
        require(Files.isRegularFile(path)) { "Topshirilgan fayl topilmadi" }
        return SubmissionFileResource(
            bytes = Files.readAllBytes(path),
            contentType = submission.contentType ?: "application/octet-stream",
            fileName = submission.originalFileName ?: "submission",
        )
    }

    private fun validate(request: AssignmentRequest) {
        require(request.title.trim().isNotEmpty()) { "Topshiriq nomi majburiy" }
        require(request.title.trim().length <= 255) { "Topshiriq nomi 255 belgidan oshmasligi kerak" }
        require(request.maxScore in 1..1000) { "Maksimal ball 1 va 1000 oralig'ida bo'lishi kerak" }
    }

    private fun assignment(id: Long): CourseAssignment = assignmentRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Topshiriq topilmadi: $id")

    private fun submission(id: Long): AssignmentSubmission = submissionRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Topshirilgan ish topilmadi: $id")

    private fun enrollmentFor(assignment: CourseAssignment, userId: Long, allowCompleted: Boolean) =
        enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            assignment.course.id!!,
            userId,
            if (allowCompleted) setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)
            else setOf(CourseEnrollmentStatus.ACTIVE),
        ) ?: throw IllegalArgumentException("Topshiriq kursiga faol biriktirish talab qilinadi")

    private fun studentIdForUser(userId: Long): Long {
        return studentRepository.findByUserId(userId)?.id ?: Long.MIN_VALUE
    }

    private fun latestSubmission(assignmentId: Long, enrollmentId: Long): AssignmentSubmission? =
        submissionRepository.findAllByAssignmentIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
            assignmentId,
            enrollmentId,
        ).firstOrNull()

    private fun latestAttempts(submissions: List<AssignmentSubmission>): List<AssignmentSubmission> = submissions
        .groupBy { Pair(it.assignment.id!!, it.enrollment.id!!) }
        .values
        .map { attempts -> attempts.maxBy { it.attemptNumber } }
        .sortedByDescending { it.submittedAt }

    private fun teacherAssignmentDto(assignment: CourseAssignment): TeacherAssignmentDto {
        val latest = latestAttempts(
            submissionRepository.findAllByAssignmentIdAndDeletedFalseOrderBySubmittedAtDesc(assignment.id!!)
        )
        return TeacherAssignmentDto(
            id = assignment.id.toString(),
            title = assignment.title,
            description = assignment.description,
            courseTitle = assignment.course.title.orEmpty(),
            courseId = assignment.course.id.toString(),
            dueDate = assignment.dueAt,
            maxScore = assignment.maxScore,
            priority = assignment.priority.name.lowercase(),
            submissionType = assignment.submissionType.name.lowercase(),
            totalSubmissions = latest.size,
            pendingGrade = latest.count { it.status != SubmissionStatus.GRADED },
            status = when (assignment.status) {
                AssignmentStatus.DRAFT -> "draft"
                AssignmentStatus.CLOSED -> "closed"
                AssignmentStatus.PUBLISHED -> if (Instant.now().isAfter(assignment.dueAt)) "closed" else "active"
            },
        )
    }

    private fun teacherSubmissionDto(submission: AssignmentSubmission) = TeacherSubmissionDto(
        id = submission.id.toString(),
        assignmentId = submission.assignment.id.toString(),
        studentName = submission.enrollment.student.user.fullName
            ?: listOf(submission.enrollment.student.lastName, submission.enrollment.student.firstName).joinToString(" "),
        assignmentTitle = submission.assignment.title,
        courseTitle = submission.assignment.course.title.orEmpty(),
        submittedAt = submission.submittedAt,
        status = when {
            submission.status == SubmissionStatus.GRADED -> "graded"
            submission.late -> "late"
            else -> "pending"
        },
        score = submission.score,
        maxScore = submission.assignment.maxScore,
        feedback = submission.feedback,
        answer = submission.answer,
        fileName = submission.originalFileName,
        fileUrl = submission.storageKey?.let { "/api/v1/submissions/${submission.id}/file" },
        attemptNumber = submission.attemptNumber,
    )

    private fun studentSubmissionDto(submission: AssignmentSubmission) = StudentSubmissionDto(
        id = submission.id.toString(),
        assignmentId = submission.assignment.id.toString(),
        studentId = submission.enrollment.student.id.toString(),
        fileUrl = submission.storageKey?.let { "/api/v1/submissions/${submission.id}/file" },
        fileName = submission.originalFileName,
        answer = submission.answer,
        submittedAt = submission.submittedAt,
        grade = submission.score,
        feedback = submission.feedback,
        status = submission.status.name.lowercase(),
        attemptNumber = submission.attemptNumber,
        late = submission.late,
    )

    private fun studentAssignmentDto(assignment: CourseAssignment, submission: AssignmentSubmission?): StudentAssignmentDto =
        StudentAssignmentDto(
            id = assignment.id.toString(),
            title = assignment.title,
            description = assignment.description,
            courseId = assignment.course.id.toString(),
            courseName = assignment.course.title.orEmpty(),
            dueDate = assignment.dueAt.toString(),
            status = when {
                submission?.status == SubmissionStatus.GRADED -> "graded"
                submission != null && submission.status != SubmissionStatus.RETURNED -> "submitted"
                Instant.now().isAfter(assignment.dueAt) || assignment.status == AssignmentStatus.CLOSED -> "overdue"
                else -> "pending"
            },
            priority = assignment.priority.name.lowercase(),
            maxScore = assignment.maxScore,
            submittedAt = submission?.submittedAt?.toString(),
            grade = submission?.score,
            feedback = submission?.feedback,
        )

    private fun studentDetailsDto(assignment: CourseAssignment, submission: AssignmentSubmission?) = StudentAssignmentDetailsDto(
        id = assignment.id.toString(),
        title = assignment.title,
        description = assignment.description,
        courseId = assignment.course.id.toString(),
        courseName = assignment.course.title.orEmpty(),
        dueDate = assignment.dueAt,
        status = when {
            submission?.status == SubmissionStatus.GRADED -> "graded"
            submission != null -> "submitted"
            Instant.now().isAfter(assignment.dueAt) || assignment.status == AssignmentStatus.CLOSED -> "overdue"
            else -> "pending"
        },
        priority = assignment.priority.name.lowercase(),
        maxScore = assignment.maxScore,
        submittedAt = submission?.submittedAt,
        grade = submission?.score,
        feedback = submission?.feedback,
        instructions = assignment.instructions,
        submissionType = assignment.submissionType.name.lowercase(),
    )

    private data class StoredFile(val key: String, val name: String, val contentType: String, val size: Long)

    private fun store(file: MultipartFile): StoredFile {
        require(file.size in 1..maxFileBytes) { "Fayl hajmi 10 MB dan oshmasligi va bo'sh bo'lmasligi kerak" }
        val cleanName = file.originalFilename.orEmpty().replace('\\', '/').substringAfterLast('/').takeLast(255)
        val extension = cleanName.substringAfterLast('.', "").lowercase()
        require(extension in allowedExtensions) { "Ruxsat etilgan fayl turlari: ${allowedExtensions.joinToString()}" }
        Files.createDirectories(storageRoot)
        val key = UUID.randomUUID().toString().replace("-", "")
        val target = storagePath(key)
        file.inputStream.use { Files.copy(it, target, StandardCopyOption.REPLACE_EXISTING) }
        return StoredFile(key, cleanName, file.contentType ?: "application/octet-stream", file.size)
    }

    private fun storagePath(key: String): Path {
        require(key.matches(Regex("[a-f0-9]{32}"))) { "Noto'g'ri fayl kaliti" }
        val target = storageRoot.resolve(key).normalize()
        require(target.startsWith(storageRoot) && target != storageRoot) { "Noto'g'ri fayl manzili" }
        return target
    }

    private fun changeStatus(assignment: CourseAssignment, status: AssignmentStatus) {
        if (status == AssignmentStatus.PUBLISHED && assignment.status != AssignmentStatus.PUBLISHED) {
            assignment.publishedAt = Instant.now()
        }
        assignment.status = status
    }
}
