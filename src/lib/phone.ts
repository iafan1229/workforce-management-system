const MODERN_MOBILE_PATTERN = /^010\d{8}$/;
const LEGACY_MOBILE_PATTERN = /^01(?:1|[6-9])\d{7,8}$/;

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");

  if (
    !MODERN_MOBILE_PATTERN.test(digits) &&
    !LEGACY_MOBILE_PATTERN.test(digits)
  ) {
    throw new Error("유효하지 않은 전화번호 형식입니다.");
  }

  return digits;
}
