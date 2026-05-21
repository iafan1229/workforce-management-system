import { describe, expect, it } from "vitest";
import { deriveWorkerStatus } from "./worker-status";

describe("deriveWorkerStatus", () => {
  it("마지막 출근일이 없으면 dormant를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: null,
        today: "2026-05-21",
      }),
    ).toBe("dormant");
  });

  it("최근 출근일이 30일 이내면 active를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2026-05-01",
        today: "2026-05-21",
      }),
    ).toBe("active");
  });

  it("정확히 30일 차이면 active를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2026-04-21",
        today: "2026-05-21",
      }),
    ).toBe("active");
  });

  it("31일 차부터 inactive를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2026-04-20",
        today: "2026-05-21",
      }),
    ).toBe("inactive");
  });

  it("정확히 180일 차이면 inactive를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2025-11-22",
        today: "2026-05-21",
      }),
    ).toBe("inactive");
  });

  it("181일 차부터 dormant를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2025-11-21",
        today: "2026-05-21",
      }),
    ).toBe("dormant");
  });

  it("미래 날짜는 dormant를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2026-05-22",
        today: "2026-05-21",
      }),
    ).toBe("dormant");
  });
});
