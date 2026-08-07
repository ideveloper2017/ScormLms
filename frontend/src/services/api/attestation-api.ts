import api from '@/lib/api';

export type AttestationStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED';
export interface AttestationSession {
  id: string; courseId: string; courseTitle: string; title: string; description?: string;
  examDate: string; examTime: string; location: string; defenseType: 'BACHELOR' | 'MASTER';
  commissionChairId: string; chairName: string; status: AttestationStatus; minCommissionMembers: number;
  currentMemberCount: number; minPassScore: number; totalEnrolled: number; defenseCount: number;
  passedCount: number; failedCount: number; retakeCount: number;
}
export interface CommissionMember { id: string; userId: string; userName: string; userEmail: string; role: 'CHAIR' | 'MEMBER' | 'SECRETARY'; }
export interface SessionDefense { defenseId: string; studentId: string; studentName: string; studentEmail: string; onsiteAttendanceRequired: boolean; onsiteAttendanceConfirmedAt?: string; defenseStatus: string; defenseDate?: string; defenseTime?: string; commissionDecision?: string; averageScore?: number; certificateIssued: boolean; }
export interface AttestationDetail { sessionId: string; courseId: string; courseTitle: string; title: string; examDate: string; examTime: string; location: string; defenseType: string; status: AttestationStatus; commission: { members: CommissionMember[]; totalMembers: number }; statistics: { passedCount: number; failedCount: number; retakeCount: number }; defenseList: SessionDefense[]; }
export interface AttestationProtocol { id: string; sessionId: string; protocolNumber: string; protocolDate: string; totalStudents: number; passedCount: number; failedCount: number; retakeCount: number; approved: boolean; approverName?: string; approvedAt?: string; }
export interface StudentAttestation { id: string; courseId: string; courseTitle: string; title: string; description?: string; examDate: string; examTime: string; location: string; onsiteAttendanceRequired: boolean; defenseType: string; chairName: string; status: AttestationStatus; myDefenseStatus?: string; myDefenseDecision?: string; myScore?: number; certificateIssued: boolean; certificateNumber?: string; resultPublished: boolean; }
export interface StudentCertificate { id: string; certificateNumber: string; issueDate: string; programName: string; specialization?: string; gpaFinal?: number; courseTitle: string; defenseScore: number; verificationUrl?: string; }
export interface CreateAttestationPayload { courseId: number; title: string; description?: string; examDate: string; examTime: string; location: string; commissionChairId: number; defenseType: 'BACHELOR' | 'MASTER'; minCommissionMembers: number; minPassScore: number; }

export const attestationApi = {
  teacherList: async () => (await api.get<AttestationSession[]>('/attestation-sessions')).data,
  create: async (payload: CreateAttestationPayload) => (await api.post<AttestationSession>('/attestation-sessions', payload)).data,
  detail: async (id: string) => (await api.get<AttestationDetail>(`/attestation-sessions/${id}`)).data,
  addMember: async (id: string, userId: number, role: 'MEMBER' | 'SECRETARY') => { await api.post(`/attestation-sessions/${id}/members`, { userId, role }); },
  publish: async (id: string) => (await api.post<AttestationSession>(`/attestation-sessions/${id}/publish`)).data,
  start: async (id: string) => (await api.post<AttestationSession>(`/attestation-sessions/${id}/start`)).data,
  complete: async (id: string) => (await api.post<AttestationSession>(`/attestation-sessions/${id}/complete`)).data,
  remove: async (id: string) => { await api.delete(`/attestation-sessions/${id}`); },
  recordDefense: async ({ id, onsiteAttendanceConfirmed }: { id: string; onsiteAttendanceConfirmed: boolean }) => (await api.post(`/defenses/${id}/record`, { defenseStatus: 'DEFENDED', onsiteAttendanceConfirmed })).data,
  grade: async (id: string, score: number, comments?: string) => (await api.post(`/defenses/${id}/grade`, { score, comments })).data,
  generateProtocol: async (sessionId: string) => (await api.post<AttestationProtocol>(`/attestation-sessions/${sessionId}/protocol`)).data,
  getProtocol: async (sessionId: string) => { const response = await api.get<AttestationProtocol | undefined>(`/attestation-sessions/${sessionId}/protocol`); return response.data; },
  approveProtocol: async (protocolId: string) => { await api.post(`/attestation-protocols/${protocolId}/approve`); },
  generateCertificate: async (defenseId: string, actorId: number) => (await api.post('/certificates/generate', { studentDefenseId: Number(defenseId), issuedByUserId: actorId, issueDate: new Date().toISOString().slice(0, 10) })).data,
  studentList: async () => (await api.get<StudentAttestation[]>('/students/me/attestations')).data,
  studentCertificates: async () => (await api.get<StudentCertificate[]>('/students/me/attestations/certificates')).data,
};
