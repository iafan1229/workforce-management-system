# Workforce Data Pipeline MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자용 Workforce 데이터 파이프라인 MVP를 구현해, 출근 등록, 고정 양식 엑셀 업로드, 작업 이력 저장, 경험 누적, 전화번호 기반 인력 조회가 가능한 내부 콘솔을 완성한다.

**Architecture:** Next.js App Router 기반 단일 웹 앱을 루트에 구축한다. 핵심 운영 규칙은 서버 측 도메인 서비스로 분리하고, Supabase Auth/Postgres를 데이터 저장소로 사용한다. 엑셀 업로드는 서버에서 전체 검증 후 `assignments`와 `worker_skills`를 원자적으로 반영한다.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres, SheetJS (`xlsx`), Zod, Vitest, React Testing Library, Playwright

---

> 사용자 요청에 따라 이 계획에서는 에이전트 커밋을 수행하지 않는다. 각 태스크 마지막 단계는 `사용자 커밋 체크포인트`로 두고, 상태 확인 후 사용자가 직접 커밋하는 흐름을 전제로 한다.

## File Structure

- `package.json`: 앱 스크립트와 의존성 정의
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`: 프론트엔드 빌드/검증 설정
- `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`: 테스트 러너 설정
- `src/app/layout.tsx`, `src/app/globals.css`: 공통 레이아웃과 스타일
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/actions.ts`: 로그인 화면과 서버 액션
- `src/app/(console)/layout.tsx`: 인증된 관리자 전용 콘솔 레이아웃
- `src/app/(console)/page.tsx`: 오늘 운영 요약 화면
- `src/app/(console)/attendance/page.tsx`, `src/app/(console)/attendance/actions.ts`: 출근 등록 화면과 서버 액션
- `src/app/(console)/upload/page.tsx`: 업로드 화면
- `src/app/(console)/workers/page.tsx`, `src/app/(console)/workers/[workerId]/page.tsx`: 인력 조회/상세 화면
- `src/app/api/uploads/assignments/route.ts`: 업로드 HTTP 엔드포인트
- `src/lib/env.ts`: 환경변수 검증
- `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`: Supabase 클라이언트 생성기
- `src/lib/phone.ts`, `src/lib/worker-status.ts`: 공유 도메인 유틸리티
- `src/features/attendance/*`: 출근 등록 도메인 로직
- `src/features/uploads/*`: 엑셀 파싱/검증/반영 로직
- `src/features/workers/*`: 조회/상세 화면용 질의 로직
- `supabase/config.toml`: 로컬 Supabase 실행 설정
- `supabase/migrations/20260521_000001_workforce_schema.sql`: DB 스키마
- `supabase/seed.sql`: `task_types` 시드 데이터
- `tests/ui/*`, `tests/e2e/*`, `src/**/*.test.ts[x]`: 단위/UI/E2E 테스트

### Task 1: Next.js 앱 셸과 테스트 하네스 부트스트랩

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Test: `tests/ui/login-page.test.tsx`

- [ ] **Step 1: 테스트 러너를 먼저 실행할 수 있는 최소 툴링 뼈대를 만든다**

```json
{
  "name": "workforce-os-system",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --run tests/ui",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.49.8",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "xlsx": "^0.18.5",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.18",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.4",
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.26.0",
    "eslint-config-next": "^15.3.2",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

```ts
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 2: 의존성을 설치한다**

Run: `npm install`  
Expected: `added ... packages` 출력 후 종료 코드 `0`

- [ ] **Step 3: 로그인 화면 스모크 테스트를 먼저 실패 상태로 작성한다**

```tsx
// tests/ui/login-page.test.tsx
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("관리자 로그인 입력폼을 렌더링한다", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: 테스트가 실제로 실패하는지 확인한다**

Run: `npm run test -- --run tests/ui/login-page.test.tsx`  
Expected: FAIL with `Cannot find module '@/app/(auth)/login/page'`

- [ ] **Step 5: 최소 앱 셸과 로그인 페이지를 구현한다**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce OS",
  description: "물류 현장 Workforce 운영 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-stone-100 text-stone-950">
        {children}
      </body>
    </html>
  );
}
```

