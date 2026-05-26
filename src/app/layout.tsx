import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={`${outfit.className} min-h-screen overflow-x-hidden bg-[#f4eee3] text-stone-950`}>
        {children}
      </body>
    </html>
  );
}
