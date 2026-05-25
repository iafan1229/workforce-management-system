import Link from "next/link";
import { parseWorkDate } from "@/features/operations/date";

type OperationsDashboardPageProps = {
  params: Promise<{
    workDate: string;
  }>;
};

export default async function OperationsDashboardPage({
  params,
}: OperationsDashboardPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-orange-700">선택 작업일</p>
          <h1 className="text-2xl font-semibold text-stone-950">
            {validDate} 운영
          </h1>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700"
        >
          날짜 변경
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/operations/${validDate}/attendance`}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-stone-950">
            출근/배정 관리
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            출근 등록과 수동 배정을 진행합니다.
          </p>
        </Link>

        <Link
          href={`/operations/${validDate}/upload`}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-stone-950">
            배정표 업로드
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            선택 날짜 배정을 엑셀로 반영합니다.
          </p>
        </Link>

        <Link
          href={`/operations/${validDate}/workers`}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-stone-950">인력 조회</h2>
          <p className="mt-2 text-sm text-stone-600">
            선택 날짜 기준 출근/배정 상태를 확인합니다.
          </p>
        </Link>
      </section>
    </main>
  );
}
