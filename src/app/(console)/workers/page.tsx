import Link from "next/link";
import {
  createWorkersRepository,
  getWorkerDetailByPhone,
  WORKER_STATUS_LABELS,
} from "@/features/workers/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkerStatus } from "@/lib/worker-status";

type WorkersPageProps = {
  searchParams: Promise<{
    phone?: string;
  }>;
};

export default async function WorkersPage({
  searchParams,
}: WorkersPageProps) {
  const params = await searchParams;
  const submittedPhone =
    typeof params.phone === "string" ? params.phone.trim() : "";

  let workerDetail = null;
  let errorMessage: string | null = null;

  if (submittedPhone) {
    const supabase = await createSupabaseServerClient();

    try {
      workerDetail = await getWorkerDetailByPhone(
        submittedPhone,
        createWorkersRepository(supabase),
      );

      if (!workerDetail) {
        errorMessage = "해당 전화번호로 등록된 인력을 찾을 수 없습니다.";
      }
    } catch (error) {
      errorMessage = getErrorMessage(error);
    }
  }

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">인력 조회</h1>
        <p className="text-sm text-stone-600">
          휴대폰 번호로 인력을 빠르게 찾고 상세 화면으로 이동할 수 있습니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          action="/workers"
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">전화번호 검색</h2>
            <p className="text-sm text-stone-600">
              등록된 휴대폰 번호를 입력하면 최근 배정과 상태를 함께 확인합니다.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">휴대폰 번호</span>
            <input
              required
              name="phone"
              defaultValue={submittedPhone}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              placeholder="010-1234-5678"
            />
          </label>

          <button className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white">
            인력 조회
          </button>
        </form>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">조회 결과</h2>
            <p className="text-sm text-stone-600">
              검색 결과가 있으면 상세 화면 이동 링크를 함께 제공합니다.
            </p>
          </div>

          {!submittedPhone ? (
            <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
              휴대폰 번호를 입력하면 인력 기본 정보와 현재 상태를 보여줍니다.
            </p>
          ) : null}

          {errorMessage ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          ) : null}

          {workerDetail ? (
            <article className="mt-6 space-y-4 rounded-2xl border border-stone-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">
                    {workerDetail.name}
                  </h3>
                  <p className="text-sm text-stone-600">{workerDetail.phone}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(workerDetail.status)}`}
                >
                  {WORKER_STATUS_LABELS[workerDetail.status]}
                </span>
              </div>

              <dl className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <dt className="text-stone-500">마지막 출근일</dt>
                  <dd className="mt-1 font-medium text-stone-900">
                    {workerDetail.lastAttendanceDate ?? "출근 기록 없음"}
                  </dd>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <dt className="text-stone-500">등록된 숙련 업무 수</dt>
                  <dd className="mt-1 font-medium text-stone-900">
                    {workerDetail.skills.length}개
                  </dd>
                </div>
              </dl>

              <Link
                href={`/workers/${workerDetail.id}`}
                className="inline-flex rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
              >
                상세 화면 보기
              </Link>
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "인력 조회 중 오류가 발생했습니다.";
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
