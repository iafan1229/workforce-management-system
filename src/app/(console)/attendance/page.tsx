import { redirect } from "next/navigation";
import { getTodayInSeoul } from "@/features/attendance/types";

type LegacyAttendancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyAttendancePage({
  searchParams,
}: LegacyAttendancePageProps) {
  const today = getTodayInSeoul();
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
    }
  }

  const query = params.toString();

  redirect(
    `/operations/${today}/attendance${query ? `?${query}` : ""}`,
  );
}
