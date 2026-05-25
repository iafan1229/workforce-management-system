import { describe, expect, it, vi } from "vitest";

async function loadWorkersService() {
  try {
    const servicePath = "./service";

    return await import(/* @vite-ignore */ servicePath);
  } catch {
    return null;
  }
}

describe("getWorkerDetailByPhone", () => {
  it("전화번호를 정규화해 상세 정보와 파생 상태를 함께 반환한다", async () => {
    const service = await loadWorkersService();

    expect(service?.getWorkerDetailByPhone).toBeTypeOf("function");

    if (!service?.getWorkerDetailByPhone) {
      return;
    }

    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-1",
        name: "김현수",
        phone: "01012345678",
        lastAttendanceDate: "2026-05-20",
      }),
      findWorkerById: vi.fn(),
      listWorkerSkills: vi.fn().mockResolvedValue([
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
      ]),
      listRecentAssignments: vi.fn().mockResolvedValue([
        {
          id: "assignment-2",
          workDate: "2026-05-21",
          taskTypeLabel: "피딩",
          source: "excel_upload",
        },
        {
          id: "assignment-1",
          workDate: "2026-05-19",
          taskTypeLabel: "세척",
          source: "excel_upload",
        },
      ]),
      countAttendancesByDate: vi.fn(),
      countAssignmentsByDate: vi.fn(),
      findAttendanceByWorkerAndDate: vi.fn(),
      findAssignmentByWorkerAndDate: vi.fn(),
    };

    const detail = await service.getWorkerDetailByPhone(
      "010-1234-5678",
      repo,
      { today: "2026-05-21" },
    );

    expect(repo.findWorkerByPhone).toHaveBeenCalledWith("01012345678");
    expect(repo.listWorkerSkills).toHaveBeenCalledWith("worker-1");
    expect(repo.listRecentAssignments).toHaveBeenCalledWith("worker-1", 5);
    expect(detail).toEqual({
      id: "worker-1",
      name: "김현수",
      phone: "01012345678",
      lastAttendanceDate: "2026-05-20",
      status: "active",
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
      recentAssignments: [
        {
          id: "assignment-2",
          workDate: "2026-05-21",
          taskTypeLabel: "피딩",
          source: "excel_upload",
        },
        {
          id: "assignment-1",
          workDate: "2026-05-19",
          taskTypeLabel: "세척",
          source: "excel_upload",
        },
      ],
    });
  });

  it("선택 날짜 출근/배정 상태로 운영 CTA 기준 상태를 계산한다", async () => {
    const service = await loadWorkersService();

    expect(service?.getWorkerDetailByPhone).toBeTypeOf("function");

    if (!service?.getWorkerDetailByPhone) {
      return;
    }

    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-1",
        name: "김현수",
        phone: "01012345678",
        lastAttendanceDate: "2026-05-25",
      }),
      findWorkerById: vi.fn(),
      listWorkerSkills: vi.fn().mockResolvedValue([]),
      listRecentAssignments: vi.fn().mockResolvedValue([]),
      findAttendanceByWorkerAndDate: vi
        .fn()
        .mockResolvedValue({ workDate: "2026-05-25" }),
      findAssignmentByWorkerAndDate: vi.fn().mockResolvedValue(null),
      countAttendancesByDate: vi.fn(),
      countAssignmentsByDate: vi.fn(),
    };

    const detail = await service.getWorkerDetailByPhone(
      "010-1234-5678",
      repo,
      { today: "2026-05-25", workDate: "2026-05-25" },
    );

    expect(detail?.operationState).toBe("attended_unassigned");
    expect(detail?.selectedDateAssignment).toBeNull();
    expect(repo.findAttendanceByWorkerAndDate).toHaveBeenCalledWith(
      "worker-1",
      "2026-05-25",
    );
    expect(repo.findAssignmentByWorkerAndDate).toHaveBeenCalledWith(
      "worker-1",
      "2026-05-25",
    );
  });
});

describe("getTodayOperationsSummary", () => {
  it("오늘 출근 수, 배정 수, 업로드 완료 여부를 함께 반환한다", async () => {
    const service = await loadWorkersService();

    expect(service?.getTodayOperationsSummary).toBeTypeOf("function");

    if (!service?.getTodayOperationsSummary) {
      return;
    }

    const repo = {
      countAttendancesByDate: vi.fn().mockResolvedValue(14),
      countAssignmentsByDate: vi.fn().mockResolvedValue(9),
    };

    const summary = await service.getTodayOperationsSummary(repo, {
      today: "2026-05-21",
    });

    expect(repo.countAttendancesByDate).toHaveBeenCalledWith("2026-05-21");
    expect(repo.countAssignmentsByDate).toHaveBeenCalledWith("2026-05-21");
    expect(summary).toEqual({
      today: "2026-05-21",
      attendanceCount: 14,
      assignmentCount: 9,
      isUploadCompleted: true,
    });
  });

  it("오늘 배정이 없으면 업로드 미완료 상태를 반환한다", async () => {
    const service = await loadWorkersService();

    expect(service?.getTodayOperationsSummary).toBeTypeOf("function");

    if (!service?.getTodayOperationsSummary) {
      return;
    }

    const repo = {
      countAttendancesByDate: vi.fn().mockResolvedValue(8),
      countAssignmentsByDate: vi.fn().mockResolvedValue(0),
    };

    const summary = await service.getTodayOperationsSummary(repo, {
      today: "2026-05-21",
    });

    expect(summary.isUploadCompleted).toBe(false);
  });
});

describe("getWorkerDetailById", () => {
  it("인력이 없으면 null을 반환하고 추가 조회를 하지 않는다", async () => {
    const service = await loadWorkersService();

    expect(service?.getWorkerDetailById).toBeTypeOf("function");

    if (!service?.getWorkerDetailById) {
      return;
    }

    const repo = {
      findWorkerById: vi.fn().mockResolvedValue(null),
      listWorkerSkills: vi.fn(),
      listRecentAssignments: vi.fn(),
    };

    const detail = await service.getWorkerDetailById(
      "de305d54-75b4-431b-adb2-eb6b9e546014",
      repo,
      { today: "2026-05-21" },
    );

    expect(detail).toBeNull();
    expect(repo.listWorkerSkills).not.toHaveBeenCalled();
    expect(repo.listRecentAssignments).not.toHaveBeenCalled();
  });
});
