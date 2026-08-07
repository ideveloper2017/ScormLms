package uz.scorm.lms.app.v1.disclosure.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.disclosure.dto.OfficialSitePublicationDto
import uz.scorm.lms.app.v1.disclosure.dto.PublicInstitutionDisclosureDto
import uz.scorm.lms.app.v1.disclosure.dto.PublicOfficialSitePublicationDto
import uz.scorm.lms.app.v1.disclosure.dto.ReviewOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.dto.SaveOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublication
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationStatus
import uz.scorm.lms.app.v1.disclosure.repository.OfficialSitePublicationRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class OfficialSitePublicationService(
    private val repository: OfficialSitePublicationRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<OfficialSitePublicationDto> = repository.findAllByDeletedFalseOrderByCategoryAscTitleAscCreatedAtDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): OfficialSitePublicationDto = toDto(requirePublication(id))

    @Transactional(readOnly = true)
    fun publicDisclosure(onDate: LocalDate = LocalDate.now()): PublicInstitutionDisclosureDto {
        val publications = currentPublications(onDate)
        val covered = publications.mapTo(linkedSetOf()) { it.category }
        val missing = OfficialSitePublicationCategory.entries.filterNotTo(linkedSetOf()) { it in covered }
        return PublicInstitutionDisclosureDto(
            generatedAt = Instant.now(), complete = missing.isEmpty(), coveredCategories = covered,
            missingCategories = missing, publications = publications.map(::toPublicDto),
        )
    }

    @Transactional(readOnly = true)
    fun currentCoverage(onDate: LocalDate = LocalDate.now()): Set<OfficialSitePublicationCategory> =
        currentPublications(onDate).mapTo(linkedSetOf()) { it.category }

    @Transactional
    fun create(request: SaveOfficialSitePublicationRequest, actorId: Long): OfficialSitePublicationDto {
        validate(request)
        val slug = canonicalSlug(request.slug)
        val version = request.versionCode.trim()
        require(!repository.existsBySlugAndVersionCodeAndDeletedFalse(slug, version)) { "Ushbu slug va versiyadagi nashr mavjud" }
        val publication = OfficialSitePublication(
            category = request.category, slug = slug, versionCode = version, title = request.title.trim(),
            summary = request.summary.trim(), sourceDocumentNumber = request.sourceDocumentNumber.trim(),
            sourceDocumentDate = request.sourceDocumentDate, sourceReference = request.sourceReference.trim(),
            effectiveFrom = request.effectiveFrom, effectiveTo = request.effectiveTo, createdByUser = requireUser(actorId),
        )
        val saved = repository.save(publication)
        auditService.logAction("OFFICIAL_SITE_PUBLICATION_CREATED", actorId, "publication=${saved.id}; category=${saved.category}; slug=$slug; version=$version")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveOfficialSitePublicationRequest, actorId: Long): OfficialSitePublicationDto {
        val publication = requirePublication(id)
        require(publication.status == OfficialSitePublicationStatus.DRAFT) { "Faqat DRAFT nashr tahrirlanadi" }
        validate(request)
        val slug = canonicalSlug(request.slug)
        val version = request.versionCode.trim()
        require(!repository.existsBySlugAndVersionCodeAndDeletedFalseAndIdNot(slug, version, id)) { "Ushbu slug va versiyadagi nashr mavjud" }
        apply(publication, request, slug, version)
        repository.save(publication)
        auditService.logAction("OFFICIAL_SITE_PUBLICATION_UPDATED", actorId, "publication=$id; category=${publication.category}; slug=$slug; version=$version")
        return toDto(publication)
    }

    @Transactional
    fun publish(id: Long, request: ReviewOfficialSitePublicationRequest, actorId: Long): OfficialSitePublicationDto {
        val publication = requirePublication(id)
        require(publication.status == OfficialSitePublicationStatus.DRAFT) { "Faqat DRAFT nashr chop etiladi" }
        require(publication.createdByUser.id != actorId) { "Nashr muallifi uni o'zi chop eta olmaydi" }
        require(!publication.sourceDocumentDate.isAfter(LocalDate.now())) { "Manba hujjat sanasi kelajakda bo'lmasligi kerak" }
        require(repository.countBySlugAndStatusAndDeletedFalse(publication.slug, OfficialSitePublicationStatus.PUBLISHED) == 0L) {
            "Ushbu slugning amaldagi versiyasi avval arxivlanishi kerak"
        }
        publication.status = OfficialSitePublicationStatus.PUBLISHED
        publication.publishedSlot = 1
        publication.reviewedAt = Instant.now()
        publication.reviewedByUser = requireUser(actorId)
        publication.reviewNote = reviewNote(request)
        repository.save(publication)
        auditService.logAction("OFFICIAL_SITE_PUBLICATION_PUBLISHED", actorId, "publication=$id; category=${publication.category}; slug=${publication.slug}; version=${publication.versionCode}")
        return toDto(publication)
    }

    @Transactional
    fun reject(id: Long, request: ReviewOfficialSitePublicationRequest, actorId: Long): OfficialSitePublicationDto {
        val publication = requirePublication(id)
        require(publication.status == OfficialSitePublicationStatus.DRAFT) { "Faqat DRAFT nashr rad etiladi" }
        require(publication.createdByUser.id != actorId) { "Nashr muallifi uni o'zi ko'rib chiqa olmaydi" }
        publication.status = OfficialSitePublicationStatus.REJECTED
        publication.reviewedAt = Instant.now()
        publication.reviewedByUser = requireUser(actorId)
        publication.reviewNote = reviewNote(request)
        repository.save(publication)
        auditService.logAction("OFFICIAL_SITE_PUBLICATION_REJECTED", actorId, "publication=$id; category=${publication.category}; slug=${publication.slug}")
        return toDto(publication)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): OfficialSitePublicationDto {
        val publication = requirePublication(id)
        require(publication.status == OfficialSitePublicationStatus.PUBLISHED) { "Faqat PUBLISHED nashr arxivlanadi" }
        publication.status = OfficialSitePublicationStatus.ARCHIVED
        publication.publishedSlot = null
        publication.archivedAt = Instant.now()
        publication.archivedByUser = requireUser(actorId)
        repository.save(publication)
        auditService.logAction("OFFICIAL_SITE_PUBLICATION_ARCHIVED", actorId, "publication=$id; category=${publication.category}; slug=${publication.slug}")
        return toDto(publication)
    }

    private fun currentPublications(onDate: LocalDate) = repository
        .findAllByStatusAndDeletedFalseOrderByCategoryAscTitleAsc(OfficialSitePublicationStatus.PUBLISHED)
        .filter { !it.effectiveFrom.isAfter(onDate) && (it.effectiveTo == null || !it.effectiveTo!!.isBefore(onDate)) }

    private fun validate(request: SaveOfficialSitePublicationRequest) {
        canonicalSlug(request.slug)
        text(request.versionCode, "Versiya kodi", 1, 100)
        text(request.title, "Sarlavha", 5, 500)
        text(request.summary, "Ommaviy mazmun", 20, 10_000)
        text(request.sourceDocumentNumber, "Manba hujjat raqami", 1, 200)
        text(request.sourceReference, "Manba havolasi yoki dalili", 5, 1000)
        require(request.effectiveTo == null || !request.effectiveTo.isBefore(request.effectiveFrom)) { "Amal tugash sanasi boshlanish sanasidan oldin bo'lmasligi kerak" }
    }

    private fun apply(publication: OfficialSitePublication, request: SaveOfficialSitePublicationRequest, slug: String, version: String) {
        publication.category = request.category
        publication.slug = slug
        publication.versionCode = version
        publication.title = request.title.trim()
        publication.summary = request.summary.trim()
        publication.sourceDocumentNumber = request.sourceDocumentNumber.trim()
        publication.sourceDocumentDate = request.sourceDocumentDate
        publication.sourceReference = request.sourceReference.trim()
        publication.effectiveFrom = request.effectiveFrom
        publication.effectiveTo = request.effectiveTo
    }

    private fun canonicalSlug(raw: String): String = raw.trim().lowercase().also {
        require(it.length in 3..100 && SLUG.matches(it)) { "Slug 3..100 belgili kichik lotin harfi, raqam va defisdan iborat bo'lishi kerak" }
    }

    private fun reviewNote(request: ReviewOfficialSitePublicationRequest): String = request.note.trim().also {
        require(it.length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" }
    }

    private fun text(value: String, label: String, min: Int, max: Int) {
        require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" }
    }

    private fun requirePublication(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Rasmiy sayt nashri topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }
    private fun visible(publication: OfficialSitePublication, onDate: LocalDate = LocalDate.now()) =
        publication.status == OfficialSitePublicationStatus.PUBLISHED && !publication.effectiveFrom.isAfter(onDate) &&
            (publication.effectiveTo == null || !publication.effectiveTo!!.isBefore(onDate))

    private fun toDto(publication: OfficialSitePublication) = OfficialSitePublicationDto(
        id = requireNotNull(publication.id), category = publication.category, slug = publication.slug,
        versionCode = publication.versionCode, title = publication.title, summary = publication.summary,
        sourceDocumentNumber = publication.sourceDocumentNumber, sourceDocumentDate = publication.sourceDocumentDate,
        sourceReference = publication.sourceReference, effectiveFrom = publication.effectiveFrom, effectiveTo = publication.effectiveTo,
        status = publication.status, currentlyVisible = visible(publication),
        createdByName = publication.createdByUser.fullName ?: publication.createdByUser.username,
        reviewedAt = publication.reviewedAt,
        reviewedByName = publication.reviewedByUser?.fullName ?: publication.reviewedByUser?.username,
        reviewNote = publication.reviewNote, archivedAt = publication.archivedAt,
    )

    private fun toPublicDto(publication: OfficialSitePublication) = PublicOfficialSitePublicationDto(
        category = publication.category, slug = publication.slug, versionCode = publication.versionCode,
        title = publication.title, summary = publication.summary, sourceDocumentNumber = publication.sourceDocumentNumber,
        sourceDocumentDate = publication.sourceDocumentDate, sourceReference = publication.sourceReference,
        effectiveFrom = publication.effectiveFrom, effectiveTo = publication.effectiveTo,
        publishedAt = requireNotNull(publication.reviewedAt),
    )

    private companion object { val SLUG = Regex("[a-z0-9]+(?:-[a-z0-9]+)*") }
}

