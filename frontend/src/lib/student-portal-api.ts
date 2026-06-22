import api from "@/lib/api";
import { StudentProfileResponse, UpdateStudentProfileRequest } from "@/types/student.types";

export async function getMyProfile(): Promise<StudentProfileResponse> {
    const res = await api.get<StudentProfileResponse>("/student/me");
    return res.data;
}

export async function updateMyProfile(req: UpdateStudentProfileRequest): Promise<StudentProfileResponse> {
    const res = await api.put<StudentProfileResponse>("/student/me", req);
    return res.data;
}
