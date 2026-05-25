import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OperationsUploadPage from "@/app/(console)/operations/[workDate]/upload/page";

afterEach(() => {
  cleanup();
});

describe("dated operations routes", () => {
  it("배정표 업로드 페이지가 선택 작업일 고정 업로드 폼을 보여준다", async () => {
    const page = await OperationsUploadPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "배정표 업로드" }),
    ).toBeInTheDocument();
    expect(screen.getByText("선택 작업일 2026-05-25")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "배정표 반영" }),
    ).toBeInTheDocument();
  });
});
