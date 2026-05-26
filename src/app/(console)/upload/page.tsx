import { redirect } from "next/navigation";
import { getTodayInSeoul } from "@/features/attendance/types";

export default function LegacyUploadPage() {
  redirect(`/operations/${getTodayInSeoul()}/upload`);
}
