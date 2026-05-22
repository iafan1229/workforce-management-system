"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type UploadResponse = {
  error?: string;
  importedCount?: number;
};

type UploadFormProps = {
  defaultWorkDate: string;
};

export function UploadForm({ defaultWorkDate }: UploadFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedWorkDate = String(
      formData.get("workDate") ?? defaultWorkDate,
    );

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/uploads/assignments", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok) {
        setError(payload.error ?? "업로드 처리 중 오류가 발생했습니다.");
        return;
      }

      const importedCount = payload.importedCount ?? 0;

      setMessage(`${importedCount}건의 배정이 반영되었습니다.`);
      form.reset();

      const workDateInput = form.elements.namedItem("workDate");

      if (workDateInput instanceof HTMLInputElement) {
        workDateInput.value = submittedWorkDate;
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-stone-950">업로드 파일 선택</h2>
        <p className="text-sm text-stone-600">
          작업일과 엑셀 파일을 함께 제출하면 서버에서 전체 검증 후 한 번에 반영합니다.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">작업일</span>
        <input
          required
          type="date"
          name="workDate"
          defaultValue={defaultWorkDate}
          className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">엑셀 파일</span>
        <input
          required
          type="file"
          name="file"
          accept=".xlsx,.xls"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isSubmitting ? "업로드 중..." : "업로드 반영"}
      </button>

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "업로드 처리 중 오류가 발생했습니다.";
}
