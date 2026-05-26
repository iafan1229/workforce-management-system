import { getTodayInSeoul } from "@/features/attendance/types";
import { parseWorkDate } from "./date";

export type CalendarDay = {
  date: string;
  label: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export function buildCalendarMonth(focusDate: string, today = getTodayInSeoul()) {
  const selected = parseWorkDate(focusDate);
  const base = new Date(`${selected}T00:00:00.000Z`);
  const monthStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const offset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - offset);

  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const current = new Date(gridStart);
      current.setUTCDate(gridStart.getUTCDate() + weekIndex * 7 + dayIndex);
      const date = current.toISOString().slice(0, 10);

      return {
        date,
        label: current.getUTCDate(),
        isCurrentMonth: current.getUTCMonth() === base.getUTCMonth(),
        isToday: date === today,
        isSelected: date === selected,
      };
    }),
  );

  return {
    focusDate: selected,
    title: `${base.getUTCFullYear()}년 ${base.getUTCMonth() + 1}월`,
    weeks,
  };
}
