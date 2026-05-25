import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createWorkersRepository,
  getWorkerDetailById,
  WORKER_STATUS_LABELS,
  type WorkerOperationState,
} from "@/features/workers/service";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkerStatus } from "@/lib/worker-status";

type WorkerDetailPageProps = {
  params: Promise<{
    workDate: string;
    workerId: string;
  }>;
};

export default async function OperationsWorkerDetailPage({
  params,
}: WorkerDetailPageProps) {
  const { workDate, workerId } = await params;
  const validDate = parseWorkDate(workDate);

  if (!isUuid(workerId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const workerDetail = await getWorkerDetailById(
    workerId,
    createWorkersRepository(supabase),
    { workDate: validDate },
  );

  if (!workerDetail) {
    notFound();
  }

  const action = getOperationAction({
    workerId: workerDetail.id,
    workDate: validDate,
    operationState: workerDetail.operationState,
  });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/operations/${validDate}/attendance`}
          className="text-sm text-stone-500 underline"
        >
          출근/배정으로 돌아가기
        </Link>
        <p className="text-sm font-medium text-orange-700">
          선택 작업일 {validDate}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">
              {workerDetail.name}
            </h1>
            <p className="text-sm text-stone-600">{workerDetail.phone}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(workerDetail.status)}`}
          >
            {WORKER_STATUS_LABELS[workerDetail.status]}
          </span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">기본 프로필</h2>
              <p className="text-sm text-stone-600">
                연락처와 최근 출근일, 선택 날짜 기준 운영 상태를 함께 봅니다.
              </p>
            </div>

            <dl className="mt-6 grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
              <div className="rounded-xl bg-stone-50 px-4 py-3">
                <dt className="text-stone-500">이름</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {workerDetail.name}
                </dd>
              </div>
              <div className="rounded-xl bg-stone-50 px-4 py-3">
                <dt className="text-stone-500">휴대폰 번호</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {workerDetail.phone}
                </dd>
              </div>
              <div className="rounded-xl bg-stone-50 px-4 py-3">
                <dt className="text-stone-500">마지막 출근일</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {workerDetail.lastAttendanceDate ?? "출근 기록 없음"}
                </dd>
              </div>
              <div className="rounded-xl bg-stone-50 px-4 py-3">
                <dt className="text-stone-500">선택 날짜 상태</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {getOperationStateLabel(workerDetail.operationState)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">배정 히스토리</h2>
              <p className="text-sm text-stone-600">
                누적 배정 count가 높은 업무부터 정리한 히스토리입니다.
              </p>
            </div>

            {workerDetail.skills.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
                아직 누적된 배정 히스토리가 없습니다.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {workerDetail.skills.map((skill) => (
                  <li
                    key={skill.taskTypeId}
                    className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{skill.label}</p>
                      <p className="text-sm text-stone-500">
                        최근 갱신 {skill.updatedAt.slice(0, 10)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-stone-700">
                      {skill.count}회
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">선택 날짜 운영</h2>
              <p className="text-sm text-stone-600">
                선택한 날짜 기준으로 지금 가능한 운영 액션을 안내합니다.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">현재 상태</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">
                {getOperationStateLabel(workerDetail.operationState)}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {workerDetail.selectedDateAssignment
                  ? `현재 배정: ${workerDetail.selectedDateAssignment.taskTypeLabel}`
                  : "선택 날짜에 아직 배정되지 않았습니다."}
              </p>
            </div>

            <Link
              href={action.href}
              className="mt-4 inline-flex rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
            >
              {action.label}
            </Link>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">최근 배정</h2>
              <p className="text-sm text-stone-600">
                최근 5건의 작업 배정을 최신순으로 보여줍니다.
              </p>
            </div>

            {workerDetail.recentAssignments.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
                최근 배정 기록이 없습니다.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {workerDetail.recentAssignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="rounded-xl border border-stone-200 px-4 py-3"
                  >
                    <p className="font-medium text-stone-900">
                      {assignment.taskTypeLabel}
                    </p>
                    <p className="text-sm text-stone-600">
                      {assignment.workDate}
                    </p>
                    <p className="text-xs text-stone-500">
                      반영 방식: {assignment.source}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

function getStatusBadgeClass(status: WorkerStatus) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "inactive") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-stone-200 text-stone-700";
}

function getOperationStateLabel(operationState: WorkerOperationState | undefined) {
  if (operationState === "attended_assigned") {
    return "출근 및 배정 완료";
  }

  if (operationState === "attended_unassigned") {
    return "출근 완료 / 미배정";
  }

  return "미출근";
}

function getOperationAction({
  workerId,
  workDate,
  operationState,
}: {
  workerId: string;
  workDate: string;
  operationState: WorkerOperationState | undefined;
}) {
  if (operationState === "attended_assigned") {
    return {
      label: "오늘 배정 수정",
      href: `/operations/${workDate}/attendance?focusWorkerId=${workerId}`,
    };
  }

  if (operationState === "attended_unassigned") {
    return {
      label: "배정하기",
      href: `/operations/${workDate}/attendance?focusWorkerId=${workerId}`,
    };
  }

  return {
    label: "출근 등록하러 가기",
    href: `/operations/${workDate}/attendance`,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
