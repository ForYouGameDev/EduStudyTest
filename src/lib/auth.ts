import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(`Unable to verify sign-in: ${error.message}`);
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireAdmin(allowedRoles = ["super_admin", "content_manager", "question_reviewer", "test_manager", "student_support"]) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return { supabase: null, user: null };
  const { data, error } = await supabase.from("user_roles")
    .select("role").eq("user_id", user.id).in("role", allowedRoles).limit(1).maybeSingle();
  if (error) throw new Error(`Unable to verify administrator access: ${error.message}`);
  if (!data) redirect("/dashboard");
  return { supabase, user };
}

export async function getAdminApiContext(allowedRoles: string[]) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, status: 503 as const };
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase: null, user: null, status: 401 as const };
  const { data, error } = await supabase.from("user_roles")
    .select("role").eq("user_id", user.id).in("role", allowedRoles).limit(1).maybeSingle();
  if (error) throw new Error(`Unable to verify administrator access: ${error.message}`);
  if (!data) return { supabase: null, user: null, status: 403 as const };
  return { supabase, user, status: 200 as const };
}
