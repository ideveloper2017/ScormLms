import api, { type ApiResponse } from "@/lib/api";

export type ScormVersion = "SCORM_1_2" | "SCORM_2004";
export type ScormAttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PASSED" | "FAILED";

export interface ScormPackage {
  id: number;
  courseId: number;
  title: string;
  version: ScormVersion;
  manifestIdentifier?: string | null;
  entryPoint: string;
  status: string;
  importedBy: string;
  createdAt?: string | null;
}

export interface ScormLaunch {
  packageId: number;
  attemptId: number;
  courseId: number;
  title: string;
  version: ScormVersion;
  launchUrl: string;
  status: ScormAttemptStatus;
  runtimeData: Record<string, string>;
}

export interface ScormAttempt {
  id: number;
  packageId: number;
  status: ScormAttemptStatus;
  scoreRaw?: number | null;
  progressMeasure?: number | null;
  totalTimeSeconds: number;
  runtimeData: Record<string, string>;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export const scormApi = {
  async listPackages(courseId: number): Promise<ScormPackage[]> {
    return dataOf(await api.get<ApiResponse<ScormPackage[]>>(`/scorm/courses/${courseId}/packages`), "SCORM paketlar yuklanmadi");
  },

  async importPackage(courseId: number, file: File): Promise<ScormPackage> {
    const form = new FormData();
    form.append("file", file);
    return dataOf(await api.post<ApiResponse<ScormPackage>>(`/scorm/courses/${courseId}/packages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180_000,
    }), "SCORM paket import qilinmadi");
  },

  async launchCourse(courseId: number): Promise<ScormLaunch> {
    return dataOf(await api.post<ApiResponse<ScormLaunch>>(`/scorm/courses/${courseId}/launch`), "SCORM kurs ishga tushmadi");
  },

  async updateRuntime(attemptId: number, values: Record<string, string>, finish = false): Promise<ScormAttempt> {
    return dataOf(await api.put<ApiResponse<ScormAttempt>>(`/scorm/attempts/${attemptId}/runtime`, { values, finish }), "SCORM natijasi saqlanmadi");
  },
};

export function scormContentUrl(relativeUrl: string): string {
  const configuredOrigin = import.meta.env.VITE_SCORM_CONTENT_ORIGIN as string | undefined;
  const apiOrigin = new URL(import.meta.env.VITE_API_BASE_URL ?? "https://api.lms.nstu.uz/api/v1", window.location.origin).origin;
  return new URL(relativeUrl, configuredOrigin || apiOrigin).toString();
}
