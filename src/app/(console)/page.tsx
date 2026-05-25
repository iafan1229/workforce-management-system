import Link from "next/link";
import { getTodayInSeoul } from "@/features/attendance/types";
import { buildCalendarMonth } from "@/features/operations/calendar";
import { toOperationsPath } from "@/features/operations/date";

export default async function OperationsHomePage() {
  const today = getTodayInSeoul();
  const calendar = buildCalendarMonth(today);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">운영 날짜 선택</h1>
        <p className="text-sm text-stone-600">
          출근, 배정, 업로드를 진행할 날짜를 먼저 선택합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-950">
            {calendar.title}
          </h2>
          <p className="text-sm text-stone-500">
            기본 선택 날짜 {today}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {calendar.weeks.flat().map((day) => (
            <Link
              key={day.date}
              href={toOperationsPath(day.date)}
              className={`rounded-xl px-3 py-4 ${
                day.isSelected
                  ? "bg-stone-900 text-white"
                  : day.isCurrentMonth
                    ? "bg-stone-50 text-stone-900"
                    : "bg-stone-100 text-stone-400"
              }`}
            >
              <span className="block text-xs">{day.date.slice(5)}</span>
              <span className="mt-1 block font-medium">{day.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
