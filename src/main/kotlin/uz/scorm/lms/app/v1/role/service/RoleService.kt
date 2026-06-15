package uz.scorm.lms.app.v1.role.service

import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.role.repository.RoleRepository

@Service
class RoleService(private val roleRepository: RoleRepository) {

    fun create(name: String): Role {
        if (roleRepository.existsByName(name)) {
            throw IllegalArgumentException("Role already exists: $name")
        }
        return roleRepository.save(Role(name = name))
    }

    fun getByName(name: String): Role =
        roleRepository.findByName(name)
            ?: throw NoSuchElementException("Role not found: $name")

    fun list(): List<Role> = roleRepository.findAll()

    fun delete(name: String) {
        val role = roleRepository.findByName(name)
            ?: throw NoSuchElementException("Role not found: $name")
        roleRepository.delete(role)
    }
}
