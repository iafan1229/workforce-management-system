import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/attendance/types", () => ({
  getTodayInSeoul: vi.fn(() => "2026-05-25"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("OperationsHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("운영 날짜 선택용 달력을 렌더링한다", async () => {
    const { default: OperationsHomePage } = await import("@/app/(console)/page");
    const page = await OperationsHomePage();
    render(page);

    expect(
      screen.getByRole("heading", { name: "작업일을 선택한 뒤 운영을 시작합니다." }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026년 5월")).toBeInTheDocument();
    expect(
      screen.getByText(/선택한 날짜의 네비게이션과 운영 대시보드가 열립니다\./),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "오늘 날짜 바로 열기" }),
    ).toHaveAttribute("href", "/operations/2026-05-25");
    expect(
      screen.queryByRole("img", { name: "운영 콘솔 무드 보드" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /05-25\s+25/ }),
    ).toHaveAttribute("href", "/operations/2026-05-25");
  });
});
