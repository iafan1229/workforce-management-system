import {
  toAttendanceListRows,
  type AttendanceQueryRow,
} from "@/features/attendance/types";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OperationsDashboardPageProps = {
  params: Promise<{
    workDate: string;
  }>;
};

type AssignmentRow = {
  worker_id: string;
  task_types: { label: string } | { label: string }[] | null;
};

export default async function OperationsDashboardPage({
  params,
}: OperationsDashboardPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const supabase = await createSupabaseServerClient();

  const [{ data: attendanceData, error: attendanceError }, { data: assignmentData, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("attendances")
        .select("id, work_date, workers(id, name, phone)")
        .eq("work_date", validDate)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select("worker_id, task_types(label)")
        .eq("work_date", validDate)
        .order("created_at", { ascending: false }),
    ]);

  if (attendanceError) {
    throw attendanceError;
  }

  if (assignmentError) {
    throw assignmentError;
  }

  const assignmentMap = new Map(
    ((assignmentData ?? []) as AssignmentRow[]).map((assignment) => [
      assignment.worker_id,
      readSingleRelation(assignment.task_types)?.label ?? "미배정",
    ]),
  );

  const attendedWorkers = toAttendanceListRows(
    (attendanceData ?? []) as AttendanceQueryRow[],
  ).map((row) => ({
    id: row.id,
    workerId: row.worker?.id ?? null,
    name: row.worker?.name ?? "이름 없음",
    phone: row.worker?.phone ?? "전화번호 없음",
    taskTypeLabel: row.worker ? assignmentMap.get(row.worker.id) ?? "미배정" : "미배정",
  }));

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

        {attendedWorkers.length === 0 ? (
          <p className="console-status-note mt-6 text-sm text-stone-500">
            아직 등록된 출근이 없습니다.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/70">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-stone-100/90 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">전화번호</th>
                  <th className="px-4 py-3 font-medium">배정</th>
                </tr>
              </thead>
              <tbody>
                {attendedWorkers.map((worker) => (
                  <tr key={worker.id} className="border-t border-stone-200/80">
                    <td className="px-4 py-3 font-medium text-stone-950">
                      {worker.name}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{worker.phone}</td>
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
