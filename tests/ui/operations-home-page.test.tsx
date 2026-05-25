import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/attendance/types", () => ({
  getTodayInSeoul: vi.fn(() => "2026-05-25"),
}));

describe("OperationsHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("운영 날짜 선택용 달력을 렌더링한다", async () => {
    const { default: OperationsHomePage } = await import("@/app/(console)/page");
    const page = await OperationsHomePage();
    render(page);
    const links = screen.getAllByRole("link");

    expect(
      screen.getByRole("heading", { name: "운영 날짜 선택" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026년 5월")).toBeInTheDocument();
    expect(links).toHaveLength(42);
    expect(links[0]).toHaveAttribute("href", "/operations/2026-04-26");
    expect(
      screen.getByRole("link", { name: /05-25\s+25/ }),
    ).toHaveAttribute("href", "/operations/2026-05-25");
  });
});
