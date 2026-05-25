import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperationsDateCalendar } from "@/components/operations-date-calendar";
import type { CalendarDay } from "@/features/operations/calendar";

const pushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
  }),
}));

const DAYS: CalendarDay[] = [
  {
    date: "2026-05-24",
    label: 24,
    isCurrentMonth: true,
    isToday: false,
    isSelected: false,
  },
  {
    date: "2026-05-25",
    label: 25,
    isCurrentMonth: true,
    isToday: true,
    isSelected: true,
  },
];

afterEach(() => {
  cleanup();
  pushSpy.mockReset();
  vi.restoreAllMocks();
});

describe("OperationsDateCalendar", () => {
  it("날짜 클릭 시 이동 확인창을 띄운다", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<OperationsDateCalendar days={DAYS} />);

    const link = screen.getByRole("link", { name: /05-25\s+25/ });
    fireEvent.click(link);

    expect(confirmSpy).toHaveBeenCalledWith(
      "2026-05-25 운영 화면으로 이동하시겠습니까?",
    );
    expect(pushSpy).toHaveBeenCalledWith("/operations/2026-05-25");
  });

  it("확인창에서 취소하면 이동을 막는다", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<OperationsDateCalendar days={DAYS} />);

    const link = screen.getByRole("link", { name: /05-25\s+25/ });
    fireEvent.click(link);

    expect(pushSpy).not.toHaveBeenCalled();
  });
});
