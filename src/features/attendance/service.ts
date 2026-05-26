import { normalizePhone } from "@/lib/phone";
import { parseWorkDate } from "@/features/operations/date";
import type {
  AttendanceRecord,
  AttendanceRepository,
  RegisterAttendanceInput,
  AttendanceStatus,
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
  validateAttendanceStatus(input.status);

  const normalizedPhone = normalizePhone(input.phone);
  const existingWorker = await repo.findWorkerByPhone(normalizedPhone);
  const worker =
    existingWorker ??
    (await createWorkerWithRecovery({
      repo,
      name: trimmedName,
      phone: normalizedPhone,
    }));

  const existingAttendance = await repo.findAttendance({
    workerId: worker.id,
    workDate: input.workDate,
  });

  if (existingAttendance) {
    await handleExistingAttendance({
      existingAttendance,
      nextStatus: input.status,
      repo,
    });
    return;
  }

  try {
    await repo.createAttendance({
      workerId: worker.id,
      workDate: input.workDate,
      status: input.status,
    });
  } catch (error) {
    if (!isAttendanceConflict(error)) {
      throw error;
    }

    const conflictedAttendance = await repo.findAttendance({
      workerId: worker.id,
      workDate: input.workDate,
    });

    if (conflictedAttendance) {
      await handleExistingAttendance({
        existingAttendance: conflictedAttendance,
        nextStatus: input.status,
        repo,
      });
      return;
    }

    throw new Error(getDuplicateAttendanceMessage(input.status));
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

function validateAttendanceStatus(status: string): asserts status is AttendanceStatus {
  if (status === "scheduled" || status === "checked_in") {
    return;
  }

  throw new Error("출근 상태 형식이 올바르지 않습니다.");
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

async function handleExistingAttendance({
  existingAttendance,
  nextStatus,
  repo,
}: {
  existingAttendance: AttendanceRecord;
  nextStatus: AttendanceStatus;
  repo: AttendanceRepository;
}) {
  if (
    existingAttendance.status === "scheduled" &&
    nextStatus === "checked_in"
  ) {
    await repo.updateAttendanceStatus({
      attendanceId: existingAttendance.id,
      status: "checked_in",
    });
    return;
  }

  throw new Error(getDuplicateAttendanceMessage(existingAttendance.status));
}

function getDuplicateAttendanceMessage(status: AttendanceStatus) {
  if (status === "scheduled") {
    return "이미 해당 날짜에 출근예정 등록된 인력입니다.";
  }

  return "이미 해당 날짜에 출근 완료 등록된 인력입니다.";
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
