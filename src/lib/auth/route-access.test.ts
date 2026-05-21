import { describe, expect, it } from "vitest";
import { resolveRouteAccess } from "./route-access";

describe("resolveRouteAccess", () => {
  it("세션이 없으면 루트 경로를 로그인으로 보낸다", () => {
    expect(resolveRouteAccess({ pathname: "/", hasSession: false })).toEqual({
      allow: false,
      redirectTo: "/login",
    });
  });

  it("세션이 없으면 보호된 경로를 로그인으로 보낸다", () => {
    expect(
      resolveRouteAccess({ pathname: "/attendance", hasSession: false }),
    ).toEqual({
      allow: false,
      redirectTo: "/login?next=%2Fattendance",
    });
  });

  it("세션이 있으면 로그인 페이지 접근을 루트로 보낸다", () => {
    expect(resolveRouteAccess({ pathname: "/login", hasSession: true })).toEqual(
      {
        allow: false,
        redirectTo: "/",
      },
    );
  });

  it("세션이 없으면 로그인 페이지 접근은 허용한다", () => {
    expect(resolveRouteAccess({ pathname: "/login", hasSession: false })).toEqual(
      {
        allow: true,
      },
    );
  });

  it("세션이 있으면 콘솔 경로 접근을 허용한다", () => {
    expect(resolveRouteAccess({ pathname: "/", hasSession: true })).toEqual({
      allow: true,
    });
  });
});
