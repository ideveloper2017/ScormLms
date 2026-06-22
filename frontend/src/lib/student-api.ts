import api from "@/lib/api";
import {
    StudentDto,
    StudentSummaryDto,
    StudentCreateRequest,
    StudentUpdateRequest,
    StudentStatus,
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

export async function createStudent(req: StudentCreateRequest): Promise<StudentDto> {
    const res = await api.post<StudentDto>("/students", req);
    return res.data;
}

export async function updateStudent(id: number, req: StudentUpdateRequest): Promise<StudentDto> {
    const res = await api.put<StudentDto>(`/students/${id}`, req);
    return res.data;
}

export async function changeStudentStatus(id: number, status: StudentStatus): Promise<StudentDto> {
    const res = await api.patch<StudentDto>(`/students/${id}/status?status=${status}`);
    return res.data;
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

export async function graduateStudent(id: number): Promise<StudentDto> {
    return changeStudentStatus(id, 'GRADUATED');
}

export async function archiveStudent(id: number): Promise<StudentDto> {
    return changeStudentStatus(id, 'EXPELLED');
}

export async function reinstateStudent(id: number): Promise<StudentDto> {
    return changeStudentStatus(id, 'ACTIVE');
}