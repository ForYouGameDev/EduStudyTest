import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  education_level: z.string().trim().min(1).max(80),
  board: z.string().trim().max(80).optional().or(z.literal("")),
  exam_goal: z.string().trim().max(120).optional().or(z.literal(""))
});

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const rate = await checkApiRateLimit(supabase, "profile_update");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many profile updates. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid education level and try again." }, { status: 400 });
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: user.user_metadata.full_name || user.user_metadata.name || null,
    avatar_url: user.user_metadata.avatar_url || null,
    education_level: parsed.data.education_level,
    board: parsed.data.board || null,
    exam_goal: parsed.data.exam_goal || null
  });
  if (error) return NextResponse.json({ error: "Your learning path could not be saved." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
