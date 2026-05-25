import { parseWorkDate } from "@/features/operations/date";
import { DatedOperationShell } from "../_components/dated-operation-shell";

type OperationsAttendancePageProps = {
  params: Promise<{
    workDate: string;
  }>;
};

export default async function OperationsAttendancePage({
  params,
}: OperationsAttendancePageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);

  return (
    <DatedOperationShell
      title="출근/배정 관리"
      description="선택한 작업일 기준 출근 등록과 배정 관리 흐름으로 진입합니다."
      validDate={validDate}
      legacyHref="/attendance"
      legacyLabel="기존 출근 등록 화면 열기"
    />
  );
}
