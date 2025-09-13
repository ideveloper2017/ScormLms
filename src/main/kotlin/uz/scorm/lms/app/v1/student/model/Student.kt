//// Student.kt
//package uz.scorm.lms.app.v1.student.model
//
//import jakarta.persistence.*
//import java.math.BigDecimal
//import uz.scorm.lms.app.common.BaseEntity
//
//@Entity
//@Table(name = "students")
//data class Student(
//    @Column(name = "meta_id")
//    val metaId: Long = 0,
//
//    @Column(name = "full_name", nullable = false)
//    val fullName: String,
//
//    @Column(name = "short_name")
//    val shortName: String? = null,
//
//    @Column(name = "first_name")
//    val firstName: String? = null,
//
//    @Column(name = "second_name")
//    val secondName: String? = null,
//
//    @Column(name = "third_name")
//    val thirdName: String? = null,
//
//    @Column
//    val image: String? = null,
//
//    @Column(name = "student_id_number", unique = true)
//    val studentIdNumber: String? = null,
//
//    @Column(name = "birth_date")
//    val birthDate: Long? = null,
//
//    @Column(name = "avg_gpa", precision = 10, scale = 2)
//    val avgGpa: BigDecimal? = null,
//
//    @Column(name = "avg_grade", precision = 10, scale = 2)
//    val avgGrade: BigDecimal? = null,
//
//    @Column(name = "total_credit", precision = 10, scale = 2)
//    val totalCredit: BigDecimal? = null,
//
//    @Embedded
//    val university: University? = null,
//
//    @Embedded
//    val gender: CodeName? = null,
//
//    @Embedded
//    val department: Department? = null,
//
//    @Embedded
//    val specialty: Specialty? = null,
//
//    @Embedded
//    val group: StudentGroup? = null,
//
//    @Embedded
//    val educationYear: CodeName? = null,
//
//    @Embedded
//    val country: CodeName? = null,
//
//    @Embedded
//    val province: CodeName? = null,
//
//    @Embedded
//    val district: CodeName? = null,
//
//    @Embedded
//    val terrain: CodeName? = null,
//
//    @Embedded
//    val citizenship: CodeName? = null,
//
//    @Embedded
//    val semester: Semester? = null,
//
//    @Embedded
//    val level: CodeName? = null,
//
//    @Embedded
//    val educationForm: CodeName? = null,
//
//    @Embedded
//    val educationType: CodeName? = null,
//
//    @Embedded
//    val paymentForm: CodeName? = null,
//
//    @Embedded
//    val studentType: CodeName? = null,
//
//    @Embedded
//    val socialCategory: CodeName? = null,
//
//    @Embedded
//    val accommodation: CodeName? = null,
//
//    @Embedded
//    val studentStatus: CodeName? = null,
//
//    @Column(name = "_curriculum")
//    val curriculum: Long? = null,
//
//    @Column(name = "hash")
//    val hash: String? = null
//) : BaseEntity() {
//    @Embeddable
//    data class University(
//        val code: String? = null,
//        val name: String? = null
//    )
//
//    @Embeddable
//    data class Department(
//        val id: Long? = null,
//        val name: String? = null,
//        val code: String? = null,
//        val parent: Long? = null,
//        val active: Boolean? = null,
//
//        @Embedded
//        val structureType: CodeName? = null,
//
//        @Embedded
//        val localityType: CodeName? = null
//    )
//
//    @Embeddable
//    data class Specialty(
//        val id: Long? = null,
//        val name: String? = null,
//        val code: String? = null
//    )
//
//    @Embeddable
//    data class StudentGroup(
//        val id: Long? = null,
//        val name: String? = null,
//
//        @Embedded
//        val educationLang: CodeName? = null
//    )
//
//    @Embeddable
//    data class Semester(
//        val id: Long? = null,
//        val code: String? = null,
//        val name: String? = null
//    )
//
//    @Embeddable
//    data class CodeName(
//        val code: String? = null,
//        val name: String? = null
//    )
//}
//
//// Common CodeName class for reusable code-name pairs
