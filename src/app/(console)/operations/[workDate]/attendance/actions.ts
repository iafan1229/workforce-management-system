"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearManualAssignment, saveManualAssignment } from "@/features/assignments/service";
import { registerAttendance } from "@/features/attendance/service";
import { parseWorkDate } from "@/features/operations/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAttendanceForDateAction(formData: FormData) {
  const workDate = parseWorkDate(String(formData.get("workDate") ?? ""));
  const supabase = await createSupabaseServerClient();

  try {
    await registerAttendance(
      {
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        workDate,
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
    redirect(withError(workDate, getErrorMessage(error)));
  }

  revalidateOperationsDate(workDate);
  redirect(`/operations/${workDate}/attendance`);
}

export async function saveManualAssignmentAction(formData: FormData) {
  const workDate = parseWorkDate(String(formData.get("workDate") ?? ""));
  const workerId = String(formData.get("workerId") ?? "");
  const taskTypeId = String(formData.get("taskTypeId") ?? "");
  const supabase = await createSupabaseServerClient();

  try {
    await saveManualAssignment(
      {
        workerId,
        taskTypeId,
        workDate,
      },
      createManualAssignmentRepository(supabase),
    );
  } catch (error) {
    redirect(withError(workDate, getErrorMessage(error), workerId));
  }

  revalidateOperationsDate(workDate);
  redirect(`/operations/${workDate}/attendance?focusWorkerId=${workerId}`);
}

export async function clearManualAssignmentAction(formData: FormData) {
  const workDate = parseWorkDate(String(formData.get("workDate") ?? ""));
  const workerId = String(formData.get("workerId") ?? "");
  const supabase = await createSupabaseServerClient();

  try {
    await clearManualAssignment(
      {
        workerId,
        workDate,
      },
      createManualAssignmentRepository(supabase),
    );
  } catch (error) {
    redirect(withError(workDate, getErrorMessage(error), workerId));
  }

  revalidateOperationsDate(workDate);
  redirect(`/operations/${workDate}/attendance?focusWorkerId=${workerId}`);
}

function createManualAssignmentRepository(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  return {
    findAttendance: async ({
      workerId,
      workDate,
    }: {
      workerId: string;
      workDate: string;
    }) => {
      const { data, error } = await supabase
        .from("attendances")
        .select("worker_id, work_date")
        .eq("worker_id", workerId)
        .eq("work_date", workDate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            workerId: data.worker_id,
            workDate: data.work_date,
          }
        : null;
    },
    findAssignment: async ({
      workerId,
      workDate,
    }: {
      workerId: string;
      workDate: string;
    }) => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, task_type_id")
        .eq("worker_id", workerId)
        .eq("work_date", workDate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            id: data.id,
            taskTypeId: data.task_type_id,
          }
        : null;
    },
    createAssignment: async (input: {
      workerId: string;
      taskTypeId: string;
      workDate: string;
      source: "manual_assignment";
    }) => {
      const { error } = await supabase.from("assignments").insert({
        worker_id: input.workerId,
        task_type_id: input.taskTypeId,
        work_date: input.workDate,
        source: input.source,
      });

      if (error) {
        throw error;
      }
    },
    updateAssignment: async (input: {
      assignmentId: string;
      taskTypeId: string;
      source: "manual_assignment";
    }) => {
      const { error } = await supabase
        .from("assignments")
        .update({
          task_type_id: input.taskTypeId,
          source: input.source,
        })
        .eq("id", input.assignmentId);

      if (error) {
        throw error;
      }
    },
    deleteAssignment: async (input: { assignmentId: string }) => {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", input.assignmentId);

      if (error) {
        throw error;
      }
    },
    incrementSkill: async (input: {
      workerId: string;
      taskTypeId: string;
    }) => {
      const { data, error } = await supabase
        .from("worker_skills")
        .select("id, count")
        .eq("worker_id", input.workerId)
        .eq("task_type_id", input.taskTypeId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        const { error: insertError } = await supabase.from("worker_skills").insert({
          worker_id: input.workerId,
          task_type_id: input.taskTypeId,
          count: 1,
        });

        if (insertError) {
          throw insertError;
        }

        return;
      }

      const { error: updateError } = await supabase
        .from("worker_skills")
        .update({
          count: data.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) {
        throw updateError;
      }
    },
    decrementSkill: async (input: {
      workerId: string;
      taskTypeId: string;
    }) => {
      const { data, error } = await supabase
        .from("worker_skills")
        .select("id, count")
        .eq("worker_id", input.workerId)
        .eq("task_type_id", input.taskTypeId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("업무 경험 기록을 찾을 수 없습니다.");
      }

      if (data.count <= 1) {
        const { error: deleteError } = await supabase
          .from("worker_skills")
          .delete()
          .eq("id", data.id);

        if (deleteError) {
          throw deleteError;
        }

        return;
      }

      const { error: updateError } = await supabase
        .from("worker_skills")
        .update({
          count: data.count - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) {
        throw updateError;
      }
    },
  };
}

function revalidateOperationsDate(workDate: string) {
  revalidatePath(`/operations/${workDate}`);
  revalidatePath(`/operations/${workDate}/attendance`);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "출근 및 배정 처리 중 오류가 발생했습니다.";
}

function withError(workDate: string, error: string, focusWorkerId?: string) {
  const params = new URLSearchParams({
    error,
  });

  if (focusWorkerId) {
    params.set("focusWorkerId", focusWorkerId);
  }

  return `/operations/${workDate}/attendance?${params.toString()}`;
}
