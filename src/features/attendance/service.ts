import { normalizePhone } from "@/lib/phone";
import type {
  AttendanceRepository,
  RegisterAttendanceInput,
} from "@/features/attendance/types";

const WORK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function registerAttendance(
  input: RegisterAttendanceInput,
  repo: AttendanceRepository,
) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("이름을 입력해 주세요.");
  }

  validateWorkDate(input.workDate);

  const normalizedPhone = normalizePhone(input.phone);
  const existingWorker = await repo.findWorkerByPhone(normalizedPhone);
  const worker =
    existingWorker ??
    (await createWorkerWithRecovery({
      repo,
      name: trimmedName,
      phone: normalizedPhone,
    }));

  try {
    await repo.createAttendance({
      workerId: worker.id,
      workDate: input.workDate,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("이미 해당 날짜에 출근 등록된 인력입니다.");
    }

    throw error;
  }
}

async function createWorkerWithRecovery({
  repo,
  name,
  phone,
}: {
  repo: AttendanceRepository;
  name: string;
  phone: string;
}) {
  try {
    return await repo.createWorker({ name, phone });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const worker = await repo.findWorkerByPhone(phone);

    if (worker) {
      return worker;
    }

    throw error;
  }
}

function validateWorkDate(workDate: string) {
  if (!WORK_DATE_PATTERN.test(workDate)) {
    throw new Error("근무일 형식이 올바르지 않습니다.");
  }

  const parsedDate = new Date(`${workDate}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== workDate
  ) {
    throw new Error("근무일 형식이 올바르지 않습니다.");
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
