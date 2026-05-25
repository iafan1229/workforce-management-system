import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AttendanceQueryRow,
  AttendanceStatus,
} from "@/features/attendance/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AttendanceListFallbackRow = Omit<AttendanceQueryRow, "status">;

type AttendanceRecordRow = {
  id: string;
  worker_id: string;
  work_date: string;
  status: AttendanceStatus;
};

type AttendanceRecordFallbackRow = Omit<AttendanceRecordRow, "status">;

const ATTENDANCE_SELECT = "id, work_date, status, workers(id, name, phone)";
const ATTENDANCE_SELECT_FALLBACK = "id, work_date, workers(id, name, phone)";
const ATTENDANCE_RECORD_SELECT = "id, worker_id, work_date, status";
const ATTENDANCE_RECORD_SELECT_FALLBACK = "id, worker_id, work_date";

export async function listAttendancesByDate(
  supabase: SupabaseServerClient,
  workDate: string,
) {
  const { data, error } = await supabase
    .from("attendances")
    .select(ATTENDANCE_SELECT)
    .eq("work_date", workDate)
    .order("created_at", { ascending: false });

  if (!error) {
    return (data ?? []) as AttendanceQueryRow[];
  }

  if (!isAttendanceStatusColumnMissing(error)) {
    throw error;
  }

  const fallback = await supabase
    .from("attendances")
    .select(ATTENDANCE_SELECT_FALLBACK)
    .eq("work_date", workDate)
    .order("created_at", { ascending: false });

  if (fallback.error) {
    throw fallback.error;
  }

  return ((fallback.data ?? []) as AttendanceListFallbackRow[]).map((row) => ({
    ...row,
    status: "checked_in" as const,
  }));
}

export async function findAttendanceByWorkerAndDate(
  supabase: SupabaseServerClient,
  input: {
    workerId: string;
    workDate: string;
  },
) {
  const { data, error } = await supabase
    .from("attendances")
    .select(ATTENDANCE_RECORD_SELECT)
    .eq("worker_id", input.workerId)
    .eq("work_date", input.workDate)
    .maybeSingle();

  if (!error) {
    return mapAttendanceRecord(data as AttendanceRecordRow | null);
  }

  if (!isAttendanceStatusColumnMissing(error)) {
    throw error;
  }

  const fallback = await supabase
    .from("attendances")
    .select(ATTENDANCE_RECORD_SELECT_FALLBACK)
    .eq("worker_id", input.workerId)
    .eq("work_date", input.workDate)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }

  return mapFallbackAttendanceRecord(
    fallback.data as AttendanceRecordFallbackRow | null,
  );
}

export async function insertAttendance(
  supabase: SupabaseServerClient,
  input: {
    workerId: string;
    workDate: string;
    status: AttendanceStatus;
  },
) {
  const { error } = await supabase.from("attendances").insert({
    worker_id: input.workerId,
    work_date: input.workDate,
    status: input.status,
  });

  if (!error) {
    return;
  }

  if (!isAttendanceStatusColumnMissing(error)) {
    throw error;
  }

  if (input.status === "scheduled") {
    throw createAttendanceStatusMigrationError();
  }

  const fallback = await supabase.from("attendances").insert({
    worker_id: input.workerId,
    work_date: input.workDate,
  });

  if (fallback.error) {
    throw fallback.error;
  }
}

export async function updateAttendanceStatus(
  supabase: SupabaseServerClient,
  input: {
    attendanceId: string;
    status: AttendanceStatus;
  },
) {
  const { error } = await supabase
    .from("attendances")
    .update({
      status: input.status,
    })
    .eq("id", input.attendanceId);

  if (!error) {
    return;
  }

  if (isAttendanceStatusColumnMissing(error)) {
    throw createAttendanceStatusMigrationError();
  }

  throw error;
}

export async function upsertAttendances(
  supabase: SupabaseServerClient,
  input: {
    workDate: string;
    workerIds: string[];
    status: AttendanceStatus;
  },
) {
  const { error } = await supabase.from("attendances").upsert(
    input.workerIds.map((workerId) => ({
      worker_id: workerId,
      work_date: input.workDate,
      status: input.status,
    })),
    {
      onConflict: "worker_id,work_date",
      ignoreDuplicates: true,
    },
  );

  if (!error) {
    return;
  }

  if (!isAttendanceStatusColumnMissing(error)) {
    throw error;
  }

  const fallback = await supabase.from("attendances").upsert(
    input.workerIds.map((workerId) => ({
      worker_id: workerId,
      work_date: input.workDate,
    })),
    {
      onConflict: "worker_id,work_date",
      ignoreDuplicates: true,
    },
  );

  if (fallback.error) {
    throw fallback.error;
  }
}

export function isAttendanceStatusColumnMissing(error: unknown) {
  return (
    readErrorField(error, "code") === "42703" &&
    readErrorField(error, "message").includes("attendances.status")
  );
}

export function createAttendanceStatusMigrationError() {
  return new Error(
    "출근예정 기능을 사용하려면 attendances.status 마이그레이션을 먼저 적용해 주세요.",
  );
}

function mapAttendanceRecord(row: AttendanceRecordRow | null) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    workerId: row.worker_id,
    workDate: row.work_date,
    status: row.status,
  };
}

function mapFallbackAttendanceRecord(row: AttendanceRecordFallbackRow | null) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    workerId: row.worker_id,
    workDate: row.work_date,
    status: "checked_in" as const,
  };
}

function readErrorField(error: unknown, field: "code" | "message") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return "";
  }

  const value = (error as Record<string, unknown>)[field];

  return typeof value === "string" ? value : "";
}
