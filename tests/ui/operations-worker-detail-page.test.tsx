import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OperationsWorkerDetailPage from "@/app/(console)/operations/[workDate]/workers/[workerId]/page";

const workersServiceMocks = vi.hoisted(() => ({
  getWorkerDetailById: vi.fn(),
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
  getWorkerDetailById: workersServiceMocks.getWorkerDetailById,
}));

describe("OperationsWorkerDetailPage", () => {
  it("배정 히스토리를 count 높은 순으로 보여준다", async () => {
    workersServiceMocks.getWorkerDetailById.mockResolvedValue({
      id: "worker-1",
      name: "김현수",
      phone: "01012345678",
      lastAttendanceDate: "2026-05-25",
      status: "active",
      operationState: "attended_assigned",
      selectedDateAssignment: {
        taskTypeId: "task-1",
        taskTypeLabel: "세척",
        source: "manual_assignment",
      },
      skills: [
        {
          taskTypeId: "task-1",
          label: "세척",
          count: 12,
          updatedAt: "2026-05-20T09:00:00.000Z",
        },
        {
          taskTypeId: "task-2",
          label: "피딩",
          count: 3,
          updatedAt: "2026-05-18T09:00:00.000Z",
        },
      ],
      recentAssignments: [],
    });

    const page = await OperationsWorkerDetailPage({
      params: Promise.resolve({
        workDate: "2026-05-25",
        workerId: "de305d54-75b4-431b-adb2-eb6b9e546014",
      }),
    });

    render(page);

    expect(
      screen.getByRole("link", { name: "출근/배정으로 돌아가기" }),
    ).toHaveAttribute("href", "/operations/2026-05-25/attendance");
    expect(
      screen.getByRole("heading", { name: "배정 히스토리" }),
    ).toBeInTheDocument();
    expect(screen.getByText("세척")).toBeInTheDocument();
    expect(screen.getByText("12회")).toBeInTheDocument();
    expect(screen.getByText("피딩")).toBeInTheDocument();
    expect(screen.getByText("3회")).toBeInTheDocument();

    const historyItems = screen.getAllByRole("listitem");
    expect(historyItems[0]).toHaveTextContent("세척");
    expect(historyItems[1]).toHaveTextContent("피딩");
  });
});
