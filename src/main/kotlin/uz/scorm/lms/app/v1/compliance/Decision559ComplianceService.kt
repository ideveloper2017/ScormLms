package uz.scorm.lms.app.v1.compliance

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository

@Service
class Decision559ComplianceService(
    private val studentRepository: StudentRepository,
    private val teacherRepository: TeacherRepository,
    private val programRepository: ProgramRepository,
) {
    @Transactional(readOnly = true)
    fun summary(): Decision559ComplianceSummaryDto {
        val distanceStudents = studentRepository.countByEducationFormAndStudentStatus(
            EducationForm.DISTANCE,
            StudentStatus.ACTIVE,
        )
        val activeTeachers = teacherRepository.countByActiveTrue()
        val ratio = if (activeTeachers == 0L) distanceStudents.toDouble() else distanceStudents.toDouble() / activeTeachers

        val programs = programRepository.findAllByDistanceEnabledTrue().map { program ->
            val localStudents = program.id?.let {
                studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                    it,
                    EducationForm.DISTANCE,
                    StudentStatus.ACTIVE,
                    Citizenship.UZBEKISTAN,
                )
            } ?: 0
            val limit = if (program.informationTechnologyProgram) null else
                (program.distanceAdmissionLimit ?: Decision559Rules.regulatoryLimit(program.degreeLevel))
            ProgramComplianceDto(
                programId = requireNotNull(program.id),
                programName = program.name,
                degreeLevel = program.degreeLevel,
                informationTechnologyProgram = program.informationTechnologyProgram,
                localDistanceStudents = localStudents,
                admissionLimit = limit,
                status = if (limit == null || localStudents <= limit) ComplianceStatus.COMPLIANT
                else ComplianceStatus.NON_COMPLIANT,
            )
        }

        val violations = buildList {
            if (distanceStudents > 0 && activeTeachers == 0L) {
                add(ComplianceViolationDto(
                    code = "TEACHER_REQUIRED",
                    clause = "26-band",
                    severity = "CRITICAL",
                    message = "Masofaviy talabalar mavjud, ammo faol o'qituvchi ro'yxatga olinmagan",
                    recommendation = "Masofaviy ta'lim boshlanishidan oldin faol o'qituvchilarni biriktiring",
                ))
            } else if (ratio > Decision559Rules.MAX_STUDENTS_PER_TEACHER) {
                add(ComplianceViolationDto(
                    code = "STUDENT_TEACHER_RATIO",
                    clause = "26-band",
                    severity = "CRITICAL",
                    message = "Bir o'qituvchiga ${"%.1f".format(ratio)} talaba to'g'ri kelmoqda",
                    recommendation = "Nisbatni 1:${Decision559Rules.MAX_STUDENTS_PER_TEACHER} yoki undan past holatga keltiring",
                ))
            }
            programs.filter { it.status == ComplianceStatus.NON_COMPLIANT }.forEach { program ->
                add(ComplianceViolationDto(
                    code = "PROGRAM_ADMISSION_LIMIT",
                    clause = "20-band",
                    severity = "CRITICAL",
                    message = "${program.programName}: ${program.localDistanceStudents} talaba, limit ${program.admissionLimit}",
                    recommendation = "Qabul parametrlarini qarordagi limitga moslashtiring",
                ))
            }
            if (programs.isEmpty()) {
                add(ComplianceViolationDto(
                    code = "NO_DISTANCE_PROGRAM",
                    clause = "3-band",
                    severity = "WARNING",
                    message = "Masofaviy ta'limga ruxsat berilgan yo'nalish sozlanmagan",
                    recommendation = "Yo'nalish kartasida masofaviy ta'lim va litsenziya rekvizitlarini kiriting",
                ))
            }
        }

        val status = when {
            violations.any { it.severity == "CRITICAL" } -> ComplianceStatus.NON_COMPLIANT
            violations.isNotEmpty() -> ComplianceStatus.WARNING
            else -> ComplianceStatus.COMPLIANT
        }

        return Decision559ComplianceSummaryDto(
            overallStatus = status,
            metrics = listOf(
                ComplianceMetricDto(
                    code = "DISTANCE_STUDENTS",
                    label = "Faol masofaviy talabalar",
                    currentValue = distanceStudents.toDouble(),
                    unit = "talaba",
                    status = ComplianceStatus.COMPLIANT,
                ),
                ComplianceMetricDto(
                    code = "ACTIVE_TEACHERS",
                    label = "Faol o'qituvchilar",
                    currentValue = activeTeachers.toDouble(),
                    unit = "o'qituvchi",
                    status = if (distanceStudents == 0L || activeTeachers > 0L) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                ),
                ComplianceMetricDto(
                    code = "STUDENT_TEACHER_RATIO",
                    label = "Bir o'qituvchiga talabalar",
                    currentValue = ratio,
                    limitValue = Decision559Rules.MAX_STUDENTS_PER_TEACHER.toDouble(),
                    unit = "talaba",
                    status = if (ratio <= Decision559Rules.MAX_STUDENTS_PER_TEACHER) ComplianceStatus.COMPLIANT else ComplianceStatus.NON_COMPLIANT,
                ),
            ),
            programs = programs,
            requirements = requirements(),
            violations = violations,
        )
    }

    fun requirements(): List<Decision559RequirementDto> = listOf(
        Decision559RequirementDto("SCORM", "10-band", "LMS va SCORM", "LMS SCORM standartlariga mos bo'lishi", RequirementImplementation.IMPLEMENTED, "/courses"),
        Decision559RequirementDto("AUTOPROCTOR", "10-11-bandlar", "Bilim nazorati", "Imtihonda autentifikatsiya va avtoproktoring", RequirementImplementation.PARTIAL, "/exams"),
        Decision559RequirementDto("USERS", "11-band", "Boshqaruv", "Foydalanuvchilar reestri, rollar, autentifikatsiya va harakatlar jurnali", RequirementImplementation.IMPLEMENTED, "/admin/users"),
        Decision559RequirementDto("ATTENDANCE", "11, 24-bandlar", "Davomat va o'zlashtirish", "Resurslardan foydalanish, davomat, baholar va individual natijalarni hisobga olish", RequirementImplementation.PARTIAL, "/attendance"),
        Decision559RequirementDto("COMMUNICATION", "11-band", "Kommunikatsiya", "Forum, chat, xabar, elektron aloqa va videokonferensiya", RequirementImplementation.PARTIAL, "/communication"),
        Decision559RequirementDto("CONTINGENT", "11-band", "Kontingent", "Talaba va pedagoglarning yagona reestri hamda shaxsiy kabinetlari", RequirementImplementation.IMPLEMENTED, "/contingent"),
        Decision559RequirementDto("COURSES", "11, 18, 24-bandlar", "Kurslarni boshqarish", "Kontent, topshiriq, test, havola, sinxron va asinxron materiallar", RequirementImplementation.PARTIAL, "/courses"),
        Decision559RequirementDto("TEACHING", "11-band", "O'qitishni boshqarish", "Kredit, jadval, konsultatsiya, imtihon va o'zlashtirishni boshqarish", RequirementImplementation.PARTIAL, "/teaching"),
        Decision559RequirementDto("STATISTICS", "11, 28-31-bandlar", "Statistika va monitoring", "Kontingent, o'zlashtirish, kontent va talaba harakati bo'yicha hisobot", RequirementImplementation.PARTIAL, "/statistics"),
        Decision559RequirementDto("ASSESSMENT", "11, 21, 24-bandlar", "Bilim nazorati", "Testologiya talablari asosidagi nazorat bazasi va yakuniy nazorat", RequirementImplementation.PARTIAL, "/exams"),
        Decision559RequirementDto("INTEGRATION", "29-band", "Davlat monitoringi", "Vazirlik va ta'lim sifatini nazorat qilish axborot tizimlari bilan integratsiya", RequirementImplementation.NOT_IMPLEMENTED, "/admin/integrations"),
    )
}
