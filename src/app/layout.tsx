import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce OS",
  description: "물류 현장 Workforce 운영 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-stone-100 text-stone-950">
        {children}
      </body>
    </html>
  );
}
