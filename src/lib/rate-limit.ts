import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitAction =
  | "test_generate"
  | "answer_save"
  | "test_submit"
  | "question_save"
  | "profile_update"
  | "pdf_upload"
  | "pdf_process"
  | "pdf_delete"
  | "question_review"
  | "education_change"
  | "pdf_preview";

export async function checkApiRateLimit(
  supabase: SupabaseClient,
  action: RateLimitAction
): Promise<{ allowed: boolean; unavailable: boolean }> {
  const { data, error } = await supabase.rpc("consume_api_rate_limit", { p_action: action });
  return { allowed: !error && data === true, unavailable: Boolean(error) };
}
