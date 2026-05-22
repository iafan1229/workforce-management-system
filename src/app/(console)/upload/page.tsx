import { getTodayInSeoul } from "@/features/attendance/types";
import { UploadForm } from "./upload-form";

export default function UploadPage() {
  const today = getTodayInSeoul();

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-950">
          배정표 엑셀 업로드
        </h1>
        <p className="text-sm text-stone-600">
          오류가 한 줄이라도 있으면 전체 업로드가 실패합니다.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        <UploadForm defaultWorkDate={today} />

        <aside className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-orange-950 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">고정 양식 규칙</h2>
            <p className="text-orange-900">
              이번 MVP에서는 합의된 템플릿 한 종류만 지원합니다.
            </p>
          </div>

          <ul className="mt-4 space-y-3 leading-6 text-orange-950">
            <li>필수 컬럼인 name, phone, task가 모두 있어야 합니다.</li>
            <li>업로드 전에 해당 인력의 출근 등록이 완료되어 있어야 합니다.</li>
            <li>같은 파일 안에서 동일 인력은 한 번만 올릴 수 있습니다.</li>
            <li>한 줄이라도 오류가 있으면 저장 없이 전체 업로드를 취소합니다.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