```tsx
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-700">
          Workforce OS
        </p>
        <h1 className="text-3xl font-semibold text-stone-950">관리자 로그인</h1>
        <p className="text-sm text-stone-600">
          오늘 출근 등록과 배정 업로드를 시작하려면 로그인하세요.
        </p>
      </div>

      <form className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">이메일</span>
          <input
            name="email"
            type="email"
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">비밀번호</span>
          <input
            name="password"
            type="password"
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />
        </label>

        <button className="w-full rounded-xl bg-orange-600 px-4 py-3 font-medium text-white">
          로그인
        </button>
      </form>
    </main>
  );
}
```

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
}
```

- [ ] **Step 6: 스모크 테스트와 정적 검증을 통과시킨다**

Run: `npm run test -- --run tests/ui/login-page.test.tsx && npm run lint && npm run typecheck`  
Expected: `1 passed` and no lint/type errors

- [ ] **Step 7: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 1에서 생성한 파일만 `??` 또는 `M` 상태로 표시됨

### Task 2: Supabase 인증 플로우와 보호된 콘솔 레이아웃 추가

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/auth/route-access.ts`
- Create: `src/lib/auth/route-access.test.ts`
- Create: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(console)/layout.tsx`
- Create: `src/app/(console)/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: 인증 라우트 접근 규칙을 검증하는 실패 테스트를 작성한다**

```ts
// src/lib/auth/route-access.test.ts
import { describe, expect, it } from "vitest";
import { resolveRouteAccess } from "./route-access";

describe("resolveRouteAccess", () => {
  it("세션이 없으면 콘솔 경로를 로그인으로 보낸다", () => {
    expect(
      resolveRouteAccess({ pathname: "/attendance", hasSession: false }),
    ).toEqual({
      allow: false,
      redirectTo: "/login?next=%2Fattendance",
    });
  });

  it("세션이 있으면 로그인 경로를 오늘 운영 화면으로 보낸다", () => {
    expect(resolveRouteAccess({ pathname: "/login", hasSession: true })).toEqual(
      {
        allow: false,
        redirectTo: "/",
      },
    );
  });
});
```

- [ ] **Step 2: 실패 테스트를 실행한다**

Run: `npm run test -- --run src/lib/auth/route-access.test.ts`  
Expected: FAIL with `Cannot find module './route-access'`

- [ ] **Step 3: 환경변수와 Supabase 접근 헬퍼를 구현한다**

```ts
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
```

```ts
// src/lib/auth/route-access.ts
type RouteAccessInput = {
  pathname: string;
  hasSession: boolean;
};

export function resolveRouteAccess({ pathname, hasSession }: RouteAccessInput) {
  const isLoginPath = pathname === "/login";

  if (!hasSession && !isLoginPath) {
    return {
      allow: false,
      redirectTo: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  if (hasSession && isLoginPath) {
    return {
      allow: false,
      redirectTo: "/",
    };
  }

  return { allow: true } as const;
}
```

```ts
// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieValues) => {
          cookieValues.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

```ts
// src/lib/supabase/browser.ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 4: 로그인 서버 액션과 보호된 콘솔 레이아웃을 구현한다**

```ts
// src/app/(auth)/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호를 확인해 주세요." };
  }

  redirect("/");
}
```

```tsx
// src/app/(auth)/login/page.tsx
import { signInAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-700">
          Workforce OS
        </p>
        <h1 className="text-3xl font-semibold text-stone-950">관리자 로그인</h1>
        <p className="text-sm text-stone-600">
          오늘 출근 등록과 배정 업로드를 시작하려면 로그인하세요.
        </p>
      </div>

      <form action={signInAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">이메일</span>
          <input
            name="email"
            type="email"
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">비밀번호</span>
          <input
            name="password"
            type="password"
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />
        </label>

        <button className="w-full rounded-xl bg-orange-600 px-4 py-3 font-medium text-white">
          로그인
        </button>
      </form>
    </main>
  );
}
```

```tsx
// src/app/(console)/layout.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              Workforce OS
            </p>
            <h1 className="text-lg font-semibold text-stone-950">운영 콘솔</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
```

```tsx
// src/app/(console)/page.tsx
export default function TodayOperationsPage() {
  return <h2 className="text-2xl font-semibold text-stone-950">오늘 운영</h2>;
}
```

- [ ] **Step 5: 테스트와 타입 검사를 다시 통과시킨다**

Run: `npm run test -- --run src/lib/auth/route-access.test.ts tests/ui/login-page.test.tsx && npm run typecheck`  
Expected: `3 passed` and no TypeScript errors

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 2 관련 인증/레이아웃 파일만 추가 변경으로 보임

### Task 3: Supabase 스키마와 공통 도메인 유틸리티 구축

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260521_000001_workforce_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/lib/phone.ts`
- Create: `src/lib/worker-status.ts`
- Create: `src/lib/phone.test.ts`
- Create: `src/lib/worker-status.test.ts`

- [ ] **Step 1: 전화번호 정규화와 상태 계산 테스트를 먼저 실패로 작성한다**

```ts
// src/lib/phone.test.ts
import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("하이픈과 공백을 제거한 11자리 숫자를 반환한다", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });
});
```

```ts
// src/lib/worker-status.test.ts
import { describe, expect, it } from "vitest";
import { deriveWorkerStatus } from "./worker-status";

