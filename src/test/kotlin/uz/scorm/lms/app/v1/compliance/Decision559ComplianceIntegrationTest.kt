package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.chat.repository.ChatConversationRepository
import uz.scorm.lms.app.v1.announcement.model.AnnouncementStatus
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementRepository
import uz.scorm.lms.app.v1.support.repository.SupportTicketRepository
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStatus
import uz.scorm.lms.app.v1.quality.repository.QualityMonitoringStudyRepository
import uz.scorm.lms.app.v1.student.repository.StudentLifecycleEventRepository
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
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
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import uz.scorm.lms.app.v1.videoconference.repository.VideoConferenceMeetingRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class Decision559ComplianceIntegrationTest {
    @Autowired private lateinit var service: Decision559ComplianceService
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var scormRepository: ScormPackageRepository
    @Autowired private lateinit var activityRepository: LearningActivityEventRepository
    @Autowired private lateinit var chatConversationRepository: ChatConversationRepository
    @Autowired private lateinit var announcementRepository: AnnouncementRepository
    @Autowired private lateinit var supportTicketRepository: SupportTicketRepository
    @Autowired private lateinit var integrationOutboxRepository: IntegrationOutboxRepository
    @Autowired private lateinit var qualityMonitoringStudyRepository: QualityMonitoringStudyRepository
    @Autowired private lateinit var studentLifecycleEventRepository: StudentLifecycleEventRepository
    @Autowired private lateinit var admissionPolicyRepository: DistanceAdmissionPolicyRepository
    @Autowired private lateinit var assessmentLeaveEvidenceRepository: AssessmentLeaveEvidenceRepository
    @Autowired private lateinit var foreignTeacherEngagementRepository: ForeignTeacherEngagementRepository
    @Autowired private lateinit var accountabilityReferralRepository: ComplianceAccountabilityReferralRepository
    @Autowired private lateinit var restrictionCatalogRepository: DistanceProgramRestrictionCatalogRepository
    @Autowired private lateinit var biometricPolicyRepository: BiometricPolicyRepository
    @Autowired private lateinit var biometricConsentEventRepository: BiometricConsentEventRepository
    @Autowired private lateinit var biometricPurgeRecordRepository: BiometricPurgeRecordRepository
    @Autowired private lateinit var proctoringSessionRepository: ProctoringSessionRepository
    @Autowired private lateinit var infrastructureReadinessRepository: DistanceInfrastructureReadinessRepository
    @Autowired private lateinit var videoConferenceMeetingRepository: VideoConferenceMeetingRepository
    @Autowired private lateinit var programRepository: ProgramRepository

    @Test
    fun `compliance dalillari real repository hisoblagichlaridan olinadi`() {
        val summary = service.summary()
        val evidence = summary.evidence.associateBy { it.code }
        assertEquals(courseRepository.countByDeletedFalse(), evidence.getValue("COURSES").recordCount)
        assertEquals(scormRepository.countByDeletedFalse(), evidence.getValue("SCORM_PACKAGES").recordCount)
        assertEquals(activityRepository.countByDeletedFalse(), evidence.getValue("LEARNING_EVENTS").recordCount)
        assertEquals(chatConversationRepository.countByDeletedFalse(), evidence.getValue("CHAT_CONVERSATIONS").recordCount)
        assertEquals(announcementRepository.countByStatusAndDeletedFalse(AnnouncementStatus.PUBLISHED), evidence.getValue("ANNOUNCEMENTS").recordCount)
        assertEquals(supportTicketRepository.countByDeletedFalse(), evidence.getValue("SUPPORT_TICKETS").recordCount)
        assertEquals(integrationOutboxRepository.countByDeletedFalse(), evidence.getValue("INTEGRATION_OUTBOX").recordCount)
        assertEquals(qualityMonitoringStudyRepository.countByStatusAndDeletedFalse(QualityMonitoringStatus.APPROVED), evidence.getValue("QUALITY_STUDIES").recordCount)
        assertEquals(studentLifecycleEventRepository.count(), evidence.getValue("STUDENT_LIFECYCLE").recordCount)
        assertEquals(admissionPolicyRepository.countByStatusAndDeletedFalse(AdmissionPolicyStatus.APPROVED), evidence.getValue("ADMISSION_POLICIES").recordCount)
        assertEquals(assessmentLeaveEvidenceRepository.countByStatusAndDeletedFalse(AssessmentLeaveStatus.VERIFIED), evidence.getValue("ASSESSMENT_LEAVES").recordCount)
        assertEquals(foreignTeacherEngagementRepository.countByStatusAndDeletedFalse(ForeignTeacherEngagementStatus.VERIFIED), evidence.getValue("FOREIGN_TEACHERS").recordCount)
        assertEquals(accountabilityReferralRepository.countByStatusAndDeletedFalse(AccountabilityReferralStatus.DECIDED), evidence.getValue("ACCOUNTABILITY_DECISIONS").recordCount)
        val restrictionYear = if (LocalDate.now().isBefore(LocalDate.of(LocalDate.now().year, 4, 1))) maxOf(2022, LocalDate.now().year - 1) else LocalDate.now().year
        assertEquals(restrictionCatalogRepository.countByCatalogYearAndStatusAndDeletedFalse(restrictionYear, DistanceRestrictionCatalogStatus.PUBLISHED), evidence.getValue("PROHIBITED_PROGRAM_CATALOG").recordCount)
        assertEquals(proctoringSessionRepository.countByAttemptIsNotNullAndDeletedFalse(), evidence.getValue("PROCTORING_EVIDENCE").recordCount)
        assertEquals(biometricPolicyRepository.countByStatusAndDeletedFalse(BiometricPolicyStatus.PUBLISHED), evidence.getValue("BIOMETRIC_POLICY").recordCount)
        assertEquals(biometricConsentEventRepository.countByActionAndDeletedFalse(BiometricConsentAction.GRANTED), evidence.getValue("BIOMETRIC_CONSENTS").recordCount)
        assertEquals(biometricPurgeRecordRepository.countByDeletedFalse(), evidence.getValue("BIOMETRIC_PURGES").recordCount)
        assertEquals(infrastructureReadinessRepository.countByStatusAndDeletedFalse(DistanceReadinessStatus.VERIFIED), evidence.getValue("INFRASTRUCTURE_READINESS").recordCount)
        assertEquals(videoConferenceMeetingRepository.countByStatusAndDeletedFalse(VideoConferenceMeetingStatus.READY), evidence.getValue("VIDEO_CONFERENCE_MEETINGS").recordCount)
        val fullTimeCounterparts = programRepository.findAllByDistanceEnabledTrue().count {
            Decision559Rules.isFullTimeCounterpartCompliant(
                it.distanceEnabled, it.informationTechnologyProgram, it.fullTimeAvailable, it.fullTimeBasisReference,
            )
        }.toLong()
        assertEquals(fullTimeCounterparts, evidence.getValue("FULL_TIME_COUNTERPARTS").recordCount)
        assertTrue(evidence.size >= 19)
        assertTrue(summary.requirements.first { it.code == "COURSES" }.evidenceCodes.contains("COURSES"))
        assertTrue(summary.requirements.first { it.code == "ATTESTATION" }.evidenceCodes.contains("CERTIFICATES"))
        assertTrue(summary.requirements.first { it.code == "FEEDBACK" }.evidenceCodes.contains("SURVEYS"))
        assertTrue(summary.requirements.first { it.code == "FEEDBACK" }.evidenceCodes.contains("QUALITY_STUDIES"))
        assertTrue(summary.requirements.first { it.code == "COMMUNICATION" }.evidenceCodes.contains("CHAT_CONVERSATIONS"))
        assertTrue(summary.requirements.first { it.code == "COMMUNICATION" }.evidenceCodes.contains("ANNOUNCEMENTS"))
        assertTrue(summary.requirements.first { it.code == "COMMUNICATION" }.evidenceCodes.contains("VIDEO_CONFERENCE_MEETINGS"))
        assertTrue(summary.requirements.first { it.code == "SUPPORT" }.evidenceCodes.contains("SUPPORT_TICKETS"))
        assertTrue(summary.requirements.first { it.code == "INTEGRATION" }.evidenceCodes.contains("INTEGRATION_OUTBOX"))
        assertTrue(summary.requirements.first { it.code == "AUTOPROCTOR" }.evidenceCodes.containsAll(listOf("PROCTORING_EVIDENCE", "BIOMETRIC_POLICY", "BIOMETRIC_CONSENTS", "BIOMETRIC_PURGES")))
        assertTrue(summary.requirements.first { it.code == "INFRASTRUCTURE_READINESS" }.evidenceCodes.contains("INFRASTRUCTURE_READINESS"))
        assertTrue(summary.requirements.first { it.code == "STUDENT_LIFECYCLE" }.evidenceCodes.contains("STUDENT_LIFECYCLE"))
        assertTrue(summary.requirements.first { it.code == "ADMISSION_POLICY" }.evidenceCodes.contains("ADMISSION_POLICIES"))
        assertTrue(summary.requirements.first { it.code == "FULL_TIME_COUNTERPART" }.evidenceCodes.contains("FULL_TIME_COUNTERPARTS"))
        assertTrue(summary.requirements.first { it.code == "ASSESSMENT_LEAVE" }.evidenceCodes.contains("ASSESSMENT_LEAVES"))
        assertTrue(summary.requirements.first { it.code == "FOREIGN_TEACHERS" }.evidenceCodes.contains("FOREIGN_TEACHERS"))
        assertEquals(RequirementImplementation.IMPLEMENTED, summary.requirements.first { it.code == "FOREIGN_TEACHERS" }.implementation)
        assertEquals(ComplianceStatus.COMPLIANT, evidence.getValue("FOREIGN_TEACHERS").status)
        assertTrue(summary.requirements.first { it.code == "ACCOUNTABILITY" }.evidenceCodes.contains("ACCOUNTABILITY_DECISIONS"))
        assertEquals(RequirementImplementation.IMPLEMENTED, summary.requirements.first { it.code == "ACCOUNTABILITY" }.implementation)
        assertEquals(ComplianceStatus.COMPLIANT, evidence.getValue("ACCOUNTABILITY_DECISIONS").status)
        assertTrue(summary.requirements.first { it.code == "PROHIBITED_PROGRAMS" }.evidenceCodes.contains("PROHIBITED_PROGRAM_CATALOG"))
        assertEquals(RequirementImplementation.IMPLEMENTED, summary.requirements.first { it.code == "PROHIBITED_PROGRAMS" }.implementation)
        assertEquals(ComplianceStatus.COMPLIANT, evidence.getValue("PROHIBITED_PROGRAM_CATALOG").status)
        assertEquals(RequirementImplementation.PARTIAL, summary.requirements.first { it.code == "INTEGRATION" }.implementation)
        assertTrue(summary.requirements.all { it.evidenceCodes.isNotEmpty() })
        assertEquals(ComplianceStatus.NON_COMPLIANT, evidence.getValue("EXTERNAL_INTEGRATIONS").status)
    }
}
