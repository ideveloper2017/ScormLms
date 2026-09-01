import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import { StudentProfileResponse, UpdateStudentProfileRequest } from "@/types/student.types";

export async function getMyProfile(): Promise<StudentProfileResponse> {
    const res = await api.get<ApiResponse<StudentProfileResponse>>("/students/me");
    if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message ?? "Profilni yuklab bo'lmadi");
    }
    return res.data.data;
}

export async function updateMyProfile(req: UpdateStudentProfileRequest): Promise<StudentProfileResponse> {
    const res = await api.put<ApiResponse<StudentProfileResponse>>("/students/me", req);
    if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message ?? "Profilni yangilab bo'lmadi");
    }
    return res.data.data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", { currentPassword, newPassword });
}
