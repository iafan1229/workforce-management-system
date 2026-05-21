"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInActionState = {
  error?: string;
};

export async function signInAction(
  _state: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword =
    typeof password === "string" ? password.trim() : "";

  if (!normalizedEmail || !normalizedPassword) {
    return { error: "이메일 또는 비밀번호를 확인해 주세요." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호를 확인해 주세요." };
  }

  redirect("/");
}
