"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import type { CalendarDay } from "@/features/operations/calendar";
import { toOperationsPath } from "@/features/operations/date";

type OperationsDateCalendarProps = {
  days: CalendarDay[];
};

export function OperationsDateCalendar({
  days,
}: OperationsDateCalendarProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>, day: CalendarDay) {
    event.preventDefault();

    const shouldMove = window.confirm(
      `${day.date} 운영 화면으로 이동하시겠습니까?`,
    );

    if (shouldMove) {
      router.push(toOperationsPath(day.date));
    }
  }

  return (
    <div className="grid grid-cols-7 gap-2 text-center text-sm">
      {days.map((day) => (
        <Link
          key={day.date}
          href={toOperationsPath(day.date)}
          onClick={(event) => handleClick(event, day)}
          className={`rounded-2xl px-3 py-4 ${
            day.isSelected
              ? "bg-stone-950 text-white shadow-[0_18px_60px_-30px_rgba(28,25,23,0.82)]"
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
  );
}
