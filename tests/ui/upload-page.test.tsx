import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UploadPage from "@/app/(console)/upload/page";

describe("UploadPage", () => {
  it("업로드 안내와 전체 실패 정책을 렌더링한다", async () => {
    const page = await UploadPage();

    render(page);

    expect(
      screen.getByRole("heading", { name: "배정표 엑셀 업로드" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("오류가 한 줄이라도 있으면 전체 업로드가 실패합니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("필수 컬럼인 name, phone, task가 모두 있어야 합니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("한 줄이라도 오류가 있으면 저장 없이 전체 업로드를 취소합니다."),
    ).toBeInTheDocument();
  });
});
