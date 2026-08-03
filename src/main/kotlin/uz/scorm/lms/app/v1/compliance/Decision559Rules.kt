package uz.scorm.lms.app.v1.compliance

/**
 * Vazirlar Mahkamasining 2022-yil 3-oktabrdagi 559-son qarorida
 * belgilangan masofaviy ta'limning asosiy sonli cheklovlari.
 */
object Decision559Rules {
    const val DECISION_NUMBER = "559"
    const val DECISION_DATE = "2022-10-03"
    const val MAX_STUDENTS_PER_TEACHER = 50
    const val MAX_BACHELOR_ADMISSION = 300
    const val MAX_MASTER_ADMISSION = 30

    fun regulatoryLimit(degreeLevel: String?): Int? = when (degreeLevel?.uppercase()) {
        "BACHELOR" -> MAX_BACHELOR_ADMISSION
        "MASTER" -> MAX_MASTER_ADMISSION
        else -> null
    }

    fun validateProgramSettings(
        degreeLevel: String?,
        distanceEnabled: Boolean,
        informationTechnologyProgram: Boolean,
        requestedLimit: Int?,
        licenseReference: String?,
    ): Int? {
        if (!distanceEnabled) return null
        require(!licenseReference.isNullOrBlank()) {
            "559-son qarorning 17-bandiga ko'ra masofaviy ta'lim uchun litsenziya rekviziti majburiy"
        }
        if (informationTechnologyProgram) return null

        val maximum = regulatoryLimit(degreeLevel)
            ?: throw IllegalArgumentException(
                "559-son qarorga ko'ra masofaviy ta'lim faqat bakalavriat yoki magistratura uchun sozlanadi"
            )
        val effective = requestedLimit ?: maximum
        require(effective in 1..maximum) {
            "Masofaviy qabul limiti $degreeLevel uchun 1..$maximum oralig'ida bo'lishi kerak"
        }
        return effective
    }
}
