export type WorkerStatus = "active" | "inactive" | "dormant";

type DeriveWorkerStatusInput = {
  lastAttendanceDate: string | null;
  today: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export function deriveWorkerStatus({
  lastAttendanceDate,
  today,
}: DeriveWorkerStatusInput): WorkerStatus {
  if (lastAttendanceDate === null) {
    return "dormant";
  }

  const lastAttendance = parseDateOnly(lastAttendanceDate);
  const currentDate = parseDateOnly(today);
  const diffDays = Math.floor(
    (currentDate.getTime() - lastAttendance.getTime()) / MS_PER_DAY,
  );

  if (diffDays < 0) {
    return "dormant";
  }

  if (diffDays <= 30) {
    return "active";
  }

  if (diffDays <= 180) {
    return "inactive";
  }

  return "dormant";
}
