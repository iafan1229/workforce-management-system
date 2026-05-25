import type { ReactNode } from "react";
import { ConsoleShell } from "@/components/console-shell";
import { getTodayInSeoul } from "@/features/attendance/types";

export default function OperationsDateLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <ConsoleShell today={getTodayInSeoul()}>{children}</ConsoleShell>;
}
