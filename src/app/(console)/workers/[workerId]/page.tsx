import { redirect } from "next/navigation";
import { getTodayInSeoul } from "@/features/attendance/types";

type LegacyWorkerDetailPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

export default async function LegacyWorkerDetailPage({
  params,
}: LegacyWorkerDetailPageProps) {
  const { workerId } = await params;

  redirect(`/operations/${getTodayInSeoul()}/workers/${workerId}`);
}
