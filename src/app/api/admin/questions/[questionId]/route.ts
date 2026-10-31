import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  prompt: z.string().trim().min(1).max(10_000).optional(),
  options: z.array(z.object({ label: z.string().trim().min(1).max(20), content: z.string().trim().min(1).max(2_000), sort_order: z.number().int().min(0) })).max(12).optional(),
  answerLabel: z.string().trim().max(20).nullable().optional(),
  explanation: z.string().trim().max(10_000).nullable().optional(),
  subject: z.string().trim().max(120).nullable().optional(),
  topic: z.string().trim().max(120).nullable().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  if (!z.string().uuid().safeParse(questionId).success) return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  const { supabase, user, status } = await getAdminApiContext(["super_admin", "content_manager", "question_reviewer"]);
  if (!supabase || !user) return NextResponse.json({ error: status === 401 ? "Sign in with an administrator account." : "Question-review access is required." }, { status });
  const rate = await checkApiRateLimit(supabase, "question_review");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Question review limit reached. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const { data, error } = await supabase.rpc("review_extracted_question", {
    p_question_id: questionId,
    p_action: input.data.action,
    p_prompt: input.data.prompt || null,
    p_options: input.data.options || null,
    p_answer_label: input.data.answerLabel ?? null,
    p_explanation: input.data.explanation ?? null,
    p_subject: input.data.subject ?? null,
    p_topic: input.data.topic ?? null
  });
  if (error) {
    const message = error.message.includes("ANSWER_NOT_IN_OPTIONS")
      ? "The answer label must match one of the question options."
      : error.message.includes("QUESTION_ALREADY_REVIEWED")
        ? "This question has already been reviewed."
        : "Question review could not be saved.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ questionId: data });
}
