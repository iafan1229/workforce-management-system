import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleShell } from "@/components/console-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/operations/2026-05-25/attendance",
}));

afterEach(() => {
  cleanup();
});

describe("ConsoleShell", () => {
  it("최상단 날짜 선택 버튼과 대시보드를 포함한 운영 메뉴를 렌더링한다", () => {
    render(
      <ConsoleShell today="2026-05-25">
        <div>본문 콘텐츠</div>
      </ConsoleShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "주요 메뉴" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "날짜 선택으로 돌아가기" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25",
    );
    expect(screen.getByRole("link", { name: "출근/배정" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/attendance",
    );
    expect(screen.getByRole("link", { name: "인력 조회" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/workers",
    );
    expect(screen.getByRole("link", { name: "배정표 업로드" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/upload",
    );
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "출근/배정" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByText("운영 콘솔")).not.toBeInTheDocument();
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();
  });
});
