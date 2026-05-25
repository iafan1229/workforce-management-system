"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type UploadResponse = {
  error?: string;
  importedCount?: number;
};

type OperationsUploadFormProps = {
  workDate: string;
};

export function OperationsUploadForm({
  workDate,
}: OperationsUploadFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

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

      setMessage(
        `${workDate} 배정 ${importedCount}건이 최종값으로 반영되었습니다.`,
      );
      form.reset();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="console-panel-strong space-y-4 rounded-[2rem] p-6"
    >
      <input type="hidden" name="workDate" value={workDate} />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
          업로드 파일 선택
        </h2>
        <p className="text-sm leading-7 text-stone-600">
          선택한 작업일에만 반영되며, 같은 날짜의 수동 배정이 있으면 엑셀이
          최종값으로 덮어씁니다.
        </p>
      </div>

      <div className="rounded-[1.4rem] bg-stone-50/90 px-4 py-4">
        <p className="text-sm text-stone-500">선택 작업일</p>
        <p className="mt-1 font-medium text-stone-900">{workDate}</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">엑셀 파일</span>
        <input
          required
          type="file"
          name="file"
          accept=".xlsx,.xls"
          className="console-file-input text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="console-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "업로드 중..." : "배정표 반영"}
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
