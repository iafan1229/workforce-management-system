import type {
  ApplyAssignmentBatchRow,
  AssignmentUploadRepository,
  ImportAssignmentUploadInput,
  ImportAssignmentUploadResult,
} from "./types";
import { validateAssignmentRows } from "./validate-assignment-upload";

export async function importAssignmentUpload(
  input: ImportAssignmentUploadInput,
  repo: AssignmentUploadRepository,
): Promise<ImportAssignmentUploadResult> {
  const rows = validateAssignmentRows(input.rows);

  if (rows.length === 0) {
    throw new Error("업로드할 데이터 행이 없습니다.");
  }

  const phones = unique(rows.map((row) => row.phone));
  const labels = unique(rows.map((row) => row.task));

  const [workers, attendances, taskTypes] = await Promise.all([
    repo.findWorkersByPhones(phones),
    repo.findAttendancesByDate(input.workDate),
    repo.findTaskTypesByLabels(labels),
  ]);

  const workerMap = new Map(workers.map((worker) => [worker.phone, worker]));
  const attendanceSet = new Set(attendances.map((attendance) => attendance.workerId));
  const taskTypeMap = new Map(
    taskTypes.map((taskType) => [taskType.label, taskType]),
  );

  const assignmentRows = rows.map((row): ApplyAssignmentBatchRow => {
    const worker = workerMap.get(row.phone);

    if (!worker) {
      throw new Error(
        `${row.rowNumber}행: ${row.phone} 전화번호의 인력을 찾을 수 없습니다.`,
      );
    }

    if (worker.name !== row.name) {
      throw new Error(
        `${row.rowNumber}행: ${row.phone} 전화번호의 인력 이름이 등록 정보와 일치하지 않습니다.`,
      );
    }

    if (!attendanceSet.has(worker.id)) {
      throw new Error(
        `${row.rowNumber}행: ${row.name}은(는) ${input.workDate} 출근 등록이 되어 있지 않습니다.`,
      );
    }

    const taskType = taskTypeMap.get(row.task);

    if (!taskType) {
      throw new Error(
        `${row.rowNumber}행: ${row.task} 업무 카테고리를 찾을 수 없습니다.`,
      );
    }

    return {
      workerId: worker.id,
      taskTypeId: taskType.id,
    };
  });

  await repo.applyAssignmentBatch({
    workDate: input.workDate,
    rows: assignmentRows,
  });

  return {
    importedCount: assignmentRows.length,
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}
