# Workforce Manual Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 날짜 중심 운영 구조로 앱을 개편하고, 선택 날짜 기준 출근 등록, 수동 배정 생성/수정/해제, 엑셀 업로드 덮어쓰기까지 일관되게 동작하도록 만든다.

**Architecture:** 기존 `(console)` 기반 콘솔을 `operations/[workDate]` 라우트 중심으로 재구성한다. 출근/배정 저장 규칙은 서버 측 도메인 함수로 분리하고, `assignments`와 `worker_skills` 보정은 단일 서비스 계층에서 관리한다. 엑셀 업로드는 기존 검증 규칙을 유지하되, 같은 날짜의 수동 배정을 덮어쓸 수 있도록 DB 함수와 도메인 로직을 갱신한다.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres, Vitest, React Testing Library, Playwright

---

> 사용자 요청에 따라 이 계획에서는 에이전트 커밋을 수행하지 않는다. 각 태스크 마지막 단계는 `사용자 커밋 체크포인트`로 두고, 상태 확인 후 사용자가 직접 커밋하는 흐름을 전제로 한다.

## File Structure

- Modify: `src/lib/auth/route-access.ts` - 로그인 후 기본 리다이렉트 경로를 날짜 선택 화면 기준으로 유지하고, 새 운영 라우트 접근 규칙을 다룬다.
- Create: `src/features/operations/date.ts` - `workDate` 파싱/검증/포맷 유틸리티를 모은다.
- Create: `src/features/operations/calendar.ts` - 달력 그리드용 뷰 모델을 만든다.
- Create: `src/features/operations/calendar.test.ts` - 날짜 선택 화면용 달력 모델 테스트.
- Create: `src/app/(console)/page.tsx`를 대체하는 날짜 선택 화면 로직 - 기존 루트를 달력 진입점으로 전환한다.
- Create: `src/app/(console)/operations/[workDate]/page.tsx` - 날짜별 운영 대시보드.
- Create: `src/app/(console)/operations/[workDate]/attendance/page.tsx` - 날짜별 출근/배정 허브.
- Create: `src/app/(console)/operations/[workDate]/attendance/actions.ts` - 출근 등록/수동 배정/해제 서버 액션.
- Create: `src/app/(console)/operations/[workDate]/upload/page.tsx` - 날짜별 업로드 화면.
- Create: `src/app/(console)/operations/[workDate]/upload/upload-form.tsx` - URL 날짜 기준 업로드 폼.
- Create: `src/app/(console)/operations/[workDate]/workers/page.tsx` - 날짜 컨텍스트를 가진 인력 조회 화면.
- Create: `src/app/(console)/operations/[workDate]/workers/[workerId]/page.tsx` - 날짜 컨텍스트를 가진 인력 상세 화면.
- Modify or replace: 기존 `src/app/(console)/attendance/*`, `upload/*`, `workers/*`, `(console)/page.tsx` - 새 경로로 정리하거나 얇은 리다이렉트로 남긴다.
- Modify: `src/features/attendance/types.ts` - 날짜별 출근자 + 오늘/선택 날짜 배정 상태를 표현할 타입을 추가한다.
- Modify: `src/features/attendance/service.ts` - 날짜별 출근 등록과 출근자 목록 조회를 분리한다.
- Create: `src/features/assignments/service.ts` - 수동 배정 생성/수정/해제 도메인 로직.
- Create: `src/features/assignments/service.test.ts` - 수동 배정과 스킬 보정 테스트.
- Create: `src/features/assignments/types.ts` - 수동 배정 저장용 타입과 리포지토리 인터페이스.
- Modify: `src/features/uploads/import-assignment-upload.ts` - 같은 날짜 기존 배정을 덮어쓰는 규칙으로 변경한다.
- Modify: `src/features/uploads/types.ts` - 업로드 리포지토리에 기존 배정 조회/덮어쓰기 의도를 반영한다.
- Modify: `src/features/uploads/import-assignment-upload.test.ts` - 수동 배정 덮어쓰기 규칙 테스트 추가.
- Modify: `src/features/workers/service.ts` - 선택 날짜 기준 출근/배정 상태와 CTA 계산을 추가한다.
- Modify: `src/features/workers/service.test.ts` - 날짜별 상태 기반 조회 테스트 추가.
- Modify: `src/app/api/uploads/assignments/route.ts` - URL 날짜 기준으로 업로드하고 새 RPC를 사용한다.
- Modify: `supabase/migrations/20260521_000001_workforce_schema.sql` 또는 Create: 후속 migration - `apply_assignment_batch`를 덮어쓰기 가능하게 갱신하고 수동 배정용 RPC 또는 업데이트 정책을 추가한다.
- Modify: `tests/ui/*` - 새 달력 화면, 새 라우트 구조, CTA 버튼 테스트 추가.
- Modify: `tests/e2e/workforce-console.spec.ts` - 날짜 선택 → 출근 등록 → 수동 배정 → 엑셀 덮어쓰기 시나리오로 확장.
- Modify: `readme.md` - 날짜 중심 운영 흐름과 새 경로 문서화.

