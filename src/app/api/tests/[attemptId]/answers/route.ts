import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/rate-limit";

const inputSchema = z.object({ questionId: z.string().uuid(), optionId: z.string().uuid() });

export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!z.string().uuid().safeParse(attemptId).success) return NextResponse.json({ error: "Invalid test attempt." }, { status: 400 });
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid answer." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save answers." }, { status: 401 });
  const rate = await checkApiRateLimit(supabase, "answer_save");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many answer updates. Please wait and try again." }, { status: rate.unavailable ? 503 : 429 });
  const { error } = await supabase.rpc("save_attempt_answer", {
    p_attempt_id: attemptId,
    p_question_id: input.data.questionId,
    p_option_id: input.data.optionId
  });
  if (error) return NextResponse.json({ error: "Answer could not be saved. Please try again." }, { status: 409 });
  return NextResponse.json({ saved: true });
}
