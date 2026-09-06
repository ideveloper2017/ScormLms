package uz.scorm.lms.app.v1.academicresult.service

import kotlin.math.round

/** The same interim/final rule used by the academic registry and teacher journal. */
object GradeCalculation {
    fun total(interim: Double?, final: Double?): Double? = when {
        interim != null && final != null -> round((interim + final) / 2.0 * 100) / 100
        else -> final ?: interim
    }
}
