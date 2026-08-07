package uz.scorm.lms.app.v1.disclosure.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublication
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationStatus

interface OfficialSitePublicationRepository : JpaRepository<OfficialSitePublication, Long> {
    fun findAllByDeletedFalseOrderByCategoryAscTitleAscCreatedAtDesc(): List<OfficialSitePublication>
    fun findAllByStatusAndDeletedFalseOrderByCategoryAscTitleAsc(status: OfficialSitePublicationStatus): List<OfficialSitePublication>
    fun findByIdAndDeletedFalse(id: Long): OfficialSitePublication?
    fun existsBySlugAndVersionCodeAndDeletedFalse(slug: String, versionCode: String): Boolean
    fun existsBySlugAndVersionCodeAndDeletedFalseAndIdNot(slug: String, versionCode: String, id: Long): Boolean
    fun countBySlugAndStatusAndDeletedFalse(slug: String, status: OfficialSitePublicationStatus): Long
}

