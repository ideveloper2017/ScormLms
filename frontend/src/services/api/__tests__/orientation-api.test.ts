import { describe, expect, it } from "vitest";
import { canAcknowledgeOrientation, canRecordOrientationAttendance, type OrientationAttendee, type OrientationSession } from "../orientation-api";

const session = (patch: Partial<OrientationSession> = {}): OrientationSession => ({ id: 1, title: "LMS", venue: "A-101", academicYear: "2026-2027", startsAt: "2026-08-06T08:00:00Z", endsAt: "2026-08-06T10:00:00Z", status: "PUBLISHED", attendeeCount: 1, presentCount: 0, acknowledgedCount: 0, ...patch });
const attendee = (patch: Partial<OrientationAttendee> = {}): OrientationAttendee => ({ id: 1, sessionId: 1, sessionTitle: "LMS", venue: "A-101", startsAt: "2026-08-06T08:00:00Z", endsAt: "2026-08-06T10:00:00Z", sessionStatus: "PUBLISHED", studentId: 2, studentNumber: "S-1", studentName: "Talaba", attendanceStatus: "INVITED", ...patch });

describe("orientation workflow guards", () => {
  it("opens attendance only after a published session starts", () => {
    expect(canRecordOrientationAttendance(session(), new Date("2026-08-06T08:00:00Z"))).toBe(true);
    expect(canRecordOrientationAttendance(session(), new Date("2026-08-06T07:59:59Z"))).toBe(false);
    expect(canRecordOrientationAttendance(session({ status: "COMPLETED" }), new Date("2026-08-06T09:00:00Z"))).toBe(false);
  });

  it("allows acknowledgement only for present and not-yet-acknowledged student", () => {
    expect(canAcknowledgeOrientation(attendee({ attendanceStatus: "PRESENT" }))).toBe(true);
    expect(canAcknowledgeOrientation(attendee({ attendanceStatus: "ABSENT" }))).toBe(false);
    expect(canAcknowledgeOrientation(attendee({ attendanceStatus: "PRESENT", acknowledgementAt: "2026-08-06T09:00:00Z" }))).toBe(false);
  });
});
