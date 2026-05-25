import { describe, expect, it } from "vitest";
import { buildCalendarMonth } from "./calendar";

describe("buildCalendarMonth", () => {
  it("선택 월을 6주 그리드로 반환한다", () => {
    const calendar = buildCalendarMonth("2026-05-25", "2026-05-12");
    const selectedDay = calendar.weeks
      .flat()
      .find((day) => day.date === "2026-05-25");
    const days = calendar.weeks.flat();
    const firstDay = days[0];
    const lastDay = days.at(-1);

    expect(calendar.focusDate).toBe("2026-05-25");
    expect(calendar.title).toBe("2026년 5월");
    expect(calendar.weeks).toHaveLength(6);
    expect(calendar.weeks[0]).toHaveLength(7);
    expect(days).toHaveLength(42);
    expect(firstDay?.date).toBe("2026-04-26");
    expect(lastDay?.date).toBe("2026-06-06");
    expect(selectedDay).toMatchObject({
      date: "2026-05-25",
      label: 25,
      isCurrentMonth: true,
      isToday: false,
      isSelected: true,
    });
  });

  it("오늘 여부를 서울 기준 날짜로 계산한다", () => {
    const calendar = buildCalendarMonth("2026-05-25", "2026-05-01");
    const today = calendar.weeks.flat().find((day) => day.date === "2026-05-01");

    expect(today).toMatchObject({
      date: "2026-05-01",
      isCurrentMonth: true,
      isToday: true,
      isSelected: false,
    });
  });
});
