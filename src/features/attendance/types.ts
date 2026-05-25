export type AttendanceWorker = {
  id: string;
  name: string;
  phone: string;
};

type RelationValue<T> = T | T[] | null;

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
});

export type RegisterAttendanceInput = {
  name: string;
  phone: string;
  workDate: string;
};

export type CreateWorkerInput = Pick<AttendanceWorker, "name" | "phone">;

export type CreateAttendanceInput = {
  workerId: string;
  workDate: string;
};

export type AttendanceRepository = {
  findWorkerByPhone: (phone: string) => Promise<AttendanceWorker | null>;
  createWorker: (input: CreateWorkerInput) => Promise<AttendanceWorker>;
  createAttendance: (input: CreateAttendanceInput) => Promise<unknown>;
};

export type AttendanceAssignment = {
  assignmentId: string;
  taskTypeId: string;
  taskTypeLabel: string;
  source: string;
};

type TaskTypeLabelRow = {
  label: string;
};

type AttendanceAssignmentQueryRow = {
  id: string;
  task_type_id: string;
  source: string;
  task_types: RelationValue<TaskTypeLabelRow>;
};

export type AttendanceQueryRow = {
  id: string;
  work_date: string;
  workers: RelationValue<AttendanceWorker>;
  assignments?: RelationValue<AttendanceAssignmentQueryRow>;
};

export type AttendanceListRow = {
  id: string;
  work_date: string;
  worker: AttendanceWorker | null;
  assignment: AttendanceAssignment | null;
};

export function getTodayInSeoul(date = new Date()) {
  return SEOUL_DATE_FORMATTER.format(date);
}

export function toAttendanceListRows(rows: AttendanceQueryRow[]) {
  return rows.map((row) => ({
    id: row.id,
    work_date: row.work_date,
    worker: Array.isArray(row.workers) ? row.workers[0] ?? null : row.workers,
    assignment: mapAttendanceAssignment(row.assignments),
  }));
}

function mapAttendanceAssignment(
  assignments: RelationValue<AttendanceAssignmentQueryRow> | undefined,
) {
  const assignment = Array.isArray(assignments)
    ? assignments[0] ?? null
    : assignments ?? null;

  if (!assignment) {
    return null;
  }

  const taskType = Array.isArray(assignment.task_types)
    ? assignment.task_types[0] ?? null
    : assignment.task_types;

  return {
    assignmentId: assignment.id,
    taskTypeId: assignment.task_type_id,
    taskTypeLabel: taskType?.label ?? "미분류",
    source: assignment.source,
  };
}
