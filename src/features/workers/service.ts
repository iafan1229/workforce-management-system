import type { SupabaseClient } from "@supabase/supabase-js";
import { getTodayInSeoul } from "@/features/attendance/types";
import { normalizePhone } from "@/lib/phone";
import {
  deriveWorkerStatus,
  type WorkerStatus,
} from "@/lib/worker-status";

type RelationValue<T> = T | T[] | null;

export type WorkerRecord = {
  id: string;
  name: string;
  phone: string;
  lastAttendanceDate: string | null;
};

export type WorkerSkill = {
  taskTypeId: string;
  label: string;
  count: number;
  updatedAt: string;
};

export type WorkerAssignment = {
  id: string;
  workDate: string;
  taskTypeLabel: string;
  source: string;
};

export type WorkerOperationState =
  | "not_attended"
  | "attended_unassigned"
  | "attended_assigned";

export type SelectedDateAssignment = {
  taskTypeId: string;
  taskTypeLabel: string;
  source: string;
};

export type WorkerDetail = WorkerRecord & {
  status: WorkerStatus;
  operationState?: WorkerOperationState;
  selectedDateAssignment?: SelectedDateAssignment | null;
  skills: WorkerSkill[];
  recentAssignments: WorkerAssignment[];
};

export type WorkerLookupRepository = {
  findWorkerByPhone: (phone: string) => Promise<WorkerRecord | null>;
  findWorkerById: (workerId: string) => Promise<WorkerRecord | null>;
  listWorkerSkills: (workerId: string) => Promise<WorkerSkill[]>;
  listRecentAssignments: (
    workerId: string,
    limit: number,
  ) => Promise<WorkerAssignment[]>;
  findAttendanceByWorkerAndDate?: (
    workerId: string,
    workDate: string,
  ) => Promise<{ workDate: string } | null>;
  findAssignmentByWorkerAndDate?: (
    workerId: string,
    workDate: string,
  ) => Promise<SelectedDateAssignment | null>;
};

export type TodayOperationsRepository = {
  countAttendancesByDate: (workDate: string) => Promise<number>;
  countAssignmentsByDate: (workDate: string) => Promise<number>;
};

export type WorkersRepository = WorkerLookupRepository &
  TodayOperationsRepository;

export type WorkerDetailOptions = {
  today?: string;
  workDate?: string;
  recentAssignmentLimit?: number;
};

export type TodayOperationsSummary = {
  today: string;
  attendanceCount: number;
  assignmentCount: number;
  isUploadCompleted: boolean;
};

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  active: "활동",
  inactive: "비활동",
  dormant: "휴면",
};

export async function getWorkerDetailByPhone(
  phone: string,
  repo: Pick<
    WorkerLookupRepository,
    "findWorkerByPhone" | "listWorkerSkills" | "listRecentAssignments"
  >,
  options: WorkerDetailOptions = {},
) {
  const normalizedPhone = normalizePhone(phone);
  const worker = await repo.findWorkerByPhone(normalizedPhone);

  return buildWorkerDetail(worker, repo, options);
}

export async function getWorkerDetailById(
  workerId: string,
  repo: Pick<
    WorkerLookupRepository,
    "findWorkerById" | "listWorkerSkills" | "listRecentAssignments"
  >,
  options: WorkerDetailOptions = {},
) {
  const worker = await repo.findWorkerById(workerId);

  return buildWorkerDetail(worker, repo, options);
}

export async function getTodayOperationsSummary(
  repo: TodayOperationsRepository,
  options: {
    today?: string;
  } = {},
): Promise<TodayOperationsSummary> {
  const today = options.today ?? getTodayInSeoul();
  const [attendanceCount, assignmentCount] = await Promise.all([
    repo.countAttendancesByDate(today),
    repo.countAssignmentsByDate(today),
  ]);

  return {
    today,
    attendanceCount,
    assignmentCount,
    isUploadCompleted: assignmentCount > 0,
  };
}

async function buildWorkerDetail(
  worker: WorkerRecord | null,
  repo: Pick<
    WorkerLookupRepository,
    | "listWorkerSkills"
    | "listRecentAssignments"
    | "findAttendanceByWorkerAndDate"
    | "findAssignmentByWorkerAndDate"
  >,
  options: WorkerDetailOptions,
): Promise<WorkerDetail | null> {
  if (!worker) {
    return null;
  }

  const today = options.today ?? getTodayInSeoul();
  const workDate = options.workDate;
  const recentAssignmentLimit = options.recentAssignmentLimit ?? 5;
  const [skills, recentAssignments] = await Promise.all([
    repo.listWorkerSkills(worker.id),
    repo.listRecentAssignments(worker.id, recentAssignmentLimit),
  ]);
  const [attendanceForDate, assignmentForDate] =
    workDate && repo.findAttendanceByWorkerAndDate && repo.findAssignmentByWorkerAndDate
      ? await Promise.all([
          repo.findAttendanceByWorkerAndDate(worker.id, workDate),
          repo.findAssignmentByWorkerAndDate(worker.id, workDate),
        ])
      : [null, null];

  return {
    ...worker,
    status: deriveWorkerStatus({
      lastAttendanceDate: worker.lastAttendanceDate,
      today,
    }),
    ...(workDate
      ? {
          operationState: deriveWorkerOperationState({
            hasDateContext: true,
            attendanceForDate,
            assignmentForDate,
          }),
          selectedDateAssignment: assignmentForDate,
        }
      : {}),
    skills: sortWorkerSkills(skills),
    recentAssignments,
  };
}

