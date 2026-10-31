import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  subject: z.string().trim().min(1).max(100),
  questionCount: z.number().int().min(1).max(100),
  durationMinutes: z.number().int().min(0).max(180),
  difficulty: z.enum(["any", "easy", "medium", "hard"]),
  mode: z.enum(["practice", "exam"])
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify your sign-in." }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Sign in to create a test." }, { status: 401 });
  const rate = await checkApiRateLimit(supabase, "test_generate");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many test requests. Please wait a minute and try again." }, { status: rate.unavailable ? 503 : 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the test settings and try again." }, { status: 400 });
  const { data, error } = await supabase.rpc("generate_test_attempt", {
    p_subject: parsed.data.subject,
    p_question_count: parsed.data.questionCount,
    p_duration_minutes: parsed.data.durationMinutes,
    p_difficulty: parsed.data.difficulty,
    p_mode: parsed.data.mode
  });
  if (error) {
    const status = error.message.includes("INSUFFICIENT_QUESTIONS") ? 422 : 500;
    return NextResponse.json({ error: status === 422 ? "There are not enough approved questions for that subject and difficulty. Try fewer questions or another subject." : "Test creation failed. Please try again." }, { status });
  }
  return NextResponse.json({ attemptId: data });
}
