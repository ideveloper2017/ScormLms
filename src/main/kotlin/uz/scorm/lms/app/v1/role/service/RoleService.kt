package uz.scorm.lms.app.v1.role.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.permission.repository.PermissionRepository

@Service
class RoleService(
    private val roleRepository: RoleRepository,
    private val permissionRepository: PermissionRepository
) {
    fun create(code: String, name: String): Role {
        val normalized = if (code.startsWith("ROLE_")) code else "ROLE_" + code
        if (roleRepository.existsByCode(normalized)) {
            throw IllegalArgumentException("Role already exists: $normalized")
        }
        return roleRepository.save(Role(code = normalized, name = name))
    }

    @Transactional
    fun addPermissionToRole(roleCode: String, permissionCode: String): Role {
        val role = roleRepository.findByCode(if (roleCode.startsWith("ROLE_")) roleCode else "ROLE_" + roleCode)
            ?: throw NoSuchElementException("Role not found: $roleCode")
        val permission = permissionRepository.findByCode(permissionCode)
            ?: throw NoSuchElementException("Permission not found: $permissionCode")
        role.permissions.add(permission)
        return role
    }

    fun getByCode(code: String): Role =
        roleRepository.findByCode(if (code.startsWith("ROLE_")) code else "ROLE_" + code)
            ?: throw NoSuchElementException("Role not found: $code")

    fun list(): List<Role> = roleRepository.findAll()

    fun deleteByCode(code: String) {
        val role = roleRepository.findByCode(if (code.startsWith("ROLE_")) code else "ROLE_" + code)
            ?: throw NoSuchElementException("Role not found: $code")
        roleRepository.delete(role)
    }
}
