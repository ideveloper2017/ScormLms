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

    /** 21-banddagi shaxsan qatnashish talablari xorijiy fuqaroga tatbiq etilmaydi. */
    fun requiresOnsiteParticipation(isForeignCitizen: Boolean): Boolean = !isForeignCitizen

    fun requiresLmsOrientation(isDistanceEducation: Boolean, isForeignCitizen: Boolean): Boolean =
        isDistanceEducation && requiresOnsiteParticipation(isForeignCitizen)

    fun regulatoryLimit(degreeLevel: String?): Int? = when (degreeLevel?.uppercase()) {
        "BACHELOR" -> MAX_BACHELOR_ADMISSION
        "MASTER" -> MAX_MASTER_ADMISSION
        else -> null
    }

    @Suppress("UNUSED_PARAMETER")
    fun validateProgramSettings(
        degreeLevel: String?,
        distanceEnabled: Boolean,
        informationTechnologyProgram: Boolean,
        requestedLimit: Int?,
        licenseReference: String?,
    ): Int? {
        if (!distanceEnabled) return null
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

    fun validateStudyDuration(
        distanceEnabled: Boolean,
        fullTimeDurationMonths: Int?,
        distanceDurationMonths: Int?,
    ) {
        fullTimeDurationMonths?.let {
            require(it in 1..120) { "Kunduzgi ta'lim davomiyligi 1..120 oy oralig'ida bo'lishi kerak" }
        }
        distanceDurationMonths?.let {
            require(it in 1..120) { "Masofaviy ta'lim davomiyligi 1..120 oy oralig'ida bo'lishi kerak" }
        }
        if (!distanceEnabled) return
        val fullTime = requireNotNull(fullTimeDurationMonths) {
            "559-son qarorning 17-bandiga ko'ra kunduzgi ta'lim normativ davomiyligi majburiy"
        }
        val distance = requireNotNull(distanceDurationMonths) {
            "559-son qarorning 17-bandiga ko'ra masofaviy ta'lim davomiyligi majburiy"
        }
        require(distance >= fullTime) {
            "559-son qarorning 17-bandiga ko'ra masofaviy ta'lim davomiyligi kunduzgi ta'limdan kam bo'lmasligi kerak"
        }
    }

    fun isStudyDurationCompliant(
        distanceEnabled: Boolean,
        fullTimeDurationMonths: Int?,
        distanceDurationMonths: Int?,
    ): Boolean = runCatching {
        validateStudyDuration(distanceEnabled, fullTimeDurationMonths, distanceDurationMonths)
    }.isSuccess

    fun validateFullTimeCounterpart(
        distanceEnabled: Boolean,
        informationTechnologyProgram: Boolean,
        fullTimeAvailable: Boolean?,
        fullTimeBasisReference: String?,
    ) {
        if (fullTimeAvailable == true) {
            require(!fullTimeBasisReference.isNullOrBlank()) {
                "Kunduzgi ta'lim shakli mavjudligini tasdiqlovchi buyruq yoki reyestr rekviziti majburiy"
            }
        }
        if (!distanceEnabled || informationTechnologyProgram) return
        require(fullTimeAvailable == true) {
            "559-son qaror ilovasining 3-bandiga ko'ra tegishli kunduzgi ta'lim dasturi mavjud bo'lishi shart"
        }
    }

    fun isFullTimeCounterpartCompliant(
        distanceEnabled: Boolean,
        informationTechnologyProgram: Boolean,
        fullTimeAvailable: Boolean?,
        fullTimeBasisReference: String?,
    ): Boolean = runCatching {
        validateFullTimeCounterpart(
            distanceEnabled,
            informationTechnologyProgram,
            fullTimeAvailable,
            fullTimeBasisReference,
        )
    }.isSuccess
}
