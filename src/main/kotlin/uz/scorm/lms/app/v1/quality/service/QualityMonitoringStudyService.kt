package uz.scorm.lms.app.v1.quality.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.quality.dto.CompleteQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.dto.CreateQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.dto.QualityMonitoringStudyDto
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringMethod
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStatus
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStudy
import uz.scorm.lms.app.v1.quality.repository.QualityMonitoringStudyRepository
import uz.scorm.lms.app.v1.survey.SurveyRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class QualityMonitoringStudyService(
    private val repository: QualityMonitoringStudyRepository,
    private val userRepository: UserRepository,
    private val surveyRepository: SurveyRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<QualityMonitoringStudyDto> =
        repository.findAllByDeletedFalseOrderByStartsAtDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): QualityMonitoringStudyDto = toDto(requireStudy(id))

    @Transactional
    fun create(request: CreateQualityMonitoringStudyRequest, actorId: Long): QualityMonitoringStudyDto {
        validateSchedule(request)
        validateSurvey(request.relatedSurveyId)
        val facilitator = requireUser(request.facilitatorUserId ?: actorId)
        val saved = repository.save(QualityMonitoringStudy(
            method = request.method,
            title = request.title.trim(),
            objective = request.objective.trim(),
            academicYear = request.academicYear,
            startsAt = request.startsAt,
            endsAt = request.endsAt,
            locationDescription = request.locationDescription.trim(),
            populationScope = request.populationScope.trim(),
            relatedSurveyId = request.relatedSurveyId,
            facilitator = facilitator,
        ))
        auditService.logAction(
            "QUALITY_MONITORING_STUDY_CREATED",
            actorId,
            "study=${saved.id}; method=${saved.method}; year=${saved.academicYear}; participantIdentitiesStored=false",
        )
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: CreateQualityMonitoringStudyRequest, actorId: Long): QualityMonitoringStudyDto {
        val study = requireStudy(id)
        require(study.status == QualityMonitoringStatus.DRAFT) { "Faqat DRAFT monitoring tadbiri tahrirlanadi" }
        validateSchedule(request)
        validateSurvey(request.relatedSurveyId)
        study.method = request.method
        study.title = request.title.trim()
        study.objective = request.objective.trim()
        study.academicYear = request.academicYear
        study.startsAt = request.startsAt
        study.endsAt = request.endsAt
        study.locationDescription = request.locationDescription.trim()
        study.populationScope = request.populationScope.trim()
        study.relatedSurveyId = request.relatedSurveyId
        request.facilitatorUserId?.let { study.facilitator = requireUser(it) }
        repository.save(study)
        auditService.logAction("QUALITY_MONITORING_STUDY_UPDATED", actorId, "study=$id; method=${study.method}")
        return toDto(study)
    }

    @Transactional
    fun complete(id: Long, request: CompleteQualityMonitoringStudyRequest, actorId: Long): QualityMonitoringStudyDto {
        val study = requireStudy(id)
        require(study.status == QualityMonitoringStatus.DRAFT) { "Faqat DRAFT monitoring tadbiri yakunlanadi" }
        require(!study.startsAt.isAfter(Instant.now())) { "Monitoring tadbiri boshlanishidan oldin yakunlanmaydi" }
        validateCompletion(study.method, request)
        study.participantCount = request.participantCount
        study.summary = request.summary.trim()
        study.findings = request.findings.trim()
        study.recommendations = request.recommendations.trim()
        study.evidenceReference = request.evidenceReference.trim()
        study.status = QualityMonitoringStatus.COMPLETED
        study.completedAt = Instant.now()
        study.completedBy = requireUser(actorId)
        repository.save(study)
        auditService.logAction(
            "QUALITY_MONITORING_STUDY_COMPLETED",
            actorId,
            "study=$id; method=${study.method}; participants=${study.participantCount}; participantIdentitiesStored=false",
        )
        return toDto(study)
    }

    @Transactional
    fun approve(id: Long, actorId: Long): QualityMonitoringStudyDto {
        val study = requireStudy(id)
        require(study.status == QualityMonitoringStatus.COMPLETED) { "Faqat COMPLETED monitoring dalili tasdiqlanadi" }
        require(!study.evidenceReference.isNullOrBlank() && !study.findings.isNullOrBlank()) {
            "Tasdiqlash uchun dalil rekviziti va topilmalar majburiy"
        }
        study.status = QualityMonitoringStatus.APPROVED
        study.approvedAt = Instant.now()
        study.approvedBy = requireUser(actorId)
        repository.save(study)
        auditService.logAction("QUALITY_MONITORING_STUDY_APPROVED", actorId, "study=$id; evidence=${study.evidenceReference?.take(120)}")
        return toDto(study)
    }

    @Transactional
    fun cancel(id: Long, actorId: Long): QualityMonitoringStudyDto {
        val study = requireStudy(id)
        require(study.status == QualityMonitoringStatus.DRAFT) { "Faqat DRAFT monitoring tadbiri bekor qilinadi" }
        study.status = QualityMonitoringStatus.CANCELLED
        study.cancelledAt = Instant.now()
        study.cancelledBy = requireUser(actorId)
        repository.save(study)
        auditService.logAction("QUALITY_MONITORING_STUDY_CANCELLED", actorId, "study=$id")
        return toDto(study)
    }

    private fun validateSchedule(request: CreateQualityMonitoringStudyRequest) {
        require(request.title.isNotBlank() && request.title.trim().length <= 500) { "Tadbir nomi majburiy va 500 belgidan oshmasligi kerak" }
        require(request.objective.isNotBlank() && request.objective.trim().length <= 2000) { "Monitoring maqsadi majburiy va 2000 belgidan oshmasligi kerak" }
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        require(request.endsAt.isAfter(request.startsAt)) { "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak" }
        require(request.locationDescription.isNotBlank() && request.locationDescription.trim().length <= 500) { "O'tkazish muhiti majburiy" }
        require(request.populationScope.isNotBlank() && request.populationScope.trim().length <= 1000) { "Ishtirokchilar agregat scope'i majburiy" }
    }

    private fun validateCompletion(method: QualityMonitoringMethod, request: CompleteQualityMonitoringStudyRequest) {
        when (method) {
            QualityMonitoringMethod.FOCUS_GROUP -> require(request.participantCount in 3..50) { "Fokus-guruhda 3 dan 50 tagacha ishtirokchi bo'lishi kerak" }
            QualityMonitoringMethod.INTERVIEW -> require(request.participantCount in 1..100) { "Intervyuda 1 dan 100 tagacha ishtirokchi bo'lishi kerak" }
            QualityMonitoringMethod.OBSERVATION,
            QualityMonitoringMethod.DOCUMENT_ANALYSIS -> require(request.participantCount in 0..1000) { "Ishtirokchi soni 0 dan 1000 gacha bo'lishi kerak" }
        }
        require(request.summary.trim().length in 20..10_000) { "Agregat xulosa 20 dan 10000 belgigacha bo'lishi kerak" }
        require(request.findings.trim().length in 20..10_000) { "Topilmalar 20 dan 10000 belgigacha bo'lishi kerak" }
        require(request.recommendations.trim().length in 10..10_000) { "Tavsiyalar 10 dan 10000 belgigacha bo'lishi kerak" }
        require(request.evidenceReference.isNotBlank() && request.evidenceReference.trim().length <= 1000) { "Tekshiriladigan dalil rekviziti majburiy" }
    }

    private fun validateSurvey(id: Long?) {
        if (id != null) require(surveyRepository.findByIdAndDeletedFalse(id) != null) { "Bog'langan anonim so'rov topilmadi: $id" }
    }

    private fun requireStudy(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Sifat monitoringi tadbiri topilmadi: $id")

    private fun requireUser(id: Long) = userRepository.findById(id)
        .orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toDto(study: QualityMonitoringStudy) = QualityMonitoringStudyDto(
        id = requireNotNull(study.id), method = study.method.name, title = study.title,
        objective = study.objective, academicYear = study.academicYear, startsAt = study.startsAt,
        endsAt = study.endsAt, locationDescription = study.locationDescription,
        populationScope = study.populationScope, relatedSurveyId = study.relatedSurveyId,
        facilitatorUserId = requireNotNull(study.facilitator.id),
        facilitatorName = study.facilitator.fullName ?: study.facilitator.username,
        status = study.status.name, participantCount = study.participantCount, summary = study.summary,
        findings = study.findings, recommendations = study.recommendations,
        evidenceReference = study.evidenceReference, completedAt = study.completedAt,
        approvedAt = study.approvedAt, approvedByName = study.approvedBy?.fullName ?: study.approvedBy?.username,
        cancelledAt = study.cancelledAt,
    )
}
