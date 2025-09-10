package uz.scorm.lms.app.v1.hemis.service

import org.springframework.stereotype.Service

@Service
class HemisService {
    data class HemisStudent(
        val hemisId: String,
        val username: String,
        val fullName: String?,
        val email: String?
    )

    // TODO: Replace with real HEMIS API integration (HTTP calls, OAuth, etc.)
    fun fetchStudentByToken(hemisToken: String): HemisStudent {
        // Demo stub: parse or map token to a hemisId and student data
        val hemisId = "HMS-${'$'}{hemisToken.take(8)}"
        val username = "s_${'$'}{hemisToken.takeLast(6)}"
        return HemisStudent(
            hemisId = hemisId,
            username = username,
            fullName = "Hemis Student",
            email = "${'$'}username@example.edu"
        )
    }

    fun fetchStudentById(hemisId: String): HemisStudent {
        // Demo stub
        val username = "s_${'$'}{hemisId.takeLast(6)}"
        return HemisStudent(
            hemisId = hemisId,
            username = username,
            fullName = "Hemis Student",
            email = "${'$'}username@example.edu"
        )
    }
}
