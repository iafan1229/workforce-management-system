const WORK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseWorkDate(value: string) {
  if (!WORK_DATE_PATTERN.test(value)) {
    throw new Error("작업일 형식이 올바르지 않습니다.");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("작업일 형식이 올바르지 않습니다.");
  }

  return value;
}

export function toOperationsPath(workDate: string) {
  return `/operations/${parseWorkDate(workDate)}`;
}