export function createWorkersRepository(
  supabase: SupabaseClient,
): WorkersRepository {
  return {
    findWorkerByPhone: async (phone) => {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, phone")
        .eq("phone", phone)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return attachLastAttendanceDate(supabase, (data as WorkerBaseRow | null) ?? null);
    },
    findWorkerById: async (workerId) => {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, phone")
        .eq("id", workerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return attachLastAttendanceDate(supabase, (data as WorkerBaseRow | null) ?? null);
    },
    listWorkerSkills: async (workerId) => {
      const { data, error } = await supabase
        .from("worker_skills")
        .select("task_type_id, count, updated_at, task_types(label)")
        .eq("worker_id", workerId)
        .order("count", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as WorkerSkillQueryRow[]).map((row) => ({
        taskTypeId: row.task_type_id,
        label: readSingleRelation(row.task_types)?.label ?? "미분류",
        count: row.count,
        updatedAt: row.updated_at,
      }));
    },
    listRecentAssignments: async (workerId, limit) => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, work_date, source, task_types(label)")
        .eq("worker_id", workerId)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return ((data ?? []) as AssignmentQueryRow[]).map((row) => ({
        id: row.id,
        workDate: row.work_date,
        taskTypeLabel: readSingleRelation(row.task_types)?.label ?? "미분류",
        source: row.source,
      }));
    },
    findAttendanceByWorkerAndDate: async (workerId, workDate) => {
      const { data, error } = await supabase
        .from("attendances")
        .select("work_date")
        .eq("worker_id", workerId)
        .eq("work_date", workDate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? { workDate: data.work_date } : null;
    },
    findAssignmentByWorkerAndDate: async (workerId, workDate) => {
      const { data, error } = await supabase
        .from("assignments")
        .select("task_type_id, source, task_types(label)")
        .eq("worker_id", workerId)
        .eq("work_date", workDate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            taskTypeId: data.task_type_id,
            taskTypeLabel: readSingleRelation(
              (data as AssignmentForDateQueryRow).task_types,
            )?.label ?? "미분류",
            source: data.source,
          }
        : null;
    },
    countAttendancesByDate: async (workDate) => {
      const { count, error } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .eq("work_date", workDate);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    countAssignmentsByDate: async (workDate) => {
      const { count, error } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("work_date", workDate);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  };
}

function deriveWorkerOperationState({
  hasDateContext,
  attendanceForDate,
  assignmentForDate,
}: {
  hasDateContext: boolean,
  attendanceForDate: { workDate: string } | null;
  assignmentForDate: SelectedDateAssignment | null;
}): WorkerOperationState | undefined {
  if (!hasDateContext) {
    return undefined;
  }

  if (!attendanceForDate) {
    return "not_attended";
  }

  if (!assignmentForDate) {
    return "attended_unassigned";
  }

  return "attended_assigned";
}

function sortWorkerSkills(skills: WorkerSkill[]) {
  return [...skills].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

type WorkerBaseRow = {
  id: string;
  name: string;
  phone: string;
};

type AttendanceDateRow = {
  work_date: string;
};

type LabelRelationRow = {
  label: string;
};

type WorkerSkillQueryRow = {
  task_type_id: string;
  count: number;
  updated_at: string;
  task_types: RelationValue<LabelRelationRow>;
};

type AssignmentQueryRow = {
  id: string;
  work_date: string;
  source: string;
  task_types: RelationValue<LabelRelationRow>;
};

type AssignmentForDateQueryRow = {
  task_type_id: string;
  source: string;
  task_types: RelationValue<LabelRelationRow>;
};

async function attachLastAttendanceDate(
  supabase: SupabaseClient,
  worker: WorkerBaseRow | null,
): Promise<WorkerRecord | null> {
  if (!worker) {
    return null;
  }

  const { data, error } = await supabase
    .from("attendances")
    .select("work_date")
    .eq("worker_id", worker.id)
    .order("work_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const attendance = data as AttendanceDateRow | null;

  return {
    ...worker,
    lastAttendanceDate: attendance?.work_date ?? null,
  };
}

function readSingleRelation<T>(value: RelationValue<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}
