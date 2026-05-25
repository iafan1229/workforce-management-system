import { parseWorkDate } from "@/features/operations/date";
import { DatedOperationShell } from "../_components/dated-operation-shell";

type OperationsWorkersPageProps = {
  params: Promise<{
    workDate: string;
  }>;
};

export default async function OperationsWorkersPage({
  params,
}: OperationsWorkersPageProps) {
  const { workDate } = await params;
  const validDate = parseWorkDate(workDate);

  return (
    <DatedOperationShell
      title="인력 조회"
      description="선택한 작업일 기준 인력 조회 흐름으로 이어질 자리입니다."
      validDate={validDate}
      legacyHref="/workers"
      legacyLabel="기존 인력 조회 화면 열기"
    />
  );
}
