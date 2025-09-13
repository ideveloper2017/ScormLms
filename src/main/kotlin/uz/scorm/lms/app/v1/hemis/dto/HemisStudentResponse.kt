package uz.scorm.lms.app.v1.hemis.dto

import uz.scorm.lms.app.v1.hemis.model.HemisStudent

class HemisStudentResponse(
    val success: Boolean,
    val error: String?,
    val data: HemisStudent?,
    val code: Int
){

}
