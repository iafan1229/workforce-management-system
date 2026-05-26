import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OperationsWorkersPage from "@/app/(console)/operations/[workDate]/workers/page";

const workersServiceMocks = vi.hoisted(() => ({
  getWorkerDetailByPhone: vi.fn(),
  createWorkersRepository: vi.fn(() => ({ mocked: true })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ mocked: true }),
}));

vi.mock("@/features/workers/service", () => ({
  WORKER_STATUS_LABELS: {
    active: "활동",
    inactive: "비활동",
    dormant: "휴면",
  },
  createWorkersRepository: workersServiceMocks.createWorkersRepository,
  getWorkerDetailByPhone: workersServiceMocks.getWorkerDetailByPhone,
}));

describe("OperationsWorkersPage", () => {
  it("선택 날짜 기준 상태에 맞는 CTA를 보여준다", async () => {
    workersServiceMocks.getWorkerDetailByPhone.mockResolvedValue({
      id: "worker-1",
      name: "김현수",
      phone: "01012345678",
      lastAttendanceDate: "2026-05-25",
      status: "active",
      operationState: "attended_unassigned",
      selectedDateAssignment: null,
      skills: [],
      recentAssignments: [],
    });

    const page = await OperationsWorkersPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({ phone: "010-1234-5678" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "인력 조회" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "배정하기" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/attendance?focusWorkerId=worker-1",
    );
  });
});
