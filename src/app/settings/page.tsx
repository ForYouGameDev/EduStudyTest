import { AppSidebar } from "@/components/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase && !user) redirect("/login");
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar name={user?.user_metadata?.full_name || "Learner"} /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><p className="text-xs font-medium text-muted">ACCOUNT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Settings</h1><section className="mt-7 rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold text-ink">Google account</h2>{user ? <><p className="mt-2 text-xs text-muted">{user.user_metadata?.full_name || "Signed in"} · {user.email}</p><p className="mt-4 text-[11px] leading-5 text-muted">Your sign-in is managed securely by Google and Supabase. Update your class or exam goal in My learning.</p></> : <p className="mt-2 text-xs text-muted">Connect Supabase and sign in to manage your account.</p>}</section><section className="mt-4 rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold text-ink">Account deletion</h2><p className="mt-2 text-xs leading-5 text-muted">Self-service account deletion is not enabled in this deployment. Ask your platform administrator to remove your account and associated learning data.</p></section></div></main></div>;
}
