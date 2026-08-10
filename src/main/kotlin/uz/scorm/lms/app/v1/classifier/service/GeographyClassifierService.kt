package uz.scorm.lms.app.v1.classifier.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.dto.*
import uz.scorm.lms.app.v1.classifier.model.CountryClassifier
import uz.scorm.lms.app.v1.classifier.model.DistrictClassifier
import uz.scorm.lms.app.v1.classifier.model.RegionClassifier
import uz.scorm.lms.app.v1.classifier.repository.*
import uz.scorm.lms.app.v1.student.model.Citizenship

data class ResolvedAddress(val regionId: Long?, val regionName: String?, val districtId: Long?, val districtName: String?)
data class ResolvedCitizenship(val countryId: Long?, val countryCode: String?, val citizenship: Citizenship)

@Service
class GeographyClassifierService(
    private val countries: CountryClassifierRepository,
    private val regions: RegionClassifierRepository,
    private val districts: DistrictClassifierRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun listCountries(includeInactive: Boolean = false) = countries.findAllByDeletedFalseOrderBySortOrderAscNameUzAsc()
        .filter { includeInactive || it.active }.map(::countryDto)

    @Transactional(readOnly = true)
    fun listRegions(includeInactive: Boolean = false) = regions.findAllByDeletedFalseOrderBySortOrderAscNameUzAsc()
        .filter { includeInactive || it.active }.map(::regionDto)

    @Transactional(readOnly = true)
    fun listDistricts(regionId: Long, includeInactive: Boolean = false) = districts
        .findAllByRegionIdAndDeletedFalseOrderBySortOrderAscNameUzAsc(regionId)
        .filter { includeInactive || it.active }.map(::districtDto)

    @Transactional(readOnly = true)
    fun resolveCitizenship(countryId: Long?, fallback: Citizenship): ResolvedCitizenship {
        if (countryId == null) {
            val uz = if (fallback == Citizenship.UZBEKISTAN) countries.findByCodeAndDeletedFalse("UZ") else null
            return ResolvedCitizenship(uz?.id, uz?.code, fallback)
        }
        val country = requireCountry(countryId)
        require(country.active) { "Tanlangan mamlakat faol emas" }
        return ResolvedCitizenship(country.id, country.code, if (country.code == "UZ") Citizenship.UZBEKISTAN else Citizenship.OTHER)
    }

    @Transactional(readOnly = true)
    fun resolveAddress(regionId: Long?, districtId: Long?, legacyRegion: String?, legacyDistrict: String?): ResolvedAddress {
        require(districtId == null || regionId != null) { "Tuman tanlansa hudud ham tanlanishi shart" }
        if (regionId == null) return ResolvedAddress(null, legacyRegion?.trim()?.takeIf(String::isNotBlank), null, legacyDistrict?.trim()?.takeIf(String::isNotBlank))
        val region = requireRegion(regionId)
        require(region.active) { "Tanlangan hudud faol emas" }
        val district = districtId?.let {
            districts.findById(it).orElseThrow { NoSuchElementException("Tuman topilmadi: $it") }.also { value ->
                require(!value.deleted && value.active) { "Tanlangan tuman faol emas" }
                require(value.region.id == regionId) { "Tanlangan tuman hududga tegishli emas" }
            }
        }
        return ResolvedAddress(region.id, region.nameUz, district?.id, district?.nameUz)
    }

    @Transactional fun createCountry(req: ClassifierUpsertRequest, actorId: Long) = saveCountry(CountryClassifier("ZZ", "temp"), req, actorId, "CREATED")
    @Transactional fun updateCountry(id: Long, req: ClassifierUpsertRequest, actorId: Long) = saveCountry(requireCountry(id), req, actorId, "UPDATED")
    @Transactional fun createRegion(req: ClassifierUpsertRequest, actorId: Long) = saveRegion(RegionClassifier("TEMP", "temp"), req, actorId, "CREATED")
    @Transactional fun updateRegion(id: Long, req: ClassifierUpsertRequest, actorId: Long) = saveRegion(requireRegion(id), req, actorId, "UPDATED")

    @Transactional
    fun createDistrict(req: DistrictClassifierUpsertRequest, actorId: Long) = saveDistrict(DistrictClassifier("TEMP", "temp", requireRegion(req.regionId)), req, actorId, "CREATED")
    @Transactional
    fun updateDistrict(id: Long, req: DistrictClassifierUpsertRequest, actorId: Long) = saveDistrict(
        districts.findById(id).orElseThrow { NoSuchElementException("Tuman topilmadi: $id") }, req, actorId, "UPDATED")

    private fun saveCountry(value: CountryClassifier, req: ClassifierUpsertRequest, actorId: Long, action: String): ClassifierItemDto {
        val code = req.code.trim().uppercase(); validate(req.name, req.sortOrder)
        require(code.matches(Regex("[A-Z]{2}"))) { "Mamlakat kodi ISO alpha-2 formatida bo'lishi shart" }
        if (value.id != null && value.code == "UZ") {
            require(code == "UZ" && req.active) { "UZ bazaviy mamlakat kodini o'zgartirish yoki faolsizlantirish mumkin emas" }
        }
        countries.findByCodeAndDeletedFalse(code)?.let { require(it.id == value.id) { "Mamlakat kodi band: $code" } }
        value.code = code; value.nameUz = req.name.trim(); value.active = req.active; value.sortOrder = req.sortOrder
        val saved = countries.save(value); auditService.logAction("COUNTRY_CLASSIFIER_$action", actorId, "id=${saved.id}; code=$code")
        return countryDto(saved)
    }

    private fun saveRegion(value: RegionClassifier, req: ClassifierUpsertRequest, actorId: Long, action: String): ClassifierItemDto {
        val code = req.code.trim().uppercase(); validate(req.name, req.sortOrder)
        require(code.matches(Regex("[A-Z0-9-]{2,20}"))) { "Hudud kodi formati noto'g'ri" }
        regions.findByCodeAndDeletedFalse(code)?.let { require(it.id == value.id) { "Hudud kodi band: $code" } }
        value.code = code; value.nameUz = req.name.trim(); value.active = req.active; value.sortOrder = req.sortOrder
        val saved = regions.save(value); auditService.logAction("REGION_CLASSIFIER_$action", actorId, "id=${saved.id}; code=$code")
        return regionDto(saved)
    }

    private fun saveDistrict(value: DistrictClassifier, req: DistrictClassifierUpsertRequest, actorId: Long, action: String): DistrictClassifierDto {
        val code = req.code.trim().uppercase(); validate(req.name, req.sortOrder)
        require(code.matches(Regex("[A-Z0-9-]{2,30}"))) { "Tuman kodi formati noto'g'ri" }
        districts.findByCodeAndDeletedFalse(code)?.let { require(it.id == value.id) { "Tuman kodi band: $code" } }
        value.code = code; value.nameUz = req.name.trim(); value.region = requireRegion(req.regionId); value.active = req.active; value.sortOrder = req.sortOrder
        val saved = districts.save(value); auditService.logAction("DISTRICT_CLASSIFIER_$action", actorId, "id=${saved.id}; code=$code; region=${req.regionId}")
        return districtDto(saved)
    }

    private fun validate(name: String, sortOrder: Int) { require(name.trim().length in 2..150) { "Nomi 2-150 belgi bo'lishi shart" }; require(sortOrder in 0..10000) { "Tartib 0-10000 oralig'ida bo'lishi shart" } }
    private fun requireCountry(id: Long) = countries.findById(id).orElseThrow { NoSuchElementException("Mamlakat topilmadi: $id") }.also { require(!it.deleted) { "Mamlakat topilmadi: $id" } }
    private fun requireRegion(id: Long) = regions.findById(id).orElseThrow { NoSuchElementException("Hudud topilmadi: $id") }.also { require(!it.deleted) { "Hudud topilmadi: $id" } }
    private fun countryDto(v: CountryClassifier) = ClassifierItemDto(requireNotNull(v.id), v.code, v.nameUz, v.active, v.sortOrder, v.managedSource, v.sourceCode, v.sourceVersion)
    private fun regionDto(v: RegionClassifier) = ClassifierItemDto(requireNotNull(v.id), v.code, v.nameUz, v.active, v.sortOrder, v.managedSource, v.sourceCode, v.sourceVersion)
    private fun districtDto(v: DistrictClassifier) = DistrictClassifierDto(requireNotNull(v.id), v.code, v.nameUz, requireNotNull(v.region.id), v.active, v.sortOrder, v.managedSource, v.sourceCode, v.sourceVersion)
}
