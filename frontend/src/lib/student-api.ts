import api from "@/lib/api";
import { StudentDto } from "@/types/student.types";

export async function listStudents(): Promise<StudentDto[]> {
  const response = await api.get<StudentDto[]>("/students");
  return response.data;
}

export async function createStudent(studentData: StudentDto): Promise<StudentDto> {
  const response = await api.post<StudentDto>("/students", studentData);
  return response.data;
}

export async function updateStudentStatus(username: string, status: string): Promise<StudentDto> {
  const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/status?status=${status}`);
  return response.data;
}

export async function promoteStudent(username: string): Promise<StudentDto> {
  const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/promote`);
  return response.data;
}

export async function graduateStudent(username: string): Promise<StudentDto> {
    const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/graduate`);
    return response.data;
}

export async function archiveStudent(username: string): Promise<StudentDto> {
    const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/archive`);
    return response.data;
}

export async function reinstateStudent(username: string): Promise<StudentDto> {
    const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/reinstate`);
    return response.data;
}

export async function editStudent(username: string, studentData: any): Promise<StudentDto> {
    const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}`, studentData);
    return response.data;
}

export async function assignGroup(username: string, groupName: string): Promise<StudentDto> {
    const response = await api.put<StudentDto>(`/students/${encodeURIComponent(username)}/group?groupName=${encodeURIComponent(groupName)}`);
    return response.data;
}
