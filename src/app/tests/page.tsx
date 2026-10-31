import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, Clock3 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyTestsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase && !user) redirect("/login");
  let attempts: { id: string; status: string; started_at: string; submitted_at: string | null; score: number | null; max_score: number; title: string; subject: string }[] = [];
  let message = "";
  if (supabase && user) {
    const { data, error } = await supabase.rpc("get_my_attempts");
    if (error) message = `Test history could not be loaded: ${error.message}`;
    else attempts = data as typeof attempts;
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">MY LEARNING</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-ink">My tests</h1><p className="mt-2 text-sm text-muted">Continue an open attempt or revisit a completed result.</p></div><Link href="/practice" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white">New practice test <ArrowRight size={14} /></Link></div>{message && <p role="alert" className="mt-5 text-xs text-red-700">{message}</p>}<section className="mt-7 rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold text-ink">Attempt history</h2>{attempts.length ? <ul className="mt-3 divide-y divide-line">{attempts.map((attempt) => <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-pale text-brand"><BookOpenCheck size={16} /></span><div><p className="text-xs font-semibold text-ink">{attempt.title}</p><p className="mt-1 text-[10px] text-muted">{attempt.subject} · {new Date(attempt.started_at).toLocaleDateString()}</p></div></div><div className="flex items-center gap-3"><span className="text-[10px] capitalize text-muted">{attempt.status.replaceAll("_", " ")}</span>{attempt.status === "submitted" ? <span className="text-xs font-semibold text-ink">{attempt.score} / {attempt.max_score}</span> : <Clock3 size={15} className="text-gold" />}{attempt.status === "submitted" ? <Link href={`/results/${attempt.id}`} className="text-xs font-semibold text-brand">Review</Link> : <Link href={`/tests/${attempt.id}`} className="text-xs font-semibold text-brand">Continue</Link>}</div></li>)}</ul> : <p className="mt-4 rounded-xl bg-canvas p-6 text-center text-xs text-muted">Your test attempts will appear here after you create a practice set.</p>}</section></div></main></div>;
}
