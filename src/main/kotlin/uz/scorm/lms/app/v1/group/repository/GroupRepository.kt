package uz.scorm.lms.app.v1.group.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.group.model.Group

interface GroupRepository : JpaRepository<Group, Long> {
    fun findAllByProgramId(programId: Long): List<Group>
}
