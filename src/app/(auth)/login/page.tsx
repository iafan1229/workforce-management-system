"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, {});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            Workforce OS
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              관리자 로그인
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              오늘 출근 등록과 배정 업로드를 시작하려면 관리자 계정으로
              로그인하세요.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/70"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-800">이메일</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-orange-500 focus:bg-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-800">비밀번호</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-orange-500 focus:bg-white"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            로그인
          </button>

          {state.error ? (
            <p className="text-sm text-red-600">{state.error}</p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
