import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("하이픈이 포함된 휴대폰 번호를 숫자만 남긴다", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });

  it("이미 정규화된 유효한 번호는 그대로 반환한다", () => {
    expect(normalizePhone("01012345678")).toBe("01012345678");
  });

  it("010 prefix는 10자리 번호를 허용하지 않는다", () => {
    expect(() => normalizePhone("0101234567")).toThrowError(
      "유효하지 않은 전화번호 형식입니다.",
    );
  });

  it("공백과 문장부호가 섞여 있어도 숫자만 남긴다", () => {
    expect(normalizePhone(" 010 1234.5678 ")).toBe("01012345678");
  });

  it("유효하지 않은 입력이면 정확한 에러 메시지를 던진다", () => {
    expect(() => normalizePhone("02-123-4567")).toThrowError(
      "유효하지 않은 전화번호 형식입니다.",
    );
  });

  it("허용되지 않은 prefix면 정확한 에러 메시지를 던진다", () => {
    expect(() => normalizePhone("012-1234-5678")).toThrowError(
      "유효하지 않은 전화번호 형식입니다.",
    );
  });

  it("너무 짧으면 정확한 에러 메시지를 던진다", () => {
    expect(() => normalizePhone("010-1234-56")).toThrowError(
      "유효하지 않은 전화번호 형식입니다.",
    );
  });

  it("너무 길면 정확한 에러 메시지를 던진다", () => {
    expect(() => normalizePhone("010-1234-56789")).toThrowError(
      "유효하지 않은 전화번호 형식입니다.",
    );
  });
});
