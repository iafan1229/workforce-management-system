import { describe, expect, it } from "vitest";
import { toAttendanceListRows } from "./types";

describe("toAttendanceListRows", () => {
  it("단일 객체 형태의 조인 결과를 그대로 매핑한다", () => {
    expect(
      toAttendanceListRows([
        {
          id: "attendance-1",
          work_date: "2026-05-22",
          status: "checked_in",
          workers: {
            id: "worker-1",
            name: "홍길동",
            phone: "01012345678",
          },
        },
      ]),
    ).toEqual([
      {
        id: "attendance-1",
        work_date: "2026-05-22",
        status: "checked_in",
        worker: {
          id: "worker-1",
          name: "홍길동",
          phone: "01012345678",
        },
        assignment: null,
      },
    ]);
  });

  it("배열 형태의 조인 결과도 첫 번째 인력을 사용해 방어적으로 매핑한다", () => {
    expect(
      toAttendanceListRows([
        {
          id: "attendance-2",
          work_date: "2026-05-22",
          status: "scheduled",
          workers: [
            {
              id: "worker-2",
              name: "김영희",
              phone: "01087654321",
            },
          ],
        },
      ]),
    ).toEqual([
      {
        id: "attendance-2",
        work_date: "2026-05-22",
        status: "scheduled",
        worker: {
          id: "worker-2",
          name: "김영희",
          phone: "01087654321",
        },
        assignment: null,
      },
    ]);
  });

  it("배정 조인 결과가 있으면 현재 배정 상태를 함께 매핑한다", () => {
    expect(
      toAttendanceListRows([
        {
          id: "attendance-3",
          work_date: "2026-05-22",
          status: "checked_in",
          workers: {
            id: "worker-3",
            name: "박민수",
            phone: "01055556666",
          },
          assignments: {
            id: "assignment-3",
            task_type_id: "task-3",
            source: "manual_assignment",
            task_types: {
              label: "피딩",
            },
          },
        },
      ]),
    ).toEqual([
      {
        id: "attendance-3",
        work_date: "2026-05-22",
        status: "checked_in",
        worker: {
          id: "worker-3",
          name: "박민수",
          phone: "01055556666",
        },
        assignment: {
          assignmentId: "assignment-3",
          taskTypeId: "task-3",
          taskTypeLabel: "피딩",
          source: "manual_assignment",
        },
      },
    ]);
  });
});
