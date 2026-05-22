import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createWorkersRepository,
  getWorkerDetailById,
  WORKER_STATUS_LABELS,
} from "@/features/workers/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkerStatus } from "@/lib/worker-status";

type WorkerDetailPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

export default async function WorkerDetailPage({
  params,
}: WorkerDetailPageProps) {
  const { workerId } = await params;

  if (!isUuid(workerId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const workerDetail = await getWorkerDetailById(
    workerId,
    createWorkersRepository(supabase),
  );

  if (!workerDetail) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link href="/workers" className="text-sm text-stone-500 underline">
          인력 조회로 돌아가기
        </Link>
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
                연락처와 최근 출근일 기준으로 운영 상태를 확인합니다.
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
                <dt className="text-stone-500">표시 중인 최근 배정</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {workerDetail.recentAssignments.length}건
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">숙련 업무</h2>
              <p className="text-sm text-stone-600">
                누적 배정 기반으로 집계된 업무 스킬 목록입니다.
              </p>
            </div>

            {workerDetail.skills.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
                아직 누적된 숙련 업무 기록이 없습니다.
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
              <h2 className="text-lg font-semibold text-stone-950">운영 상태</h2>
              <p className="text-sm text-stone-600">
                마지막 출근일 기준으로 자동 산정한 상태입니다.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">현재 상태</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">
                {WORKER_STATUS_LABELS[workerDetail.status]}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {getStatusDescription(workerDetail.status)}
              </p>
            </div>
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

function getStatusDescription(status: WorkerStatus) {
  if (status === "active") {
    return "최근 30일 안에 출근 이력이 있어 바로 배정 검토가 가능합니다.";
  }

  if (status === "inactive") {
    return "최근 출근이 30일을 넘겨 당장 운영 투입 전 확인이 필요합니다.";
  }

  return "출근 이력이 오래되었거나 없어 재활성화 확인이 필요한 상태입니다.";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
