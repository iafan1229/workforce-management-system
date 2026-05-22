import Link from "next/link";
import {
  createWorkersRepository,
  getTodayOperationsSummary,
} from "@/features/workers/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const QUICK_LINKS = [
  {
    href: "/attendance",
    title: "출근 등록",
    description: "오늘 출근자를 등록하고 실시간으로 목록을 확인합니다.",
  },
  {
    href: "/workers",
    title: "인력 조회",
    description: "휴대폰 번호로 인력을 찾아 상태와 최근 배정을 확인합니다.",
  },
  {
    href: "/upload",
    title: "배정 업로드",
    description: "엑셀 업로드로 오늘 배정을 한 번에 반영합니다.",
  },
];

export default async function ConsolePage() {
  const supabase = await createSupabaseServerClient();
  const summary = await getTodayOperationsSummary(
    createWorkersRepository(supabase),
  );
  const uploadStatus = summary.isUploadCompleted ? "완료" : "미완료";

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">오늘 운영</h1>
        <p className="text-sm text-stone-600">
          {summary.today} 기준 출근과 배정 현황을 빠르게 확인합니다.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">오늘 출근 인원</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {summary.attendanceCount}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            출근 등록 화면에서 당일 인력 현황을 바로 이어서 확인할 수 있습니다.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">오늘 배정 건수</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {summary.assignmentCount}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            엑셀 업로드로 반영된 오늘 작업 배정 수를 집계합니다.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">오늘 업로드 상태</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {uploadStatus}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            오늘 배정이 1건 이상 반영되면 업로드 완료로 표시합니다.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-950">빠른 이동</h2>
          <p className="text-sm text-stone-600">
            자주 쓰는 운영 화면으로 바로 이동할 수 있습니다.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-stone-200 px-5 py-4 transition hover:border-stone-400 hover:bg-stone-50"
            >
              <p className="font-medium text-stone-950">{link.title}</p>
              <p className="mt-2 text-sm text-stone-600">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
