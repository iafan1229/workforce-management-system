export type AttendanceWorker = {
  id: string;
  name: string;
  phone: string;
};

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

export type AttendanceQueryRow = {
  id: string;
  work_date: string;
  workers: AttendanceWorker | AttendanceWorker[] | null;
};

export type AttendanceListRow = {
  id: string;
  work_date: string;
  worker: AttendanceWorker | null;
};

export function getTodayInSeoul(date = new Date()) {
  return SEOUL_DATE_FORMATTER.format(date);
}

export function toAttendanceListRows(rows: AttendanceQueryRow[]) {
  return rows.map((row) => ({
    id: row.id,
    work_date: row.work_date,
    worker: Array.isArray(row.workers) ? row.workers[0] ?? null : row.workers,
  }));
}
