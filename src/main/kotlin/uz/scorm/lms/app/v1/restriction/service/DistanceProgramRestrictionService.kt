package uz.scorm.lms.app.v1.restriction.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.restriction.dto.DistanceProgramRestrictionCatalogDto
import uz.scorm.lms.app.v1.restriction.dto.DistanceProgramRestrictionEntryDto
import uz.scorm.lms.app.v1.restriction.dto.DistanceProgramRestrictionEntryRequest
import uz.scorm.lms.app.v1.restriction.dto.PublishDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.dto.SaveDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.model.DistanceProgramRestrictionCatalog
import uz.scorm.lms.app.v1.restriction.model.DistanceProgramRestrictionEntry
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionDegreeLevel
import uz.scorm.lms.app.v1.restriction.repository.DistanceProgramRestrictionCatalogRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class DistanceProgramRestrictionService(
    private val repository: DistanceProgramRestrictionCatalogRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<DistanceProgramRestrictionCatalogDto> = repository.findAllByDeletedFalseOrderByCatalogYearDescVersionCodeAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): DistanceProgramRestrictionCatalogDto = toDto(requireCatalog(id))

    @Transactional
    fun create(request: SaveDistanceProgramRestrictionCatalogRequest, actorId: Long): DistanceProgramRestrictionCatalogDto {
        validate(request)
        val version = request.versionCode.trim()
        require(!repository.existsByCatalogYearAndVersionCodeAndDeletedFalse(request.catalogYear, version)) {
            "Ushbu yil va versiyadagi taqiqlangan yo'nalishlar katalogi allaqachon mavjud"
        }
        val catalog = DistanceProgramRestrictionCatalog(
            catalogYear = request.catalogYear, versionCode = version, authorityName = request.authorityName.trim(),
            documentNumber = request.documentNumber.trim(), documentDate = request.documentDate,
            publicationDate = request.publicationDate, documentReference = request.documentReference.trim(),
            scopeNote = request.scopeNote.trim(), createdByUser = requireUser(actorId),
        )
        replaceEntries(catalog, request.entries)
        val saved = repository.save(catalog)
        auditService.logAction("DISTANCE_RESTRICTION_CATALOG_CREATED", actorId, "catalog=${saved.id}; year=${saved.catalogYear}; version=${saved.versionCode}; entries=${saved.entries.size}")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveDistanceProgramRestrictionCatalogRequest, actorId: Long): DistanceProgramRestrictionCatalogDto {
        val catalog = requireCatalog(id)
        require(catalog.status == DistanceRestrictionCatalogStatus.DRAFT) { "Faqat DRAFT katalog tahrirlanadi" }
        validate(request)
        val version = request.versionCode.trim()
        require(!repository.existsByCatalogYearAndVersionCodeAndDeletedFalseAndIdNot(request.catalogYear, version, id)) {
            "Ushbu yil va versiyadagi taqiqlangan yo'nalishlar katalogi allaqachon mavjud"
        }
        catalog.catalogYear = request.catalogYear
        catalog.versionCode = version
        catalog.authorityName = request.authorityName.trim()
        catalog.documentNumber = request.documentNumber.trim()
        catalog.documentDate = request.documentDate
        catalog.publicationDate = request.publicationDate
        catalog.documentReference = request.documentReference.trim()
        catalog.scopeNote = request.scopeNote.trim()
        replaceEntries(catalog, request.entries)
        repository.save(catalog)
        auditService.logAction("DISTANCE_RESTRICTION_CATALOG_UPDATED", actorId, "catalog=$id; year=${catalog.catalogYear}; entries=${catalog.entries.size}")
        return toDto(catalog)
    }

    @Transactional
    fun publish(id: Long, request: PublishDistanceProgramRestrictionCatalogRequest, actorId: Long): DistanceProgramRestrictionCatalogDto {
        val catalog = requireCatalog(id)
        require(catalog.status == DistanceRestrictionCatalogStatus.DRAFT) { "Faqat DRAFT katalog e'lon qilinadi" }
        require(catalog.createdByUser.id != actorId) { "Katalog muallifi uni o'zi e'lon qilingan deb tasdiqlay olmaydi" }
        require(!repository.existsByCatalogYearAndStatusAndDeletedFalse(catalog.catalogYear, DistanceRestrictionCatalogStatus.PUBLISHED)) {
            "Ushbu yil uchun e'lon qilingan katalog allaqachon mavjud"
        }
        require(!catalog.publicationDate.isAfter(LocalDate.now())) { "E'lon sanasi kelajakda bo'lmasligi kerak" }
        require(request.verificationNote.trim().length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" }
        catalog.status = DistanceRestrictionCatalogStatus.PUBLISHED
        catalog.publishedAt = Instant.now()
        catalog.publishedByUser = requireUser(actorId)
        catalog.verificationNote = request.verificationNote.trim()
        repository.save(catalog)
        auditService.logAction("DISTANCE_RESTRICTION_CATALOG_PUBLISHED", actorId, "catalog=$id; year=${catalog.catalogYear}; deadlineCompliant=${deadlineCompliant(catalog)}")
        return toDto(catalog)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): DistanceProgramRestrictionCatalogDto {
        val catalog = requireCatalog(id)
        require(catalog.status == DistanceRestrictionCatalogStatus.PUBLISHED) { "Faqat PUBLISHED katalog arxivlanadi" }
        catalog.status = DistanceRestrictionCatalogStatus.ARCHIVED
        catalog.archivedAt = Instant.now()
        catalog.archivedByUser = requireUser(actorId)
        repository.save(catalog)
        auditService.logAction("DISTANCE_RESTRICTION_CATALOG_ARCHIVED", actorId, "catalog=$id; year=${catalog.catalogYear}")
        return toDto(catalog)
    }

    @Transactional(readOnly = true)
    fun requireAllowed(programCode: String?, degreeLevel: String?, distanceEnabled: Boolean, onDate: LocalDate) {
        if (!distanceEnabled) return
        val code = programCode?.trim()?.uppercase()?.takeIf(String::isNotBlank)
            ?: throw IllegalArgumentException("14-band nazorati uchun ta'lim dasturining rasmiy kodi majburiy")
        val degree = try {
            DistanceRestrictionDegreeLevel.valueOf(degreeLevel?.trim()?.uppercase().orEmpty())
        } catch (_: IllegalArgumentException) {
            throw IllegalArgumentException("14-band nazorati faqat BACHELOR yoki MASTER darajasidagi dasturga qo'llanadi")
        }
        val year = requiredCatalogYear(onDate)
        val catalog = repository.findFirstByCatalogYearAndStatusAndDeletedFalse(year, DistanceRestrictionCatalogStatus.PUBLISHED)
            ?: throw IllegalArgumentException("$year-yil uchun 1-aprelgacha e'lon qilinadigan taqiqlangan yo'nalishlar rasmiy katalogi topilmadi")
        val prohibited = catalog.entries.firstOrNull { it.programCode == code && it.degreeLevel == degree }
        require(prohibited == null) {
            "$code - ${prohibited?.programName} masofaviy shaklda joriy etilishi mumkin bo'lmagan yo'nalishlar ro'yxatiga kiritilgan"
        }
    }

    fun requiredCatalogYear(onDate: LocalDate): Int =
        if (onDate.isBefore(LocalDate.of(onDate.year, 4, 1))) maxOf(2022, onDate.year - 1) else onDate.year

    private fun validate(request: SaveDistanceProgramRestrictionCatalogRequest) {
        require(request.catalogYear in 2022..LocalDate.now().year + 1) { "Katalog yili 2022 va keyingi yil oralig'ida bo'lishi kerak" }
        text(request.versionCode, "Versiya kodi", 100, 1)
        text(request.authorityName, "Vakolatli vazirlik nomi", 500, 3)
        text(request.documentNumber, "Hujjat raqami", 200, 1)
        text(request.documentReference, "Rasmiy hujjat yoki e'lon rekviziti", 1000, 5)
        text(request.scopeNote, "Katalog qamrovi izohi", 2000, 10)
        require(!request.documentDate.isAfter(request.publicationDate)) { "Hujjat sanasi e'lon sanasidan keyin bo'lmasligi kerak" }
        val keys = request.entries.map { "${it.programCode.trim().uppercase()}|${it.degreeLevel}" }
        require(keys.distinct().size == keys.size) { "Bir katalogda dastur kodi va darajasi takrorlanmaydi" }
        request.entries.forEach(::validateEntry)
    }

    private fun validateEntry(entry: DistanceProgramRestrictionEntryRequest) {
        text(entry.programCode, "Dastur kodi", 100, 1)
        text(entry.programName, "Dastur nomi", 500, 3)
        text(entry.reason, "Taqiqlash asosi", 1000, 5)
    }

    private fun text(value: String, label: String, max: Int, min: Int) {
        require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" }
    }

    private fun replaceEntries(catalog: DistanceProgramRestrictionCatalog, entries: List<DistanceProgramRestrictionEntryRequest>) {
        catalog.entries.clear()
        catalog.entries += entries.map { entry ->
            DistanceProgramRestrictionEntry(
                catalog = catalog, programCode = entry.programCode.trim().uppercase(), programName = entry.programName.trim(),
                degreeLevel = entry.degreeLevel, reason = entry.reason.trim(),
            )
        }
    }

    private fun requireCatalog(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Taqiqlangan yo'nalishlar katalogi topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }
    private fun deadline(catalog: DistanceProgramRestrictionCatalog) = LocalDate.of(catalog.catalogYear, 4, 1)
    private fun deadlineCompliant(catalog: DistanceProgramRestrictionCatalog) = !catalog.publicationDate.isAfter(deadline(catalog))

    private fun toDto(catalog: DistanceProgramRestrictionCatalog) = DistanceProgramRestrictionCatalogDto(
        id = requireNotNull(catalog.id), catalogYear = catalog.catalogYear, versionCode = catalog.versionCode,
        authorityName = catalog.authorityName, documentNumber = catalog.documentNumber, documentDate = catalog.documentDate,
        publicationDate = catalog.publicationDate, publicationDeadline = deadline(catalog), deadlineCompliant = deadlineCompliant(catalog),
        documentReference = catalog.documentReference, scopeNote = catalog.scopeNote, status = catalog.status,
        entries = catalog.entries.sortedWith(compareBy({ it.degreeLevel.name }, { it.programCode })).map { entry ->
            DistanceProgramRestrictionEntryDto(requireNotNull(entry.id), entry.programCode, entry.programName, entry.degreeLevel, entry.reason)
        },
        createdByName = catalog.createdByUser.fullName ?: catalog.createdByUser.username,
        publishedAt = catalog.publishedAt, publishedByName = catalog.publishedByUser?.fullName ?: catalog.publishedByUser?.username,
        verificationNote = catalog.verificationNote, archivedAt = catalog.archivedAt,
    )
}
