import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveRouteAccess } from "@/lib/auth/route-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const access = resolveRouteAccess({
    pathname: "/",
    hasSession: Boolean(session),
  });

  if (!access.allow) {
    redirect(access.redirectTo);
  }

  return <>{children}</>;
}
