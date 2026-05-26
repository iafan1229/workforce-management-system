import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/attendance/types", () => ({
  getTodayInSeoul: () => "2026-05-25",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/operations/2026-05-25",
}));

describe("OperationsDateLayout", () => {
  it("선택한 작업일 화면에는 네비게이션 셸을 붙인다", async () => {
    const { default: OperationsDateLayout } = await import(
      "@/app/(console)/operations/[workDate]/layout"
    );
    const layout = await OperationsDateLayout({
      children: <div>운영 대시보드 본문</div>,
    });

    render(layout);

    expect(
      screen.getByRole("navigation", { name: "주요 메뉴" }),
    ).toBeInTheDocument();
    expect(screen.getByText("운영 대시보드 본문")).toBeInTheDocument();
  });
});