### Task 1: 날짜 중심 라우팅 유틸리티와 홈 달력 화면 추가

**Files:**
- Create: `src/features/operations/date.ts`
- Create: `src/features/operations/calendar.ts`
- Create: `src/features/operations/calendar.test.ts`
- Modify: `src/app/(console)/page.tsx`
- Test: `tests/ui/operations-home-page.test.tsx`

- [ ] **Step 1: 달력 뷰 모델 테스트를 먼저 작성한다**

```ts
// src/features/operations/calendar.test.ts
import { describe, expect, it } from "vitest";
import { buildCalendarMonth } from "./calendar";

describe("buildCalendarMonth", () => {
  it("선택 월을 6주 그리드로 반환한다", () => {
    const calendar = buildCalendarMonth("2026-05-25");

    expect(calendar.focusDate).toBe("2026-05-25");
    expect(calendar.weeks).toHaveLength(6);
    expect(calendar.weeks[0]).toHaveLength(7);
    expect(
      calendar.weeks.flat().some((day) => day.date === "2026-05-25" && day.isCurrentMonth),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run src/features/operations/calendar.test.ts`
Expected: FAIL with `Cannot find module './calendar'`

- [ ] **Step 3: 날짜 유틸리티와 달력 뷰 모델을 최소 구현한다**

```ts
// src/features/operations/date.ts
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
```

```ts
// src/features/operations/calendar.ts
import { parseWorkDate } from "./date";

export type CalendarDay = {
  date: string;
  label: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export function buildCalendarMonth(focusDate: string) {
  const selected = parseWorkDate(focusDate);
  const base = new Date(`${selected}T00:00:00.000Z`);
  const monthStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const offset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - offset);
  const today = new Date().toISOString().slice(0, 10);

  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const current = new Date(gridStart);
      current.setUTCDate(gridStart.getUTCDate() + weekIndex * 7 + dayIndex);
      const date = current.toISOString().slice(0, 10);

      return {
        date,
        label: current.getUTCDate(),
        isCurrentMonth: current.getUTCMonth() === base.getUTCMonth(),
        isToday: date === today,
        isSelected: date === selected,
      };
    }),
  );

  return {
    focusDate: selected,
    title: `${base.getUTCFullYear()}년 ${base.getUTCMonth() + 1}월`,
    weeks,
  };
}
```

- [ ] **Step 4: 로그인 후 홈 화면을 달력 진입점으로 바꾸는 UI 테스트를 작성한다**

```tsx
// tests/ui/operations-home-page.test.tsx
import { render, screen } from "@testing-library/react";
import OperationsHomePage from "@/app/(console)/page";

describe("OperationsHomePage", () => {
  it("운영 날짜 선택용 달력을 렌더링한다", async () => {
    const page = await OperationsHomePage();
    render(page);

    expect(
      screen.getByRole("heading", { name: "운영 날짜 선택" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 5: 홈 달력 페이지를 구현한다**

```tsx
// src/app/(console)/page.tsx
import Link from "next/link";
import { getTodayInSeoul } from "@/features/attendance/types";
import { buildCalendarMonth } from "@/features/operations/calendar";
import { toOperationsPath } from "@/features/operations/date";

