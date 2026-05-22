import {
  getTodayInSeoul,
  toAttendanceListRows,
  type AttendanceQueryRow,
} from "@/features/attendance/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerAttendanceAction } from "./actions";

type AttendancePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const today = getTodayInSeoul();
  const errorMessage = typeof params.error === "string" ? params.error : null;
  const { data, error } = await supabase
    .from("attendances")
    .select("id, work_date, workers(id, name, phone)")
    .eq("work_date", today)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const attendedWorkers = toAttendanceListRows(
    (data ?? []) as AttendanceQueryRow[],
  );

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">출근 등록</h1>
        <p className="text-sm text-stone-600">
          {today} 기준으로 오늘 출근자 등록과 조회를 처리합니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          action={registerAttendanceAction}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">오늘 출근 등록</h2>
            <p className="text-sm text-stone-600">
              이름과 휴대폰 번호를 입력하면 신규 인력 생성과 출근 등록을 함께 처리합니다.
            </p>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">이름</span>
            <input
              required
              name="name"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              placeholder="홍길동"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">휴대폰 번호</span>
            <input
              required
              name="phone"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              placeholder="010-1234-5678"
            />
          </label>

          <button className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white">
            오늘 출근 등록
          </button>
        </form>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">오늘 출근자</h2>
            <p className="text-sm text-stone-600">
              오늘 등록된 인력 목록을 최신순으로 보여줍니다.
            </p>
          </div>

          {attendedWorkers.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
              아직 등록된 출근이 없습니다.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {attendedWorkers.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-stone-200 px-4 py-3"
                >
                  <p className="font-medium text-stone-900">
                    {row.worker?.name ?? "이름 없음"}
                  </p>
                  <p className="text-sm text-stone-600">
                    {row.worker?.phone ?? "전화번호 없음"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
