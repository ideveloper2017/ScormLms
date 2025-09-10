package uz.scorm.lms.app.v1.permission.service

import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.permission.model.Permission
import uz.scorm.lms.app.v1.permission.repository.PermissionRepository

@Service
class PermissionService(
    private val permissionRepository: PermissionRepository
) {
    fun create(code: String, name: String): Permission {
        if (permissionRepository.existsByCode(code)) {
            throw IllegalArgumentException("Permission already exists: $code")
        }
        return permissionRepository.save(Permission(code = code, name = name))
    }

    fun getByCode(code: String): Permission =
        permissionRepository.findByCode(code) ?: throw NoSuchElementException("Permission not found: $code")

    fun list(): List<Permission> = permissionRepository.findAll()

    fun deleteByCode(code: String) {
        val p = permissionRepository.findByCode(code)
            ?: throw NoSuchElementException("Permission not found: $code")
        permissionRepository.delete(p)
    }
}
