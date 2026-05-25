"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ConsoleShellProps = {
  children: ReactNode;
  today: string;
};

const NAVIGATION_ITEMS = [
  {
    label: "대시보드",
    getHref: (workDate: string) => `/operations/${workDate}`,
  },
  {
    label: "출근/배정",
    getHref: (workDate: string) => `/operations/${workDate}/attendance`,
  },
  {
    label: "인력 조회",
    getHref: (workDate: string) => `/operations/${workDate}/workers`,
  },
  {
    label: "배정표 업로드",
    getHref: (workDate: string) => `/operations/${workDate}/upload`,
  },
] as const;

export function ConsoleShell({ children, today }: ConsoleShellProps) {
  const pathname = usePathname();
  const activeDate = readActiveDate(pathname) ?? today;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-stone-200/55 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[20rem] w-[20rem] rounded-full bg-amber-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-4 pb-10 pt-4 lg:flex-row lg:px-6 lg:pb-6 lg:pt-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[280px] lg:shrink-0">
          <div className="console-panel h-full overflow-hidden p-5 lg:p-6">
            <div className="flex h-full flex-col gap-4">
              <Link
                href="/"
                className="console-button-secondary w-full"
              >
                날짜 선택으로 돌아가기
              </Link>

              <nav aria-label="주요 메뉴" className="space-y-2">
                {NAVIGATION_ITEMS.map((item) => {
                  const href = item.getHref(activeDate);
                  const active =
                    pathname === href ||
                    (href !== `/operations/${activeDate}` &&
                      pathname?.startsWith(`${href}/`));

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-stone-950 text-white shadow-[0_18px_60px_-30px_rgba(28,25,23,0.8)]"
                          : "bg-white/60 text-stone-800 hover:bg-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          active ? "bg-white" : "bg-stone-300"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pt-6 lg:pl-6 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function readActiveDate(pathname: string | null) {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(/^\/operations\/(\d{4}-\d{2}-\d{2})(?:\/|$)/);
  return match?.[1] ?? null;
}
