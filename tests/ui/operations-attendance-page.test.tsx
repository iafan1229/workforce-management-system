import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttendanceOperationsPage from "@/app/(console)/operations/[workDate]/attendance/page";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      if (table === "attendances") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [],
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
                data: [],
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
              data: [],
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }),
}));

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
      screen.getByRole("heading", { name: "출근자 및 배정 상태" }),
    ).toBeInTheDocument();
  });
});
