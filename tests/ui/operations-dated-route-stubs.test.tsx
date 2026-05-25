import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OperationsAttendancePage from "@/app/(console)/operations/[workDate]/attendance/page";
import OperationsUploadPage from "@/app/(console)/operations/[workDate]/upload/page";
import OperationsWorkersPage from "@/app/(console)/operations/[workDate]/workers/page";

afterEach(() => {
  cleanup();
});

describe("dated operations route stubs", () => {
  it("출근/배정 관리 페이지가 선택 작업일과 기존 화면 링크를 보여준다", async () => {
    const page = await OperationsAttendancePage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "2026-05-25 출근/배정 관리" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기존 출근 등록 화면 열기" })).toHaveAttribute(
      "href",
      "/attendance",
    );
  });

  it("배정표 업로드 페이지가 선택 작업일과 기존 화면 링크를 보여준다", async () => {
    const page = await OperationsUploadPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "2026-05-25 배정표 업로드" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기존 업로드 화면 열기" })).toHaveAttribute(
      "href",
      "/upload",
    );
  });

  it("인력 조회 페이지가 선택 작업일과 기존 화면 링크를 보여준다", async () => {
    const page = await OperationsWorkersPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "2026-05-25 인력 조회" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기존 인력 조회 화면 열기" })).toHaveAttribute(
      "href",
      "/workers",
    );
  });
});
