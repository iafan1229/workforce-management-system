import {
  toAttendanceListRows,
  type AttendanceListRow,
  type AttendanceQueryRow,
} from "@/features/attendance/types";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  clearManualAssignmentAction,
  registerAttendanceForDateAction,
  saveManualAssignmentAction,
} from "./actions";

type OperationsAttendancePageProps = {
  params: Promise<{
    workDate: string;
  }>;
  searchParams: Promise<{
    error?: string;
    focusWorkerId?: string;
  }>;
};

export default async function OperationsAttendancePage({
  params,
  searchParams,
}: OperationsAttendancePageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const { error, focusWorkerId } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: attendanceData, error: attendanceError }, { data: assignmentData, error: assignmentError }, { data: taskTypeData, error: taskTypeError }] =
    await Promise.all([
      supabase
        .from("attendances")
        .select("id, work_date, workers(id, name, phone)")
        .eq("work_date", validDate)
        .order("created_at", { ascending: false }),
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

  if (attendanceError) {
    throw attendanceError;
  }

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

  const attendedWorkers = toAttendanceListRows(
    (attendanceData ?? []) as AttendanceQueryRow[],
  ).map((row) => ({
    ...row,
    assignment: row.worker ? assignmentMap.get(row.worker.id) ?? null : null,
  }));

  return (
    <main className="space-y-8">
      <header className="console-panel-strong rounded-[2rem] px-7 py-8 md:px-8">
        <p className="text-sm font-medium text-amber-700">
          선택 작업일 {validDate}
        </p>
        <h1 className="mt-3 text-[clamp(2.2rem,3vw,3.4rem)] font-semibold tracking-[-0.05em] text-stone-950">
          출근 및 수동 배정
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          출근 등록과 현재 배정 상태를 같은 날짜 기준으로 관리합니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          action={registerAttendanceForDateAction}
          className="console-panel-strong space-y-4 rounded-[2rem] p-6"
        >
          <input type="hidden" name="workDate" value={validDate} />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              선택 날짜 출근 등록
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              신규 인력 생성과 출근 등록을 함께 처리합니다.
            </p>
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

          <button className="console-button-primary w-full">
            출근 등록
          </button>
        </form>

        <section className="console-panel rounded-[2rem] p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              출근자 및 배정 상태
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              선택한 날짜 기준으로 미배정, 배정 저장, 배정 해제를 관리합니다.
            </p>
          </div>

          {attendedWorkers.length === 0 ? (
            <p className="console-status-note mt-6 text-sm text-stone-500">
              아직 등록된 출근이 없습니다.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {attendedWorkers.map((row) => (
                <li
                  key={row.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    row.worker?.id === focusWorkerId
                      ? "border-orange-300 bg-orange-50/80"
                      : "border-white/70 bg-white/65"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">
                        {row.worker?.name ?? "이름 없음"}
                      </p>
                      <p className="text-sm text-stone-600">
                        {row.worker?.phone ?? "전화번호 없음"}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-stone-500">현재 상태</p>
                      <p className="mt-1 font-medium text-stone-900">
                        {row.assignment?.taskTypeLabel ?? "미배정"}
                      </p>
                    </div>
                  </div>

                  {row.worker ? (
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <form action={saveManualAssignmentAction} className="flex flex-1 flex-wrap items-end gap-3">
                        <input type="hidden" name="workDate" value={validDate} />
                        <input type="hidden" name="workerId" value={row.worker.id} />
                        <label className="min-w-[220px] flex-1 space-y-2">
                          <span className="text-sm font-medium text-stone-700">
                            업무 카테고리
                          </span>
                          <select
                            name="taskTypeId"
                            required
                            defaultValue={row.assignment?.taskTypeId ?? ""}
                            className="console-select text-sm"
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

                        <button className="console-button-primary rounded-2xl px-4 py-3 text-sm">
                          {row.assignment ? "수정" : "배정하기"}
                        </button>
                      </form>

                      {row.assignment ? (
                        <form action={clearManualAssignmentAction}>
                          <input type="hidden" name="workDate" value={validDate} />
                          <input type="hidden" name="workerId" value={row.worker.id} />
                          <button className="console-button-secondary rounded-2xl px-4 py-3 text-sm">
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
