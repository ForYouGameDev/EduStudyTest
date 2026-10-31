import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({ questionId: z.string().uuid() });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!z.string().uuid().safeParse(attemptId).success) return NextResponse.json({ error: "Invalid test attempt." }, { status: 400 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save questions." }, { status: 401 });
  const rate = await checkApiRateLimit(supabase, "question_save");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many save requests. Please wait and try again." }, { status: rate.unavailable ? 503 : 429 });
  const { error } = await supabase.rpc("save_question_for_later", {
    p_attempt_id: attemptId,
    p_question_id: input.data.questionId
  });
  if (error) return NextResponse.json({ error: "Question could not be saved." }, { status: 409 });
  return NextResponse.json({ saved: true });
}
