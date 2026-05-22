"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registerAttendance } from "@/features/attendance/service";
import { getTodayInSeoul } from "@/features/attendance/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAttendanceAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await registerAttendance(
      {
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        workDate: getTodayInSeoul(),
      },
      {
        findWorkerByPhone: async (phone) => {
          const { data, error } = await supabase
            .from("workers")
            .select("id, name, phone")
            .eq("phone", phone)
            .maybeSingle();

          if (error) {
            throw error;
          }

          return data;
        },
        createWorker: async (input) => {
          const { data, error } = await supabase
            .from("workers")
            .insert(input)
            .select("id, name, phone")
            .single();

          if (error) {
            throw error;
          }

          return data;
        },
        createAttendance: async (input) => {
          const { error } = await supabase.from("attendances").insert({
            worker_id: input.workerId,
            work_date: input.workDate,
          });

          if (error) {
            throw error;
          }
        },
      },
    );
  } catch (error) {
    redirect(`/attendance?error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/attendance");
  revalidatePath("/");
  redirect("/attendance");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "출근 등록 중 오류가 발생했습니다.";
}
