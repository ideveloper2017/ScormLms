package uz.scorm.lms.app.v1.role.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.role.model.Role

interface RoleRepository : JpaRepository<Role, Long> {
    fun findByName(name: String): Role?
    fun existsByName(name: String): Boolean
}
