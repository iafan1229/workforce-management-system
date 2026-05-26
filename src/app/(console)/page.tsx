import Link from "next/link";
import { OperationsDateCalendar } from "@/components/operations-date-calendar";
import { getTodayInSeoul } from "@/features/attendance/types";
import { buildCalendarMonth } from "@/features/operations/calendar";

const START_STEPS = [
  "로그인 후 먼저 작업일을 선택합니다.",
  "선택한 날짜의 운영 대시보드와 좌측 네비게이션이 열립니다.",
  "출근/배정, 업로드, 인력 조회를 같은 작업일 기준으로 이어서 처리합니다.",
];

export default async function OperationsHomePage() {
  const today = getTodayInSeoul();
  const calendar = buildCalendarMonth(today);

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 py-8 md:px-6 md:py-10">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Workforce OS
          </p>
          <h1 className="max-w-4xl text-[clamp(2.6rem,4vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950">
            작업일을 선택한 뒤 운영을 시작합니다.
          </h1>
          <p className="max-w-3xl text-base leading-8 text-stone-600 md:text-lg">
            선택한 날짜의 네비게이션과 운영 대시보드가 열립니다. 먼저 달력에서
            작업일을 고르고, 그 다음 화면에서 출근/배정과 업로드, 인력 조회를
            진행하세요.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="console-panel-strong rounded-[2rem] p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="console-soft-label">작업일 선택</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                  {calendar.title}
                </h2>
              </div>
              <Link
                href={`/operations/${today}`}
                className="console-button-primary"
              >
                오늘 날짜 바로 열기
              </Link>
            </div>

            <OperationsDateCalendar days={calendar.weeks.flat()} />
          </div>

          <aside className="space-y-6">
            <section className="console-panel rounded-[2rem] p-6">
              <p className="console-soft-label">진행 순서</p>
              <ol className="mt-4 space-y-4 text-sm leading-7 text-stone-700">
                {START_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="console-panel rounded-[2rem] p-6">
              <p className="console-soft-label">기본 작업일</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                {today}
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                빠르게 시작해야 한다면 오늘 날짜를 바로 열고, 다른 날짜가
                필요하면 달력에서 선택하세요.
              </p>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