describe("deriveWorkerStatus", () => {
  it("최근 30일 이내 근무자는 active를 반환한다", () => {
    expect(
      deriveWorkerStatus({
        lastAttendanceDate: "2026-05-01",
        today: "2026-05-21",
      }),
    ).toBe("active");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run src/lib/phone.test.ts src/lib/worker-status.test.ts`  
Expected: FAIL with `Cannot find module './phone'` and `Cannot find module './worker-status'`

- [ ] **Step 3: 유틸리티와 DB 스키마를 구현한다**

```ts
// src/lib/phone.ts
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");

  if (!/^01\d{8,9}$/.test(digits)) {
    throw new Error("유효하지 않은 전화번호 형식입니다.");
  }

  return digits;
}
```

```ts
// src/lib/worker-status.ts
export type WorkerStatus = "active" | "inactive" | "dormant";

export function deriveWorkerStatus({
  lastAttendanceDate,
  today,
}: {
  lastAttendanceDate: string | null;
  today: string;
}): WorkerStatus {
  if (!lastAttendanceDate) {
    return "dormant";
  }

  const last = new Date(lastAttendanceDate);
  const current = new Date(today);
  const diffDays = Math.floor(
    (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 30) return "active";
  if (diffDays <= 180) return "inactive";
  return "dormant";
}
```

```toml
# supabase/config.toml
project_id = "workforce-os-system"

[api]
enabled = true
port = 54321

[db]
port = 54322
major_version = 15
```

```sql
-- supabase/migrations/20260521_000001_workforce_schema.sql
create extension if not exists "pgcrypto";

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  work_date date not null,
  created_at timestamptz not null default now(),
  unique(worker_id, work_date)
);

create table public.task_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  task_type_id uuid not null references public.task_types(id) on delete restrict,
  work_date date not null,
  source text not null default 'excel_upload',
  created_at timestamptz not null default now(),
  unique(worker_id, work_date)
);

create table public.worker_skills (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  task_type_id uuid not null references public.task_types(id) on delete restrict,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  unique(worker_id, task_type_id)
);

alter table public.workers enable row level security;
alter table public.attendances enable row level security;
alter table public.task_types enable row level security;
alter table public.assignments enable row level security;
alter table public.worker_skills enable row level security;

create policy "authenticated full access workers"
on public.workers for all to authenticated using (true) with check (true);
create policy "authenticated full access attendances"
on public.attendances for all to authenticated using (true) with check (true);
create policy "authenticated full access task_types"
on public.task_types for all to authenticated using (true) with check (true);
create policy "authenticated full access assignments"
on public.assignments for all to authenticated using (true) with check (true);
create policy "authenticated full access worker_skills"
on public.worker_skills for all to authenticated using (true) with check (true);

create or replace function public.apply_assignment_batch(
  p_work_date date,
  p_rows jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  row_record jsonb;
  v_worker_id uuid;
  v_task_type_id uuid;
begin
  for row_record in select * from jsonb_array_elements(p_rows)
  loop
    v_worker_id := (row_record ->> 'worker_id')::uuid;
    v_task_type_id := (row_record ->> 'task_type_id')::uuid;

    insert into public.assignments (worker_id, task_type_id, work_date, source)
    values (v_worker_id, v_task_type_id, p_work_date, 'excel_upload');

    insert into public.worker_skills (worker_id, task_type_id, count)
    values (v_worker_id, v_task_type_id, 1)
    on conflict (worker_id, task_type_id)
    do update
      set count = public.worker_skills.count + 1,
          updated_at = now();
  end loop;
end;
$$;
```

```sql
-- supabase/seed.sql
insert into public.task_types (code, label)
values
  ('wash', '세척'),
  ('linehaul_unload', '간선하차'),
  ('signaler', '신호수'),
  ('feeding', '피딩'),
  ('sorting_mover', '소분_무버'),
  ('sorting_unload', '소분_하차'),
  ('sorting_load', '소분_적재'),
  ('sorting_reject', '소분_리젝'),
  ('sorting_overflow', '소분_오버플로우'),
  ('sorting_irregular', '소분_이형'),
  ('sorting_large', '소분_대분류'),
  ('sorting_small', '소분_소분류'),
  ('sorting_pb_support', '소분_PB지원'),
  ('unloading', '언로딩')
on conflict (code) do update set label = excluded.label;
```

- [ ] **Step 4: 테스트와 로컬 DB 초기화를 실행한다**

Run: `npm run test -- --run src/lib/phone.test.ts src/lib/worker-status.test.ts && supabase db reset`  
Expected: `2 passed` and Supabase local database reset/apply/seed complete

- [ ] **Step 5: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 3 관련 SQL과 공통 유틸리티만 변경으로 보임

### Task 4: 출근 등록 도메인과 화면 구현

**Files:**
- Create: `src/features/attendance/types.ts`
- Create: `src/features/attendance/service.ts`
- Create: `src/features/attendance/service.test.ts`
- Create: `src/app/(console)/attendance/actions.ts`
- Create: `src/app/(console)/attendance/page.tsx`

- [ ] **Step 1: 신규 인력 생성 + 출근 등록 규칙의 실패 테스트를 작성한다**

```ts
// src/features/attendance/service.test.ts
import { describe, expect, it, vi } from "vitest";
import { registerAttendance } from "./service";

describe("registerAttendance", () => {
  it("없는 전화번호면 신규 인력을 만들고 출근을 기록한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue(null),
      createWorker: vi.fn().mockResolvedValue({ id: "worker-1" }),
      createAttendance: vi.fn().mockResolvedValue({ id: "attendance-1" }),
    };

    await registerAttendance(
      {
        name: "홍길동",
        phone: "010-1234-5678",
        workDate: "2026-05-21",
      },
      repo,
    );

    expect(repo.createWorker).toHaveBeenCalledWith({
      name: "홍길동",
      phone: "01012345678",
    });
    expect(repo.createAttendance).toHaveBeenCalledWith({
      workerId: "worker-1",
      workDate: "2026-05-21",
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run src/features/attendance/service.test.ts`  
Expected: FAIL with `Cannot find module './service'`

- [ ] **Step 3: 출근 등록 도메인 서비스를 구현한다**

```ts
// src/features/attendance/service.ts
import { normalizePhone } from "@/lib/phone";

type AttendanceRepo = {
  findWorkerByPhone: (phone: string) => Promise<{ id: string; name: string } | null>;
  createWorker: (input: { name: string; phone: string }) => Promise<{ id: string }>;
  createAttendance: (input: { workerId: string; workDate: string }) => Promise<unknown>;
};

export async function registerAttendance(
  input: { name: string; phone: string; workDate: string },
  repo: AttendanceRepo,
) {
  const normalizedPhone = normalizePhone(input.phone);
  const existingWorker = await repo.findWorkerByPhone(normalizedPhone);

  const worker =
    existingWorker ??
    (await repo.createWorker({
      name: input.name.trim(),
      phone: normalizedPhone,
    }));

  await repo.createAttendance({
    workerId: worker.id,
    workDate: input.workDate,
  });

  return worker;
}
```

```ts
// src/app/(console)/attendance/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerAttendance } from "@/features/attendance/service";

export async function registerAttendanceAction(formData: FormData) {
  const supabase = createSupabaseServerClient();

  await registerAttendance(
    {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      workDate: String(formData.get("workDate") ?? ""),
    },
    {
      findWorkerByPhone: async (phone) => {
        const { data } = await supabase
          .from("workers")
          .select("id, name")
          .eq("phone", phone)
          .maybeSingle();
        return data;
      },
      createWorker: async (input) => {
        const { data, error } = await supabase
          .from("workers")
          .insert(input)
          .select("id")
          .single();
        if (error) throw error;
        return data;
      },
      createAttendance: async (input) => {
        const { error } = await supabase.from("attendances").insert({
          worker_id: input.workerId,
          work_date: input.workDate,
        });
        if (error) throw error;
      },
    },
  );

  revalidatePath("/attendance");
  revalidatePath("/");
}
```

- [ ] **Step 4: 출근 등록 화면을 구현한다**

```tsx
// src/app/(console)/attendance/page.tsx
import { registerAttendanceAction } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AttendancePage() {
  const supabase = createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: attendedWorkers } = await supabase
    .from("attendances")
    .select("id, work_date, workers(id, name, phone)")
    .eq("work_date", today)
    .order("created_at", { ascending: false });

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form action={registerAttendanceAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">출근 등록</h2>
        <input type="hidden" name="workDate" value={today} />
        <input name="name" placeholder="이름" className="w-full rounded-xl border px-4 py-3" />
        <input name="phone" placeholder="01012345678" className="w-full rounded-xl border px-4 py-3" />
        <button className="w-full rounded-xl bg-orange-600 px-4 py-3 font-medium text-white">
          오늘 출근 등록
        </button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-950">오늘 출근자</h3>
        <ul className="mt-4 space-y-3">
          {attendedWorkers?.map((row) => (
            <li key={row.id} className="rounded-xl border border-stone-200 px-4 py-3">
              <p className="font-medium text-stone-900">{row.workers?.name}</p>
              <p className="text-sm text-stone-600">{row.workers?.phone}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 출근 등록 테스트를 통과시키고 수동 동작을 확인한다**

Run: `npm run test -- --run src/features/attendance/service.test.ts && npm run typecheck`  
Expected: `1 passed` and no type errors

Run: `npm run dev`  
Expected: `/attendance`에서 출근 등록 폼과 오늘 출근자 목록이 렌더링됨

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 4 관련 출근 등록 서비스/화면 파일만 변경으로 보임

### Task 5: 엑셀 업로드 검증과 원자적 반영 도메인 구현

**Files:**
- Create: `src/features/uploads/types.ts`
- Create: `src/features/uploads/parse-assignment-workbook.ts`
- Create: `src/features/uploads/validate-assignment-upload.ts`
- Create: `src/features/uploads/import-assignment-upload.ts`
- Create: `src/features/uploads/import-assignment-upload.test.ts`

- [ ] **Step 1: 중복 행, 미출근 인력, 경험 누적을 검증하는 실패 테스트를 작성한다**

```ts
// src/features/uploads/import-assignment-upload.test.ts
import { describe, expect, it, vi } from "vitest";
import { importAssignmentUpload } from "./import-assignment-upload";

describe("importAssignmentUpload", () => {
  it("업로드 중복 행이 있으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [
            { name: "홍길동", phone: "01012345678", task: "피딩" },
            { name: "홍길동", phone: "01012345678", task: "피딩" },
          ],
        },
        repo as never,
      ),
    ).rejects.toThrow("업로드 파일 안에 동일 인력 중복 행이 있습니다.");
  });
});
```

- [ ] **Step 2: 실패 테스트를 실행한다**

Run: `npm run test -- --run src/features/uploads/import-assignment-upload.test.ts`  
Expected: FAIL with `Cannot find module './import-assignment-upload'`

- [ ] **Step 3: 파싱/검증/반영 도메인 로직을 구현한다**

```ts
// src/features/uploads/parse-assignment-workbook.ts
import * as XLSX from "xlsx";

export function parseAssignmentWorkbook(fileBuffer: ArrayBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    throw new Error("업로드할 시트를 찾을 수 없습니다.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<{
    name: string;
    phone: string;
    task: string;
  }>(sheet, { defval: "" });
}
```

```ts
// src/features/uploads/validate-assignment-upload.ts
import { normalizePhone } from "@/lib/phone";

export function validateAssignmentRows(
  rows: Array<{ name: string; phone: string; task: string }>,
) {
  const seenPhones = new Set<string>();

  return rows.map((row, index) => {
    const normalizedPhone = normalizePhone(row.phone);

    if (!row.name.trim() || !row.task.trim()) {
      throw new Error(`${index + 2}행: 이름, 전화번호, 업무는 모두 필수입니다.`);
    }

    if (seenPhones.has(normalizedPhone)) {
      throw new Error("업로드 파일 안에 동일 인력 중복 행이 있습니다.");
    }

    seenPhones.add(normalizedPhone);

    return {
      ...row,
      name: row.name.trim(),
      phone: normalizedPhone,
      task: row.task.trim(),
    };
  });
}
```

```ts
// src/features/uploads/import-assignment-upload.ts
import { validateAssignmentRows } from "./validate-assignment-upload";

type UploadRepo = {
  findWorkersByPhones: (phones: string[]) => Promise<Array<{ id: string; name: string; phone: string }>>;
  findAttendancesByDate: (workDate: string) => Promise<Array<{ workerId: string; workDate: string }>>;
  findTaskTypesByLabels: (labels: string[]) => Promise<Array<{ id: string; label: string }>>;
  applyAssignmentBatch: (input: {
    workDate: string;
    rows: Array<{ workerId: string; taskTypeId: string }>;
  }) => Promise<void>;
};

export async function importAssignmentUpload(
  input: {
    workDate: string;
    rows: Array<{ name: string; phone: string; task: string }>;
  },
  repo: UploadRepo,
) {
  const rows = validateAssignmentRows(input.rows);
  const workers = await repo.findWorkersByPhones(rows.map((row) => row.phone));
  const attendances = await repo.findAttendancesByDate(input.workDate);
  const taskTypes = await repo.findTaskTypesByLabels(rows.map((row) => row.task));

  const workerMap = new Map(workers.map((worker) => [worker.phone, worker]));
  const attendanceSet = new Set(attendances.map((row) => row.workerId));
  const taskTypeMap = new Map(taskTypes.map((taskType) => [taskType.label, taskType]));

  const assignmentRows = rows.map((row) => {
    const worker = workerMap.get(row.phone);
    const taskType = taskTypeMap.get(row.task);

    if (!worker) throw new Error(`${row.phone} 인력이 등록되어 있지 않습니다.`);
    if (worker.name !== row.name) throw new Error(`${row.phone}의 이름이 등록 정보와 다릅니다.`);
    if (!attendanceSet.has(worker.id)) throw new Error(`${row.name}은(는) 출근 등록되지 않았습니다.`);
    if (!taskType) throw new Error(`${row.task} 업무 카테고리를 찾을 수 없습니다.`);

    return {
      workerId: worker.id,
      taskTypeId: taskType.id,
    };
  });

  await repo.applyAssignmentBatch({
    workDate: input.workDate,
    rows: assignmentRows,
  });

  return {
    importedCount: assignmentRows.length,
  };
}
```

- [ ] **Step 4: 업로드 도메인 테스트를 통과시킨다**

Run: `npm run test -- --run src/features/uploads/import-assignment-upload.test.ts`  
Expected: `1 passed`

- [ ] **Step 5: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 5 관련 업로드 도메인 파일만 변경으로 보임

### Task 6: 업로드 API와 화면을 연결한다

**Files:**
- Create: `src/app/api/uploads/assignments/route.ts`
- Create: `src/app/(console)/upload/page.tsx`
- Create: `src/app/(console)/upload/upload-form.tsx`
- Create: `tests/ui/upload-page.test.tsx`

- [ ] **Step 1: 업로드 화면이 실패 메시지 영역을 렌더링하는지 먼저 테스트한다**

```tsx
// tests/ui/upload-page.test.tsx
import { render, screen } from "@testing-library/react";
import UploadPage from "@/app/(console)/upload/page";

describe("UploadPage", () => {
  it("업로드 안내와 실패 메시지 영역을 렌더링한다", async () => {
    const page = await UploadPage();
    render(page);

    expect(
      screen.getByRole("heading", { name: "배정표 엑셀 업로드" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("오류가 한 줄이라도 있으면 전체 업로드가 실패합니다."),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test -- --run tests/ui/upload-page.test.tsx`  
Expected: FAIL with `Cannot find module '@/app/(console)/upload/page'`

- [ ] **Step 3: 업로드 API 엔드포인트를 구현한다**

```ts
// src/app/api/uploads/assignments/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAssignmentWorkbook } from "@/features/uploads/parse-assignment-workbook";
import { importAssignmentUpload } from "@/features/uploads/import-assignment-upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const workDate = String(formData.get("workDate") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "업로드 파일이 필요합니다." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const rows = parseAssignmentWorkbook(await file.arrayBuffer());

    const result = await importAssignmentUpload(
      { workDate, rows },
      {
        findWorkersByPhones: async (phones) => {
          const { data, error } = await supabase.from("workers").select("id, name, phone").in("phone", phones);
          if (error) throw error;
          return data ?? [];
        },
        findAttendancesByDate: async (date) => {
          const { data, error } = await supabase.from("attendances").select("worker_id, work_date").eq("work_date", date);
          if (error) throw error;
          return (data ?? []).map((row) => ({ workerId: row.worker_id, workDate: row.work_date }));
        },
        findTaskTypesByLabels: async (labels) => {
          const { data, error } = await supabase.from("task_types").select("id, label").in("label", labels);
          if (error) throw error;
          return data ?? [];
        },
        applyAssignmentBatch: async ({ workDate, rows }) => {
          const { error } = await supabase.rpc("apply_assignment_batch", {
            p_work_date: workDate,
            p_rows: rows.map((row) => ({
              worker_id: row.workerId,
              task_type_id: row.taskTypeId,
            })),
          });
          if (error) throw error;
        },
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "업로드 처리 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 4: 업로드 화면을 구현한다**

```tsx
// src/app/(console)/upload/page.tsx
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="grid gap-6 lg:grid-cols-[440px_1fr]">
      <UploadForm defaultWorkDate={today} />

      <aside className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-orange-900">
        <h3 className="font-semibold">고정 양식 규칙</h3>
        <ul className="mt-3 space-y-2">
          <li>`name`, `phone`, `task` 컬럼이 모두 있어야 합니다.</li>
          <li>업로드 전에 해당 인력의 출근 등록이 완료되어 있어야 합니다.</li>
          <li>한 사람은 같은 날짜에 한 번만 배정될 수 있습니다.</li>
        </ul>
      </aside>
    </section>
  );
}
```

```tsx
// src/app/(console)/upload/upload-form.tsx
"use client";

import { useState } from "react";

type UploadFormProps = {
  defaultWorkDate: string;
};

export function UploadForm({ defaultWorkDate }: UploadFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    const response = await fetch("/api/uploads/assignments", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "업로드 처리 중 오류가 발생했습니다.");
      return;
    }

    setMessage(`${payload.importedCount}건의 배정이 반영되었습니다.`);
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold text-stone-950">배정표 엑셀 업로드</h2>
        <p className="mt-2 text-sm text-stone-600">
          오류가 한 줄이라도 있으면 전체 업로드가 실패합니다.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-800">작업일</span>
        <input
          type="date"
          name="workDate"
          defaultValue={defaultWorkDate}
          className="w-full rounded-xl border px-4 py-3"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-800">엑셀 파일</span>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          className="w-full rounded-xl border px-4 py-3"
        />
      </label>

      <button className="w-full rounded-xl bg-orange-600 px-4 py-3 font-medium text-white">
        업로드 반영
      </button>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
```

- [ ] **Step 5: UI 테스트와 수동 업로드 시나리오를 검증한다**

Run: `npm run test -- --run tests/ui/upload-page.test.tsx && npm run typecheck`  
Expected: `1 passed` and no type errors

Run: `npm run dev`  
Expected: `/upload`에서 파일 선택, 날짜 선택, 규칙 안내가 모두 보임

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 6 관련 업로드 화면/API 파일만 변경으로 보임

### Task 7: 오늘 운영 요약과 인력 조회/상세 화면 구현

**Files:**
- Create: `src/features/workers/service.ts`
- Create: `src/features/workers/service.test.ts`
- Create: `src/app/(console)/workers/page.tsx`
- Create: `src/app/(console)/workers/[workerId]/page.tsx`
- Modify: `src/app/(console)/page.tsx`

- [ ] **Step 1: 전화번호 기반 인력 상세 조회 테스트를 먼저 실패로 작성한다**

```ts
// src/features/workers/service.test.ts
import { describe, expect, it, vi } from "vitest";
import { getWorkerDetailByPhone } from "./service";

describe("getWorkerDetailByPhone", () => {
  it("작업 경험과 최근 이력을 함께 반환한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-1",
        name: "홍길동",
        phone: "01012345678",
        lastAttendanceDate: "2026-05-20",
      }),
      listSkills: vi.fn().mockResolvedValue([{ label: "피딩", count: 3 }]),
      listAssignments: vi.fn().mockResolvedValue([{ workDate: "2026-05-20", taskLabel: "피딩" }]),
    };

    const result = await getWorkerDetailByPhone("010-1234-5678", repo as never);

    expect(result?.status).toBe("active");
    expect(result?.skills[0]).toEqual({ label: "피딩", count: 3 });
  });
});
```

- [ ] **Step 2: 실패 테스트를 실행한다**

Run: `npm run test -- --run src/features/workers/service.test.ts`  
Expected: FAIL with `Cannot find module './service'`

- [ ] **Step 3: 인력 조회 서비스와 오늘 운영 집계 질의를 구현한다**

```ts
// src/features/workers/service.ts
import { normalizePhone } from "@/lib/phone";
import { deriveWorkerStatus } from "@/lib/worker-status";

type WorkerRepo = {
  findWorkerByPhone: (phone: string) => Promise<{
    id: string;
    name: string;
    phone: string;
    lastAttendanceDate: string | null;
  } | null>;
  listSkills: (workerId: string) => Promise<Array<{ label: string; count: number }>>;
  listAssignments: (workerId: string) => Promise<Array<{ workDate: string; taskLabel: string }>>;
};

export async function getWorkerDetailByPhone(phone: string, repo: WorkerRepo) {
  const worker = await repo.findWorkerByPhone(normalizePhone(phone));
  if (!worker) return null;

  const [skills, assignments] = await Promise.all([
    repo.listSkills(worker.id),
    repo.listAssignments(worker.id),
  ]);

  return {
    ...worker,
    status: deriveWorkerStatus({
      lastAttendanceDate: worker.lastAttendanceDate,
      today: new Date().toISOString().slice(0, 10),
    }),
    skills,
    assignments,
  };
}
```

```tsx
// src/app/(console)/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TodayOperationsPage() {
  const supabase = createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: attendanceCount }, { count: assignmentCount }] = await Promise.all([
    supabase.from("attendances").select("*", { count: "exact", head: true }).eq("work_date", today),
    supabase.from("assignments").select("*", { count: "exact", head: true }).eq("work_date", today),
  ]);

  return (
    <section className="grid gap-6 md:grid-cols-3">
      <article className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">오늘 출근 인원</p>
        <p className="mt-3 text-3xl font-semibold text-stone-950">{attendanceCount ?? 0}</p>
      </article>
      <article className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">오늘 반영된 배정</p>
        <p className="mt-3 text-3xl font-semibold text-stone-950">{assignmentCount ?? 0}</p>
      </article>
      <article className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">바로가기</p>
        <div className="mt-4 flex flex-col gap-3">
          <Link href="/attendance" className="rounded-xl bg-stone-900 px-4 py-3 text-white">출근 등록</Link>
          <Link href="/upload" className="rounded-xl bg-orange-600 px-4 py-3 text-white">엑셀 업로드</Link>
          <Link href="/workers" className="rounded-xl border border-stone-300 px-4 py-3">인력 조회</Link>
        </div>
      </article>
    </section>
  );
}
```

- [ ] **Step 4: 인력 조회/상세 화면을 구현한다**

```tsx
// src/app/(console)/workers/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const phone = params.phone?.replace(/\D/g, "") ?? "";
  const supabase = createSupabaseServerClient();

  const workerQuery = phone
    ? supabase.from("workers").select("id, name, phone").eq("phone", phone).maybeSingle()
    : Promise.resolve({ data: null });

  const { data: worker } = await workerQuery;

  return (
    <section className="space-y-6">
      <form className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">전화번호 기반 인력 조회</h2>
        <div className="mt-4 flex gap-3">
          <input
            name="phone"
            placeholder="01012345678"
            defaultValue={phone}
            className="flex-1 rounded-xl border px-4 py-3"
          />
          <button className="rounded-xl bg-stone-900 px-4 py-3 text-white">조회</button>
        </div>
      </form>

      {worker ? (
        <Link
          href={`/workers/${worker.id}`}
          className="block rounded-2xl bg-white p-6 shadow-sm"
        >
          <p className="font-semibold text-stone-950">{worker.name}</p>
          <p className="text-sm text-stone-600">{worker.phone}</p>
        </Link>
      ) : null}
    </section>
  );
}
```

```tsx
// src/app/(console)/workers/[workerId]/page.tsx
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deriveWorkerStatus } from "@/lib/worker-status";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const supabase = createSupabaseServerClient();

  const { data: worker } = await supabase
    .from("workers")
    .select("id, name, phone")
    .eq("id", workerId)
    .maybeSingle();

  if (!worker) notFound();

  const [{ data: latestAttendance }, { data: skills }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("attendances")
        .select("work_date")
        .eq("worker_id", workerId)
        .order("work_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("worker_skills")
        .select("count, task_types(label)")
        .eq("worker_id", workerId)
        .order("count", { ascending: false }),
      supabase
        .from("assignments")
        .select("work_date, task_types(label)")
        .eq("worker_id", workerId)
        .order("work_date", { ascending: false })
        .limit(10),
    ]);

  const status = deriveWorkerStatus({
    lastAttendanceDate: latestAttendance?.work_date ?? null,
    today: new Date().toISOString().slice(0, 10),
  });

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-stone-950">{worker.name}</h2>
        <p className="mt-2 text-stone-600">{worker.phone}</p>
        <p className="mt-2 text-sm text-orange-700">상태: {status}</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-950">업무 경험</h3>
        <ul className="mt-4 space-y-2">
          {skills?.map((row) => (
            <li key={`${row.task_types?.label}-${row.count}`} className="flex justify-between rounded-xl border px-4 py-3">
              <span>{row.task_types?.label}</span>
              <span>{row.count}회</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-950">최근 작업 이력</h3>
        <ul className="mt-4 space-y-2">
          {assignments?.map((row) => (
            <li key={`${row.work_date}-${row.task_types?.label}`} className="rounded-xl border px-4 py-3">
              <p className="font-medium text-stone-900">{row.task_types?.label}</p>
              <p className="text-sm text-stone-600">{row.work_date}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 조회 테스트와 수동 흐름을 검증한다**

Run: `npm run test -- --run src/features/workers/service.test.ts && npm run typecheck`  
Expected: `1 passed` and no type errors

Run: `npm run dev`  
Expected: `/`, `/workers`, `/workers/[id]`에서 요약 카드, 조회 폼, 상세 카드가 렌더링됨

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: Task 7 관련 조회/요약 화면 파일만 변경으로 보임

### Task 8: 최종 검증, 보강 테스트, 운영 문서 업데이트

**Files:**
- Create: `tests/e2e/workforce-console.spec.ts`
- Modify: `readme.md`

- [ ] **Step 1: 로그인 화면과 주요 이동 경로의 실패 E2E 테스트를 작성한다**

```ts
// tests/e2e/workforce-console.spec.ts
import { expect, test } from "@playwright/test";

test("로그인 화면이 첫 진입점으로 보인다", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await expect(
    page.getByRole("heading", { name: "관리자 로그인" }),
  ).toBeVisible();
});
```

- [ ] **Step 2: E2E 테스트가 실패하는지 확인한다**

Run: `npm run test:e2e -- tests/e2e/workforce-console.spec.ts`  
Expected: FAIL because local app server is not running yet

- [ ] **Step 3: 개발/운영 문서를 업데이트한다**

```md
<!-- readme.md -->
# Workforce OS

## 로컬 실행

1. `npm install`
2. `supabase start`
3. `supabase db reset`
4. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
5. `npm run dev`

## 핵심 화면

- `/login`
- `/attendance`
- `/upload`
- `/workers`

## 검증 명령어

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
```

- [ ] **Step 4: 정적 검증과 빌드 검증을 먼저 완료한다**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`  
Expected: lint/type/unit tests pass and Next production build completes successfully

- [ ] **Step 5: 로컬 서버를 띄운 뒤 E2E 흐름을 점검한다**

Run: `npm run dev`  
Expected: local dev server starts on `http://localhost:3000`

Run: `npm run test:e2e -- tests/e2e/workforce-console.spec.ts`  
Expected: `1 passed`

- [ ] **Step 6: 사용자 커밋 체크포인트**

Run: `git status --short`  
Expected: 최종 보강 파일과 문서만 남아 있음
