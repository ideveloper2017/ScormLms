import api from "@/lib/api";

export type OrientationSessionStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
export type OrientationAttendanceStatus = "INVITED" | "PRESENT" | "ABSENT" | "EXCUSED";

export interface OrientationSession {
  id: number;
  title: string;
  venue: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  instructions?: string | null;
  programId?: number | null;
  groupId?: number | null;
  status: OrientationSessionStatus;
  attendeeCount: number;
  presentCount: number;
  acknowledgedCount: number;
  publishedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface OrientationAttendee {
  id: number;
  sessionId: number;
  sessionTitle: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  instructions?: string | null;
  sessionStatus: OrientationSessionStatus;
  studentId: number;
  studentNumber: string;
  studentName: string;
  attendanceStatus: OrientationAttendanceStatus;
  checkedInAt?: string | null;
  acknowledgementAt?: string | null;
}

export interface StudentOrientation {
  orientationRequired: boolean;
  orientationCompletedAt?: string | null;
  sessions: OrientationAttendee[];
}

export interface CreateOrientationInput {
  title: string;
  venue: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  instructions?: string;
  programId?: number;
  groupId?: number;
}

export const canRecordOrientationAttendance = (session: OrientationSession, now = new Date()) =>
  session.status === "PUBLISHED" && new Date(session.startsAt).getTime() <= now.getTime();

export const canAcknowledgeOrientation = (attendee: OrientationAttendee) =>
  attendee.attendanceStatus === "PRESENT" && !attendee.acknowledgementAt;

export const orientationApi = {
  list: async () => (await api.get<OrientationSession[]>("/orientations")).data,
  attendees: async (id: number) => (await api.get<OrientationAttendee[]>(`/orientations/${id}/attendees`)).data,
  create: async (input: CreateOrientationInput) => (await api.post<OrientationSession>("/orientations", input)).data,
  publish: async (id: number) => (await api.post<OrientationSession>(`/orientations/${id}/publish`)).data,
  complete: async (id: number) => (await api.post<OrientationSession>(`/orientations/${id}/complete`)).data,
  cancel: async (id: number) => (await api.post<OrientationSession>(`/orientations/${id}/cancel`)).data,
  attendance: async (sessionId: number, studentId: number, status: Exclude<OrientationAttendanceStatus, "INVITED">) =>
    (await api.post<OrientationAttendee>(`/orientations/${sessionId}/attendees/${studentId}/attendance`, { status })).data,
  mine: async () => (await api.get<StudentOrientation>("/orientations/me")).data,
  acknowledge: async (id: number) => (await api.post<StudentOrientation>(`/orientations/${id}/acknowledge`)).data,
};
