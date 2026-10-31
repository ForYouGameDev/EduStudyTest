import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function POST(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!z.string().uuid().safeParse(attemptId).success) return NextResponse.json({ error: "Invalid test attempt." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit your test." }, { status: 401 });
  const rate = await checkApiRateLimit(supabase, "test_submit");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many submission requests. Please wait and try again." }, { status: rate.unavailable ? 503 : 429 });
  const { data, error } = await supabase.rpc("submit_test_attempt", { p_attempt_id: attemptId });
  if (error) return NextResponse.json({ error: "Your test could not be submitted. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ result: data });
}
