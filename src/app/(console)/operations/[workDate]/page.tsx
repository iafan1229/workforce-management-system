import Link from "next/link";
import {
  ATTENDANCE_STATUS_LABELS,
  toAttendanceListRows,
  type AttendanceStatus,
} from "@/features/attendance/types";
import { listAttendancesByDate } from "@/features/attendance/status-column-compat";
import {
  hasActiveAttendanceFilters,
  matchesNameFilter,
  matchesPhoneFilter,
  matchesTaskTypeFilter,
  readAttendanceFilterState,
  sortRowsByTaskTypeAndName,
} from "@/features/operations/attendance-filters";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OperationsDashboardPageProps = {
  params: Promise<{
    workDate: string;
  }>;
  searchParams: Promise<{
    name?: string | string[];
    phone?: string | string[];
    taskTypeId?: string | string[];
  }>;
};

type AssignmentRow = {
  worker_id: string;
  task_type_id: string;
  task_types: { label: string } | { label: string }[] | null;
};

type TaskTypeRow = {
  id: string;
  label: string;
};

type DashboardAttendanceRow = {
  id: string;
  workerId: string | null;
  name: string;
  phone: string;
  status: AttendanceStatus;
  taskTypeId: string | null;
  taskTypeLabel: string;
};

export default async function OperationsDashboardPage({
  params,
  searchParams,
}: OperationsDashboardPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const filters = readAttendanceFilterState(await searchParams);
  const supabase = await createSupabaseServerClient();

  const [
    attendanceData,
    { data: assignmentData, error: assignmentError },
    { data: taskTypeData, error: taskTypeError },
  ] =
    await Promise.all([
      listAttendancesByDate(supabase, validDate),
      supabase
        .from("assignments")
        .select("worker_id, task_type_id, task_types(label)")
        .eq("work_date", validDate)
        .order("created_at", { ascending: false }),
      supabase
        .from("task_types")
        .select("id, label")
        .order("label", { ascending: true }),
    ]);

  if (assignmentError) {
    throw assignmentError;
  }

  if (taskTypeError) {
    throw taskTypeError;
  }

  const assignmentMap = new Map(
    ((assignmentData ?? []) as AssignmentRow[]).map((assignment) => [
      assignment.worker_id,
      {
        taskTypeId: assignment.task_type_id,
        taskTypeLabel: readSingleRelation(assignment.task_types)?.label ?? "미배정",
      },
    ]),
  );

  const attendedWorkers = toAttendanceListRows(attendanceData).map((row) => ({
    id: row.id,
    workerId: row.worker?.id ?? null,
    name: row.worker?.name ?? "이름 없음",
    phone: row.worker?.phone ?? "전화번호 없음",
    status: row.status,
    taskTypeId: row.worker ? assignmentMap.get(row.worker.id)?.taskTypeId ?? null : null,
    taskTypeLabel:
      row.worker ? assignmentMap.get(row.worker.id)?.taskTypeLabel ?? "미배정" : "미배정",
  }));
  const filteredWorkers = sortRowsByTaskTypeAndName(
    attendedWorkers.filter((worker) => {
      return (
        matchesNameFilter(worker.name, filters.name) &&
        matchesPhoneFilter(worker.phone, filters.phone) &&
        matchesTaskTypeFilter(worker.taskTypeId, filters.taskTypeId)
      );
    }),
  );

  return (
    <main className="space-y-6">
      <header className="console-panel-strong rounded-[2rem] px-7 py-8 md:px-8">
        <p className="text-sm font-medium text-amber-700">
          선택 작업일 {validDate}
        </p>
        <h1 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.05em] text-stone-950">
          운영 대시보드
        </h1>
      </header>

      <section className="console-panel rounded-[2rem] p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-stone-950">
          현재 출근/배정 인원
        </h2>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1 space-y-2">
            <span className="text-sm font-medium text-stone-700">이름 검색</span>
            <input
              name="name"
              defaultValue={filters.name}
              className="console-input"
              placeholder="예: 김현"
            />
          </label>
          <label className="min-w-[220px] flex-1 space-y-2">
            <span className="text-sm font-medium text-stone-700">전화번호 검색</span>
            <input
              name="phone"
              defaultValue={filters.phone}
              className="console-input"
              placeholder="예: 5678"
            />
          </label>
          <label className="min-w-[220px] flex-1 space-y-2">
            <span className="text-sm font-medium text-stone-700">배정 필터</span>
            <select
              name="taskTypeId"
              defaultValue={filters.taskTypeId}
              className="console-select text-sm"
            >
              <option value="">전체 배정</option>
              {((taskTypeData ?? []) as TaskTypeRow[]).map((taskType) => (
                <option key={taskType.id} value={taskType.id}>
                  {taskType.label}
                </option>
              ))}
            </select>
          </label>
          <button className="console-button-primary px-4 py-3 text-sm">
            검색
          </button>
          {hasActiveAttendanceFilters(filters) ? (
            <Link
              href={`/operations/${validDate}`}
              className="console-button-secondary px-4 py-3 text-sm"
            >
              초기화
            </Link>
          ) : null}
        </form>

        {filteredWorkers.length === 0 ? (
          <p className="console-status-note mt-6 text-sm text-stone-500">
            {hasActiveAttendanceFilters(filters)
              ? "조건에 맞는 인력이 없습니다."
              : "아직 등록된 출근이 없습니다."}
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/70">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-stone-100/90 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">전화번호</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">배정</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    data-attendance-status={worker.status}
                    className={getDashboardRowClass(worker.status)}
                  >
                    <td className="px-4 py-3 font-medium text-stone-950">
                      {worker.name}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{worker.phone}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {ATTENDANCE_STATUS_LABELS[worker.status]}
                    </td>
                    <td className="px-4 py-3 text-stone-950">
                      {worker.taskTypeLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function readSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getDashboardRowClass(status: AttendanceStatus) {
  if (status === "scheduled") {
    return "console-scheduled-row border-t border-stone-200/80";
  }

  return "border-t border-stone-200/80";
}