export default async function OperationsHomePage() {
  const today = getTodayInSeoul();
  const calendar = buildCalendarMonth(today);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">운영 날짜 선택</h1>
        <p className="text-sm text-stone-600">
          출근, 배정, 업로드를 진행할 날짜를 먼저 선택합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-950">{calendar.title}</h2>
          <p className="text-sm text-stone-500">기본 선택 날짜 {today}</p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {calendar.weeks.flat().map((day) => (
            <Link
              key={day.date}
              href={toOperationsPath(day.date)}
              className={`rounded-xl px-3 py-4 ${
                day.isSelected
                  ? "bg-stone-900 text-white"
                  : day.isCurrentMonth
                    ? "bg-stone-50 text-stone-900"
                    : "bg-stone-100 text-stone-400"
              }`}
            >
              <span className="block text-xs">{day.date.slice(5)}</span>
              <span className="mt-1 block font-medium">{day.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run src/features/operations/calendar.test.ts tests/ui/operations-home-page.test.tsx && npm run lint && npm run typecheck`
Expected: PASS with both test files passing and no lint/type errors

- [ ] **Step 7: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: Task 1 관련 파일만 `M`/`??`로 보인다

### Task 2: 날짜별 운영 대시보드와 네비게이션 셸 추가

**Files:**
- Create: `src/app/(console)/operations/[workDate]/page.tsx`
- Modify: `src/app/(console)/layout.tsx`
- Test: `tests/ui/operations-dashboard-page.test.tsx`

- [ ] **Step 1: 날짜별 운영 대시보드 UI 테스트를 작성한다**

```tsx
// tests/ui/operations-dashboard-page.test.tsx
import { render, screen } from "@testing-library/react";
import OperationsDashboardPage from "@/app/(console)/operations/[workDate]/page";

describe("OperationsDashboardPage", () => {
  it("날짜 변경 링크와 운영 진입 링크를 보여준다", async () => {
    const page = await OperationsDashboardPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
    });

    render(page);

    expect(screen.getByRole("link", { name: "날짜 변경" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "출근/배정 관리" })).toHaveAttribute(
      "href",
      "/operations/2026-05-25/attendance",
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run tests/ui/operations-dashboard-page.test.tsx`
Expected: FAIL with `Cannot find module '@/app/(console)/operations/[workDate]/page'`

- [ ] **Step 3: 날짜별 운영 대시보드 페이지를 구현한다**

```tsx
// src/app/(console)/operations/[workDate]/page.tsx
import Link from "next/link";
import { parseWorkDate } from "@/features/operations/date";

export default async function OperationsDashboardPage({
  params,
}: {
  params: Promise<{ workDate: string }>;
}) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-orange-700">선택 작업일</p>
          <h1 className="text-2xl font-semibold text-stone-950">{validDate} 운영</h1>
        </div>
        <Link href="/" className="rounded-xl border border-stone-300 px-4 py-2 text-sm">
          날짜 변경
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href={`/operations/${validDate}/attendance`} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">출근/배정 관리</h2>
          <p className="mt-2 text-sm text-stone-600">출근 등록과 수동 배정을 진행합니다.</p>
        </Link>
        <Link href={`/operations/${validDate}/upload`} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">배정표 업로드</h2>
          <p className="mt-2 text-sm text-stone-600">선택 날짜 배정을 엑셀로 반영합니다.</p>
        </Link>
        <Link href={`/operations/${validDate}/workers`} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">인력 조회</h2>
          <p className="mt-2 text-sm text-stone-600">선택 날짜 기준 출근/배정 상태를 확인합니다.</p>
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 보호 레이아웃이 새 라우트 구조와 함께 동작하는지 확인한다**

```ts
// src/lib/auth/route-access.ts
// existing logic can stay mostly unchanged because /operations/... is still a protected path
```

이 단계에서는 코드 변경이 없어도 되지만, `/operations/...` 경로가 `pathname !== "/login"` 조건으로 보호되는지 확인한다.

- [ ] **Step 5: 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run tests/ui/operations-dashboard-page.test.tsx && npm run lint && npm run typecheck`
Expected: PASS and no lint/type errors

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: Task 2 관련 파일 변경만 추가된다

### Task 3: 날짜별 출근자 목록 모델과 수동 배정 도메인 서비스 추가

**Files:**
- Modify: `src/features/attendance/types.ts`
- Modify: `src/features/attendance/service.ts`
- Create: `src/features/assignments/types.ts`
- Create: `src/features/assignments/service.ts`
- Create: `src/features/assignments/service.test.ts`

- [ ] **Step 1: 수동 배정 도메인 테스트를 먼저 작성한다**

```ts
// src/features/assignments/service.test.ts
import { describe, expect, it, vi } from "vitest";
import { saveManualAssignment, clearManualAssignment } from "./service";

describe("saveManualAssignment", () => {
  it("기존 배정이 없으면 새 배정을 만들고 경험을 증가시킨다", async () => {
    const repo = {
      findAttendance: vi.fn().mockResolvedValue({ workerId: "worker-1", workDate: "2026-05-25" }),
      findAssignment: vi.fn().mockResolvedValue(null),
      createAssignment: vi.fn().mockResolvedValue(undefined),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      incrementSkill: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn(),
    };

    await saveManualAssignment(
      { workerId: "worker-1", taskTypeId: "task-1", workDate: "2026-05-25" },
      repo,
    );

    expect(repo.createAssignment).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
      workDate: "2026-05-25",
      source: "manual_assignment",
    });
    expect(repo.incrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
    });
  });

  it("기존 배정이 다른 업무면 기존 경험을 줄이고 새 업무로 갱신한다", async () => {
    const repo = {
      findAttendance: vi.fn().mockResolvedValue({ workerId: "worker-1", workDate: "2026-05-25" }),
      findAssignment: vi.fn().mockResolvedValue({ id: "assignment-1", taskTypeId: "task-old" }),
      createAssignment: vi.fn(),
      updateAssignment: vi.fn().mockResolvedValue(undefined),
      deleteAssignment: vi.fn(),
      incrementSkill: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn().mockResolvedValue(undefined),
    };

    await saveManualAssignment(
      { workerId: "worker-1", taskTypeId: "task-new", workDate: "2026-05-25" },
      repo,
    );

    expect(repo.decrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-old",
    });
    expect(repo.updateAssignment).toHaveBeenCalledWith({
      assignmentId: "assignment-1",
      taskTypeId: "task-new",
      source: "manual_assignment",
    });
    expect(repo.incrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-new",
    });
  });
});

describe("clearManualAssignment", () => {
  it("배정을 삭제하고 경험을 줄인다", async () => {
    const repo = {
      findAssignment: vi.fn().mockResolvedValue({ id: "assignment-1", taskTypeId: "task-1" }),
      deleteAssignment: vi.fn().mockResolvedValue(undefined),
      decrementSkill: vi.fn().mockResolvedValue(undefined),
    };

    await clearManualAssignment(
      { workerId: "worker-1", workDate: "2026-05-25" },
      repo,
    );

    expect(repo.deleteAssignment).toHaveBeenCalledWith({ assignmentId: "assignment-1" });
    expect(repo.decrementSkill).toHaveBeenCalledWith({
      workerId: "worker-1",
      taskTypeId: "task-1",
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run src/features/assignments/service.test.ts`
Expected: FAIL with `Cannot find module './service'`

- [ ] **Step 3: 수동 배정 타입과 도메인 서비스를 구현한다**

```ts
// src/features/assignments/types.ts
export type AssignmentRecord = {
  id: string;
  taskTypeId: string;
};

export type ManualAssignmentRepository = {
  findAttendance: (input: { workerId: string; workDate: string }) => Promise<{ workerId: string; workDate: string } | null>;
  findAssignment: (input: { workerId: string; workDate: string }) => Promise<AssignmentRecord | null>;
  createAssignment: (input: {
    workerId: string;
    taskTypeId: string;
    workDate: string;
    source: "manual_assignment";
  }) => Promise<void>;
  updateAssignment: (input: {
    assignmentId: string;
    taskTypeId: string;
    source: "manual_assignment";
  }) => Promise<void>;
  deleteAssignment: (input: { assignmentId: string }) => Promise<void>;
  incrementSkill: (input: { workerId: string; taskTypeId: string }) => Promise<void>;
  decrementSkill: (input: { workerId: string; taskTypeId: string }) => Promise<void>;
};
```

```ts
// src/features/assignments/service.ts
import type { ManualAssignmentRepository } from "./types";

export async function saveManualAssignment(
  input: { workerId: string; taskTypeId: string; workDate: string },
  repo: ManualAssignmentRepository,
) {
  const attendance = await repo.findAttendance({
    workerId: input.workerId,
    workDate: input.workDate,
  });

  if (!attendance) {
    throw new Error("선택한 날짜에 출근 등록이 되어 있지 않습니다.");
  }

  const existing = await repo.findAssignment({
    workerId: input.workerId,
    workDate: input.workDate,
  });

  if (!existing) {
    await repo.createAssignment({
      workerId: input.workerId,
      taskTypeId: input.taskTypeId,
      workDate: input.workDate,
      source: "manual_assignment",
    });
    await repo.incrementSkill({ workerId: input.workerId, taskTypeId: input.taskTypeId });
    return;
  }

  if (existing.taskTypeId === input.taskTypeId) {
    await repo.updateAssignment({
      assignmentId: existing.id,
      taskTypeId: input.taskTypeId,
      source: "manual_assignment",
    });
    return;
  }

  await repo.decrementSkill({ workerId: input.workerId, taskTypeId: existing.taskTypeId });
  await repo.updateAssignment({
    assignmentId: existing.id,
    taskTypeId: input.taskTypeId,
    source: "manual_assignment",
  });
  await repo.incrementSkill({ workerId: input.workerId, taskTypeId: input.taskTypeId });
}

export async function clearManualAssignment(
  input: { workerId: string; workDate: string },
  repo: Pick<ManualAssignmentRepository, "findAssignment" | "deleteAssignment" | "decrementSkill">,
) {
  const existing = await repo.findAssignment(input);

  if (!existing) {
    throw new Error("해당 날짜의 기존 배정을 찾을 수 없습니다.");
  }

  await repo.deleteAssignment({ assignmentId: existing.id });
  await repo.decrementSkill({ workerId: input.workerId, taskTypeId: existing.taskTypeId });
}
```

- [ ] **Step 4: 출근자 목록 타입에 현재 배정 상태를 담을 수 있게 확장한다**

```ts
// src/features/attendance/types.ts
export type AttendanceAssignment = {
  assignmentId: string;
  taskTypeId: string;
  taskTypeLabel: string;
  source: string;
};

export type AttendanceListRow = {
  id: string;
  work_date: string;
  worker: AttendanceWorker | null;
  assignment: AttendanceAssignment | null;
};
```

- [ ] **Step 5: 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run src/features/assignments/service.test.ts src/features/attendance/service.test.ts && npm run lint && npm run typecheck`
Expected: PASS with all tests green

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: Task 3 관련 도메인 파일이 추가/수정된다

### Task 4: 날짜별 출근/배정 화면과 서버 액션 구현

**Files:**
- Create: `src/app/(console)/operations/[workDate]/attendance/page.tsx`
- Create: `src/app/(console)/operations/[workDate]/attendance/actions.ts`
- Test: `tests/ui/operations-attendance-page.test.tsx`

- [ ] **Step 1: 날짜별 출근/배정 화면 테스트를 작성한다**

```tsx
// tests/ui/operations-attendance-page.test.tsx
import { render, screen } from "@testing-library/react";
import AttendanceOperationsPage from "@/app/(console)/operations/[workDate]/attendance/page";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            data: [],
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

describe("AttendanceOperationsPage", () => {
  it("출근 등록과 배정 관리 영역을 함께 보여준다", async () => {
    const page = await AttendanceOperationsPage({
      params: Promise.resolve({ workDate: "2026-05-25" }),
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "출근 및 수동 배정" })).toBeInTheDocument();
    expect(screen.getByText("선택 작업일 2026-05-25")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run tests/ui/operations-attendance-page.test.tsx`
Expected: FAIL with missing module for new attendance route

- [ ] **Step 3: 출근 등록/배정 페이지를 구현한다**

```tsx
// src/app/(console)/operations/[workDate]/attendance/page.tsx
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  clearManualAssignmentAction,
  registerAttendanceForDateAction,
  saveManualAssignmentAction,
} from "./actions";

export default async function AttendanceOperationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workDate: string }>;
  searchParams: Promise<{ focusWorkerId?: string; error?: string }>;
}) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendances")
    .select("id, work_date, workers(id, name, phone), assignments(id, task_type_id, source, task_types(label))")
    .eq("work_date", validDate)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-orange-700">선택 작업일 {validDate}</p>
        <h1 className="text-2xl font-semibold text-stone-950">출근 및 수동 배정</h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form action={registerAttendanceForDateAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="workDate" value={validDate} />
          {/* name / phone inputs */}
        </form>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          {/* attendance rows with task select, save action, clear action */}
        </section>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 서버 액션을 구현한다**

```ts
// src/app/(console)/operations/[workDate]/attendance/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registerAttendance } from "@/features/attendance/service";
import { saveManualAssignment, clearManualAssignment } from "@/features/assignments/service";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAttendanceForDateAction(formData: FormData) {
  const workDate = parseWorkDate(String(formData.get("workDate") ?? ""));
  const supabase = await createSupabaseServerClient();

  await registerAttendance(
    {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      workDate,
    },
    /* existing repo mapping */,
  );

  revalidatePath(`/operations/${workDate}/attendance`);
  redirect(`/operations/${workDate}/attendance`);
}

export async function saveManualAssignmentAction(formData: FormData) {
  const workDate = parseWorkDate(String(formData.get("workDate") ?? ""));
  const workerId = String(formData.get("workerId") ?? "");
  const taskTypeId = String(formData.get("taskTypeId") ?? "");
  const supabase = await createSupabaseServerClient();

  await saveManualAssignment({ workerId, taskTypeId, workDate }, /* supabase-backed repo */);

  revalidatePath(`/operations/${workDate}/attendance`);
  redirect(`/operations/${workDate}/attendance?focusWorkerId=${workerId}`);
}
```

- [ ] **Step 5: 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run tests/ui/operations-attendance-page.test.tsx src/features/assignments/service.test.ts && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: Task 4 관련 route/action changes가 보인다

### Task 5: 업로드 덮어쓰기 규칙과 DB 함수 갱신

**Files:**
- Modify: `supabase/migrations/20260521_000001_workforce_schema.sql` or add follow-up migration
- Modify: `src/features/uploads/types.ts`
- Modify: `src/features/uploads/import-assignment-upload.ts`
- Modify: `src/features/uploads/import-assignment-upload.test.ts`
- Modify: `src/app/api/uploads/assignments/route.ts`

- [ ] **Step 1: 덮어쓰기 규칙 테스트를 먼저 추가한다**

```ts
// src/features/uploads/import-assignment-upload.test.ts
it("같은 날짜 기존 수동 배정이 있으면 엑셀 값으로 덮어쓴다", async () => {
  const repo = {
    findWorkersByPhones: vi.fn().mockResolvedValue([{ id: "worker-1", name: "홍길동", phone: "01012345678" }]),
    findAttendancesByDate: vi.fn().mockResolvedValue([{ workerId: "worker-1", workDate: "2026-05-25" }]),
    findTaskTypesByLabels: vi.fn().mockResolvedValue([{ id: "task-new", label: "피딩" }]),
    applyAssignmentBatch: vi.fn().mockResolvedValue(undefined),
  };

  await importAssignmentUpload(
    {
      workDate: "2026-05-25",
      rows: [{ rowNumber: 2, name: "홍길동", phone: "010-1234-5678", task: "피딩" }],
    },
    repo,
  );

  expect(repo.applyAssignmentBatch).toHaveBeenCalledWith({
    workDate: "2026-05-25",
    rows: [{ workerId: "worker-1", taskTypeId: "task-new" }],
  });
});
```

- [ ] **Step 2: 테스트가 현재 규칙과 충돌 없이 유지되는지 확인한다**

Run: `npm run test -- --run src/features/uploads/import-assignment-upload.test.ts`
Expected: PASS for old cases, then add new failing assertion once RPC behavior changes are asserted more strictly

- [ ] **Step 3: DB 함수와 업로드 도메인을 덮어쓰기 규칙으로 갱신한다**

```sql
-- follow-up migration example
create or replace function public.apply_assignment_batch(
  p_work_date date,
  p_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row_record jsonb;
  v_worker_id uuid;
  v_task_type_id uuid;
  v_existing_assignment public.assignments%rowtype;
begin
  for row_record in select * from jsonb_array_elements(p_rows)
  loop
    v_worker_id := (row_record ->> 'worker_id')::uuid;
    v_task_type_id := (row_record ->> 'task_type_id')::uuid;

    select * into v_existing_assignment
    from public.assignments
    where worker_id = v_worker_id and work_date = p_work_date;

    if not found then
      insert into public.assignments (worker_id, task_type_id, work_date, source)
      values (v_worker_id, v_task_type_id, p_work_date, 'excel_upload');

      insert into public.worker_skills (worker_id, task_type_id, count)
      values (v_worker_id, v_task_type_id, 1)
      on conflict (worker_id, task_type_id)
      do update set count = public.worker_skills.count + 1, updated_at = now();
    elsif v_existing_assignment.task_type_id <> v_task_type_id then
      update public.worker_skills
      set count = count - 1, updated_at = now()
      where worker_id = v_worker_id and task_type_id = v_existing_assignment.task_type_id;

      delete from public.worker_skills where worker_id = v_worker_id and task_type_id = v_existing_assignment.task_type_id and count <= 0;

      update public.assignments
      set task_type_id = v_task_type_id, source = 'excel_upload'
      where id = v_existing_assignment.id;

      insert into public.worker_skills (worker_id, task_type_id, count)
      values (v_worker_id, v_task_type_id, 1)
      on conflict (worker_id, task_type_id)
      do update set count = public.worker_skills.count + 1, updated_at = now();
    else
      update public.assignments
      set source = 'excel_upload'
      where id = v_existing_assignment.id;
    end if;
  end loop;
end;
$$;
```

- [ ] **Step 4: 업로드 API가 URL 날짜를 기준으로 움직이게 바꾼다**

```ts
// src/app/api/uploads/assignments/route.ts
// accept workDate from form as before, but page should always pass URL-derived date
// keep validation, then call supabase.rpc("apply_assignment_batch", ...)
```

여기서는 API 입력 형식은 유지하되, 페이지 레벨에서 임의 날짜 선택 대신 URL의 `workDate` hidden field만 보내도록 바꾼다.

- [ ] **Step 5: 업로드 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run src/features/uploads/import-assignment-upload.test.ts && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: migration/upload 관련 변경이 보인다

### Task 6: 날짜 기준 인력 조회/상세 상태 계산과 CTA 추가

**Files:**
- Modify: `src/features/workers/service.ts`
- Modify: `src/features/workers/service.test.ts`
- Create: `src/app/(console)/operations/[workDate]/workers/page.tsx`
- Create: `src/app/(console)/operations/[workDate]/workers/[workerId]/page.tsx`
- Test: `tests/ui/operations-workers-page.test.tsx`

- [ ] **Step 1: 날짜 기준 CTA 계산 테스트를 추가한다**

```ts
// src/features/workers/service.test.ts
it("선택 날짜 출근/배정 상태로 CTA를 계산한다", async () => {
  const repo = {
    findWorkerByPhone: vi.fn().mockResolvedValue({
      id: "worker-1",
      name: "홍길동",
      phone: "01012345678",
      lastAttendanceDate: "2026-05-25",
    }),
    listWorkerSkills: vi.fn().mockResolvedValue([]),
    listRecentAssignments: vi.fn().mockResolvedValue([]),
    findAttendanceByWorkerAndDate: vi.fn().mockResolvedValue({ workDate: "2026-05-25" }),
    findAssignmentByWorkerAndDate: vi.fn().mockResolvedValue(null),
  };

  const detail = await getWorkerDetailByPhone("01012345678", repo as never, {
    today: "2026-05-25",
    workDate: "2026-05-25",
  });

  expect(detail?.operationState).toBe("attended_unassigned");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run src/features/workers/service.test.ts`
Expected: FAIL because `operationState` and new repo methods do not exist

- [ ] **Step 3: 워커 서비스에 날짜 기준 상태 모델을 추가한다**

```ts
// src/features/workers/service.ts
export type WorkerOperationState =
  | "not_attended"
  | "attended_unassigned"
  | "attended_assigned";

export type WorkerDetail = WorkerRecord & {
  status: WorkerStatus;
  operationState?: WorkerOperationState;
  selectedDateAssignment?: {
    taskTypeLabel: string;
    source: string;
  } | null;
  skills: WorkerSkill[];
  recentAssignments: WorkerAssignment[];
};
```

이 단계에서 `findAttendanceByWorkerAndDate`, `findAssignmentByWorkerAndDate` 리포지토리 메서드를 추가하고, `options.workDate`가 있을 때 상태를 계산하도록 구현한다.

- [ ] **Step 4: 날짜 컨텍스트를 가진 인력 조회/상세 페이지를 구현한다**

```tsx
// src/app/(console)/operations/[workDate]/workers/page.tsx
// search form keeps phone query
// detail card CTA uses operationState to link to `/operations/${workDate}/attendance?focusWorkerId=${worker.id}`
```

```tsx
// src/app/(console)/operations/[workDate]/workers/[workerId]/page.tsx
// header includes operationState-aware CTA
```

- [ ] **Step 5: UI 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run src/features/workers/service.test.ts tests/ui/operations-workers-page.test.tsx && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: workers service/pages changes 확인

### Task 7: 기존 경로 정리, README, E2E 스모크 확장

**Files:**
- Modify: `tests/e2e/workforce-console.spec.ts`
- Modify: `readme.md`
- Modify: 기존 `src/app/(console)/attendance/page.tsx`, `upload/page.tsx`, `workers/page.tsx` if redirect stubs are needed

- [ ] **Step 1: 새 흐름 기준 E2E 시나리오를 작성한다**

```ts
// tests/e2e/workforce-console.spec.ts
import { test, expect } from "@playwright/test";

test("날짜 선택 화면에서 운영 화면으로 진입할 수 있다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "운영 날짜 선택" })).toBeVisible();
  await page.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/operations\/\d{4}-\d{2}-\d{2}$/);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test:e2e -- tests/e2e/workforce-console.spec.ts`
Expected: FAIL until route structure and login flow are updated together

- [ ] **Step 3: 기존 경로 접근 시 새 날짜 중심 경로로 안내하거나 리다이렉트한다**

```tsx
// example redirect stub
import { redirect } from "next/navigation";
import { getTodayInSeoul } from "@/features/attendance/types";

export default function LegacyAttendanceRedirect() {
  redirect(`/operations/${getTodayInSeoul()}/attendance`);
}
```

- [ ] **Step 4: 문서를 새 흐름으로 갱신한다**

```md
## Routes

- `/`: 운영 날짜 선택 달력
- `/operations/[workDate]`: 날짜별 운영 대시보드
- `/operations/[workDate]/attendance`: 출근 등록 + 수동 배정
- `/operations/[workDate]/upload`: 날짜별 업로드
- `/operations/[workDate]/workers`: 날짜 컨텍스트 인력 조회
```

- [ ] **Step 5: 핵심 검증 명령을 순서대로 실행한다**

Run: `npm run lint`
Expected: exit code `0`

Run: `npm run typecheck`
Expected: exit code `0`

Run: `npm run test`
Expected: all unit/UI tests PASS

Run: `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`
Expected: build PASS

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`
Expected: 최종 변경 파일이 의도한 범위 안에 있다

## Self-Review

- Spec coverage:
  - 날짜 선택 진입 화면: Task 1, 2
  - 날짜별 운영 대시보드: Task 2
  - 날짜별 출근/수동 배정: Task 3, 4
  - 조회 화면 상태 기반 CTA: Task 6
  - 엑셀 덮어쓰기: Task 5
  - 테스트/E2E/문서: Task 7
- Placeholder scan:
  - `tests/ui/operations-workers-page.test.tsx`는 Task 6에서 생성 대상으로 명시했고, 코드 예시는 CTA 중심으로 구현하도록 적었다.
  - 업로드 API 단계는 기존 형식을 유지하되 페이지의 hidden field로 날짜를 고정하는 것으로 범위를 제한했다.
- Type consistency:
  - `workDate`, `taskTypeId`, `operationState`, `manual_assignment` 명칭을 전 태스크에서 동일하게 사용한다.
  - `ManualAssignmentRepository`와 `saveManualAssignment` 시그니처를 이후 액션/페이지에서 동일하게 사용한다.
