import { normalizePhone } from "@/lib/phone";
import { parseWorkDate } from "@/features/operations/date";
import type {
  AttendanceRepository,
  RegisterAttendanceInput,
} from "@/features/attendance/types";

export async function registerAttendance(
  input: RegisterAttendanceInput,
  repo: AttendanceRepository,
) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("이름을 입력해 주세요.");
  }

  validateAttendanceWorkDate(input.workDate);

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
    if (isAttendanceConflict(error)) {
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
    if (!isWorkerPhoneConflict(error)) {
      throw error;
    }

    const worker = await repo.findWorkerByPhone(phone);

    if (worker) {
      return worker;
    }

    throw error;
  }
}

function isUniqueViolation(error: unknown) {
  return readErrorField(error, "code") === "23505";
}

function validateAttendanceWorkDate(workDate: string) {
  try {
    parseWorkDate(workDate);
  } catch {
    throw new Error("근무일 형식이 올바르지 않습니다.");
  }
}

function isWorkerPhoneConflict(error: unknown) {
  return matchesUniqueConstraint(error, {
    constraintName: "workers_phone_key",
    detailSnippet: "Key (phone)=",
  });
}

function isAttendanceConflict(error: unknown) {
  return matchesUniqueConstraint(error, {
    constraintName: "attendances_worker_id_work_date_key",
    detailSnippet: "Key (worker_id, work_date)=",
  });
}

function matchesUniqueConstraint(
  error: unknown,
  {
    constraintName,
    detailSnippet,
  }: {
    constraintName: string;
    detailSnippet: string;
  },
) {
  return (
    isUniqueViolation(error) &&
    (readErrorField(error, "message").includes(constraintName) ||
      readErrorField(error, "details").includes(detailSnippet))
  );
}

function readErrorField(error: unknown, field: "code" | "message" | "details") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return "";
  }

  const value = (error as Record<string, unknown>)[field];

  return typeof value === "string" ? value : "";
}
