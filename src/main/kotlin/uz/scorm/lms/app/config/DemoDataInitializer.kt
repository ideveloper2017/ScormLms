package uz.scorm.lms.app.config

import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicperiod.model.AcademicSemesterDefinition
import uz.scorm.lms.app.v1.academicperiod.model.AcademicYearPeriod
import uz.scorm.lms.app.v1.academicperiod.repository.AcademicSemesterDefinitionRepository
import uz.scorm.lms.app.v1.academicperiod.repository.AcademicYearPeriodRepository
import uz.scorm.lms.app.v1.academicresult.model.RatingSystem
import uz.scorm.lms.app.v1.academicresult.repository.RatingSystemRepository
import uz.scorm.lms.app.v1.courses.model.*
import uz.scorm.lms.app.v1.courses.repository.*
import uz.scorm.lms.app.v1.curriculum.model.*
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.repository.DepartmentRepository
import uz.scorm.lms.app.v1.faculty.model.Faculty
import uz.scorm.lms.app.v1.faculty.repository.FacultyRepository
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.*
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.model.SubjectType
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.subjectcategory.model.SubjectCategory
import uz.scorm.lms.app.v1.subjectcategory.repository.SubjectCategoryRepository
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroup
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroupMembership
import uz.scorm.lms.app.v1.subjectgroup.model.AcademicSubjectGroupTeacherAssignment
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupMembershipRepository
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupRepository
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupTeacherAssignmentRepository
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.university.model.University
import uz.scorm.lms.app.v1.university.model.UniversityLanguage
import uz.scorm.lms.app.v1.university.repository.UniversityRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService
import uz.scorm.lms.app.v1.user.dto.PasswordResetRequest
import java.time.Instant
import java.time.LocalDate

private val demoLogger = KotlinLogging.logger {}

/**
 * Bog'langan, ko'rish va o'rganish uchun mo'ljallangan demo ma'lumotlar.
 *
 * Default holatda o'chirilgan. APP_DEMO_DATA_ENABLED=true berilgandagina ishlaydi.
 * Barcha yozuvlar DEMO markerlari orqali topiladi va mavjud yozuvlar yangilanadi,
 * shuning uchun ilovani qayta ishga tushirish nusxa ma'lumot hosil qilmaydi.
 */
