import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AttendanceOperationsPage from "@/app/(console)/operations/[workDate]/attendance/page";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      if (table === "attendances") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [
                  {
                    id: "attendance-1",
                    work_date: "2026-05-25",
                    status: "checked_in",
                    workers: {
                      id: "worker-1",
                      name: "김현수",
                      phone: "010-1234-5678",
                    },
                  },
                  {
                    id: "attendance-2",
                    work_date: "2026-05-25",
                    status: "scheduled",
                    workers: {
                      id: "worker-2",
                      name: "박서준",
                      phone: "010-9999-8888",
                    },
                  },
                ],
                error: null,
              }),
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
                    source: "manual_assignment",
                    task_types: {
                      label: "세척",
                    },
                  },
                  {
                    id: "assignment-2",
                    worker_id: "worker-2",
                    task_type_id: "task-2",
                    source: "manual_assignment",
                    task_types: {
                      label: "피딩",
                    },
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
                { id: "task-1", label: "세척" },
                { id: "task-2", label: "피딩" },
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
});

describe("AttendanceOperationsPage", () => {
  it("출근 등록과 배정 관리 영역을 함께 보여준다", async () => {
    const page = await AttendanceOperationsPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "출근 및 수동 배정" }),
    ).toBeInTheDocument();
    expect(screen.getByText("선택 작업일 2026-05-25")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "선택 날짜 출근 등록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "출근예정 등록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "출근완료 등록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "출근자 및 배정 상태" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "이름 검색" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "전화번호 검색" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "배정 필터" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "상세보기" })[0],
    ).toHaveAttribute(
      "href",
      "/operations/2026-05-25/workers/worker-1",
    );

    const scheduledCard = screen.getByText("박서준").closest("li");
    expect(scheduledCard).toHaveAttribute("data-attendance-status", "scheduled");
    expect(scheduledCard).toHaveClass("console-scheduled-card");
  });

  it("이름, 전화번호, 배정 필터가 있으면 일치하는 인원만 보여준다", async () => {
    const page = await AttendanceOperationsPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({
        name: "현수",
        phone: "5678",
        taskTypeId: "task-1",
      }),
    });

    render(page);

    expect(screen.getAllByText("김현수")[0]).toBeInTheDocument();
    expect(screen.queryByText("박서준")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "이름 검색" })).toHaveValue("현수");
    expect(screen.getByRole("textbox", { name: "전화번호 검색" })).toHaveValue(
      "5678",
    );
    expect(screen.getByRole("combobox", { name: "배정 필터" })).toHaveValue(
      "task-1",
    );
  });
});
