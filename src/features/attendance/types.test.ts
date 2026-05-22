import { describe, expect, it } from "vitest";
import { toAttendanceListRows } from "./types";

describe("toAttendanceListRows", () => {
  it("단일 객체 형태의 조인 결과를 그대로 매핑한다", () => {
    expect(
      toAttendanceListRows([
        {
          id: "attendance-1",
          work_date: "2026-05-22",
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
        worker: {
          id: "worker-1",
          name: "홍길동",
          phone: "01012345678",
        },
      },
    ]);
  });

  it("배열 형태의 조인 결과도 첫 번째 인력을 사용해 방어적으로 매핑한다", () => {
    expect(
      toAttendanceListRows([
        {
          id: "attendance-2",
          work_date: "2026-05-22",
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
        worker: {
          id: "worker-2",
          name: "김영희",
          phone: "01087654321",
        },
      },
    ]);
  });
});
