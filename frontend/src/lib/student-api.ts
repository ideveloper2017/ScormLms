import api from "@/lib/api";
import {
    StudentDto,
    StudentSummaryDto,
    StudentAdmissionRequest,
    StudentLifecycleEventDto,
    StudentLifecycleRequest,
    StudentLifecycleResultDto,
    StudentUpdateRequest,
} from "@/types/student.types";

export async function listStudents(): Promise<StudentSummaryDto[]> {
    const res = await api.get<StudentSummaryDto[]>("/students");
    return res.data;
}

export async function getStudent(id: number): Promise<StudentDto> {
    const res = await api.get<StudentDto>(`/students/${id}`);
    return res.data;
}

export async function getStudentByNumber(studentNumber: string): Promise<StudentDto> {
    const res = await api.get<StudentDto>(`/students/by-number/${encodeURIComponent(studentNumber)}`);
    return res.data;
}

export async function createStudent(req: StudentAdmissionRequest): Promise<StudentLifecycleResultDto> {
    validateLifecycleEvidence(req);
    const res = await api.post<StudentLifecycleResultDto>("/students", req);
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
