package uz.scorm.lms.app.common

import jakarta.persistence.*
import java.io.Serializable

@MappedSuperclass
open class BaseEntity : UserDateAudit(),Serializable {
    companion object {
        private const val serialVersionUID = 1L
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
    
    var deleted: Boolean = false
}
