package uz.scorm.lms.app.v1.permission.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.permission.model.Permission

interface PermissionRepository : JpaRepository<Permission, Long> {
    fun findByCode(code: String): Permission?
    fun existsByCode(code: String): Boolean
}
