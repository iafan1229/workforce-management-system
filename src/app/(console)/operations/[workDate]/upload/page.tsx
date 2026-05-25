import { parseWorkDate } from "@/features/operations/date";
import { DatedOperationShell } from "../_components/dated-operation-shell";

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
    <DatedOperationShell
      title="배정표 업로드"
      description="선택한 작업일 기준 업로드 진입 경로를 먼저 고정합니다."
      validDate={validDate}
      legacyHref="/upload"
      legacyLabel="기존 업로드 화면 열기"
    />
  );
}
