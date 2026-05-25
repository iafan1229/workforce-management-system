import Link from "next/link";
import {
  createWorkersRepository,
  getWorkerDetailByPhone,
  WORKER_STATUS_LABELS,
  type WorkerOperationState,
} from "@/features/workers/service";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkerStatus } from "@/lib/worker-status";

type OperationsWorkersPageProps = {
  params: Promise<{
    workDate: string;
  }>;
  searchParams: Promise<{
    phone?: string;
  }>;
};

export default async function OperationsWorkersPage({
  params,
  searchParams,
}: OperationsWorkersPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const { phone } = await searchParams;
  const submittedPhone = typeof phone === "string" ? phone.trim() : "";

  let workerDetail = null;
  let errorMessage: string | null = null;

  if (submittedPhone) {
    const supabase = await createSupabaseServerClient();

    try {
      workerDetail = await getWorkerDetailByPhone(
        submittedPhone,
        createWorkersRepository(supabase),
        { workDate: validDate },
      );

      if (!workerDetail) {
        errorMessage = "해당 전화번호로 등록된 인력을 찾을 수 없습니다.";
      }
    } catch (error) {
      errorMessage = getErrorMessage(error);
    }
  }

  const action = workerDetail
    ? getOperationAction({
        workerId: workerDetail.id,
        workDate: validDate,
        operationState: workerDetail.operationState,
      })
    : null;

  return (
    <main className="space-y-8">
      <header className="console-panel-strong rounded-[2rem] px-7 py-8 md:px-8">
        <p className="text-sm font-medium text-amber-700">
          선택 작업일 {validDate}
        </p>
        <h1 className="mt-3 text-[clamp(2.2rem,3vw,3.4rem)] font-semibold tracking-[-0.05em] text-stone-950">
          인력 조회
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          선택한 날짜 기준 출근/배정 상태를 보고 운영 화면으로 이동합니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          action={`/operations/${validDate}/workers`}
          className="console-panel-strong space-y-4 rounded-[2rem] p-6"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              전화번호 검색
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              휴대폰 번호로 인력을 찾아 선택 날짜 기준 액션을 확인합니다.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">휴대폰 번호</span>
            <input
              required
              name="phone"
              defaultValue={submittedPhone}
              className="console-input"
              placeholder="010-1234-5678"
            />
          </label>

          <button className="console-button-primary w-full">
            인력 조회
          </button>
        </form>

        <section className="console-panel rounded-[2rem] p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              조회 결과
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              검색 결과가 있으면 선택 날짜 기준 운영 액션을 함께 제공합니다.
            </p>
          </div>

          {!submittedPhone ? (
            <p className="console-status-note mt-6 text-sm text-stone-500">
              휴대폰 번호를 입력하면 인력 기본 정보와 선택 날짜 기준 상태를 보여줍니다.
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

          {workerDetail && action ? (
            <article className="mt-6 space-y-4 rounded-[1.8rem] border border-white/70 bg-white/70 p-5">
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
                  <dt className="text-stone-500">선택 날짜 상태</dt>
                  <dd className="mt-1 font-medium text-stone-900">
                    {getOperationStateLabel(workerDetail.operationState)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={action.href}
                  className="console-button-primary rounded-2xl px-4 py-3 text-sm"
                >
                  {action.label}
                </Link>
                <Link
                  href={`/operations/${validDate}/workers/${workerDetail.id}`}
                  className="console-button-secondary rounded-2xl px-4 py-3 text-sm"
                >
                  상세 화면 보기
                </Link>
              </div>
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
