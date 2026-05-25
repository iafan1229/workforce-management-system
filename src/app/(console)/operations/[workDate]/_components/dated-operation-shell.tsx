import Link from "next/link";

type DatedOperationShellProps = {
  title: string;
  description: string;
  validDate: string;
  legacyHref: string;
  legacyLabel: string;
};

export function DatedOperationShell({
  title,
  description,
  validDate,
  legacyHref,
  legacyLabel,
}: DatedOperationShellProps) {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-orange-700">선택 작업일 {validDate}</p>
        <h1 className="text-2xl font-semibold text-stone-950">
          {validDate} {title}
        </h1>
        <p className="text-sm text-stone-600">{description}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-950">임시 연결 안내</h2>
          <p className="text-sm leading-6 text-stone-600">
            날짜 기반 상세 화면은 다음 작업에서 확장될 예정입니다. 지금은 기존 운영
            화면으로 이동해 작업을 이어갈 수 있습니다.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/operations/${validDate}`}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700"
          >
            운영 대시보드로 돌아가기
          </Link>
          <Link
            href={legacyHref}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            {legacyLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
