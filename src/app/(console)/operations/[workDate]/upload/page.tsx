import { parseWorkDate } from "@/features/operations/date";
import { OperationsUploadForm } from "./upload-form";

type OperationsUploadPageProps = {
  params: Promise<{
    workDate: string;
  }>;
};

export default async function OperationsUploadPage({
  params,
}: OperationsUploadPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);

  return (
    <main className="space-y-8">
      <header className="console-panel-strong rounded-[2rem] px-7 py-8 md:px-8">
        <p className="text-sm font-medium text-amber-700">선택 작업일 {validDate}</p>
        <h1 className="mt-3 text-[clamp(2.1rem,3vw,3.3rem)] font-semibold tracking-[-0.05em] text-stone-950">
          배정표 업로드
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          고정 양식 엑셀을 검증한 뒤 선택한 작업일의 배정 최종값으로 반영합니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        <OperationsUploadForm workDate={validDate} />

        <aside className="console-panel rounded-[2rem] p-6 text-sm text-orange-950">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
              고정 양식 규칙
            </h2>
            <p className="text-stone-600">
              한 줄이라도 오류가 있으면 전체 업로드가 실패합니다.
            </p>
          </div>

          <ul className="mt-4 space-y-3 leading-7 text-stone-700">
            <li>필수 컬럼인 name, phone, task가 모두 있어야 합니다.</li>
            <li>해당 인력은 선택한 날짜에 출근 등록되어 있어야 합니다.</li>
            <li>같은 파일 안에서 동일 인력은 한 번만 올릴 수 있습니다.</li>
            <li>같은 날짜의 수동 배정이 있으면 엑셀 배정이 최종값이 됩니다.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
