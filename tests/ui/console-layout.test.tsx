import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getSession: async () => ({
        data: {
          session: { user: { id: "manager-1" } },
        },
      }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("ConsoleLayout", () => {
  it("달력 진입 페이지에는 네비게이션 셸을 붙이지 않는다", async () => {
    const { default: ConsoleLayout } = await import("@/app/(console)/layout");
    const layout = await ConsoleLayout({
      children: <div>달력 화면</div>,
    });

    render(layout);

    expect(screen.getByText("달력 화면")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "주요 메뉴" }),
    ).not.toBeInTheDocument();
  });
});
