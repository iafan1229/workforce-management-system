import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OperationsDashboardPage from "@/app/(console)/operations/[workDate]/page";

let useLegacyAttendanceSchema = false;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      if (table === "attendances") {
        return {
          select: (query: string) => ({
            eq: () => ({
              order: () => {
                if (useLegacyAttendanceSchema && query.includes("status")) {
                  return {
                    data: null,
                    error: {
                      code: "42703",
                      message: "column attendances.status does not exist",
                    },
                  };
                }

                return {
                  data: [
                    {
                      id: "attendance-1",
                      work_date: "2026-05-25",
                      ...(useLegacyAttendanceSchema ? {} : { status: "checked_in" }),
                      workers: {
                        id: "worker-1",
                        name: "김현우",
                        phone: "010-1111-2222",
                      },
                    },
                    {
                      id: "attendance-2",
                      work_date: "2026-05-25",
                      ...(useLegacyAttendanceSchema ? {} : { status: "scheduled" }),
                      workers: {
                        id: "worker-2",
                        name: "박서준",
                        phone: "010-3333-4444",
                      },
                    },
                  ],
                  error: null,
                };
              },
            }),
          }),
        };
      }

      if (table === "assignments") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [
                  {
                    id: "assignment-1",
                    worker_id: "worker-1",
                    task_type_id: "task-1",
                    source: "manual",
                    task_types: { label: "피킹" },
                  },
                  {
                    id: "assignment-2",
                    worker_id: "worker-2",
                    task_type_id: "task-2",
                    source: "manual",
                    task_types: { label: "세척" },
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "task_types") {
        return {
          select: () => ({
            order: () => ({
              data: [
                { id: "task-1", label: "피킹" },
                { id: "task-2", label: "세척" },
              ],
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }),
}));

afterEach(() => {
  cleanup();
  useLegacyAttendanceSchema = false;
});

describe("OperationsDashboardPage", () => {
  it("작업일 기준 현재 출근/배정 사람 리스트를 테이블로 보여준다", async () => {
    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText("선택 작업일 2026-05-25")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "운영 대시보드" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "현재 출근/배정 인원" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "이름 검색" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "전화번호 검색" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "배정 필터" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "이름" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "전화번호" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "상태" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "배정" })).toBeInTheDocument();
    expect(screen.getByText("김현우")).toBeInTheDocument();
    expect(screen.getByText("박서준")).toBeInTheDocument();
    expect(screen.getByText("출근완료")).toBeInTheDocument();
    expect(screen.getByText("출근예정")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "피킹" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "세척" })).toBeInTheDocument();

    const dataRows = screen.getAllByRole("row").slice(1);
    expect(dataRows[0]).toHaveTextContent("박서준");
    expect(dataRows[0]).toHaveTextContent("세척");
    expect(dataRows[1]).toHaveTextContent("김현우");
    expect(dataRows[1]).toHaveTextContent("피킹");

    const scheduledRow = screen.getByText("박서준").closest("tr");
    expect(scheduledRow).toHaveAttribute("data-attendance-status", "scheduled");
    expect(scheduledRow).toHaveClass("console-scheduled-row");
  });

  it("status 컬럼이 없는 기존 DB에서도 기본 출근완료 상태로 폴백 렌더링한다", async () => {
    useLegacyAttendanceSchema = true;

    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText("김현우")).toBeInTheDocument();
    expect(screen.getByText("박서준")).toBeInTheDocument();
    expect(screen.getAllByText("출근완료")).toHaveLength(2);
  });

  it("이름, 전화번호, 배정 필터가 있으면 해당 인원만 보여준다", async () => {
    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({
        name: "현우",
        phone: "2222",
        taskTypeId: "task-1",
      }),
    });

    render(page);

    expect(screen.getByText("김현우")).toBeInTheDocument();
    expect(screen.queryByText("박서준")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "이름 검색" })).toHaveValue("현우");
    expect(screen.getByRole("textbox", { name: "전화번호 검색" })).toHaveValue(
      "2222",
    );
    expect(screen.getByRole("combobox", { name: "배정 필터" })).toHaveValue(
      "task-1",
    );
  });
});
