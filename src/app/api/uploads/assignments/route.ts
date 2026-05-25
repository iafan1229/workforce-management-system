import { NextResponse } from "next/server";
import { parseWorkDate } from "@/features/operations/date";
import { upsertAttendances } from "@/features/attendance/status-column-compat";
import { importAssignmentUpload } from "@/features/uploads/import-assignment-upload";
import { parseAssignmentWorkbook } from "@/features/uploads/parse-assignment-workbook";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EXPECTED_UPLOAD_ERROR_MESSAGES = new Set([
  "작업일을 선택해 주세요.",
  "작업일 형식이 올바르지 않습니다.",
  "업로드할 시트를 찾을 수 없습니다.",
  "필수 컬럼(name, phone, task)을 업로드 시트에서 찾을 수 없습니다.",
  "업로드할 데이터 행이 없습니다.",
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const workDate = parseUploadWorkDate(formData.get("workDate"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드 파일이 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const rows = parseAssignmentWorkbook(await file.arrayBuffer());
    const result = await importAssignmentUpload(
      {
        workDate,
        rows,
      },
      {
        findWorkersByPhones: async (phones) => {
          const { data, error } = await supabase
            .from("workers")
            .select("id, name, phone")
            .in("phone", phones);

          if (error) {
            throw error;
          }

          return data ?? [];
        },
        createWorkers: async (workers) => {
          if (workers.length === 0) {
            return;
          }

          const { error } = await supabase.from("workers").upsert(workers, {
            onConflict: "phone",
            ignoreDuplicates: true,
          });

          if (error) {
            throw error;
          }
        },
        createAttendances: async ({
          workDate: attendanceWorkDate,
          workerIds,
          status,
        }) => {
          if (workerIds.length === 0) {
            return;
          }
          await upsertAttendances(supabase, {
            workDate: attendanceWorkDate,
            workerIds,
            status,
          });
        },
        findTaskTypesByLabels: async (labels) => {
          const { data, error } = await supabase
            .from("task_types")
            .select("id, label")
            .in("label", labels);

          if (error) {
            throw error;
          }

          return data ?? [];
        },
        applyAssignmentBatch: async ({ workDate: uploadWorkDate, rows: batchRows }) => {
          const { error } = await supabase.rpc("apply_assignment_batch", {
            p_work_date: uploadWorkDate,
            p_rows: batchRows.map((row) => ({
              worker_id: row.workerId,
              task_type_id: row.taskTypeId,
            })),
          });

          if (error) {
            throw error;
          }
        },
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    const status = getErrorStatus(error);

    return NextResponse.json(
      {
        error:
          status === 400
            ? getErrorMessage(error)
            : "업로드 처리 중 서버 오류가 발생했습니다.",
      },
      { status },
    );
  }
}

function parseUploadWorkDate(workDateEntry: FormDataEntryValue | null) {
  if (workDateEntry === null || workDateEntry === "") {
    throw new Error("작업일을 선택해 주세요.");
  }

  if (typeof workDateEntry !== "string") {
    throw new Error("작업일 형식이 올바르지 않습니다.");
  }

  try {
    return parseWorkDate(workDateEntry.trim());
  } catch {
    throw new Error("작업일 형식이 올바르지 않습니다.");
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "업로드 처리 중 알 수 없는 오류가 발생했습니다.";
}

function getErrorStatus(error: unknown) {
  const code = getErrorCode(error);

  if (code === "23505") {
    return 400;
  }

  if (isExpectedUploadError(error)) {
    return 400;
  }

  return 500;
}

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "";
  }

  const code = (error as Record<string, unknown>).code;

  return typeof code === "string" ? code : "";
}

function isExpectedUploadError(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return false;
  }

  if (EXPECTED_UPLOAD_ERROR_MESSAGES.has(error.message)) {
    return true;
  }

  return /^\d+행:/.test(error.message);
}