@Component
@Order(100)
@ConditionalOnProperty(prefix = "app.demo", name = ["enabled"], havingValue = "true")
class DemoDataInitializer(
    private val userService: UserService,
    private val userRepository: UserRepository,
    private val universityRepository: UniversityRepository,
    private val facultyRepository: FacultyRepository,
    private val departmentRepository: DepartmentRepository,
    private val programRepository: ProgramRepository,
    private val groupRepository: GroupRepository,
    private val subjectCategoryRepository: SubjectCategoryRepository,
    private val subjectRepository: SubjectRepository,
    private val teacherRepository: TeacherRepository,
    private val studentRepository: StudentRepository,
    private val academicYearRepository: AcademicYearPeriodRepository,
    private val semesterRepository: AcademicSemesterDefinitionRepository,
    private val ratingSystemRepository: RatingSystemRepository,
    private val curriculumRepository: ProgramCurriculumVersionRepository,
    private val curriculumSubjectRepository: ProgramCurriculumSubjectRepository,
    private val subjectGroupRepository: AcademicSubjectGroupRepository,
    private val membershipRepository: AcademicSubjectGroupMembershipRepository,
    private val teacherAssignmentRepository: AcademicSubjectGroupTeacherAssignmentRepository,
    private val courseRepository: CourseRepository,
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
    private val revisionRepository: CourseContentRevisionRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    @param:Value("\${app.seed.teacher-password:}") private val teacherPassword: String,
    @param:Value("\${app.seed.student-password:}") private val studentPassword: String,
    @param:Value("\${app.seed.demo-staff-password:}") private val demoStaffPassword: String,
) : ApplicationRunner {

    @Transactional
    override fun run(args: ApplicationArguments) {
        val teacherUser = demoUser("demo_teacher", teacherPassword, "teacher")
        val studentUser = demoUser("demo_student", studentPassword, "student")
        demoUser("demo_admin", demoStaffPassword, "admin")
        demoUser("demo_metodist", demoStaffPassword, "metodist")
        demoUser("demo_proctor", demoStaffPassword, "proctor")
        demoUser("demo_monitoring", demoStaffPassword, "monitoring")
        if (teacherUser == null || studentUser == null) {
            demoLogger.warn {
                "Demo ma'lumotlar yaratilmadi. demo_teacher/demo_student foydalanuvchilari mavjud bo'lishi yoki " +
                    "APP_SEED_TEACHER_PASSWORD va APP_SEED_STUDENT_PASSWORD berilishi kerak."
            }
            return
        }

        val today = LocalDate.now()
        val academicYear = if (today.monthValue >= 8) "${today.year}-${today.year + 1}" else "${today.year - 1}-${today.year}"
        val academicYearStart = LocalDate.of(academicYear.substringBefore('-').toInt(), 8, 1)
        val academicYearEnd = academicYearStart.plusYears(1).minusDays(1)

        val university = seedUniversity()
        val faculty = seedFaculty()
        val department = seedDepartment(faculty)
        val program = seedProgram(department)
        val studyGroup = seedStudyGroup(program, academicYear)
        val category = seedSubjectCategory()
        val subjects = listOf(
            seedSubject("DEMO-MEX", "Mexanika", 6, SubjectType.PRACTICE, program, category),
            seedSubject("DEMO-AMAL", "Amaliy mashg'ulotlar", 4, SubjectType.PRACTICE, program, category),
            seedSubject("DEMO-LAB", "Laboratoriya mashg'ulotlari", 4, SubjectType.PRACTICE, program, category),
        )

        val teacher = seedTeacher(teacherUser, department, subjects)
        val student = seedStudent(
            studentUser,
            university,
            faculty,
            department,
            program,
            studyGroup,
            academicYear,
            academicYearStart,
        )
        seedAcademicPeriod(academicYear, academicYearStart, academicYearEnd)
        seedSemester()
        val ratingSystem = seedRatingSystem()
        val curriculum = seedCurriculum(program, ratingSystem, teacherUser, academicYear, academicYearStart, academicYearEnd)

        val subjectGroups = subjects.associateWith { subject ->
            val curriculumSubject = seedCurriculumSubject(curriculum, subject)
            seedSubjectGroup(curriculumSubject, teacher, student)
        }

        val courseSpecs = listOf(
            DemoCourseSpec(
                subject = subjects[0],
                title = "Mexanika",
                slug = "demo-mexanika",
                published = true,
                progress = 35,
                topics = listOf(
                    "Kinematika asoslari", "Tekis harakat", "Tezlanish va erkin tushish",
                    "Nyuton qonunlari", "Ish va energiya", "Impuls", "Aylanma harakat",
                ),
            ),
            DemoCourseSpec(
                subject = subjects[1],
                title = "Amaliy mashg'ulotlar",
                slug = "demo-amaliy-mashgulotlar",
                published = true,
                progress = 60,
                topics = listOf("Masalani tahlil qilish", "Formulalarni qo'llash", "Natijani tekshirish"),
            ),
            DemoCourseSpec(
                subject = subjects[2],
                title = "Laboratoriya mashg'ulotlari",
                slug = "demo-laboratoriya-mashgulotlari",
                published = false,
                progress = 0,
                topics = listOf("Xavfsizlik qoidalari", "O'lchash xatoliklari", "Laboratoriya hisoboti"),
            ),
        )
        courseSpecs.forEach { spec ->
            val course = seedCourse(spec, teacherUser, category, subjectGroups.getValue(spec.subject), academicYearStart, academicYearEnd)
            seedCourseLessons(course, spec, teacherUser)
            if (spec.published) seedEnrollment(course, student, academicYear, spec.subject.credits ?: 0, spec.progress)
        }

        demoLogger.info {
            "Demo ma'lumotlar tayyor: demo_teacher, demo_student, ${subjects.size} fan, ${courseSpecs.size} kurs, o'quv yili $academicYear."
        }
    }

    private fun demoUser(username: String, password: String, roleName: String): User? {
        val existing = userRepository.findByUsername(username)
        if (existing != null) {
            if (!existing.role?.name.equals(roleName, ignoreCase = true)) {
                demoLogger.error { "$username akkaunti '$roleName' roliga tegishli emas; xavfsizlik uchun o'zgartirilmadi." }
                return null
            }
            // Development demo akkauntlari har ishga tushishda hujjatlashtirilgan
            // parol bilan kiriladigan holatda qolishi kerak. Aks holda bazada kurslar
            // bo'lsa ham foydalanuvchi student/teacher kabinetiga kira olmaydi.
            if (password.isNotBlank()) {
                userService.resetPassword(requireNotNull(existing.id), PasswordResetRequest(password))
            }
            existing.deleted = false
            existing.status = UserStatus.ACTIVE
            existing.credentialsInitialized = true
            return userRepository.save(existing)
        }
        if (password.isBlank()) return null
        return userService.register(username, password, roleName)
    }

    private fun seedUniversity(): University {
        val name = "[DEMO] Smart Universiteti"
        val university = universityRepository.findByNameIgnoreCaseAndDeletedFalse(name) ?: University(
            name = name,
            rector = "Demo Rektor",
            address = "Toshkent shahri, Universitet ko'chasi, 1-uy",
            defaultLanguage = UniversityLanguage.UZ_LATIN,
            phone = "+998 71 000 00 00",
            bankDetails = "Demo hisob raqami (haqiqiy to'lovlar uchun emas)",
            chiefAccountant = "Demo Bosh hisobchi",
            legalCounsel = "Demo Yuriskonsult",
        )
        university.active = true
        university.deleted = false
        return universityRepository.save(university)
    }

    private fun seedFaculty(): Faculty {
        val faculty = facultyRepository.findAll().firstOrNull { it.code == "DEMO-FIZ" }
            ?: Faculty(name = "Fizika fakulteti", code = "DEMO-FIZ")
        faculty.name = "Fizika fakulteti"
        faculty.active = true
        faculty.deleted = false
        return facultyRepository.save(faculty)
    }

    private fun seedDepartment(faculty: Faculty): Department {
        val department = departmentRepository.findAll().firstOrNull { it.code == "DEMO-FIZ-KAF" }
            ?: Department(name = "Umumiy fizika kafedrasi", code = "DEMO-FIZ-KAF")
        department.faculty = faculty
        department.active = true
        department.deleted = false
        return departmentRepository.save(department)
    }

    private fun seedProgram(department: Department): Program {
        val program = programRepository.findAll().firstOrNull { it.code == "DEMO-60530900" }
            ?: Program(name = "Fizika", code = "DEMO-60530900")
        program.degreeLevel = DegreeLevel.BACHELOR.name
        program.active = true
        program.distanceEnabled = true
        program.educationLanguage = "uz"
        program.distanceAdmissionLimit = 100
        program.distanceDurationMonths = 48
        program.fullTimeDurationMonths = 48
        program.fullTimeAvailable = true
        program.fullTimeBasisReference = "Demo o'quv rejasi"
        program.licenseReference = "DEMO-LICENSE"
        program.department = department
        program.deleted = false
        return programRepository.save(program)
    }

    private fun seedStudyGroup(program: Program, academicYear: String): Group {
        val studyGroup = groupRepository.findAllByProgramId(program.id!!).firstOrNull { it.name == "[DEMO] FIZ-101" }
            ?: Group(name = "[DEMO] FIZ-101", program = program)
        studyGroup.educationYear = academicYear
        studyGroup.language = "uz"
        studyGroup.active = true
        studyGroup.deleted = false
        return groupRepository.save(studyGroup)
    }

    private fun seedSubjectCategory(): SubjectCategory {
        val category = subjectCategoryRepository.findAll().firstOrNull { it.code.equals("DEMO-FIZIKA", true) }
            ?: SubjectCategory(name = "Fizika", code = "DEMO-FIZIKA")
        category.name = "Fizika"
        category.nameEn = "Physics"
        category.nameRu = "Физика"
        category.active = true
        category.deleted = false
        return subjectCategoryRepository.save(category)
    }

    private fun seedSubject(
        code: String,
        name: String,
        credits: Int,
        type: SubjectType,
        program: Program,
        category: SubjectCategory,
    ): Subject {
        val subject = subjectRepository.findAll().firstOrNull { it.code == code } ?: Subject(name = name, code = code)
        subject.name = name
        subject.credits = credits
        subject.subjectType = type
        subject.active = true
        subject.program = program
        subject.subjectCategory = category
        subject.deleted = false
        return subjectRepository.save(subject)
    }

    private fun seedTeacher(user: User, department: Department, subjects: List<Subject>): Teacher {
        val teacher = teacherRepository.findByUserId(user.id!!) ?: Teacher(user = user)
        teacher.fullName = "Demo Fizika O'qituvchisi"
        teacher.phone = "+998 90 111 22 33"
        teacher.email = "demo.teacher@example.invalid"
        teacher.position = "Katta o'qituvchi"
        teacher.department = department
        teacher.active = true
        teacher.deleted = false
        teacher.subjects.addAll(subjects)
        user.fullName = teacher.fullName
        user.email = teacher.email
        user.faculty = department.faculty?.name
        user.direction = programName(department)
        userRepository.save(user)
        return teacherRepository.save(teacher)
    }

    private fun programName(department: Department): String =
        programRepository.findAllByDepartmentId(department.id!!).firstOrNull { it.code == "DEMO-60530900" }?.name ?: "Fizika"

    private fun seedStudent(
        user: User,
        university: University,
        faculty: Faculty,
        department: Department,
        program: Program,
        studyGroup: Group,
        academicYear: String,
        admissionDate: LocalDate,
    ): StudentProfile {
        val student = studentRepository.findByUserId(user.id!!) ?: StudentProfile(
            user = user,
            pinfl = "9001010000001",
            lastName = "Talaba",
            firstName = "Demo",
            birthDate = LocalDate.of(2004, 1, 1),
            gender = Gender.MALE,
            studentNumber = "DEMO-ST-001",
        )
        student.lastName = "Talaba"
        student.firstName = "Demo"
        student.phoneNumber = "+998 90 444 55 66"
        student.email = "demo.student@example.invalid"
        student.universityId = university.id
        student.facultyId = faculty.id
        student.departmentId = department.id
        student.programId = program.id
        student.degreeLevel = DegreeLevel.BACHELOR
        student.educationForm = EducationForm.DISTANCE
        student.educationLanguage = "uz"
        student.courseNumber = 1
        student.semesterNumber = 1
        student.groupId = studyGroup.id
        student.academicYear = academicYear
        student.admissionDate = admissionDate
        student.admissionOrderNumber = "DEMO-001"
        student.studentStatus = StudentStatus.ACTIVE
        student.paymentType = PaymentType.GRANT
        user.fullName = student.fullName
        user.email = student.email
        user.jshshir = student.pinfl
        user.faculty = faculty.name
        user.direction = program.name
        user.groupName = studyGroup.name
        userRepository.save(user)
        return studentRepository.save(student)
    }

    private fun seedAcademicPeriod(code: String, startsOn: LocalDate, endsOn: LocalDate) {
        val period = academicYearRepository.findAll().firstOrNull { it.code == code }
            ?: AcademicYearPeriod(code = code, startsOn = startsOn, endsOn = endsOn)
        period.startsOn = startsOn
        period.endsOn = endsOn
        period.active = true
        period.current = true
        period.deleted = false
        academicYearRepository.save(period)
    }

    private fun seedSemester() {
        val semester = semesterRepository.findAll().firstOrNull { it.semesterNumber == 1 }
            ?: AcademicSemesterDefinition(semesterNumber = 1, nameUz = "1-semestr", courseNumber = 1)
        semester.nameUz = "1-semestr"
        semester.courseNumber = 1
        semester.active = true
        semester.deleted = false
        semesterRepository.save(semester)
    }

    private fun seedRatingSystem(): RatingSystem {
        val rating = ratingSystemRepository.findAll().firstOrNull { it.shortName.equals("DEMO-100", true) }
            ?: RatingSystem(name = "100 ballik demo tizim", shortName = "DEMO-100")
        rating.minScore = 0
        rating.maxScore = 100
        rating.passScore = 60
        rating.active = true
        rating.deleted = false
        return ratingSystemRepository.save(rating)
    }

    private fun seedCurriculum(
        program: Program,
        rating: RatingSystem,
        user: User,
        academicYear: String,
        validFrom: LocalDate,
        validUntil: LocalDate,
    ): ProgramCurriculumVersion {
        val versionCode = "DEMO-$academicYear"
        val curriculum = curriculumRepository.findAll().firstOrNull {
            it.program.id == program.id && it.versionCode == versionCode
        } ?: ProgramCurriculumVersion(
            program = program,
            versionCode = versionCode,
            academicYear = academicYear,
            name = "Fizika demo o'quv rejasi",
            ratingSystem = rating,
            credentialType = CurriculumCredentialType.STATE_DIPLOMA,
            normativeBasisType = CurriculumNormativeBasisType.STATE_EDUCATION_STANDARD,
            standardReference = "Demo davlat ta'lim standarti",
            qualificationRequirementsReference = "Demo malaka talablari",
            validFrom = validFrom,
            validUntil = validUntil,
            createdByUser = user,
        )
        curriculum.academicYear = academicYear
        curriculum.active = true
        curriculum.educationLanguage = "uz"
        curriculum.passingScore = 60
        curriculum.baseCreditAmount = 60
        curriculum.educationForm = EducationForm.DISTANCE
        curriculum.ratingSystem = rating
        curriculum.semesterCount = 8
        curriculum.validFrom = validFrom
        curriculum.validUntil = validUntil
        curriculum.status = CurriculumStatus.APPROVED
        curriculum.approvalOrderNumber = "DEMO-ORDER-001"
        curriculum.approvalOrderDate = validFrom
        curriculum.approvedAt = Instant.now()
        curriculum.approvedByUser = user
        curriculum.deleted = false
        return curriculumRepository.save(curriculum)
    }

    private fun seedCurriculumSubject(curriculum: ProgramCurriculumVersion, subject: Subject): ProgramCurriculumSubject {
        val curriculumSubject = curriculumSubjectRepository.findAll()
            .filter { it.curriculumVersion.id == curriculum.id }
            .firstOrNull { it.subject?.id == subject.id }
            ?: ProgramCurriculumSubject(
                curriculumVersion = curriculum,
                subject = subject,
                subjectCodeSnapshot = subject.code!!,
                subjectNameSnapshot = subject.name,
                creditsSnapshot = subject.credits ?: 0,
                semester = 1,
                planItemType = CurriculumPlanItemType.REQUIRED,
            )
        curriculumSubject.subjectCodeSnapshot = subject.code!!
        curriculumSubject.subjectNameSnapshot = subject.name
        curriculumSubject.creditsSnapshot = subject.credits ?: 0
        curriculumSubject.semester = 1
        curriculumSubject.planItemType = CurriculumPlanItemType.REQUIRED
        curriculumSubject.deleted = false
        return curriculumSubjectRepository.save(curriculumSubject)
    }

    private fun seedSubjectGroup(
        curriculumSubject: ProgramCurriculumSubject,
        teacher: Teacher,
        student: StudentProfile,
    ): AcademicSubjectGroup {
        val code = "${curriculumSubject.subjectCodeSnapshot}-01"
        val subjectGroup = subjectGroupRepository.findAll().firstOrNull {
            it.curriculumSubject.id == curriculumSubject.id && it.code.equals(code, true)
        } ?: AcademicSubjectGroup(
            curriculumSubject = curriculumSubject,
            code = code,
            name = "${curriculumSubject.subjectNameSnapshot} — 1-guruh",
        )
        subjectGroup.name = "${curriculumSubject.subjectNameSnapshot} — 1-guruh"
        subjectGroup.capacity = 30
        subjectGroup.active = true
        subjectGroup.deleted = false
        val savedGroup = subjectGroupRepository.save(subjectGroup)

        val assignment = teacherAssignmentRepository.findBySubjectGroupIdAndTeacherId(savedGroup.id!!, teacher.id!!)
            ?: AcademicSubjectGroupTeacherAssignment(subjectGroup = savedGroup, teacher = teacher)
        assignment.active = true
        teacherAssignmentRepository.save(assignment)

        if (membershipRepository.findBySubjectGroupIdAndStudentId(savedGroup.id!!, student.id!!) == null) {
            membershipRepository.save(
                AcademicSubjectGroupMembership(
                    subjectGroup = savedGroup,
                    curriculumSubject = curriculumSubject,
                    student = student,
                ),
            )
        }
        return savedGroup
    }

    private fun seedCourse(
        spec: DemoCourseSpec,
        teacherUser: User,
        category: SubjectCategory,
        subjectGroup: AcademicSubjectGroup,
        startsOn: LocalDate,
        endsOn: LocalDate,
    ): Course {
        val course = courseRepository.findAll().filter { it.userId == teacherUser.id }
            .firstOrNull { it.slug == spec.slug } ?: Course(slug = spec.slug, userId = teacherUser.id)
        course.title = "[DEMO] ${spec.title}"
        course.shortDescription = "${spec.title} bo'yicha asosiy tushunchalar va amaliy misollar."
        course.description = "Ushbu demo kurs mavzular, matnli darslar va talaba progressi qanday ishlashini ko'rsatadi."
        course.requirements = "Maktab fizika va matematika asoslarini bilish."
        course.outcomes = "Nazariy tushunchalarni izohlash; formulalarni amaliy masalalarda qo'llash."
        course.status = if (spec.published) CourseStatus.PUBLISHED.name else CourseStatus.DRAFT.name
        course.publishedAt = if (spec.published) Instant.now() else null
        course.subject = spec.subject
        course.subjectName = spec.subject.name
        course.subjectGroup = subjectGroup
        course.groupName = subjectGroup.name
        course.categoryId = category.id
        course.level = "BEGINNER"
        course.language = "uz"
        course.courseType = "FREE"
        course.isPaid = 0
        course.price = 0.0
        course.startDate = startsOn
        course.endDate = endsOn
        course.expiryPeriodType = CourseExpiryPeriodType.LIFETIME.name
        course.dripContent = false
        course.metaKeywords = "fizika, ${spec.title.lowercase()}, demo kurs"
        course.metaDescription = course.shortDescription
        course.instructorIds = teacherUser.id.toString()
        course.deleted = false
        return courseRepository.save(course)
    }

    private fun seedCourseLessons(course: Course, spec: DemoCourseSpec, teacherUser: User) {
        val existingModules = moduleRepository.findAll().filter { it.course.id == course.id }
        spec.topics.forEachIndexed { index, topic ->
            val position = index + 1
            val module = existingModules.firstOrNull { it.position == position }
                ?: CourseModule(course = course, title = topic, position = position)
            module.title = "$position. MAVZU — $topic"
            module.description = "$topic bo'yicha nazariy va amaliy material."
            module.status = if (spec.published) LearningItemStatus.PUBLISHED.name else LearningItemStatus.DRAFT.name
            module.publishedAt = if (spec.published) Instant.now() else null
            module.deleted = false
            val savedModule = moduleRepository.save(module)

            val content = contentRepository.findAll().filter { it.module.id == savedModule.id }
                .firstOrNull { it.position == 1 } ?: CourseContent(
                module = savedModule,
                title = topic,
                contentType = CourseContentType.TEXT,
                languageCode = "uz-Latn",
                authorName = "Demo Fizika O'qituvchisi",
                contentVersion = "1.0",
                sourceName = "SCORM LMS demo materiali",
                validFrom = course.startDate ?: LocalDate.now(),
                metadataUpdatedAt = Instant.now(),
            )
            content.title = "$topic: qisqacha dars"
            content.description = "$topic mavzusining muhim qoidalari."
            content.contentType = CourseContentType.TEXT
            content.contentBody = demoLessonBody(topic, position)
            content.durationMinutes = 15
            content.status = if (spec.published) LearningItemStatus.PUBLISHED.name else LearningItemStatus.DRAFT.name
            content.publishedAt = if (spec.published) Instant.now() else null
            content.languageCode = "uz-Latn"
            content.authorName = "Demo Fizika O'qituvchisi"
            content.contentVersion = "1.0"
            content.sourceName = "SCORM LMS demo materiali"
            content.validFrom = course.startDate ?: LocalDate.now()
            content.validUntil = course.endDate
            content.metadataUpdatedAt = Instant.now()
            content.reviewStatus = if (spec.published) ContentReviewStatus.APPROVED.name else ContentReviewStatus.DRAFT.name
            content.approvedRevisionNumber = if (spec.published) 1 else null
            content.deleted = false
            val savedContent = contentRepository.save(content)

            val revision = revisionRepository.findAll().firstOrNull {
                it.content.id == savedContent.id && it.revisionNumber == 1
            } ?: CourseContentRevision(
                content = savedContent,
                revisionNumber = 1,
                title = savedContent.title,
                description = savedContent.description,
                contentType = savedContent.contentType,
                contentUrl = savedContent.contentUrl,
                contentBody = savedContent.contentBody,
                asset = savedContent.asset,
                durationMinutes = savedContent.durationMinutes,
                languageCode = savedContent.languageCode,
                authorName = savedContent.authorName,
                contentVersion = savedContent.contentVersion,
                sourceName = savedContent.sourceName,
                sourceUrl = savedContent.sourceUrl,
                validFrom = savedContent.validFrom,
                validUntil = savedContent.validUntil,
                changedAt = Instant.now(),
                changedBy = teacherUser.id!!,
            )
            revision.title = savedContent.title
            revision.description = savedContent.description
            revision.contentBody = savedContent.contentBody
            revision.validFrom = savedContent.validFrom
            revision.validUntil = savedContent.validUntil
            revision.deleted = false
            revisionRepository.save(revision)
        }
    }

    private fun seedEnrollment(course: Course, student: StudentProfile, academicYear: String, credits: Int, progress: Int) {
        val enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.id!!, student.id!!)
            ?: CourseEnrollment(course = course, student = student)
        enrollment.status = CourseEnrollmentStatus.ACTIVE
        enrollment.progress = progress
        enrollment.academicYear = academicYear
        enrollment.semester = 1
        enrollment.credits = credits
        enrollment.required = true
        enrollment.deleted = false
        enrollmentRepository.save(enrollment)
    }

    private fun demoLessonBody(topic: String, position: Int): String = """
        <h2>$topic</h2>
        <p>Bu demo dars kurs materialining frontendda qanday ko'rinishini tekshirish uchun tayyorlangan.</p>
        <p><strong>Asosiy g'oya:</strong> fizik hodisani avval sifat jihatdan tahlil qiling, so'ng kattaliklar va birliklarni yozib, mos formulani tanlang.</p>
        <ol>
          <li>Berilgan kattaliklarni SI birliklariga o'tkazing.</li>
          <li>Kerakli qonun yoki formulani aniqlang.</li>
          <li>Hisoblang va natijaning fizik ma'nosini tekshiring.</li>
        </ol>
        <p>Mavzu raqami: $position. Dars yakunida o'z-o'zini tekshirish uchun bitta misol tuzing.</p>
    """.trimIndent()

    private data class DemoCourseSpec(
        val subject: Subject,
        val title: String,
        val slug: String,
        val published: Boolean,
        val progress: Int,
        val topics: List<String>,
    )
}
