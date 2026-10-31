import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, ChartNoAxesCombined, Clock3, FileQuestion, GraduationCap, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  let user = null;
  let attempts: { id: string; score: number | null; submitted_at: string | null }[] = [];
  let profile: { full_name: string | null; education_level: string | null } | null = null;
  let stats: { tests_completed: number; questions_solved: number; accuracy: number | null; average_score: number | null; best_score: number | null; study_time_seconds: number } | null = null;
  let setupMessage = "";
  if (supabase) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) setupMessage = `Could not verify session: ${authError.message}`;
    user = auth.user;
    if (!user) redirect("/login");
    if (user) {
      const [profileResult, attemptsResult, statsResult] = await Promise.all([
        supabase.from("profiles").select("full_name, education_level").eq("id", user.id).maybeSingle(),
        supabase.from("test_attempts").select("id, score, submitted_at").eq("user_id", user.id).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(5),
        supabase.rpc("get_my_learning_stats")
      ]);
      if (profileResult.error) setupMessage = `Profile could not be loaded: ${profileResult.error.message}`;
      else profile = profileResult.data;
      if (attemptsResult.error) setupMessage = `Recent results could not be loaded: ${attemptsResult.error.message}`;
      else attempts = attemptsResult.data || [];
      if (statsResult.error) setupMessage = `Learning statistics could not be loaded: ${statsResult.error.message}`;
      else stats = statsResult.data;
    }
  }
  const firstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const studyHours = stats ? Math.floor(stats.study_time_seconds / 3600) : null;
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <AppSidebar name={firstName} />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-medium text-muted">YOUR LEARNING SPACE</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Welcome back, {firstName}.</h1><p className="mt-2 text-sm text-muted">A new session is a good next step.</p></div>
            <Link href="/practice" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-dark">Start a practice test <ArrowRight size={15} /></Link>
          </div>
          {!supabase && <div role="status" className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Connect Supabase to enable your private dashboard. Add the values from <code className="font-mono">.env.example</code> to your local environment.</div>}
          {setupMessage && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{setupMessage}</div>}
          {!user && supabase && <div className="mt-7 rounded-2xl border border-line bg-white p-5 text-sm text-muted">Sign in to see your personal dashboard. <Link className="font-semibold text-brand" href="/login">Continue to sign in</Link></div>}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{ label: "Tests completed", value: stats ? String(stats.tests_completed) : "—", icon: BookOpenCheck }, { label: "Questions solved", value: stats ? String(stats.questions_solved) : "—", icon: FileQuestion }, { label: "Accuracy", value: stats?.accuracy === null || !stats ? "—" : `${stats.accuracy}%`, icon: ChartNoAxesCombined }, { label: "Study time", value: studyHours === null ? "—" : `${studyHours}h`, icon: Clock3 }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted">{label}</p><Icon size={16} className="text-brand" /></div><p className="mt-4 text-2xl font-semibold text-ink">{value}</p><p className="mt-1 text-[10px] text-muted">{value === "—" ? "No recorded data yet" : "Based on completed attempts"}</p></div>)}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.8fr]">
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-ink">Pick up your learning</p><p className="mt-1 text-[11px] text-muted">Choose a subject and make today count.</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-pale text-brand"><GraduationCap size={17} /></span></div>
              {profile?.education_level ? <div className="mt-5 rounded-xl bg-canvas p-4"><p className="text-xs text-muted">Your learning level</p><p className="mt-1 text-sm font-semibold text-ink">{profile.education_level}</p></div> : <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-line bg-[#fbfcfb] px-5 py-8 text-center"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pale text-brand"><Sparkles size={18} /></span><p className="mt-3 text-xs font-semibold text-ink">Set your learning path</p><p className="mt-1 max-w-xs text-[11px] leading-5 text-muted">Tell us about your class, course or exam to find relevant practice.</p><Link href="/learning" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-semibold text-white">Choose your level <ArrowRight size={13} /></Link></div>}
            </section>
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-ink">Recent results</p><p className="mt-1 text-[11px] text-muted">Your completed test attempts</p></div><ChartNoAxesCombined size={17} className="text-brand" /></div>
              {attempts.length ? <ul className="mt-4 divide-y divide-line">{attempts.map((attempt) => <li key={attempt.id} className="flex items-center justify-between py-3"><span className="text-xs text-ink">Practice test</span><span className="text-xs font-semibold text-brand">{attempt.score ?? "Submitted"}</span></li>)}</ul> : <p className="mt-5 rounded-xl bg-canvas px-4 py-5 text-center text-[11px] leading-5 text-muted">Completed attempts will appear here once you take a test.</p>}
            </section>
          </div>
          <section className="mt-5 rounded-2xl bg-[#1d5147] p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-semibold">One question at a time</p><p className="mt-1 text-[11px] text-white/65">Create a focused practice set for the topic you want to improve.</p></div><Link href="/practice" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-[11px] font-semibold text-brand sm:mt-0">Explore practice <ArrowRight size={13} /></Link></section>
        </div>
      </main>
    </div>
  );
}
