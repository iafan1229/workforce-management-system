import { describe, expect, it, vi } from "vitest";
import { clearManualAssignment, saveManualAssignment } from "./service";

describe("saveManualAssignment", () => {
  it("기존 배정이 없으면 새 배정을 만들고 경험을 증가시킨다", async () => {
    const repo = {
      findAttendance: vi
        .fn()
        .mockResolvedValue({ workerId: "worker-1", workDate: "2026-05-25" }),
      findAssignment: vi.fn().mockResolvedValue(null),
      createAssignment: vi.fn().mockResolvedValue(undefined),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      incrementSkill: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn(),
    };

    await saveManualAssignment(
      {
        workerId: "worker-1",
        taskTypeId: "task-1",
        workDate: "2026-05-25",
      },
      repo,
    );

    expect(repo.createAssignment).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
      workDate: "2026-05-25",
      source: "manual_assignment",
    });
    expect(repo.incrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
    });
  });

  it("기존 배정이 다른 업무면 기존 경험을 줄이고 새 업무로 갱신한다", async () => {
    const repo = {
      findAttendance: vi
        .fn()
        .mockResolvedValue({ workerId: "worker-1", workDate: "2026-05-25" }),
      findAssignment: vi
        .fn()
        .mockResolvedValue({ id: "assignment-1", taskTypeId: "task-old" }),
      createAssignment: vi.fn(),
      updateAssignment: vi.fn().mockResolvedValue(undefined),
      deleteAssignment: vi.fn(),
      incrementSkill: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn().mockResolvedValue(undefined),
    };

    await saveManualAssignment(
      {
        workerId: "worker-1",
        taskTypeId: "task-new",
        workDate: "2026-05-25",
      },
      repo,
    );

    expect(repo.decrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-old",
    });
    expect(repo.updateAssignment).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
      taskTypeId: "task-new",
      source: "manual_assignment",
    });
    expect(repo.incrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-new",
    });
  });
});

describe("clearManualAssignment", () => {
  it("배정을 삭제하고 경험을 줄인다", async () => {
    const repo = {
      findAssignment: vi
        .fn()
        .mockResolvedValue({ id: "assignment-1", taskTypeId: "task-1" }),
      deleteAssignment: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn().mockResolvedValue(undefined),
    };

    await clearManualAssignment(
      {
        workerId: "worker-1",
        workDate: "2026-05-25",
      },
      repo,
    );

    expect(repo.deleteAssignment).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
    });
    expect(repo.decrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
    });
  });
});
