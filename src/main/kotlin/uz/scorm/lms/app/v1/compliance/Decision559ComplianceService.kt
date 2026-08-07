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
import uz.scorm.lms.app.v1.chat.repository.ChatConversationRepository
import uz.scorm.lms.app.v1.announcement.model.AnnouncementStatus
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementRepository
import uz.scorm.lms.app.v1.support.repository.SupportTicketRepository
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import uz.scorm.lms.app.v1.hemis.sync.repository.HemisSyncRunRepository
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationSessionStatus
import uz.scorm.lms.app.v1.orientation.repository.LmsOrientationAttendeeRepository
import uz.scorm.lms.app.v1.orientation.repository.LmsOrientationSessionRepository
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatRunRepository
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatRunStatus
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStatus
import uz.scorm.lms.app.v1.quality.repository.QualityMonitoringStudyRepository
import uz.scorm.lms.app.v1.practice.model.StudentPracticeStatus
import uz.scorm.lms.app.v1.practice.repository.StudentPracticeRepository
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.student.repository.StudentLifecycleEventRepository
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.leave.model.AssessmentLeaveStatus
import uz.scorm.lms.app.v1.leave.repository.AssessmentLeaveEvidenceRepository
import uz.scorm.lms.app.v1.foreignteacher.model.ForeignTeacherEngagementStatus
import uz.scorm.lms.app.v1.foreignteacher.repository.ForeignTeacherEngagementRepository
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus
import uz.scorm.lms.app.v1.restriction.repository.DistanceProgramRestrictionCatalogRepository
import uz.scorm.lms.app.v1.biometric.model.BiometricConsentAction
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import uz.scorm.lms.app.v1.biometric.repository.BiometricConsentEventRepository
import uz.scorm.lms.app.v1.biometric.repository.BiometricPolicyRepository
import uz.scorm.lms.app.v1.biometric.repository.BiometricPurgeRecordRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.readiness.model.DistanceReadinessStatus
import uz.scorm.lms.app.v1.readiness.repository.DistanceInfrastructureReadinessRepository
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.service.OfficialSitePublicationService
import uz.scorm.lms.app.v1.contentstandard.service.ContentStandardService
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import uz.scorm.lms.app.v1.videoconference.repository.VideoConferenceMeetingRepository
import java.time.LocalDate

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
    private val chatConversationRepository: ChatConversationRepository,
    private val announcementRepository: AnnouncementRepository,
    private val supportTicketRepository: SupportTicketRepository,
    private val integrationOutboxRepository: IntegrationOutboxRepository,
    private val hemisSyncRunRepository: HemisSyncRunRepository,
    private val surveyRepository: SurveyRepository,
    private val orientationSessionRepository: LmsOrientationSessionRepository,
    private val orientationAttendeeRepository: LmsOrientationAttendeeRepository,
    private val uatRunRepository: Decision559UatRunRepository,
    private val qualityMonitoringStudyRepository: QualityMonitoringStudyRepository,
    private val studentPracticeRepository: StudentPracticeRepository,
    private val curriculumVersionRepository: ProgramCurriculumVersionRepository,
    private val studentLifecycleEventRepository: StudentLifecycleEventRepository,
    private val admissionPolicyRepository: DistanceAdmissionPolicyRepository,
    private val licenseScopeRepository: NonStateLicenseProgramScopeRepository,
    private val assessmentLeaveEvidenceRepository: AssessmentLeaveEvidenceRepository,
    private val foreignTeacherEngagementRepository: ForeignTeacherEngagementRepository,
    private val accountabilityReferralRepository: ComplianceAccountabilityReferralRepository,
    private val restrictionCatalogRepository: DistanceProgramRestrictionCatalogRepository,
    private val biometricPolicyRepository: BiometricPolicyRepository,
    private val biometricConsentEventRepository: BiometricConsentEventRepository,
    private val biometricPurgeRecordRepository: BiometricPurgeRecordRepository,
    private val proctoringSessionRepository: ProctoringSessionRepository,
    private val infrastructureReadinessRepository: DistanceInfrastructureReadinessRepository,
    private val officialSitePublicationService: OfficialSitePublicationService,
    private val contentStandardService: ContentStandardService,
    private val videoConferenceMeetingRepository: VideoConferenceMeetingRepository,
) {
    @Transactional(readOnly = true)
    fun summary(): Decision559ComplianceSummaryDto {
        val distanceStudents = studentRepository.countByEducationFormAndStudentStatus(
            EducationForm.DISTANCE,
            StudentStatus.ACTIVE,
        )
        val activeTeachers = teacherRepository.countByActiveTrue()
        val ratio = if (activeTeachers == 0L) distanceStudents.toDouble() else distanceStudents.toDouble() / activeTeachers
        val today = LocalDate.now()
        val nonStatePolicies = admissionPolicyRepository.findAllByInstitutionGovernanceTypeAndStatusAndDeletedFalse(
            InstitutionGovernanceType.NON_STATE, AdmissionPolicyStatus.APPROVED,
        )
        val uncoveredNonStatePolicies = nonStatePolicies.filterNot { policy ->
            licenseScopeRepository.existsEffectiveCoverage(requireNotNull(policy.program.id), NonStateLicenseStatus.VERIFIED, today)
        }
        val evidence = evidence(nonStatePolicies, today)

        val academicYear = currentAcademicYear(LocalDate.now())
        val programs = programRepository.findAllByDistanceEnabledTrue().map { program ->
            val localStudents = program.id?.let {
                studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                    it,
                    academicYear,
                    EducationForm.DISTANCE,
                    Citizenship.UZBEKISTAN,
                )
            } ?: 0
            val policy = program.id?.let { admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(it, academicYear, AdmissionPolicyStatus.APPROVED) }
            val limit = policy?.admissionQuota
            val admissionCompliant = policy != null && localStudents <= policy.admissionQuota
            val durationCompliant = Decision559Rules.isStudyDurationCompliant(
                program.distanceEnabled,
                program.fullTimeDurationMonths,
                program.distanceDurationMonths,
            )
            val fullTimeCounterpartCompliant = Decision559Rules.isFullTimeCounterpartCompliant(
                program.distanceEnabled,
                program.informationTechnologyProgram,
                program.fullTimeAvailable,
                program.fullTimeBasisReference,
            )
            ProgramComplianceDto(
                programId = requireNotNull(program.id),
                programName = program.name,
                degreeLevel = program.degreeLevel,
                informationTechnologyProgram = program.informationTechnologyProgram,
                localDistanceStudents = localStudents,
                admissionLimit = limit,
                fullTimeDurationMonths = program.fullTimeDurationMonths,
                distanceDurationMonths = program.distanceDurationMonths,
                durationStatus = if (durationCompliant) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                fullTimeAvailable = program.fullTimeAvailable,
                fullTimeBasisReference = program.fullTimeBasisReference,
                fullTimeCounterpartStatus = if (fullTimeCounterpartCompliant) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                status = if (admissionCompliant && durationCompliant && fullTimeCounterpartCompliant) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
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
            programs.filter { it.admissionLimit != null && it.localDistanceStudents > it.admissionLimit }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "PROGRAM_ADMISSION_LIMIT_${program.programId}",
                    clause = "20-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: ${program.localDistanceStudents} talaba, limit ${program.admissionLimit}",
                    recommendation = "Qabul parametrlarini qarordagi limitga moslashtiring",
                ))
            }
            programs.filter { it.admissionLimit == null }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "MISSING_ADMISSION_POLICY_${program.programId}",
                    clause = "15-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: joriy $academicYear o'quv yili uchun tasdiqlangan qabul parametri va kontrakt qiymati yo'q",
                    recommendation = "OTM boshqaruv turiga mos vakolatli organ hujjati bilan qabul siyosatini tasdiqlang",
                ))
            }
            programs.filter { it.durationStatus == ComplianceStatus.NON_COMPLIANT }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "PROGRAM_DURATION_${program.programId}",
                    clause = "17-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: kunduzgi ${program.fullTimeDurationMonths ?: "kiritilmagan"} oy, masofaviy ${program.distanceDurationMonths ?: "kiritilmagan"} oy",
                    recommendation = "Kunduzgi va masofaviy normativ davomiylikni kiriting; masofaviy muddat kunduzgidan kam bo'lmasin",
                ))
            }
            programs.filter { it.fullTimeCounterpartStatus == ComplianceStatus.NON_COMPLIANT }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "PROGRAM_FULL_TIME_COUNTERPART_${program.programId}",
                    clause = "3-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: tegishli kunduzgi ta'lim shakli yoki uning asos rekviziti tasdiqlanmagan",
                    recommendation = "Kunduzgi shakl mavjudligini yo'nalish kartasida buyruq yoki reyestr rekviziti bilan tasdiqlang; AKT istisnosini faqat haqiqiy AKT yo'nalishiga qo'llang",
                ))
            }
            uncoveredNonStatePolicies.forEach { policy ->
                add(ComplianceViolationDto(
                    code = "NON_STATE_LICENSE_SCOPE_${policy.program.id}",
                    clause = "16-band",
                    severity = "CRITICAL",
                    message = "${policy.institutionName}: ${policy.program.name} dasturi amaldagi tekshirilgan litsenziyada qayd etilmagan",
                    recommendation = "Nodavlat OTM litsenziyasini rasmiy reyestr dalili bilan tekshiring va dastur qamrovini litsenziyaga kiriting",
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
            evidence.filter { it.status != ComplianceStatus.COMPLIANT && it.code != "NON_STATE_LICENSES" }.forEach { item ->
                add(ComplianceViolationDto(
                    code = "MISSING_EVIDENCE_${item.code}", clause = evidenceClause(item.code),
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
                ComplianceMetricDto("ORIENTATION_ACKS", "LMS orientatsiyasi tasdiqlari", evidence.count("ORIENTATION_ACKS").toDouble(), unit = "tasdiq", status = evidence.status("ORIENTATION_ACKS")),
                ComplianceMetricDto("UAT_ACCEPTANCE_RUNS", "Tasdiqlangan 559 qabul protokollari", evidence.count("UAT_ACCEPTANCE_RUNS").toDouble(), unit = "protokol", status = evidence.status("UAT_ACCEPTANCE_RUNS")),
                ComplianceMetricDto("PRACTICE_PLACEMENTS", "Tasdiqlangan talaba amaliyotlari", evidence.count("PRACTICE_PLACEMENTS").toDouble(), unit = "amaliyot", status = evidence.status("PRACTICE_PLACEMENTS")),
                ComplianceMetricDto("CURRICULA", "Tasdiqlangan curriculum versiyalari", evidence.count("CURRICULA").toDouble(), unit = "versiya", status = evidence.status("CURRICULA")),
                ComplianceMetricDto("STUDENT_LIFECYCLE", "Buyruqli talaba harakati", evidence.count("STUDENT_LIFECYCLE").toDouble(), unit = "hodisa", status = evidence.status("STUDENT_LIFECYCLE")),
                ComplianceMetricDto("ADMISSION_POLICIES", "Tasdiqlangan qabul siyosatlari", evidence.count("ADMISSION_POLICIES").toDouble(), unit = "siyosat", status = evidence.status("ADMISSION_POLICIES")),
                ComplianceMetricDto("FULL_TIME_COUNTERPARTS", "Kunduzgi shakl asosi tasdiqlangan masofaviy dasturlar", evidence.count("FULL_TIME_COUNTERPARTS").toDouble(), unit = "dastur", status = evidence.status("FULL_TIME_COUNTERPARTS")),
                ComplianceMetricDto("NON_STATE_LICENSES", "Amaldagi nodavlat OTM litsenziya qamrovlari", evidence.count("NON_STATE_LICENSES").toDouble(), unit = "qamrov", status = evidence.status("NON_STATE_LICENSES")),
                ComplianceMetricDto("ASSESSMENT_LEAVES", "Tekshirilgan haq saqlanadigan ta'til dalillari", evidence.count("ASSESSMENT_LEAVES").toDouble(), unit = "dalil", status = evidence.status("ASSESSMENT_LEAVES")),
                ComplianceMetricDto("FOREIGN_TEACHERS", "Tekshirilgan xorijiy pedagog engagementlari", evidence.count("FOREIGN_TEACHERS").toDouble(), unit = "engagement", status = evidence.status("FOREIGN_TEACHERS")),
                ComplianceMetricDto("ACCOUNTABILITY_DECISIONS", "Vakolatli organ qarori qayd etilgan javobgarlik yo'llanmalari", evidence.count("ACCOUNTABILITY_DECISIONS").toDouble(), unit = "qaror", status = evidence.status("ACCOUNTABILITY_DECISIONS")),
                ComplianceMetricDto("PROHIBITED_PROGRAM_CATALOG", "Joriy yillik taqiqlangan yo'nalishlar katalogi", evidence.count("PROHIBITED_PROGRAM_CATALOG").toDouble(), unit = "katalog", status = evidence.status("PROHIBITED_PROGRAM_CATALOG")),
                ComplianceMetricDto("BIOMETRIC_POLICY", "Amaldagi biometrik siyosat", evidence.count("BIOMETRIC_POLICY").toDouble(), unit = "siyosat", status = evidence.status("BIOMETRIC_POLICY")),
                ComplianceMetricDto("BIOMETRIC_CONSENTS", "Aniq siyosatga bog'langan roziliklar", evidence.count("BIOMETRIC_CONSENTS").toDouble(), unit = "rozilik", status = evidence.status("BIOMETRIC_CONSENTS")),
                ComplianceMetricDto("BIOMETRIC_PURGES", "Auditli biometrik o'chirishlar", evidence.count("BIOMETRIC_PURGES").toDouble(), unit = "o'chirish", status = evidence.status("BIOMETRIC_PURGES")),
                ComplianceMetricDto("INFRASTRUCTURE_READINESS", "Tasdiqlangan 8-band infratuzilma profili", evidence.count("INFRASTRUCTURE_READINESS").toDouble(), unit = "profil", status = evidence.status("INFRASTRUCTURE_READINESS")),
                ComplianceMetricDto("OFFICIAL_SITE_PUBLICATIONS", "Rasmiy saytdagi majburiy axborot toifalari", evidence.count("OFFICIAL_SITE_PUBLICATIONS").toDouble(), limitValue = OfficialSitePublicationCategory.entries.size.toDouble(), unit = "toifa", status = evidence.status("OFFICIAL_SITE_PUBLICATIONS")),
                ComplianceMetricDto("CONTENT_STANDARD_CHECKLIST", "Amaldagi O'zDSt 36.2030 checklisti", evidence.count("CONTENT_STANDARD_CHECKLIST").toDouble(), limitValue = 1.0, unit = "checklist", status = evidence.status("CONTENT_STANDARD_CHECKLIST")),
                ComplianceMetricDto("CONTENT_STANDARD_COVERAGE", "O'zDSt assessmentidan o'tgan nashrdagi kontent", evidence.count("CONTENT_STANDARD_COVERAGE").toDouble(), unit = "kontent", status = evidence.status("CONTENT_STANDARD_COVERAGE")),
                ComplianceMetricDto("VIDEO_CONFERENCE_MEETINGS", "Provider yaratgan READY videokonferensiyalar", evidence.count("VIDEO_CONFERENCE_MEETINGS").toDouble(), unit = "meeting", status = evidence.status("VIDEO_CONFERENCE_MEETINGS")),
                ComplianceMetricDto("QUALITY_STUDIES", "Tasdiqlangan sifat tadqiqotlari", evidence.count("QUALITY_STUDIES").toDouble(), unit = "dalil", status = evidence.status("QUALITY_STUDIES")),
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
            Decision559RequirementDto("FULL_TIME_COUNTERPART", "3-band", "Kunduzgi dastur mavjudligi", "AKT yo'nalishlaridan tashqari masofaviy bakalavriat yoki magistratura dasturi uchun tegishli kunduzgi ta'lim shakli mavjud bo'lishi", if (evidence.status("FULL_TIME_COUNTERPARTS") == ComplianceStatus.COMPLIANT) RequirementImplementation.IMPLEMENTED else RequirementImplementation.PARTIAL, "/admin/programs", listOf("FULL_TIME_COUNTERPARTS")),
            Decision559RequirementDto("INFRASTRUCTURE_READINESS", "8-band", "Masofaviy ta'lim infratuzilmasi", "Internet, sanitariya talablariga mos kompyuter xonasi, malakali texnik shtat, O'zbekistondagi mulk yoki kamida 5 yillik ijara serveri va majburiy axborotli rasmiy sayt", if (listOf("INFRASTRUCTURE_READINESS", "OFFICIAL_SITE_PUBLICATIONS").all { evidence.status(it) == ComplianceStatus.COMPLIANT }) RequirementImplementation.IMPLEMENTED else RequirementImplementation.PARTIAL, "/admin/distance-readiness", listOf("INFRASTRUCTURE_READINESS", "OFFICIAL_SITE_PUBLICATIONS")),
            Decision559RequirementDto("CONTENT_STANDARD", "9-band", "O'zDSt 36.2030 kontent muvofiqligi", "Rasmiy checklistni versiyalash va kontentning aniq revisionini har bir mezon bo'yicha dalil bilan mustaqil baholash", if (listOf("CONTENT_STANDARD_CHECKLIST", "CONTENT_STANDARD_COVERAGE").all { evidence.status(it) == ComplianceStatus.COMPLIANT }) RequirementImplementation.IMPLEMENTED else RequirementImplementation.PARTIAL, "/admin/content-standard", listOf("CONTENT_STANDARD_CHECKLIST", "CONTENT_STANDARD_COVERAGE")),
            Decision559RequirementDto("SCORM", "10-band", "LMS va SCORM", "LMS SCORM standartlariga mos bo'lishi", implementation("SCORM_PACKAGES"), "/courses", listOf("SCORM_PACKAGES")),
            Decision559RequirementDto("AUTOPROCTOR", "10-11-bandlar", "Bilim nazorati", "Imtihonda autentifikatsiya, aniq siyosatga rozilik, retention/o'chirish va avtoproktoring", RequirementImplementation.PARTIAL, "/exams", listOf("ASSESSMENTS", "PROCTORING_EVIDENCE", "BIOMETRIC_POLICY", "BIOMETRIC_CONSENTS", "BIOMETRIC_PURGES")),
            Decision559RequirementDto("USERS", "11-band", "Boshqaruv", "Foydalanuvchilar reestri, rollar, autentifikatsiya va harakatlar jurnali", implementation("ACTIVE_USERS", "AUDIT_LOGS"), "/admin/users", listOf("ACTIVE_USERS", "AUDIT_LOGS")),
            Decision559RequirementDto("ATTENDANCE", "11, 24-bandlar", "Davomat va o'zlashtirish", "Resurslardan foydalanish, davomat, baholar va individual natijalarni hisobga olish", implementation("LEARNING_EVENTS"), "/attendance", listOf("LEARNING_EVENTS")),
            Decision559RequirementDto("COMMUNICATION", "11-band", "Kommunikatsiya", "Forum, chat, e'lon, elektron aloqa va provider orqali auditli videokonferensiya", implementation("CHAT_CONVERSATIONS", "ANNOUNCEMENTS", "NOTIFICATIONS", "VIDEO_CONFERENCE_MEETINGS"), "/teacher/sessions", listOf("CHAT_CONVERSATIONS", "ANNOUNCEMENTS", "NOTIFICATIONS", "VIDEO_CONFERENCE_MEETINGS")),
            Decision559RequirementDto("SUPPORT", "8, 32-bandlar", "Texnik va metodik yordam", "Murojaat, mas'ul, izoh, yechim va SLA nazorati", implementation("SUPPORT_TICKETS"), "/support", listOf("SUPPORT_TICKETS")),
            Decision559RequirementDto("CONTINGENT", "11-band", "Kontingent", "Talaba va pedagoglarning yagona reestri hamda shaxsiy kabinetlari", implementation("ACTIVE_USERS"), "/contingent", listOf("ACTIVE_USERS")),
            Decision559RequirementDto("COURSES", "11, 18, 24-bandlar", "Kurslarni boshqarish", "Kontent, topshiriq, test, havola, sinxron va asinxron materiallar", implementation("COURSES", "ASSIGNMENTS", "QUIZZES", "LEARNING_SESSIONS"), "/courses", listOf("COURSES", "ASSIGNMENTS", "QUIZZES", "LEARNING_SESSIONS")),
            Decision559RequirementDto("STUDY_DURATION", "17-band", "O'qish davomiyligi", "Masofaviy o'qish davomiyligi kunduzgi shakldan kam bo'lmasligi", RequirementImplementation.IMPLEMENTED, "/admin/programs", listOf("PROGRAMS")),
            Decision559RequirementDto("ORIENTATION", "21-band", "LMS bilan boshlang'ich tanishtirish", "O'zbekiston fuqarosi bo'lgan masofaviy talabaning shaxsan qatnashuvi va LMS yo'riqnomasini qabul qilishi; xorijiy fuqaro istisnosi", implementation("ORIENTATION_SESSIONS", "ORIENTATION_ACKS"), "/admin/orientations", listOf("ORIENTATION_SESSIONS", "ORIENTATION_ACKS")),
            Decision559RequirementDto("PRACTICE", "23-band", "Talaba amaliyoti", "Amaliyotni o'quv rejasidagi muddatda mos ish joyi yoki OTM kelishgan tashkilotda o'tkazish", implementation("PRACTICE_PLACEMENTS"), "/admin/practices", listOf("PRACTICE_PLACEMENTS")),
            Decision559RequirementDto("CURRICULUM", "19-band", "O'quv reja va dastur normativ asosi", "Curriculumni davlat yoki kasbiy standart hamda malaka talablari asosida versiyalash va tasdiqlash", implementation("CURRICULA"), "/admin/study-plans", listOf("CURRICULA")),
            Decision559RequirementDto("STUDENT_LIFECYCLE", "12-band", "Talabalar harakati", "Qabul, o'qishni to'xtatish, ko'chirish, qayta tiklash va chetlashtirishni buyruq hamda audit bilan yuritish", implementation("STUDENT_LIFECYCLE"), "/admin/students", listOf("STUDENT_LIFECYCLE")),
            Decision559RequirementDto("ADMISSION_POLICY", "15-band", "Qabul parametrlari va kontrakt", "OTM turiga mos vakolatli organ tasdiqlagan yillik qabul parametri va to'lov-kontrakt qiymati", implementation("ADMISSION_POLICIES"), "/admin/admission-policies", listOf("ADMISSION_POLICIES")),
            Decision559RequirementDto("NON_STATE_LICENSE", "16-band", "Nodavlat OTM litsenziya qamrovi", "Masofaviy bakalavriat yo'nalishi yoki magistratura mutaxassisligi amaldagi tekshirilgan litsenziyada qayd etilishi", if (evidence.status("NON_STATE_LICENSES") == ComplianceStatus.COMPLIANT) RequirementImplementation.IMPLEMENTED else RequirementImplementation.PARTIAL, "/admin/non-state-licenses", listOf("NON_STATE_LICENSES")),
            Decision559RequirementDto("ASSESSMENT_LEAVE", "22-band", "Ishlaydigan talabaning haq saqlanadigan ta'tili", "Yakuniy baholash, davlat attestatsiyasi yoki bitiruv/magistrlik himoyasi uchun kamida 15 kalendar kun ish haqi saqlangan ta'til dalili", implementation("ASSESSMENT_LEAVES"), "/admin/assessment-leaves", listOf("ASSESSMENT_LEAVES")),
            Decision559RequirementDto("FOREIGN_TEACHERS", "25-band", "Xorijiy pedagoglarni jalb qilish", "Masofadan dars olib boradigan xorijiy pedagogni fuqarolik, malaka, shartnoma, buyruq va kurs dalili bilan jalb qilish imkoniyati", RequirementImplementation.IMPLEMENTED, "/admin/foreign-teacher-engagements", listOf("FOREIGN_TEACHERS")),
            Decision559RequirementDto("ACCOUNTABILITY", "33-band", "Qonuniy javobgarlik bo'yicha tashqi qaror", "LMS aybdorlikni aniqlamaydi; nomuvofiqlik dalil paketini vakolatli organga yo'llaydi va faqat uning hujjatlashtirilgan qarorini qayd etadi", RequirementImplementation.IMPLEMENTED, "/admin/accountability-referrals", listOf("ACCOUNTABILITY_DECISIONS")),
            Decision559RequirementDto("PROHIBITED_PROGRAMS", "14-band", "Masofaviy shakl mumkin bo'lmagan yo'nalishlar", "Vakolatli vazirlik har yili 1-aprelgacha e'lon qilgan ro'yxatni versiyalash va ro'yxatdagi kod bo'yicha dastur, qabul siyosati hamda qabulni bloklash", RequirementImplementation.IMPLEMENTED, "/admin/distance-program-restrictions", listOf("PROHIBITED_PROGRAM_CATALOG")),
            Decision559RequirementDto("TEACHING", "11-band", "O'qitishni boshqarish", "Kredit, jadval, konsultatsiya, imtihon va o'zlashtirishni boshqarish", implementation("LEARNING_SESSIONS", "ASSESSMENTS"), "/teaching", listOf("LEARNING_SESSIONS", "ASSESSMENTS")),
            Decision559RequirementDto("STATISTICS", "11, 28-31-bandlar", "Statistika va monitoring", "Kontingent, o'zlashtirish, kontent va talaba harakati bo'yicha hisobot", implementation("AUDIT_LOGS"), "/statistics", listOf("AUDIT_LOGS")),
            Decision559RequirementDto("ASSESSMENT", "11, 21, 24-bandlar", "Bilim nazorati", "Yakuniy nazoratda fuqarolikka mos shaxsan davomat snapshoti, baho va testologiya talablari", implementation("QUIZZES", "ASSESSMENTS"), "/exams", listOf("QUIZZES", "ASSESSMENTS")),
            Decision559RequirementDto("ATTESTATION", "21-band", "Davlat attestatsiyasi", "Mahalliy talaba uchun shaxsan qatnashuv tasdig'i, xorijiy fuqaro istisnosi, komissiya qarori, protokol va sertifikat", implementation("ATTESTATIONS", "CERTIFICATES"), "/teacher/attestations", listOf("ATTESTATIONS", "CERTIFICATES")),
            Decision559RequirementDto("UAT_ACCEPTANCE", "Production", "Yakuniy qabul dalillari", "27 band bo'yicha mustaqil review, xususiy SHA-256 dalil fayllari va imzolangan yakuniy protokol", implementation("UAT_ACCEPTANCE_RUNS"), "/admin/compliance-559", listOf("UAT_ACCEPTANCE_RUNS")),
            Decision559RequirementDto("FEEDBACK", "28-30-bandlar", "Sifat monitoringi", "Anonim so'rov, fokus-guruh, intervyu, kuzatuv va hujjat tahlilining agregat dalillari", implementation("SURVEYS", "QUALITY_STUDIES"), "/admin/quality-monitoring", listOf("SURVEYS", "QUALITY_STUDIES")),
            Decision559RequirementDto("INTEGRATION", "29-band", "Davlat monitoringi", "Vazirlik va ta'lim sifatini nazorat qilish axborot tizimlari bilan integratsiya", RequirementImplementation.PARTIAL, "/admin/integrations", listOf("INTEGRATION_OUTBOX", "HEMIS_SYNC_RUNS", "EXTERNAL_INTEGRATIONS")),
        )
    }

    private fun evidence(
        nonStatePolicies: List<DistanceAdmissionPolicy> = admissionPolicyRepository.findAllByInstitutionGovernanceTypeAndStatusAndDeletedFalse(
            InstitutionGovernanceType.NON_STATE, AdmissionPolicyStatus.APPROVED,
        ),
        onDate: LocalDate = LocalDate.now(),
    ): List<ComplianceEvidenceDto> {
        fun item(code: String, label: String, count: Long, unit: String, source: String, route: String?, missingStatus: ComplianceStatus = ComplianceStatus.WARNING) = ComplianceEvidenceDto(
            code, label, count, unit, source, route, if (count > 0) ComplianceStatus.COMPLIANT else missingStatus,
        )
        val effectiveLicenseScopes = licenseScopeRepository.countEffectiveCoverages(NonStateLicenseStatus.VERIFIED, onDate)
        val allNonStatePoliciesCovered = nonStatePolicies.all { policy ->
            licenseScopeRepository.existsEffectiveCoverage(requireNotNull(policy.program.id), NonStateLicenseStatus.VERIFIED, onDate)
        }
        val restrictionYear = if (onDate.isBefore(LocalDate.of(onDate.year, 4, 1))) maxOf(2022, onDate.year - 1) else onDate.year
        val restrictionCatalog = restrictionCatalogRepository.findFirstByCatalogYearAndStatusAndDeletedFalse(
            restrictionYear, DistanceRestrictionCatalogStatus.PUBLISHED,
        )
        val officialSiteCoverage = officialSitePublicationService.currentCoverage(onDate).size.toLong()
        val contentStandardCoverage = contentStandardService.coverage(onDate)
        val distancePrograms = programRepository.findAllByDistanceEnabledTrue()
        val fullTimeCounterpartCount = distancePrograms.count { program ->
            Decision559Rules.isFullTimeCounterpartCompliant(
                program.distanceEnabled,
                program.informationTechnologyProgram,
                program.fullTimeAvailable,
                program.fullTimeBasisReference,
            )
        }.toLong()
        return listOf(
            item("ACTIVE_USERS", "Faol foydalanuvchilar", userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE), "foydalanuvchi", "users", "/admin/users"),
            item("COURSES", "Kurslar", courseRepository.countByDeletedFalse(), "kurs", "courses", "/admin/courses"),
            item("PROGRAMS", "Ta'lim dasturlari va normativ davomiylik", programRepository.countByDeletedFalse(), "dastur", "programs.full_time_duration_months / distance_duration_months", "/admin/programs"),
            ComplianceEvidenceDto(
                "FULL_TIME_COUNTERPARTS", "3-band bo'yicha kunduzgi shakl asosi mavjud masofaviy dasturlar",
                fullTimeCounterpartCount, "dastur", "programs.full_time_available / full_time_basis_reference",
                "/admin/programs", if (fullTimeCounterpartCount == distancePrograms.size.toLong()) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            item("SCORM_PACKAGES", "SCORM paketlari", scormPackageRepository.countByDeletedFalse(), "paket", "scorm_packages", "/courses"),
            item("LEARNING_EVENTS", "O'quv faolligi", learningActivityEventRepository.countByDeletedFalse(), "hodisa", "learning_activity_events", "/attendance"),
            item("ASSIGNMENTS", "Topshiriqlar", assignmentRepository.countByDeletedFalse(), "topshiriq", "course_assignments", "/teacher/assignments"),
            item("QUIZZES", "Testlar", quizRepository.countByDeletedFalse(), "test", "course_quizzes", "/teacher/tests"),
            item("LEARNING_SESSIONS", "Mashg'ulotlar", learningSessionRepository.countByDeletedFalse(), "mashg'ulot", "course_learning_sessions", "/teacher/sessions"),
            item("ASSESSMENTS", "Yakunlangan nazoratlar", examSessionRepository.findAllByStatusAndDeletedFalseOrderByExamDateAsc(ExamSessionStatus.COMPLETED).size.toLong(), "nazorat", "exam_sessions", "/teacher/exams"),
            item("ATTESTATIONS", "Yakunlangan attestatsiyalar", attestationSessionRepository.countByStatusAndDeletedFalse(AttestationSessionStatus.COMPLETED), "sessiya", "state_attestation_sessions", "/teacher/attestations"),
            item("ORIENTATION_SESSIONS", "Yakunlangan LMS orientatsiyalari", orientationSessionRepository.countByStatusAndDeletedFalse(LmsOrientationSessionStatus.COMPLETED), "sessiya", "lms_orientation_sessions", "/admin/orientations"),
            item("ORIENTATION_ACKS", "Shaxsan orientatsiya va yo'riqnoma tasdiqlari", orientationAttendeeRepository.countByAcknowledgementAtIsNotNullAndDeletedFalse(), "tasdiq", "lms_orientation_attendees", "/admin/orientations"),
            item("UAT_ACCEPTANCE_RUNS", "Mustaqil tasdiqlangan 559 qabul protokollari", uatRunRepository.countByStatusAndDeletedFalse(Decision559UatRunStatus.APPROVED), "protokol", "decision_559_uat_runs / decision_559_uat_evidence", "/admin/compliance-559"),
            item("PRACTICE_PLACEMENTS", "23-bandga mos tasdiqlangan talaba amaliyotlari", studentPracticeRepository.countByStatusAndDeletedFalse(StudentPracticeStatus.APPROVED) + studentPracticeRepository.countByStatusAndDeletedFalse(StudentPracticeStatus.COMPLETED), "amaliyot", "student_practice_placements", "/admin/practices"),
            item("CURRICULA", "Amaldagi normativ asosli tasdiqlangan curriculum versiyalari", curriculumVersionRepository.countCurrentApproved(CurriculumStatus.APPROVED, LocalDate.now()), "versiya", "program_curriculum_versions / program_curriculum_subjects", "/admin/study-plans"),
            item("STUDENT_LIFECYCLE", "Buyruq va huquqiy asosli talabalar harakati", studentLifecycleEventRepository.count(), "hodisa", "student_lifecycle_events", "/admin/students"),
            item("ADMISSION_POLICIES", "Vakolatli organ tasdiqlagan qabul parametrlari va kontrakt qiymatlari", admissionPolicyRepository.countByStatusAndDeletedFalse(AdmissionPolicyStatus.APPROVED), "siyosat", "distance_admission_policies", "/admin/admission-policies"),
            ComplianceEvidenceDto(
                "NON_STATE_LICENSES", "Nodavlat OTMning litsenziyada qayd etilgan masofaviy dasturlari",
                effectiveLicenseScopes, "qamrov", "non_state_education_licenses / non_state_license_program_scopes",
                "/admin/non-state-licenses", if (allNonStatePoliciesCovered) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            item("ASSESSMENT_LEAVES", "Ish beruvchi bergan kamida 15 kunlik haq saqlanadigan ta'til dalillari", assessmentLeaveEvidenceRepository.countByStatusAndDeletedFalse(AssessmentLeaveStatus.VERIFIED), "dalil", "assessment_leave_evidence", "/admin/assessment-leaves"),
            item("FOREIGN_TEACHERS", "Masofaviy kursga biriktirilgan xorijiy pedagog engagementlari", foreignTeacherEngagementRepository.countByStatusAndDeletedFalse(ForeignTeacherEngagementStatus.VERIFIED), "engagement", "foreign_teacher_engagements / foreign_teacher_engagement_courses", "/admin/foreign-teacher-engagements", ComplianceStatus.COMPLIANT),
            item("ACCOUNTABILITY_DECISIONS", "Vakolatli organ qarori qayd etilgan javobgarlik yo'llanmalari", accountabilityReferralRepository.countByStatusAndDeletedFalse(AccountabilityReferralStatus.DECIDED), "qaror", "compliance_accountability_referrals", "/admin/accountability-referrals", ComplianceStatus.COMPLIANT),
            ComplianceEvidenceDto(
                "PROHIBITED_PROGRAM_CATALOG", "$restrictionYear-yil uchun taqiqlangan masofaviy yo'nalishlar rasmiy katalogi",
                if (restrictionCatalog == null) 0 else 1, "katalog", "distance_program_restriction_catalogs / distance_program_restriction_entries",
                "/admin/distance-program-restrictions",
                if (restrictionCatalog != null && !restrictionCatalog.publicationDate.isAfter(LocalDate.of(restrictionYear, 4, 1))) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            item("CERTIFICATES", "Bitiruv sertifikatlari", certificateRepository.countByDeletedFalse(), "sertifikat", "graduation_certificates", "/teacher/attestations"),
            item("AUDIT_LOGS", "Audit yozuvlari", auditLogRepository.count(), "yozuv", "audit_logs", "/admin/audit-logs"),
            item("NOTIFICATIONS", "Yuborilgan xabarnomalar", notificationRepository.count(), "xabarnoma", "notifications", "/communication"),
            item("CHAT_CONVERSATIONS", "Shaxsiy va guruh chatlari", chatConversationRepository.countByDeletedFalse(), "chat", "chat_conversations", "/communication"),
            item("ANNOUNCEMENTS", "Chop etilgan e'lonlar", announcementRepository.countByStatusAndDeletedFalse(AnnouncementStatus.PUBLISHED), "e'lon", "announcements / announcement_deliveries", "/teacher/announcements"),
            item("VIDEO_CONFERENCE_MEETINGS", "Provider adapteri yaratgan READY videokonferensiyalar", videoConferenceMeetingRepository.countByStatusAndDeletedFalse(VideoConferenceMeetingStatus.READY), "meeting", "video_conference_meetings", "/teacher/sessions", ComplianceStatus.NON_COMPLIANT),
            item("SUPPORT_TICKETS", "Texnik va metodik yordam murojaatlari", supportTicketRepository.countByDeletedFalse(), "murojaat", "support_tickets / support_ticket_events", "/support"),
            item("INTEGRATION_OUTBOX", "Integratsiya outbox va urinishlar auditi", integrationOutboxRepository.countByDeletedFalse(), "event", "integration_outbox_events / integration_attempts", "/admin/integrations"),
            item("HEMIS_SYNC_RUNS", "HEMIS davriy sinxronlash auditi", hemisSyncRunRepository.countByDeletedFalse(), "run", "hemis_sync_runs / hemis_sync_items / hemis_sync_conflicts", "/admin/integrations"),
            item("SURVEYS", "Anonim sifat so'rovlari", surveyRepository.countByDeletedFalse(), "so'rov", "surveys", "/admin/surveys"),
            item("QUALITY_STUDIES", "Tasdiqlangan fokus-guruh, intervyu, kuzatuv va tahlillar", qualityMonitoringStudyRepository.countByStatusAndDeletedFalse(QualityMonitoringStatus.APPROVED), "dalil", "quality_monitoring_studies", "/admin/quality-monitoring"),
            item("PROCTORING_EVIDENCE", "Attemptga bog'langan avtoproktoring dalillari", proctoringSessionRepository.countByAttemptIsNotNullAndDeletedFalse(), "dalil", "proctoring_sessions / proctoring_events", "/exams", ComplianceStatus.NON_COMPLIANT),
            item("BIOMETRIC_POLICY", "Mustaqil tasdiqlangan amaldagi biometrik siyosat", biometricPolicyRepository.countByStatusAndDeletedFalse(BiometricPolicyStatus.PUBLISHED), "siyosat", "biometric_policies", "/admin/biometric-governance", ComplianceStatus.NON_COMPLIANT),
            item("BIOMETRIC_CONSENTS", "Siyosat versiyasi va hashiga bog'langan roziliklar", biometricConsentEventRepository.countByActionAndDeletedFalse(BiometricConsentAction.GRANTED), "rozilik", "biometric_consent_events", "/admin/biometric-governance"),
            ComplianceEvidenceDto(
                "BIOMETRIC_PURGES", "Retention yoki rozilikni qaytarish bo'yicha auditli o'chirishlar",
                biometricPurgeRecordRepository.countByDeletedFalse(), "o'chirish", "biometric_purge_records",
                "/admin/biometric-governance", ComplianceStatus.COMPLIANT,
            ),
            item("INFRASTRUCTURE_READINESS", "8-band bo'yicha mustaqil tekshirilgan infratuzilma readiness profili", infrastructureReadinessRepository.countByStatusAndDeletedFalse(DistanceReadinessStatus.VERIFIED), "profil", "distance_infrastructure_readiness_profiles", "/admin/distance-readiness", ComplianceStatus.NON_COMPLIANT),
            ComplianceEvidenceDto(
                "OFFICIAL_SITE_PUBLICATIONS", "Rasmiy saytdagi amaldagi majburiy axborot toifalari",
                officialSiteCoverage, "toifa", "official_site_publications", "/admin/official-site-publications",
                if (officialSiteCoverage == OfficialSitePublicationCategory.entries.size.toLong()) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            ComplianceEvidenceDto(
                "CONTENT_STANDARD_CHECKLIST", "Amaldagi rasmiy O'zDSt 36.2030 checklist versiyasi",
                if (contentStandardCoverage.checklistEffective) 1 else 0, "checklist", "content_standard_checklists / content_standard_criteria",
                "/admin/content-standard", if (contentStandardCoverage.checklistEffective) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            ComplianceEvidenceDto(
                "CONTENT_STANDARD_COVERAGE", "Amaldagi checklist assessmentidan o'tgan nashrdagi kontent revisionlari",
                contentStandardCoverage.passedContents, "kontent", "content_standard_assessments / content_standard_assessment_responses",
                "/admin/content-standard", if (contentStandardCoverage.complete) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
            ),
            item("EXTERNAL_INTEGRATIONS", "Tashqi monitoring integratsiyalari", 0, "adapter", "integratsiya adapterlari", "/admin/integrations", ComplianceStatus.NON_COMPLIANT),
        )
    }

    private fun List<ComplianceEvidenceDto>.count(code: String) = firstOrNull { it.code == code }?.recordCount ?: 0
    private fun List<ComplianceEvidenceDto>.status(code: String) = firstOrNull { it.code == code }?.status ?: ComplianceStatus.WARNING

    private fun evidenceClause(code: String) = when (code) {
        "CURRICULA" -> "19-band"
        "STUDENT_LIFECYCLE" -> "12-band"
        "ADMISSION_POLICIES" -> "15-band"
        "FULL_TIME_COUNTERPARTS" -> "3-band"
        "NON_STATE_LICENSES" -> "16-band"
        "ASSESSMENT_LEAVES" -> "22-band"
        "FOREIGN_TEACHERS" -> "25-band"
        "ACCOUNTABILITY_DECISIONS" -> "33-band"
        "PROHIBITED_PROGRAM_CATALOG" -> "14-band"
        "PROCTORING_EVIDENCE", "BIOMETRIC_POLICY", "BIOMETRIC_CONSENTS", "BIOMETRIC_PURGES" -> "10-band"
        "INFRASTRUCTURE_READINESS", "OFFICIAL_SITE_PUBLICATIONS" -> "8-band"
        "CONTENT_STANDARD_CHECKLIST", "CONTENT_STANDARD_COVERAGE" -> "9-band"
        "VIDEO_CONFERENCE_MEETINGS" -> "11-band"
        "ORIENTATION_SESSIONS", "ORIENTATION_ACKS" -> "21-band"
        "UAT_ACCEPTANCE_RUNS" -> "Production"
        "PRACTICE_PLACEMENTS" -> "23-band"
        "INTEGRATION_OUTBOX", "HEMIS_SYNC_RUNS", "EXTERNAL_INTEGRATIONS" -> "29-band"
        "SURVEYS", "QUALITY_STUDIES" -> "30-band"
        else -> "10-11, 24, 28-31-bandlar"
    }

    private fun currentAcademicYear(date: LocalDate): String {
        val first = if (date.monthValue >= 9) date.year else date.year - 1
        return "$first-${first + 1}"
    }
}
