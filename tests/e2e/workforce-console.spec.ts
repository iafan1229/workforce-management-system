import { expect, test } from "@playwright/test";

test.describe("Workforce console entrypoint", () => {
  test("루트 진입 시 로그인 화면을 보여준다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(
      page.getByText(
        "오늘 출근 등록과 배정 업로드를 시작하려면 관리자 계정으로 로그인하세요.",
      ),
    ).toBeVisible();
  });

  test("날짜별 운영 경로도 로그인 보호를 유지한다", async ({ page }) => {
    await page.goto("/operations/2026-05-25");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeVisible();
  });
});
