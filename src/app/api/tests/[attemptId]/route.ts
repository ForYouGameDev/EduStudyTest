import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!idSchema.safeParse(attemptId).success) return NextResponse.json({ error: "Invalid test attempt." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_attempt_for_student", { p_attempt_id: attemptId });
  if (error) return NextResponse.json({ error: "This test could not be loaded. It may have been submitted or expired." }, { status: 404 });
  return NextResponse.json(data);
}
