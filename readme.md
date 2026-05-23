# Workforce OS MVP

물류 현장 운영팀이 매일 쓰는 최소 기능만 담은 Workforce OS MVP입니다. 현재 앱은 관리자 로그인 뒤에 오늘 운영 대시보드, 출근 등록, 인력 조회, 배정표 엑셀 업로드 화면을 제공합니다.

## 로컬 실행

1. 의존성을 설치합니다.

```bash
npm install
```

2. 로컬 Supabase를 시작합니다.

```bash
supabase start
```

3. 스키마와 시드 데이터를 로컬 DB에 반영합니다.

```bash
supabase db reset
```

4. 프로젝트 루트에 `.env.local`을 만들고 Supabase 공개 환경 변수를 설정합니다.

```bash
cp .env.local.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

로컬 Supabase의 anon key는 `supabase status` 출력에서 확인합니다.

5. 개발 서버를 실행합니다.

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

6. 브라우저에서 `http://127.0.0.1:3000`에 접속합니다.

세션이 없으면 첫 진입점 `/`에서 `/login`으로 이동합니다.

## 핵심 화면

- `/login`: 관리자 이메일과 비밀번호로 로그인하는 첫 진입 화면입니다.
- `/`: 오늘 운영 대시보드입니다. 오늘 출근 인원, 배정 건수, 업로드 상태와 빠른 이동 링크를 보여줍니다.
- `/attendance`: 당일 출근 등록과 오늘 출근자 목록 조회를 함께 처리합니다.
- `/workers`: 휴대폰 번호로 인력을 검색하고 상세 화면으로 이동합니다.
- `/workers/[workerId]`: 인력 기본 프로필, 운영 상태, 숙련 업무, 최근 배정을 확인합니다.
- `/upload`: 고정 양식 엑셀 파일로 오늘 배정을 일괄 업로드합니다.

## 검증 명령

기본 점검:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Task 8 범위 E2E:

현재 `npm run test:e2e` 스크립트는 `PLAYWRIGHT_SKIP_WEBSERVER=1`로 실행되므로, 먼저 개발 서버를 3000 포트에 띄운 뒤 아래 명령을 실행합니다.

```bash
npm run test:e2e -- tests/e2e/workforce-console.spec.ts
```
