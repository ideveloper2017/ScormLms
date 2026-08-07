package uz.scorm.lms.app.v1.restriction.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.restriction.model.DistanceProgramRestrictionCatalog
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus

interface DistanceProgramRestrictionCatalogRepository : JpaRepository<DistanceProgramRestrictionCatalog, Long> {
    @EntityGraph(attributePaths = ["entries"])
    fun findAllByDeletedFalseOrderByCatalogYearDescVersionCodeAsc(): List<DistanceProgramRestrictionCatalog>

    @EntityGraph(attributePaths = ["entries"])
    fun findByIdAndDeletedFalse(id: Long): DistanceProgramRestrictionCatalog?

    fun findFirstByCatalogYearAndStatusAndDeletedFalse(catalogYear: Int, status: DistanceRestrictionCatalogStatus): DistanceProgramRestrictionCatalog?

    fun existsByCatalogYearAndVersionCodeAndDeletedFalse(catalogYear: Int, versionCode: String): Boolean
    fun existsByCatalogYearAndVersionCodeAndDeletedFalseAndIdNot(catalogYear: Int, versionCode: String, id: Long): Boolean
    fun existsByCatalogYearAndStatusAndDeletedFalse(catalogYear: Int, status: DistanceRestrictionCatalogStatus): Boolean
    fun countByCatalogYearAndStatusAndDeletedFalse(catalogYear: Int, status: DistanceRestrictionCatalogStatus): Long
}
