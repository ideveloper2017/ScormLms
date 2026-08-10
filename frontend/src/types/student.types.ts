// ── Enums ─────────────────────────────────────────────────────────────────────

export type Gender         = 'MALE' | 'FEMALE';
export type Citizenship    = 'UZBEKISTAN' | 'OTHER';
export type PassportType   = 'BIOMETRIC_PASSPORT' | 'PASSPORT' | 'ID_CARD' | 'BIRTH_CERTIFICATE';
export type DegreeLevel    = 'BACHELOR' | 'MASTER' | 'PHD' | 'ASSOCIATE';
export type EducationForm  = 'FULL_TIME' | 'PART_TIME' | 'DISTANCE' | 'EVENING';
export type PaymentType    = 'CONTRACT' | 'GRANT';
export type StudentStatus  = 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'EXPELLED' | 'GRADUATED';
export type UserStatus     = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'GRADUATED' | 'EXPELLED' | 'ARCHIVED';
export type StudentLifecycleEventType = 'ADMISSION' | 'SUSPENSION' | 'REINSTATEMENT' | 'TRANSFER' | 'EXPULSION' | 'GRADUATION';

// ── Admin response (to'liq) ───────────────────────────────────────────────────

export interface StudentDto {
    id: number | null;
    citizenshipCountryId: number | null;
    permanentRegionId: number | null;
    permanentDistrictId: number | null;
    currentRegionId: number | null;
    currentDistrictId: number | null;
    // Shaxsiy
    pinfl: string;
    lastName: string;
    firstName: string;
    middleName: string | null;
    fullName: string;
    birthDate: string | null;
    gender: Gender | null;
    citizenship: Citizenship | null;
    // Pasport
    passportType: PassportType | null;
    passportSeries: string | null;
    passportNumber: string | null;
    passportIssuedDate: string | null;
    passportExpiryDate: string | null;
    passportIssuedBy: string | null;
    photoUrl: string | null;
    // Aloqa
    phoneNumber: string | null;
    email: string | null;
    // Doimiy manzil
    permanentRegion: string | null;
    permanentDistrict: string | null;
    permanentAddress: string | null;
    // Hozirgi manzil
    currentRegion: string | null;
    currentDistrict: string | null;
    currentAddress: string | null;
    // Ta'lim
    studentNumber: string;
    universityId: number | null;
    facultyId: number | null;
    departmentId: number | null;
    programId: number | null;
    degreeLevel: DegreeLevel | null;
    educationForm: EducationForm | null;
    educationLanguage: string | null;
    courseNumber: number | null;
    semesterNumber: number | null;
    groupId: number | null;
    academicYear: string | null;
    admissionDate: string | null;
    admissionOrderNumber: string | null;
    studentStatus: StudentStatus | null;
    paymentType: PaymentType | null;
    contractNumber: string | null;
    contractAmount: number | null;
    // Tizim
    username: string;
    accountEnabled: boolean;
    lastLoginAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

// ── Ro'yxat uchun qisqa DTO ───────────────────────────────────────────────────

export interface StudentSummaryDto {
    id: number | null;
    studentNumber: string;
    fullName: string;
    pinfl: string;
    phoneNumber: string | null;
    email: string | null;
    facultyId: number | null;
    groupId: number | null;
    courseNumber: number | null;
    semesterNumber: number | null;
    degreeLevel: DegreeLevel | null;
    studentStatus: StudentStatus | null;
    photoUrl: string | null;
    lmsOrientationRequired: boolean;
    username: string;
    accountStatus: UserStatus;
    accountEnabled: boolean;
}

// ── Create / Update ───────────────────────────────────────────────────────────

export interface StudentCreateRequest {
    pinfl: string;
    lastName: string;
    firstName: string;
    middleName?: string | null;
    birthDate: string;
    gender: Gender;
    citizenship?: Citizenship;
    passportType?: PassportType | null;
    passportSeries?: string | null;
    passportNumber?: string | null;
    passportIssuedDate?: string | null;
    passportExpiryDate?: string | null;
    passportIssuedBy?: string | null;
    photoUrl?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    permanentRegion?: string | null;
    permanentDistrict?: string | null;
    permanentAddress?: string | null;
    currentRegion?: string | null;
    currentDistrict?: string | null;
    currentAddress?: string | null;
    studentNumber: string;
    universityId?: number | null;
    facultyId?: number | null;
    departmentId?: number | null;
    programId?: number | null;
    degreeLevel?: DegreeLevel;
    educationForm?: EducationForm;
    educationLanguage?: string;
    courseNumber?: number;
    groupId?: number | null;
    academicYear?: string | null;
    admissionDate?: string | null;
    admissionOrderNumber?: string | null;
    studentStatus?: StudentStatus;
    paymentType?: PaymentType | null;
    contractNumber?: string | null;
    contractAmount?: number | null;
    password?: string;
}

export interface StudentRegistryPageDto {
    items: StudentSummaryDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface StudentRegistryQuery {
    search?: string;
    status?: StudentStatus;
    page?: number;
    size?: number;
}

export interface StudentRegistrationRequest {
    pinfl: string;
    lastName: string;
    firstName: string;
    middleName?: string | null;
    birthDate: string;
    gender: Gender;
    citizenship?: Citizenship;
    citizenshipCountryId?: number | null;
    passportType?: PassportType | null;
    passportSeries?: string | null;
    passportNumber?: string | null;
    passportIssuedDate?: string | null;
    passportExpiryDate?: string | null;
    passportIssuedBy?: string | null;
    photoUrl?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    permanentRegion?: string | null;
    permanentRegionId?: number | null;
    permanentDistrict?: string | null;
    permanentDistrictId?: number | null;
    permanentAddress?: string | null;
    currentRegion?: string | null;
    currentRegionId?: number | null;
    currentDistrict?: string | null;
    currentDistrictId?: number | null;
    currentAddress?: string | null;
    studentNumber: string;
    password?: string;
}

export interface StudentPersonalProfileUpdateRequest {
    lastName: string;
    firstName: string;
    middleName?: string | null;
    passportType?: PassportType | null;
    passportSeries?: string | null;
    passportNumber?: string | null;
    passportIssuedDate?: string | null;
    passportExpiryDate?: string | null;
    passportIssuedBy?: string | null;
    photoUrl?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    permanentRegion?: string | null;
    permanentRegionId?: number | null;
    permanentDistrict?: string | null;
    permanentDistrictId?: number | null;
    permanentAddress?: string | null;
    currentRegion?: string | null;
    currentRegionId?: number | null;
    currentDistrict?: string | null;
    currentDistrictId?: number | null;
    currentAddress?: string | null;
}

export interface StudentAccountAccessRequest {
    enabled: boolean;
    reason: string;
}

export interface StudentAcademicAdmissionRequest {
    universityId?: number | null;
    facultyId?: number | null;
    departmentId?: number | null;
    programId: number;
    degreeLevel: DegreeLevel;
    educationForm: EducationForm;
    educationLanguage: string;
    semesterNumber: number;
    courseNumber: number;
    groupId?: number | null;
    academicYear?: string | null;
    paymentType?: PaymentType | null;
    contractNumber?: string | null;
    contractAmount?: number | null;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
}

export interface StudentAdmissionRequest {
    student: StudentCreateRequest;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
}

export interface StudentLifecycleRequest {
    eventType: Exclude<StudentLifecycleEventType, 'ADMISSION'>;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
    targetProgramId?: number | null;
    targetGroupId?: number | null;
    academicYear?: string | null;
}

export interface StudentLifecycleEventDto {
    id: number;
    studentId: number;
    studentNumber: string;
    studentName: string;
    eventType: StudentLifecycleEventType;
    fromStatus: StudentStatus | null;
    toStatus: StudentStatus;
    fromProgramId: number | null;
    fromProgramName: string | null;
    toProgramId: number | null;
    toProgramName: string | null;
    fromGroupId: number | null;
    toGroupId: number | null;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
    recordedByUserId: number;
    recordedByName: string;
    recordedAt: string;
}

export interface StudentLifecycleResultDto {
    student: StudentDto;
    event: StudentLifecycleEventDto;
}

export interface StudentBulkTransferRequest {
    studentIds: number[];
    targetProgramId: number;
    targetGroupId?: number | null;
    academicYear?: string | null;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
}

export interface StudentBulkTransferItemDto {
    studentId: number;
    studentNumber: string;
    studentName: string;
    studentStatus: StudentStatus;
    eventId: number;
    fromProgramId: number | null;
    toProgramId: number | null;
    fromGroupId: number | null;
    toGroupId: number | null;
}

export interface StudentBulkTransferResultDto {
    orderNumber: string;
    processedCount: number;
    targetProgramId: number;
    targetGroupId: number | null;
    items: StudentBulkTransferItemDto[];
}

export type CourseEnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';

export interface ReinstatementSubjectDto {
    enrollmentId: number;
    courseId: number;
    courseTitle: string;
    subjectCode: string | null;
    subjectName: string;
    academicYear: string;
    semester: number;
    credits: number;
    required: boolean;
    status: CourseEnrollmentStatus;
    progress: number;
    enrolledAt: string;
    completedAt: string | null;
}

export interface ReinstatementSubjectReportItemDto {
    reinstatementEventId: number;
    studentId: number;
    studentNumber: string;
    studentName: string;
    studentStatus: StudentStatus;
    programId: number | null;
    programName: string | null;
    groupId: number | null;
    groupName: string | null;
    academicYear: string | null;
    semesterNumber: number | null;
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    reason: string;
    subjects: ReinstatementSubjectDto[];
}

export interface ReinstatementSubjectReportPageDto {
    items: ReinstatementSubjectReportItemDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ReinstatementSubjectReportQuery {
    search?: string;
    academicYear?: string;
    page?: number;
    size?: number;
}

export interface StudentUpdateRequest {
    lastName?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    passportType?: PassportType | null;
    passportSeries?: string | null;
    passportNumber?: string | null;
    passportIssuedDate?: string | null;
    passportExpiryDate?: string | null;
    passportIssuedBy?: string | null;
    photoUrl?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    permanentRegion?: string | null;
    permanentDistrict?: string | null;
    permanentAddress?: string | null;
    currentRegion?: string | null;
    currentDistrict?: string | null;
    currentAddress?: string | null;
    facultyId?: number | null;
    departmentId?: number | null;
    programId?: number | null;
    degreeLevel?: DegreeLevel | null;
    educationForm?: EducationForm | null;
    educationLanguage?: string | null;
    courseNumber?: number | null;
    groupId?: number | null;
    academicYear?: string | null;
    studentStatus?: StudentStatus | null;
    paymentType?: PaymentType | null;
    contractNumber?: string | null;
    contractAmount?: number | null;
}

// ── Student portal (talaba o'zi uchun) ───────────────────────────────────────

export interface StudentProfileResponse {
    id: number | null;
    pinfl: string;
    lastName: string;
    firstName: string;
    middleName: string | null;
    fullName: string;
    birthDate: string | null;
    gender: Gender | null;
    citizenship: Citizenship | null;
    citizenshipCountryId: number | null;
    passportType: PassportType | null;
    passportSeries: string | null;
    passportNumber: string | null;
    passportIssuedDate: string | null;
    passportExpiryDate: string | null;
    passportIssuedBy: string | null;
    photoUrl: string | null;
    phoneNumber: string | null;
    email: string | null;
    permanentRegion: string | null;
    permanentRegionId: number | null;
    permanentDistrict: string | null;
    permanentDistrictId: number | null;
    permanentAddress: string | null;
    currentRegion: string | null;
    currentRegionId: number | null;
    currentDistrict: string | null;
    currentDistrictId: number | null;
    currentAddress: string | null;
    studentNumber: string;
    facultyId: number | null;
    degreeLevel: DegreeLevel | null;
    educationForm: EducationForm | null;
    educationLanguage: string | null;
    courseNumber: number | null;
    groupId: number | null;
    academicYear: string | null;
    admissionDate: string | null;
    admissionOrderNumber: string | null;
    studentStatus: StudentStatus | null;
    paymentType: PaymentType | null;
    contractNumber: string | null;
    contractAmount: number | null;
    username: string;
    lastLoginAt: string | null;
}

export interface UpdateStudentProfileRequest {
    phoneNumber?: string | null;
    email?: string | null;
    currentRegion?: string | null;
    currentRegionId?: number | null;
    currentDistrict?: string | null;
    currentDistrictId?: number | null;
    currentAddress?: string | null;
    photoUrl?: string | null;
}
