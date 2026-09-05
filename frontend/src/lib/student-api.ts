import api from "@/lib/api";
import {
    StudentDto,
    StudentSummaryDto,
    StudentRegistryPageDto,
    StudentRegistryQuery,
    StudentAcademicAdmissionRequest,
    StudentPersonalProfileUpdateRequest,
    StudentRegistrationRequest,
    StudentLifecycleEventDto,
    StudentLifecycleRequest,
    StudentLifecycleResultDto,
    StudentUpdateRequest,
    StudentAccountAccessRequest,
    StudentCredentialSetupRequest,
    StudentBulkTransferRequest,
    StudentBulkTransferResultDto,
    ReinstatementSubjectReportPageDto,
    ReinstatementSubjectReportQuery,
    StudentIdentityLookupResult,
} from "@/types/student.types";

export async function listStudents(query: StudentRegistryQuery = {}): Promise<StudentRegistryPageDto> {
    const res = await api.get<StudentRegistryPageDto>("/students", { params: query });
    return res.data;
}

export async function listReinstatementSubjectReport(
    query: ReinstatementSubjectReportQuery = {},
): Promise<ReinstatementSubjectReportPageDto> {
    const res = await api.get<ReinstatementSubjectReportPageDto>(
        "/students/reinstatements/subjects-report",
        { params: query },
    );
    return res.data;
}

export async function exportStudentRegistry(query: Pick<StudentRegistryQuery, 'search' | 'status'>): Promise<{ blob: Blob; filename: string }> {
    const res = await api.get<Blob>("/students/export", { params: query, responseType: 'blob' });
    const disposition = String(res.headers['content-disposition'] ?? '');
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'student-registry.xlsx';
    return { blob: res.data, filename };
}

export async function getStudent(id: number): Promise<StudentDto> {
    const res = await api.get<StudentDto>(`/students/${id}`);
    return res.data;
}

export async function getStudentByNumber(studentNumber: string): Promise<StudentDto> {
    const res = await api.get<StudentDto>(`/students/by-number/${encodeURIComponent(studentNumber)}`);
    return res.data;
}

export async function createStudent(req: StudentRegistrationRequest): Promise<StudentDto> {
    const res = await api.post<StudentDto>("/students", req);
    return res.data;
}

export async function lookupStudentIdentity(query: {
    pinfl?: string;
    passportSeries?: string;
    passportNumber?: string;
}): Promise<StudentIdentityLookupResult> {
    const res = await api.get<StudentIdentityLookupResult>("/students/identity-lookup", { params: query });
    return res.data;
}

export async function admitStudent(id: number, req: StudentAcademicAdmissionRequest): Promise<StudentLifecycleResultDto> {
    validateLifecycleEvidence(req);
    const res = await api.post<StudentLifecycleResultDto>(`/students/${id}/admission`, req);
    return res.data;
}

export async function updateStudent(id: number, req: StudentUpdateRequest): Promise<StudentDto> {
    const res = await api.put<StudentDto>(`/students/${id}`, req);
    return res.data;
}

export async function listStudentLifecycle(id: number): Promise<StudentLifecycleEventDto[]> {
    const res = await api.get<StudentLifecycleEventDto[]>(`/students/${id}/lifecycle`);
    return res.data;
}

export async function updateStudentPersonalProfile(
    id: number,
    req: StudentPersonalProfileUpdateRequest,
): Promise<StudentDto> {
    const res = await api.put<StudentDto>(`/students/${id}/personal-profile`, req);
    return res.data;
}

export async function changeStudentAccountAccess(
    id: number,
    req: StudentAccountAccessRequest,
): Promise<StudentSummaryDto> {
    const reason = req.reason.trim();
    if (reason.length < 5 || reason.length > 500) {
        throw new Error("Akkaunt holatini o'zgartirish sababi 5-500 belgi bo'lishi shart");
    }
    const res = await api.patch<StudentSummaryDto>(`/students/${id}/account-access`, { ...req, reason });
    return res.data;
}

export async function setupStudentCredentials(
    id: number,
    req: StudentCredentialSetupRequest,
): Promise<StudentSummaryDto> {
    if (req.newPassword.length < 12 || req.newPassword.length > 128) {
        throw new Error("Parol 12 dan 128 tagacha belgidan iborat bo'lishi kerak");
    }
    const res = await api.patch<StudentSummaryDto>(`/students/${id}/credentials`, req);
    return res.data;
}

export async function transitionStudent(id: number, request: StudentLifecycleRequest): Promise<StudentLifecycleResultDto> {
    validateLifecycleEvidence(request);
    if (request.eventType === 'TRANSFER' && !request.targetProgramId) {
        throw new Error("Ko'chirish uchun yangi ta'lim dasturi majburiy");
    }
    if (request.eventType !== 'TRANSFER' && (request.targetProgramId || request.targetGroupId)) {
        throw new Error("Dastur va guruh faqat TRANSFER hodisasida beriladi");
    }
    const res = await api.post<StudentLifecycleResultDto>(`/students/${id}/lifecycle`, request);
    return res.data;
}

export async function bulkTransferStudents(request: StudentBulkTransferRequest): Promise<StudentBulkTransferResultDto> {
    if (request.studentIds.length < 2 || request.studentIds.length > 200) {
        throw new Error("Ommaviy ko'chirish uchun 2-200 ta talaba tanlanishi shart");
    }
    if (new Set(request.studentIds).size !== request.studentIds.length) {
        throw new Error("Ommaviy ko'chirish ro'yxatida takroriy talaba mavjud");
    }
    if (!request.targetProgramId) throw new Error("Yangi ta'lim dasturi majburiy");
    validateLifecycleEvidence(request);
    const res = await api.post<StudentBulkTransferResultDto>('/students/bulk-transfer', request);
    return res.data;
}

export function validateLifecycleEvidence(request: {
    orderNumber: string;
    orderDate: string;
    effectiveDate: string;
    legalBasis: string;
    reason: string;
}): void {
    if (request.orderNumber.trim().length < 2) throw new Error("Buyruq raqami majburiy");
    if (!request.orderDate || !request.effectiveDate) throw new Error("Buyruq va amal sanasi majburiy");
    if (request.effectiveDate < request.orderDate) throw new Error("Amal sanasi buyruq sanasidan oldin bo'lishi mumkin emas");
    const today = new Date().toISOString().slice(0, 10);
    if (request.orderDate > today || request.effectiveDate > today) throw new Error("Kelajakdagi lifecycle sanasi qabul qilinmaydi");
    if (request.legalBasis.trim().length < 5) throw new Error("Huquqiy asos majburiy");
    if (request.reason.trim().length < 5) throw new Error("Sabab majburiy");
}

export async function promoteStudent(id: number): Promise<StudentDto> {
    const res = await api.patch<StudentDto>(`/students/${id}/promote`);
    return res.data;
}

export async function deleteStudent(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
}

export async function editStudent(username: string, req: Partial<StudentDto>): Promise<StudentDto> {
    const res = await api.put<StudentDto>(`/students/by-username/${encodeURIComponent(username)}`, req);
    return res.data;
}
