import { describe, expect, it } from "vitest";
import { canCompleteQualityMonitoringStudy, qualityMonitoringParticipantRange, type QualityMonitoringStudy } from "../quality-monitoring-api";

const study = (patch: Partial<QualityMonitoringStudy> = {}): QualityMonitoringStudy => ({
  id: 1, method: "FOCUS_GROUP", title: "Sifat", objective: "Tahlil", academicYear: "2026-2027",
  startsAt: "2026-08-06T08:00:00Z", endsAt: "2026-08-06T10:00:00Z", locationDescription: "A-101",
  populationScope: "1-kurs masofaviy talabalar", facilitatorUserId: 1, facilitatorName: "Moderator",
  status: "DRAFT", participantIdentitiesStored: false, ...patch,
});

describe("quality monitoring workflow guards", () => {
  it("uses method-specific aggregate participant bounds", () => {
    expect(qualityMonitoringParticipantRange("FOCUS_GROUP")).toEqual([3, 50]);
    expect(qualityMonitoringParticipantRange("INTERVIEW")).toEqual([1, 100]);
    expect(qualityMonitoringParticipantRange("OBSERVATION")).toEqual([0, 1000]);
  });

  it("allows completion only after a draft study starts", () => {
    expect(canCompleteQualityMonitoringStudy(study(), new Date("2026-08-06T08:00:00Z"))).toBe(true);
    expect(canCompleteQualityMonitoringStudy(study(), new Date("2026-08-06T07:59:59Z"))).toBe(false);
    expect(canCompleteQualityMonitoringStudy(study({ status: "APPROVED" }), new Date("2026-08-06T09:00:00Z"))).toBe(false);
  });
});

