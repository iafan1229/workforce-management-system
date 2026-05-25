import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OperationsDashboardPage from "@/app/(console)/operations/[workDate]/page";

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
                    workers: {
                      id: "worker-1",
                      name: "김현우",
                      phone: "010-1111-2222",
                    },
                  },
                  {
                    id: "attendance-2",
                    work_date: "2026-05-25",
                    workers: {
                      id: "worker-2",
                      name: "박서준",
                      phone: "010-3333-4444",
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
                    source: "manual",
                    task_types: { label: "피킹" },
                  },
                ],
                error: null,
              }),
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

describe("OperationsDashboardPage", () => {
  it("작업일 기준 현재 출근/배정 사람 리스트를 테이블로 보여준다", async () => {
    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(screen.getByText("선택 작업일 2026-05-25")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "운영 대시보드" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "현재 출근/배정 인원" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "이름" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "전화번호" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "배정" })).toBeInTheDocument();
    expect(screen.getByText("김현우")).toBeInTheDocument();
    expect(screen.getByText("박서준")).toBeInTheDocument();
    expect(screen.getByText("피킹")).toBeInTheDocument();
    expect(screen.getByText("미배정")).toBeInTheDocument();
  });
});
