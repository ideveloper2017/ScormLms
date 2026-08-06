package uz.scorm.lms.app.v1.compliance

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.survey.SurveyRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.attestation.repository.AttestationSessionRepository
import uz.scorm.lms.app.v1.attestation.repository.GraduationCertificateRepository
import uz.scorm.lms.app.v1.attestation.model.AttestationSessionStatus
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.notification.repository.NotificationRepository

@Service
class Decision559ComplianceService(
    private val studentRepository: StudentRepository,
    private val teacherRepository: TeacherRepository,
    private val programRepository: ProgramRepository,
    private val userRepository: UserRepository,
    private val courseRepository: CourseRepository,
    private val scormPackageRepository: ScormPackageRepository,
    private val learningActivityEventRepository: LearningActivityEventRepository,
    private val assignmentRepository: CourseAssignmentRepository,
    private val quizRepository: CourseQuizRepository,
    private val learningSessionRepository: CourseLearningSessionRepository,
    private val examSessionRepository: ExamSessionRepository,
    private val attestationSessionRepository: AttestationSessionRepository,
    private val certificateRepository: GraduationCertificateRepository,
    private val auditLogRepository: AuditLogRepository,
    private val notificationRepository: NotificationRepository,
    private val surveyRepository: SurveyRepository,
) {
    @Transactional(readOnly = true)
    fun summary(): Decision559ComplianceSummaryDto {
        val distanceStudents = studentRepository.countByEducationFormAndStudentStatus(
            EducationForm.DISTANCE,
            StudentStatus.ACTIVE,
        )
        val activeTeachers = teacherRepository.countByActiveTrue()
        val ratio = if (activeTeachers == 0L) distanceStudents.toDouble() else distanceStudents.toDouble() / activeTeachers
        val evidence = evidence()

        val programs = programRepository.findAllByDistanceEnabledTrue().map { program ->
            val localStudents = program.id?.let {
                studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                    it,
                    EducationForm.DISTANCE,
                    StudentStatus.ACTIVE,
                    Citizenship.UZBEKISTAN,
                )
            } ?: 0
            val limit = if (program.informationTechnologyProgram) null else
                (program.distanceAdmissionLimit ?: Decision559Rules.regulatoryLimit(program.degreeLevel))
            ProgramComplianceDto(
                programId = requireNotNull(program.id),
                programName = program.name,
                degreeLevel = program.degreeLevel,
                informationTechnologyProgram = program.informationTechnologyProgram,
                localDistanceStudents = localStudents,
                admissionLimit = limit,
                status = if (limit == null || localStudents <= limit) ComplianceStatus.COMPLIANT
                else ComplianceStatus.NON_COMPLIANT,
            )
        }

        val violations = buildList {
            if (distanceStudents > 0 && activeTeachers == 0L) {
                add(ComplianceViolationDto(
                    code = "TEACHER_REQUIRED",
                    clause = "26-band",
                    severity = "CRITICAL",
                    message = "Masofaviy talabalar mavjud, ammo faol o'qituvchi ro'yxatga olinmagan",
                    recommendation = "Masofaviy ta'lim boshlanishidan oldin faol o'qituvchilarni biriktiring",
                ))
            } else if (ratio > Decision559Rules.MAX_STUDENTS_PER_TEACHER) {
                add(ComplianceViolationDto(
                    code = "STUDENT_TEACHER_RATIO",
                    clause = "26-band",
                    severity = "CRITICAL",
                    message = "Bir o'qituvchiga ${"%.1f".format(ratio)} talaba to'g'ri kelmoqda",
                    recommendation = "Nisbatni 1:${Decision559Rules.MAX_STUDENTS_PER_TEACHER} yoki undan past holatga keltiring",
                ))
            }
            programs.filter { it.status == ComplianceStatus.NON_COMPLIANT }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "PROGRAM_ADMISSION_LIMIT_${program.programId}",
                    clause = "20-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: ${program.localDistanceStudents} talaba, limit ${program.admissionLimit}",
                    recommendation = "Qabul parametrlarini qarordagi limitga moslashtiring",
                ))
            }
            if (programs.isEmpty()) {
                add(ComplianceViolationDto(
                    code = "NO_DISTANCE_PROGRAM",
                    clause = "3-band",
                    severity = "WARNING",
                    message = "Masofaviy ta'limga ruxsat berilgan yo'nalish sozlanmagan",
                    recommendation = "Yo'nalish kartasida masofaviy ta'lim va litsenziya rekvizitlarini kiriting",
                ))
            }
            evidence.filter { it.status != ComplianceStatus.COMPLIANT }.forEach { item ->
                add(ComplianceViolationDto(
                    code = "MISSING_EVIDENCE_${item.code}", clause = "10-11, 24, 28-31-bandlar",
                    severity = if (item.status == ComplianceStatus.NON_COMPLIANT) "CRITICAL" else "WARNING",
                    message = "${item.label} bo'yicha amaliy yozuv topilmadi",
                    recommendation = "${item.source} modulida ish jarayonini bajaring va dalil yozuvlarini shakllantiring",
                ))
            }
        }

        val status = when {
            violations.any { it.severity == "CRITICAL" } -> ComplianceStatus.NON_COMPLIANT
            violations.isNotEmpty() -> ComplianceStatus.WARNING
            else -> ComplianceStatus.COMPLIANT
        }

        return Decision559ComplianceSummaryDto(
            overallStatus = status,
            metrics = listOf(
                ComplianceMetricDto(
                    code = "DISTANCE_STUDENTS",
                    label = "Faol masofaviy talabalar",
                    currentValue = distanceStudents.toDouble(),
                    unit = "talaba",
                    status = ComplianceStatus.COMPLIANT,
                ),
                ComplianceMetricDto(
                    code = "ACTIVE_TEACHERS",
                    label = "Faol o'qituvchilar",
                    currentValue = activeTeachers.toDouble(),
                    unit = "o'qituvchi",
                    status = if (distanceStudents == 0L || activeTeachers > 0L) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                ),
                ComplianceMetricDto(
                    code = "STUDENT_TEACHER_RATIO",
                    label = "Bir o'qituvchiga talabalar",
                    currentValue = ratio,
                    limitValue = Decision559Rules.MAX_STUDENTS_PER_TEACHER.toDouble(),
                    unit = "talaba",
                    status = if (ratio <= Decision559Rules.MAX_STUDENTS_PER_TEACHER) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                ),
                ComplianceMetricDto("COURSES", "O'chirilmagan kurslar", evidence.count("COURSES").toDouble(), unit = "kurs", status = evidence.status("COURSES")),
                ComplianceMetricDto("LEARNING_EVENTS", "O'quv faolligi dalillari", evidence.count("LEARNING_EVENTS").toDouble(), unit = "hodisa", status = evidence.status("LEARNING_EVENTS")),
                ComplianceMetricDto("ASSESSMENTS", "Test va yakuniy nazoratlar", evidence.count("ASSESSMENTS").toDouble(), unit = "nazorat", status = evidence.status("ASSESSMENTS")),
                ComplianceMetricDto("ATTESTATIONS", "Yakunlangan attestatsiyalar", evidence.count("ATTESTATIONS").toDouble(), unit = "sessiya", status = evidence.status("ATTESTATIONS")),
            ),
            programs = programs,
            requirements = requirements(evidence),
            evidence = evidence,
            violations = violations,
        )
    }

    @Transactional(readOnly = true)
    fun requirements(): List<Decision559RequirementDto> = requirements(evidence())

    private fun requirements(evidence: List<ComplianceEvidenceDto>): List<Decision559RequirementDto> {
        fun implementation(vararg codes: String) = if (codes.all { evidence.count(it) > 0 }) RequirementImplementation.IMPLEMENTED else RequirementImplementation.PARTIAL
        return listOf(
            Decision559RequirementDto("SCORM", "10-band", "LMS va SCORM", "LMS SCORM standartlariga mos bo'lishi", implementation("SCORM_PACKAGES"), "/courses", listOf("SCORM_PACKAGES")),
            Decision559RequirementDto("AUTOPROCTOR", "10-11-bandlar", "Bilim nazorati", "Imtihonda autentifikatsiya va avtoproktoring", RequirementImplementation.PARTIAL, "/exams", listOf("ASSESSMENTS", "PROCTORING_EVIDENCE")),
            Decision559RequirementDto("USERS", "11-band", "Boshqaruv", "Foydalanuvchilar reestri, rollar, autentifikatsiya va harakatlar jurnali", implementation("ACTIVE_USERS", "AUDIT_LOGS"), "/admin/users", listOf("ACTIVE_USERS", "AUDIT_LOGS")),
            Decision559RequirementDto("ATTENDANCE", "11, 24-bandlar", "Davomat va o'zlashtirish", "Resurslardan foydalanish, davomat, baholar va individual natijalarni hisobga olish", implementation("LEARNING_EVENTS"), "/attendance", listOf("LEARNING_EVENTS")),
            Decision559RequirementDto("COMMUNICATION", "11-band", "Kommunikatsiya", "Forum, chat, xabar, elektron aloqa va videokonferensiya", RequirementImplementation.PARTIAL, "/communication", listOf("NOTIFICATIONS")),
            Decision559RequirementDto("CONTINGENT", "11-band", "Kontingent", "Talaba va pedagoglarning yagona reestri hamda shaxsiy kabinetlari", implementation("ACTIVE_USERS"), "/contingent", listOf("ACTIVE_USERS")),
            Decision559RequirementDto("COURSES", "11, 18, 24-bandlar", "Kurslarni boshqarish", "Kontent, topshiriq, test, havola, sinxron va asinxron materiallar", implementation("COURSES", "ASSIGNMENTS", "QUIZZES", "LEARNING_SESSIONS"), "/courses", listOf("COURSES", "ASSIGNMENTS", "QUIZZES", "LEARNING_SESSIONS")),
            Decision559RequirementDto("TEACHING", "11-band", "O'qitishni boshqarish", "Kredit, jadval, konsultatsiya, imtihon va o'zlashtirishni boshqarish", implementation("LEARNING_SESSIONS", "ASSESSMENTS"), "/teaching", listOf("LEARNING_SESSIONS", "ASSESSMENTS")),
            Decision559RequirementDto("STATISTICS", "11, 28-31-bandlar", "Statistika va monitoring", "Kontingent, o'zlashtirish, kontent va talaba harakati bo'yicha hisobot", implementation("AUDIT_LOGS"), "/statistics", listOf("AUDIT_LOGS")),
            Decision559RequirementDto("ASSESSMENT", "11, 21, 24-bandlar", "Bilim nazorati", "Testologiya talablari asosidagi nazorat bazasi va yakuniy nazorat", implementation("QUIZZES", "ASSESSMENTS"), "/exams", listOf("QUIZZES", "ASSESSMENTS")),
            Decision559RequirementDto("ATTESTATION", "21-band", "Davlat attestatsiyasi", "Komissiya qarori, rasmiy protokol va tekshiriladigan bitiruv sertifikati", implementation("ATTESTATIONS", "CERTIFICATES"), "/teacher/attestations", listOf("ATTESTATIONS", "CERTIFICATES")),
            Decision559RequirementDto("FEEDBACK", "28-31-bandlar", "Sifat bo'yicha fikr", "Talaba va pedagoglarning anonim so'rovlari hamda agregat tahlili", implementation("SURVEYS"), "/admin/surveys", listOf("SURVEYS")),
            Decision559RequirementDto("INTEGRATION", "29-band", "Davlat monitoringi", "Vazirlik va ta'lim sifatini nazorat qilish axborot tizimlari bilan integratsiya", RequirementImplementation.NOT_IMPLEMENTED, "/admin/integrations", listOf("EXTERNAL_INTEGRATIONS")),
        )
    }

    private fun evidence(): List<ComplianceEvidenceDto> {
        fun item(code: String, label: String, count: Long, unit: String, source: String, route: String?, missingStatus: ComplianceStatus = ComplianceStatus.WARNING) = ComplianceEvidenceDto(
            code, label, count, unit, source, route, if (count > 0) ComplianceStatus.COMPLIANT else missingStatus,
        )
        return listOf(
            item("ACTIVE_USERS", "Faol foydalanuvchilar", userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE), "foydalanuvchi", "users", "/admin/users"),
            item("COURSES", "Kurslar", courseRepository.countByDeletedFalse(), "kurs", "courses", "/admin/courses"),
            item("SCORM_PACKAGES", "SCORM paketlari", scormPackageRepository.countByDeletedFalse(), "paket", "scorm_packages", "/courses"),
            item("LEARNING_EVENTS", "O'quv faolligi", learningActivityEventRepository.countByDeletedFalse(), "hodisa", "learning_activity_events", "/attendance"),
            item("ASSIGNMENTS", "Topshiriqlar", assignmentRepository.countByDeletedFalse(), "topshiriq", "course_assignments", "/teacher/assignments"),
            item("QUIZZES", "Testlar", quizRepository.countByDeletedFalse(), "test", "course_quizzes", "/teacher/tests"),
            item("LEARNING_SESSIONS", "Mashg'ulotlar", learningSessionRepository.countByDeletedFalse(), "mashg'ulot", "course_learning_sessions", "/teacher/sessions"),
            item("ASSESSMENTS", "Yakunlangan nazoratlar", examSessionRepository.findAllByStatusAndDeletedFalseOrderByExamDateAsc(ExamSessionStatus.COMPLETED).size.toLong(), "nazorat", "exam_sessions", "/teacher/exams"),
            item("ATTESTATIONS", "Yakunlangan attestatsiyalar", attestationSessionRepository.countByStatusAndDeletedFalse(AttestationSessionStatus.COMPLETED), "sessiya", "state_attestation_sessions", "/teacher/attestations"),
            item("CERTIFICATES", "Bitiruv sertifikatlari", certificateRepository.countByDeletedFalse(), "sertifikat", "graduation_certificates", "/teacher/attestations"),
            item("AUDIT_LOGS", "Audit yozuvlari", auditLogRepository.count(), "yozuv", "audit_logs", "/admin/audit-logs"),
            item("NOTIFICATIONS", "Yuborilgan xabarnomalar", notificationRepository.count(), "xabarnoma", "notifications", "/communication"),
            item("SURVEYS", "Anonim sifat so'rovlari", surveyRepository.countByDeletedFalse(), "so'rov", "surveys", "/admin/surveys"),
            item("PROCTORING_EVIDENCE", "Avtoproktoring dalillari", 0, "dalil", "proctoring adapteri", "/exams", ComplianceStatus.NON_COMPLIANT),
            item("EXTERNAL_INTEGRATIONS", "Tashqi monitoring integratsiyalari", 0, "adapter", "integratsiya adapterlari", "/admin/integrations", ComplianceStatus.NON_COMPLIANT),
        )
    }

    private fun List<ComplianceEvidenceDto>.count(code: String) = firstOrNull { it.code == code }?.recordCount ?: 0
    private fun List<ComplianceEvidenceDto>.status(code: String) = firstOrNull { it.code == code }?.status ?: ComplianceStatus.WARNING
}
