package uz.scorm.lms.app.v1.academicresult.service

import kotlin.math.round

/** The same interim/final rule used by the academic registry and teacher journal. */
object GradeCalculation {
    fun letterGrade(score: Double, passingScore: Double = 60.0): String = when {
        score < passingScore -> "F"
        score >= 90 -> "A"
        score >= 85 -> "B+"
        score >= 80 -> "B"
        score >= 75 -> "C+"
        score >= 70 -> "C"
        score >= 65 -> "D+"
        score >= 60 -> "D"
        else -> "D"
    }

    fun gpaPoint(score: Double, passingScore: Double = 60.0): Double = when {
        score < passingScore -> 0.0
        score >= 90 -> 4.0
        score >= 85 -> 3.7
        score >= 80 -> 3.3
        score >= 75 -> 3.0
        score >= 70 -> 2.7
        score >= 65 -> 2.3
        score >= 60 -> 2.0
        else -> 2.0
    }

    fun total(interim: Double?, final: Double?): Double? = when {
        interim != null && final != null -> round((interim + final) / 2.0 * 100) / 100
        else -> final ?: interim
    }
}
