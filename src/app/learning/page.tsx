import { AppSidebar } from "@/components/app-sidebar";
import { LearningProfileForm } from "@/components/learning-profile-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase && !user) redirect("/login");
  let profile: { education_level?: string | null; board?: string | null; exam_goal?: string | null } | null = null;
  if (supabase && user) {
    const { data, error } = await supabase.from("profiles").select("education_level, board, exam_goal").eq("id", user.id).maybeSingle();
    if (error) throw new Error(`Unable to load your learning profile: ${error.message}`);
    profile = data;
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><p className="text-xs font-medium text-muted">MY LEARNING</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Choose your learning path.</h1><p className="mt-3 text-sm leading-6 text-muted">Set your level and goal so your study space can be tailored to you.</p>{!supabase && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Connect Supabase to save your profile.</p>}<div className="mt-7"><LearningProfileForm initial={profile} enabled={Boolean(supabase && user)} /></div></div></main></div>;
}
