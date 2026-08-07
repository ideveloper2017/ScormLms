package uz.scorm.lms.app.v1.readiness.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.service.OfficialSitePublicationService
import uz.scorm.lms.app.v1.readiness.dto.DistanceInfrastructureReadinessDto
import uz.scorm.lms.app.v1.readiness.dto.ReviewDistanceInfrastructureReadinessRequest
import uz.scorm.lms.app.v1.readiness.dto.SaveDistanceInfrastructureReadinessRequest
import uz.scorm.lms.app.v1.readiness.model.DistanceInfrastructureReadiness
import uz.scorm.lms.app.v1.readiness.model.DistanceReadinessStatus
import uz.scorm.lms.app.v1.readiness.model.ServerOwnershipType
import uz.scorm.lms.app.v1.readiness.repository.DistanceInfrastructureReadinessRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.net.URI
import java.time.Instant
import java.time.LocalDate

@Service
class DistanceInfrastructureReadinessService(
    private val repository: DistanceInfrastructureReadinessRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    private val publicationService: OfficialSitePublicationService,
) {
    @Transactional(readOnly = true)
    fun list(): List<DistanceInfrastructureReadinessDto> = repository.findAllByDeletedFalseOrderByCreatedAtDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): DistanceInfrastructureReadinessDto = toDto(requireProfile(id))

    @Transactional
    fun create(request: SaveDistanceInfrastructureReadinessRequest, actorId: Long): DistanceInfrastructureReadinessDto {
        validate(request)
        val version = request.versionCode.trim()
        require(!repository.existsByVersionCodeAndDeletedFalse(version)) { "Ushbu infratuzilma readiness versiyasi mavjud" }
        val profile = DistanceInfrastructureReadiness(
            versionCode = version, title = request.title.trim(), internetProvider = request.internetProvider.trim(),
            internetCapacityMbps = request.internetCapacityMbps, internetEvidenceReference = request.internetEvidenceReference.trim(),
            computerFacilityAddress = request.computerFacilityAddress.trim(), sanitationDocumentNumber = request.sanitationDocumentNumber.trim(),
            sanitationDocumentDate = request.sanitationDocumentDate, sanitationEvidenceReference = request.sanitationEvidenceReference.trim(),
            technicalStaffCount = request.technicalStaffCount, technicalStaffQualificationReference = request.technicalStaffQualificationReference.trim(),
            plannedDistanceStudents = request.plannedDistanceStudents, serverCapacityStudents = request.serverCapacityStudents,
            serverOwnershipType = request.serverOwnershipType, serverCountryCode = request.serverCountryCode.trim().uppercase(),
            serverLocationAddress = request.serverLocationAddress.trim(), serverDocumentNumber = request.serverDocumentNumber.trim(),
            serverDocumentDate = request.serverDocumentDate, serverEvidenceReference = request.serverEvidenceReference.trim(),
            leaseStartDate = request.leaseStartDate, leaseEndDate = request.leaseEndDate,
            officialWebsiteUrl = canonicalWebsite(request.officialWebsiteUrl), websiteHasCharter = request.websiteHasCharter,
            websiteHasCurricula = request.websiteHasCurricula, websiteHasStaffInformation = request.websiteHasStaffInformation,
            websiteHasAcademicCalendar = request.websiteHasAcademicCalendar, websiteReviewedAt = request.websiteReviewedAt,
            createdByUser = requireUser(actorId),
        )
        val saved = repository.save(profile)
        auditService.logAction("DISTANCE_INFRASTRUCTURE_READINESS_CREATED", actorId, "profile=${saved.id}; version=$version")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveDistanceInfrastructureReadinessRequest, actorId: Long): DistanceInfrastructureReadinessDto {
        val profile = requireProfile(id)
        require(profile.status == DistanceReadinessStatus.DRAFT) { "Faqat DRAFT readiness profili tahrirlanadi" }
        validate(request)
        val version = request.versionCode.trim()
        require(!repository.existsByVersionCodeAndDeletedFalseAndIdNot(version, id)) { "Ushbu infratuzilma readiness versiyasi mavjud" }
        apply(profile, request, version)
        repository.save(profile)
        auditService.logAction("DISTANCE_INFRASTRUCTURE_READINESS_UPDATED", actorId, "profile=$id; version=$version")
        return toDto(profile)
    }

    @Transactional
    fun verify(id: Long, request: ReviewDistanceInfrastructureReadinessRequest, actorId: Long): DistanceInfrastructureReadinessDto {
        val profile = requireProfile(id)
        require(profile.status == DistanceReadinessStatus.DRAFT) { "Faqat DRAFT readiness profili tekshiriladi" }
        require(profile.createdByUser.id != actorId) { "Readiness profili muallifi uni o'zi tasdiqlay olmaydi" }
        require(repository.countByStatusAndDeletedFalse(DistanceReadinessStatus.VERIFIED) == 0L) {
            "Amaldagi readiness profili avval arxivlanishi kerak"
        }
        require(profile.serverCapacityStudents >= profile.plannedDistanceStudents) { "Server quvvati rejalashtirilgan talabalar sonidan kam" }
        require(profile.serverCountryCode == "UZ") { "Server qurilmasi O'zbekiston hududida joylashgan bo'lishi kerak" }
        require(minimumFiveYearLease(profile)) { "Ijaradagi server shartnomasi kamida 5 yilga tuzilgan bo'lishi kerak" }
        require(profile.websiteHasCharter && profile.websiteHasCurricula && profile.websiteHasStaffInformation && profile.websiteHasAcademicCalendar) {
            "Rasmiy saytda ustav/nizom, o'quv reja-dasturlari, pedagoglar va akademik kalendar bo'lishi kerak"
        }
        val missingPublications = OfficialSitePublicationCategory.entries.toSet() - publicationService.currentCoverage()
        require(missingPublications.isEmpty()) {
            "Rasmiy saytda amaldagi tasdiqlangan ommaviy nashrlar to'liq emas: ${missingPublications.joinToString()}"
        }
        require(!profile.sanitationDocumentDate.isAfter(LocalDate.now()) && !profile.serverDocumentDate.isAfter(LocalDate.now())) {
            "Tasdiqlovchi hujjat sanasi kelajakda bo'lmasligi kerak"
        }
        require(!profile.websiteReviewedAt.isAfter(Instant.now())) { "Rasmiy sayt tekshiruv vaqti kelajakda bo'lmasligi kerak" }
        val note = reviewNote(request)
        profile.status = DistanceReadinessStatus.VERIFIED
        profile.verifiedSlot = 1
        profile.reviewedAt = Instant.now()
        profile.reviewedByUser = requireUser(actorId)
        profile.reviewNote = note
        repository.save(profile)
        auditService.logAction("DISTANCE_INFRASTRUCTURE_READINESS_VERIFIED", actorId, "profile=$id; version=${profile.versionCode}; planned=${profile.plannedDistanceStudents}; capacity=${profile.serverCapacityStudents}")
        return toDto(profile)
    }

    @Transactional
    fun reject(id: Long, request: ReviewDistanceInfrastructureReadinessRequest, actorId: Long): DistanceInfrastructureReadinessDto {
        val profile = requireProfile(id)
        require(profile.status == DistanceReadinessStatus.DRAFT) { "Faqat DRAFT readiness profili rad etiladi" }
        require(profile.createdByUser.id != actorId) { "Readiness profili muallifi uni o'zi ko'rib chiqa olmaydi" }
        profile.status = DistanceReadinessStatus.REJECTED
        profile.reviewedAt = Instant.now()
        profile.reviewedByUser = requireUser(actorId)
        profile.reviewNote = reviewNote(request)
        repository.save(profile)
        auditService.logAction("DISTANCE_INFRASTRUCTURE_READINESS_REJECTED", actorId, "profile=$id")
        return toDto(profile)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): DistanceInfrastructureReadinessDto {
        val profile = requireProfile(id)
        require(profile.status == DistanceReadinessStatus.VERIFIED) { "Faqat VERIFIED readiness profili arxivlanadi" }
        profile.status = DistanceReadinessStatus.ARCHIVED
        profile.verifiedSlot = null
        profile.archivedAt = Instant.now()
        profile.archivedByUser = requireUser(actorId)
        repository.save(profile)
        auditService.logAction("DISTANCE_INFRASTRUCTURE_READINESS_ARCHIVED", actorId, "profile=$id; version=${profile.versionCode}")
        return toDto(profile)
    }

    private fun validate(request: SaveDistanceInfrastructureReadinessRequest) {
        text(request.versionCode, "Versiya kodi", 1, 100)
        text(request.title, "Readiness nomi", 5, 500)
        text(request.internetProvider, "Internet provayder", 2, 500)
        require(request.internetCapacityMbps > BigDecimal.ZERO && request.internetCapacityMbps <= BigDecimal("1000000")) { "Internet sig'imi 0 dan katta bo'lishi kerak" }
        text(request.internetEvidenceReference, "Internet dalili", 5, 1000)
        text(request.computerFacilityAddress, "Kompyuter xonasi manzili", 5, 1000)
        text(request.sanitationDocumentNumber, "Sanitariya hujjati raqami", 1, 200)
        text(request.sanitationEvidenceReference, "Sanitariya dalili", 5, 1000)
        require(request.technicalStaffCount in 1..10_000) { "Muhandis-texnik xodimlar soni 1..10000 oralig'ida bo'lishi kerak" }
        text(request.technicalStaffQualificationReference, "Xodimlar malakasi dalili", 5, 1000)
        require(request.plannedDistanceStudents in 1..1_000_000) { "Rejalashtirilgan masofaviy talabalar soni yaroqsiz" }
        require(request.serverCapacityStudents in request.plannedDistanceStudents..1_000_000) { "Server quvvati rejalashtirilgan talabalar sonidan kam bo'lmasligi kerak" }
        require(request.serverCountryCode.trim().uppercase() == "UZ") { "Server O'zbekiston hududida joylashgan bo'lishi kerak" }
        text(request.serverLocationAddress, "Server manzili", 5, 1000)
        text(request.serverDocumentNumber, "Server hujjati raqami", 1, 200)
        text(request.serverEvidenceReference, "Server egalik/ijara dalili", 5, 1000)
        when (request.serverOwnershipType) {
            ServerOwnershipType.OWNED -> require(request.leaseStartDate == null && request.leaseEndDate == null) { "Mulk serveri uchun ijara sanalari kiritilmaydi" }
            ServerOwnershipType.LEASED -> {
                val start = requireNotNull(request.leaseStartDate) { "Ijara boshlanish sanasi majburiy" }
                val end = requireNotNull(request.leaseEndDate) { "Ijara tugash sanasi majburiy" }
                require(!end.isBefore(start.plusYears(5))) { "Server ijara shartnomasi kamida 5 yil bo'lishi kerak" }
            }
        }
        canonicalWebsite(request.officialWebsiteUrl)
    }

    private fun apply(profile: DistanceInfrastructureReadiness, request: SaveDistanceInfrastructureReadinessRequest, version: String) {
        profile.versionCode = version
        profile.title = request.title.trim()
        profile.internetProvider = request.internetProvider.trim()
        profile.internetCapacityMbps = request.internetCapacityMbps
        profile.internetEvidenceReference = request.internetEvidenceReference.trim()
        profile.computerFacilityAddress = request.computerFacilityAddress.trim()
        profile.sanitationDocumentNumber = request.sanitationDocumentNumber.trim()
        profile.sanitationDocumentDate = request.sanitationDocumentDate
        profile.sanitationEvidenceReference = request.sanitationEvidenceReference.trim()
        profile.technicalStaffCount = request.technicalStaffCount
        profile.technicalStaffQualificationReference = request.technicalStaffQualificationReference.trim()
        profile.plannedDistanceStudents = request.plannedDistanceStudents
        profile.serverCapacityStudents = request.serverCapacityStudents
        profile.serverOwnershipType = request.serverOwnershipType
        profile.serverCountryCode = request.serverCountryCode.trim().uppercase()
        profile.serverLocationAddress = request.serverLocationAddress.trim()
        profile.serverDocumentNumber = request.serverDocumentNumber.trim()
        profile.serverDocumentDate = request.serverDocumentDate
        profile.serverEvidenceReference = request.serverEvidenceReference.trim()
        profile.leaseStartDate = request.leaseStartDate
        profile.leaseEndDate = request.leaseEndDate
        profile.officialWebsiteUrl = canonicalWebsite(request.officialWebsiteUrl)
        profile.websiteHasCharter = request.websiteHasCharter
        profile.websiteHasCurricula = request.websiteHasCurricula
        profile.websiteHasStaffInformation = request.websiteHasStaffInformation
        profile.websiteHasAcademicCalendar = request.websiteHasAcademicCalendar
        profile.websiteReviewedAt = request.websiteReviewedAt
    }

    private fun canonicalWebsite(raw: String): String {
        val value = raw.trim()
        val uri = try { URI(value) } catch (_: Exception) { throw IllegalArgumentException("Rasmiy sayt URL yaroqsiz") }
        require(uri.scheme.equals("https", ignoreCase = true) && !uri.host.isNullOrBlank() && uri.userInfo == null) { "Rasmiy sayt aniq HTTPS URL bo'lishi kerak" }
        return uri.normalize().toASCIIString()
    }

    private fun minimumFiveYearLease(profile: DistanceInfrastructureReadiness): Boolean = when (profile.serverOwnershipType) {
        ServerOwnershipType.OWNED -> profile.leaseStartDate == null && profile.leaseEndDate == null
        ServerOwnershipType.LEASED -> profile.leaseStartDate != null && profile.leaseEndDate != null &&
            !profile.leaseEndDate!!.isBefore(profile.leaseStartDate!!.plusYears(5))
    }

    private fun reviewNote(request: ReviewDistanceInfrastructureReadinessRequest): String = request.note.trim().also {
        require(it.length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" }
    }

    private fun text(value: String, label: String, min: Int, max: Int) {
        require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" }
    }

    private fun requireProfile(id: Long) = repository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Infratuzilma readiness profili topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toDto(profile: DistanceInfrastructureReadiness) = DistanceInfrastructureReadinessDto(
        id = requireNotNull(profile.id), versionCode = profile.versionCode, title = profile.title,
        internetProvider = profile.internetProvider, internetCapacityMbps = profile.internetCapacityMbps,
        internetEvidenceReference = profile.internetEvidenceReference, computerFacilityAddress = profile.computerFacilityAddress,
        sanitationDocumentNumber = profile.sanitationDocumentNumber, sanitationDocumentDate = profile.sanitationDocumentDate,
        sanitationEvidenceReference = profile.sanitationEvidenceReference, technicalStaffCount = profile.technicalStaffCount,
        technicalStaffQualificationReference = profile.technicalStaffQualificationReference,
        plannedDistanceStudents = profile.plannedDistanceStudents, serverCapacityStudents = profile.serverCapacityStudents,
        serverOwnershipType = profile.serverOwnershipType, serverCountryCode = profile.serverCountryCode,
        serverLocationAddress = profile.serverLocationAddress, serverDocumentNumber = profile.serverDocumentNumber,
        serverDocumentDate = profile.serverDocumentDate, serverEvidenceReference = profile.serverEvidenceReference,
        leaseStartDate = profile.leaseStartDate, leaseEndDate = profile.leaseEndDate,
        minimumFiveYearLease = minimumFiveYearLease(profile), officialWebsiteUrl = profile.officialWebsiteUrl,
        websiteHasCharter = profile.websiteHasCharter, websiteHasCurricula = profile.websiteHasCurricula,
        websiteHasStaffInformation = profile.websiteHasStaffInformation, websiteHasAcademicCalendar = profile.websiteHasAcademicCalendar,
        websiteReviewedAt = profile.websiteReviewedAt, status = profile.status,
        createdByName = profile.createdByUser.fullName ?: profile.createdByUser.username,
        reviewedAt = profile.reviewedAt, reviewedByName = profile.reviewedByUser?.fullName ?: profile.reviewedByUser?.username,
        reviewNote = profile.reviewNote, archivedAt = profile.archivedAt,
    )
}
