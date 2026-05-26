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
import {
  clearManualAssignmentAction,
  registerAttendanceForDateAction,
  saveManualAssignmentAction,
} from "./actions";
import Link from "next/link";

type OperationsAttendancePageProps = {
  params: Promise<{
    workDate: string;
  }>;
  searchParams: Promise<{
    error?: string;
    focusWorkerId?: string;
    name?: string | string[];
    phone?: string | string[];
    taskTypeId?: string | string[];
  }>;
};

export default async function OperationsAttendancePage({
  params,
  searchParams,
}: OperationsAttendancePageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const resolvedSearchParams = await searchParams;
  const { error, focusWorkerId } = resolvedSearchParams;
  const filters = readAttendanceFilterState(resolvedSearchParams);
  const supabase = await createSupabaseServerClient();
  const [attendanceData, { data: assignmentData, error: assignmentError }, { data: taskTypeData, error: taskTypeError }] =
    await Promise.all([
      listAttendancesByDate(supabase, validDate),
      supabase
        .from("assignments")
        .select("id, worker_id, task_type_id, source, task_types(label)")
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
        assignmentId: assignment.id,
        taskTypeId: assignment.task_type_id,
        taskTypeLabel: readSingleRelation(assignment.task_types)?.label ?? "미분류",
        source: assignment.source,
      },
    ]),
  );

  const attendedWorkers = toAttendanceListRows(attendanceData).map((row) => ({
    ...row,
    assignment: row.worker ? assignmentMap.get(row.worker.id) ?? null : null,
  }));
  const filteredWorkers = sortRowsByTaskTypeAndName(
    attendedWorkers
      .filter((row) => {
        const name = row.worker?.name ?? "";
        const phone = row.worker?.phone ?? "";
        const taskTypeId = row.assignment?.taskTypeId ?? null;

        return (
          matchesNameFilter(name, filters.name) &&
          matchesPhoneFilter(phone, filters.phone) &&
          matchesTaskTypeFilter(taskTypeId, filters.taskTypeId)
        );
      })
      .map((row) => ({
        ...row,
        name: row.worker?.name ?? "이름 없음",
        phone: row.worker?.phone ?? "전화번호 없음",
        taskTypeLabel: row.assignment?.taskTypeLabel ?? "미배정",
      })),
  );

  return (
    <main className="space-y-8">
      <header className="console-panel-strong rounded-[2rem] px-7 py-8 md:px-8">
        <p className="text-sm font-medium text-amber-700">
          선택 작업일 {validDate}
        </p>
        <h1 className="mt-3 text-[clamp(2.2rem,3vw,3.4rem)] font-semibold tracking-[-0.05em] text-stone-950">
          출근 및 수동 배정
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          action={registerAttendanceForDateAction}
          className="console-panel-strong space-y-4 rounded-[2rem] p-6"
        >
          <input type="hidden" name="workDate" value={validDate} />
          <input type="hidden" name="searchName" value={filters.name} />
          <input type="hidden" name="searchPhone" value={filters.phone} />
          <input type="hidden" name="searchTaskTypeId" value={filters.taskTypeId} />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              선택 날짜 출근 등록
            </h2>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">이름</span>
            <input
              required
              name="name"
              className="console-input"
              placeholder="홍길동"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">휴대폰 번호</span>
            <input
              required
              name="phone"
              className="console-input"
              placeholder="010-1234-5678"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              name="status"
              value="scheduled"
              className="console-button-secondary flex-1"
            >
              출근예정 등록
            </button>
            <button
              type="submit"
              name="status"
              value="checked_in"
              className="console-button-primary flex-1"
            >
              출근완료 등록
            </button>
          </div>
        </form>

        <section className="console-panel rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
            출근자 및 배정 상태
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
                {(taskTypeData ?? []).map((taskType) => (
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
                href={`/operations/${validDate}/attendance`}
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
                : "아직 등록된 인력이 없습니다."}
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {filteredWorkers.map((row) => (
                <li
                  key={row.id}
                  data-attendance-status={row.status}
                  className={getAttendanceCardClass(
                    row.status,
                    row.worker?.id === focusWorkerId,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-900">
                          {row.worker?.name ?? "이름 없음"}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getAttendanceBadgeClass(row.status)}`}
                        >
                          {ATTENDANCE_STATUS_LABELS[row.status]}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">
                        {row.worker?.phone ?? "전화번호 없음"}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        배정 상태
                      </p>
                      <p className="mt-2 inline-flex rounded-full bg-stone-900 px-3 py-1.5 text-sm font-medium text-white">
                        {row.assignment?.taskTypeLabel ?? "미배정"}
                      </p>
                    </div>
                  </div>

                  {row.worker ? (
                    <div className="console-action-bar mt-5">
                      <Link
                        href={`/operations/${validDate}/workers/${row.worker.id}`}
                        className="console-action-link"
                      >
                        상세보기
                      </Link>
                      <form
                        action={saveManualAssignmentAction}
                        className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <input type="hidden" name="workDate" value={validDate} />
                        <input type="hidden" name="workerId" value={row.worker.id} />
                        <input type="hidden" name="searchName" value={filters.name} />
                        <input type="hidden" name="searchPhone" value={filters.phone} />
                        <input
                          type="hidden"
                          name="searchTaskTypeId"
                          value={filters.taskTypeId}
                        />
                        <label className="min-w-0 space-y-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            업무 카테고리
                          </span>
                          <select
                            name="taskTypeId"
                            required
                            defaultValue={row.assignment?.taskTypeId ?? ""}
                            className="console-select min-w-0 rounded-[1.2rem] border-stone-300/70 bg-white text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                          >
                            <option value="" disabled>
                              업무를 선택하세요
                            </option>
                            {(taskTypeData ?? []).map((taskType) => (
                              <option key={taskType.id} value={taskType.id}>
                                {taskType.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button className="console-button-primary min-w-[112px] rounded-[1.1rem] px-4 py-3 text-sm shadow-[0_16px_36px_-22px_rgba(28,25,23,0.7)]">
                          {row.assignment ? "수정" : "배정하기"}
                        </button>
                      </form>

                      {row.assignment ? (
                        <form action={clearManualAssignmentAction}>
                          <input type="hidden" name="workDate" value={validDate} />
                          <input type="hidden" name="workerId" value={row.worker.id} />
                          <input type="hidden" name="searchName" value={filters.name} />
                          <input type="hidden" name="searchPhone" value={filters.phone} />
                          <input
                            type="hidden"
                            name="searchTaskTypeId"
                            value={filters.taskTypeId}
                          />
                          <button className="console-button-danger">
                            배정 해제
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

type TaskTypeRow = {
  id: string;
  label: string;
};

type AssignmentRow = {
  id: string;
  worker_id: string;
  task_type_id: string;
  source: string;
  task_types: { label: string } | { label: string }[] | null;
};

function readSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getAttendanceCardClass(status: AttendanceStatus, isFocused: boolean) {
  const focusClass = isFocused
    ? "border-orange-300 ring-1 ring-orange-200"
    : "border-white/70";

  if (status === "scheduled") {
    return `console-scheduled-card rounded-[1.7rem] border px-4 py-4 ${focusClass}`;
  }

  return `rounded-[1.7rem] border bg-white/75 px-4 py-4 shadow-[0_24px_54px_-34px_rgba(28,25,23,0.34)] ${focusClass}`;
}

function getAttendanceBadgeClass(status: AttendanceStatus) {
  if (status === "checked_in") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-stone-200 text-stone-600";
}
