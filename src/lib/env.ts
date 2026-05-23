import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function getEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const missingKeys = parsed.error.issues
      .map((issue) => issue.path[0])
      .filter((value): value is string => typeof value === "string");

    throw new Error(
      [
        "Supabase 환경변수가 설정되지 않았습니다.",
        `누락된 값: ${missingKeys.join(", ")}`,
        "프로젝트 루트에 `.env.local` 파일을 만들고 값을 채워주세요.",
        "로컬 Supabase를 쓰는 경우 `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` 입니다.",
        "`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 `supabase status` 출력에서 anon key 값을 사용하세요.",
      ].join(" "),
    );
  }

  return parsed.data;
}
