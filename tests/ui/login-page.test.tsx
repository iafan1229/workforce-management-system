import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("앱 셸 안에서 관리자 로그인 화면을 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <LoginPage />
      </RootLayout>,
    );
    const document = new DOMParser().parseFromString(markup, "text/html");
    const heading = document.querySelector("h1");
    const emailLabel = document.querySelector('label input[name="email"]');
    const passwordLabel = document.querySelector(
      'label input[name="password"]',
    );

    expect(document.documentElement.lang).toBe("ko");
    expect(document.body.className).toContain("min-h-screen");
    expect(document.body.className).toContain("bg-[#f4eee3]");
    expect(document.body.className).toContain("text-stone-950");
    expect(heading?.textContent).toBe("관리자 로그인");
    expect(emailLabel).not.toBeNull();
    expect(passwordLabel).not.toBeNull();
    expect(markup).toContain("오늘 출근 등록과 배정 업로드를 시작하려면");
  });
});
