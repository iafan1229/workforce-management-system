# Workforce OS MVP

물류 현장 운영팀이 매일 쓰는 최소 기능만 담은 Workforce OS MVP입니다. 현재 앱은 `관리자 로그인 → 운영 날짜 선택 → 선택 날짜 기준 출근/배정/업로드/인력 조회` 흐름으로 동작합니다.

## 로컬 실행

1. 의존성을 설치합니다.

```bash
npm install
```

2. 로컬 Supabase를 시작합니다.

```bash
npx supabase start
```

3. 스키마와 시드 데이터를 로컬 DB에 반영합니다.

```bash
npx supabase db reset
```

4. 프로젝트 루트에 `.env.local`을 만들고 Supabase 공개 환경 변수를 설정합니다.

```bash
cp .env.local.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

로컬 Supabase의 공개 키는 `npx supabase status` 출력에서 확인합니다. Docker를 쓰지 않고 클라우드 Supabase를 연결할 때는 대시보드의 `Project URL`과 `anon` 또는 `publishable key`를 넣으면 됩니다.

5. 개발 서버를 실행합니다.

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

6. 브라우저에서 `http://127.0.0.1:3000`에 접속합니다.

세션이 없으면 첫 진입점 `/` 또는 `/operations/...`에서 `/login`으로 이동합니다.

## 화면 흐름

- `/login`: 관리자 로그인 화면입니다.
- `/`: 운영 날짜 선택 달력입니다.
- `/operations/[workDate]`: 선택 날짜 운영 대시보드입니다.
- `/operations/[workDate]/attendance`: 선택 날짜 출근 등록과 수동 배정/수정/해제를 처리합니다.
- `/operations/[workDate]/upload`: 선택 날짜 배정표 엑셀 업로드를 처리합니다.
- `/operations/[workDate]/workers`: 선택 날짜 기준 인력 조회와 상태 기반 CTA를 제공합니다.
- `/operations/[workDate]/workers/[workerId]`: 선택 날짜 기준 인력 상세와 최근 배정 이력을 보여줍니다.

기존 `/attendance`, `/upload`, `/workers` 경로는 현재 날짜 기준의 새 운영 경로로 리다이렉트됩니다.

## 운영 규칙

- 출근 기록과 배정 기록은 모두 `workDate` 기준으로 쌓입니다.
- 수동 배정은 출근 등록된 인력에게만 가능합니다.
- 한 사람은 같은 날짜에 최종 배정 1건만 가집니다.
- 같은 날짜에 수동 배정이 있더라도 엑셀 업로드가 최종값으로 덮어씁니다.
- `worker_skills`는 날짜별 이력이 아니라 누적 숙련도 집계 테이블입니다.

## 검증 명령

기본 점검:

```bash
npm run lint
npm run typecheck
npm run test
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build
```

E2E 스모크:

`npm run test:e2e` 스크립트는 `PLAYWRIGHT_SKIP_WEBSERVER=1`로 실행되므로, 먼저 개발 서버를 띄운 뒤 아래 명령을 실행합니다.

```bash
npm run test:e2e -- tests/e2e/workforce-console.spec.ts
```
