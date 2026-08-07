package uz.scorm.lms.app

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.restriction.model.DistanceProgramRestrictionCatalog
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus
import uz.scorm.lms.app.v1.restriction.repository.DistanceProgramRestrictionCatalogRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Component
@Profile("test")
class DistanceRestrictionTestCatalogSeeder(
    private val repository: DistanceProgramRestrictionCatalogRepository,
    private val userRepository: UserRepository,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        val year = LocalDate.now().year
        if (repository.existsByCatalogYearAndStatusAndDeletedFalse(year, DistanceRestrictionCatalogStatus.PUBLISHED)) return
        val user = userRepository.findByUsername("restriction-test-fixture")
            ?: userRepository.save(User(username = "restriction-test-fixture", password = "test", fullName = "Test fixture"))
        repository.save(DistanceProgramRestrictionCatalog(
            catalogYear = year,
            versionCode = "TEST-EMPTY-$year",
            authorityName = "Test vakolatli organi",
            documentNumber = "TEST-$year",
            documentDate = LocalDate.of(year, 3, 1),
            publicationDate = LocalDate.of(year, 4, 1),
            documentReference = "TEST-ONLY/RESTRICTION-CATALOG-$year",
            scopeNote = "Avtomatik testlar uchun taqiqlangan kodlar mavjud bo'lmagan fixture katalogi",
            status = DistanceRestrictionCatalogStatus.PUBLISHED,
            createdByUser = user,
            publishedAt = Instant.now(),
            publishedByUser = user,
            verificationNote = "Faqat test profilida ishlatiladigan fixture",
        ))
    }
}
