import { Bookmark } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase && !user) redirect("/login");
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-4xl"><p className="text-xs font-medium text-muted">MY LEARNING</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Saved questions</h1>{supabase && user ? <SavedQuestions /> : <p className="mt-5 rounded-xl bg-white p-5 text-sm text-muted">Sign in and connect your account to view saved questions.</p>}</div></main></div>;
}

async function SavedQuestions() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_saved_questions");
  if (error) return <p role="alert" className="mt-5 text-sm text-red-700">Saved questions could not be loaded.</p>;
  const items = data as { question_id: string; prompt: string; subject: string | null; chapter: string | null; topic: string | null }[];
  return items.length ? <ul className="mt-6 space-y-3">{items.map((item) => <li key={item.question_id} className="rounded-xl border border-line bg-white p-4"><p className="text-sm leading-6 text-ink">{item.prompt}</p><p className="mt-2 text-[10px] text-muted">{[item.subject, item.chapter, item.topic].filter(Boolean).join(" · ") || "Saved question"}</p></li>)}</ul> : <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-10 text-center"><Bookmark className="mx-auto text-brand" size={21} /><p className="mt-3 text-sm font-semibold text-ink">Your saved questions will live here</p><p className="mt-1 text-xs text-muted">Save a question during a practice test to come back to it later.</p></div>;
}
