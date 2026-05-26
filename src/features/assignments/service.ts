import type { ManualAssignmentRepository } from "./types";

export async function saveManualAssignment(
  input: {
    workerId: string;
    taskTypeId: string;
    workDate: string;
  },
  repo: ManualAssignmentRepository,
) {
  const attendance = await repo.findAttendance({
    workerId: input.workerId,
    workDate: input.workDate,
  });

  if (!attendance) {
    throw new Error("선택한 날짜에 출근 등록이 되어 있지 않습니다.");
  }

  const existing = await repo.findAssignment({
    workerId: input.workerId,
    workDate: input.workDate,
  });

  if (!existing) {
    await repo.createAssignment({
      workerId: input.workerId,
      taskTypeId: input.taskTypeId,
      workDate: input.workDate,
      source: "manual_assignment",
    });
    await repo.incrementSkill({
      workerId: input.workerId,
      taskTypeId: input.taskTypeId,
    });
    return;
  }

  if (existing.taskTypeId === input.taskTypeId) {
    await repo.updateAssignment({
      assignmentId: existing.id,
      taskTypeId: input.taskTypeId,
      source: "manual_assignment",
    });
    return;
  }

  await repo.decrementSkill({
    workerId: input.workerId,
    taskTypeId: existing.taskTypeId,
  });
  await repo.updateAssignment({
    assignmentId: existing.id,
    taskTypeId: input.taskTypeId,
    source: "manual_assignment",
  });
  await repo.incrementSkill({
    workerId: input.workerId,
    taskTypeId: input.taskTypeId,
  });
}

export async function clearManualAssignment(
  input: {
    workerId: string;
    workDate: string;
  },
  repo: Pick<
    ManualAssignmentRepository,
    "findAssignment" | "deleteAssignment" | "decrementSkill"
  >,
) {
  const existing = await repo.findAssignment({
    workerId: input.workerId,
    workDate: input.workDate,
  });

  if (!existing) {
    throw new Error("해당 날짜의 기존 배정을 찾을 수 없습니다.");
  }

  await repo.deleteAssignment({
    assignmentId: existing.id,
  });
  await repo.decrementSkill({
    workerId: input.workerId,
    taskTypeId: existing.taskTypeId,
  });
}
