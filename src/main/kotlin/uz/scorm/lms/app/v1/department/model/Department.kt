package uz.scorm.lms.app.v1.department.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity


@Entity
@Table(name = "department")
data class Department(

    @Column(name= "name")
    var name:String,

    @Column(name = "code")
    var code:String,

    @Column(name = "parent")
    var parent:String,

    @Column(name = "active")
    var active:Boolean,

    ): BaseEntity(){

}
