import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OperationsDashboardPage from "@/app/(console)/operations/[workDate]/page";

afterEach(() => {
  cleanup();
});

describe("OperationsDashboardPage", () => {
  it("날짜 변경 링크와 운영 진입 링크를 보여준다", async () => {
    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(screen.getByRole("link", { name: "날짜 변경" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /출근\/배정 관리/ })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/attendance",
    );
    expect(screen.getByRole("link", { name: /배정표 업로드/ })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/upload",
    );
    expect(screen.getByRole("link", { name: /인력 조회/ })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/workers",
    );
  });
});
