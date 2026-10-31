import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleX } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return <main className="p-8 text-sm text-muted">Supabase configuration is required to view a result.</main>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId });
  if (error || !data) notFound();
  const questions = data.questions as {
    prompt: string;
    explanation: string | null;
    source_page: number | null;
    student_option_id: string | null;
    options: { id: string; label: string; content: string; is_correct: boolean }[];
  }[];
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-4xl"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-brand"><ArrowLeft size={14} />Dashboard</Link>
    <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center sm:p-10"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand"><CheckCircle2 size={24} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-widest text-brand">Test submitted</p><h1 className="mt-2 text-2xl font-semibold text-ink">Your effort adds up.</h1><p className="mt-2 text-sm text-muted">Review each answer and use what you learned in your next practice session.</p><div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "Score", value: `${data.score ?? "—"} / ${data.max_score ?? "—"}` }, { label: "Correct", value: data.correct_count ?? "—" }, { label: "Incorrect", value: data.incorrect_count ?? "—" }, { label: "Unanswered", value: data.unanswered_count ?? "—" }].map(({ label, value }) => <div key={label} className="rounded-xl bg-canvas p-4"><p className="text-[11px] text-muted">{label}</p><p className="mt-2 text-lg font-semibold text-ink">{value}</p></div>)}</div><Link href="/practice" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-semibold text-white">Practice again <ArrowRight size={14} /></Link></div>
    <section className="mt-6"><h2 className="text-sm font-semibold text-ink">Answer review</h2><ul className="mt-3 space-y-3">{questions.map((question, index) => {
      const selected = question.options.find((option) => option.id === question.student_option_id);
      return <li key={`${index}-${question.prompt}`} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${selected?.is_correct ? "bg-brand-pale text-brand" : "bg-red-50 text-red-600"}`}>{selected?.is_correct ? <CheckCircle2 size={14} /> : <CircleX size={14} />}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted">QUESTION {index + 1}{question.source_page ? ` · SOURCE PAGE ${question.source_page}` : ""}</p><p className="mt-2 text-sm leading-6 text-ink">{question.prompt}</p><div className="mt-3 space-y-2">{question.options.map((option) => <p key={option.id} className={`rounded-lg px-3 py-2 text-xs ${option.is_correct ? "bg-brand-pale text-brand" : option.id === question.student_option_id ? "bg-red-50 text-red-700" : "bg-canvas text-muted"}`}><span className="font-semibold">{option.label}.</span> {option.content}{option.is_correct && <span className="ml-2 font-semibold">Correct answer</span>}{option.id === question.student_option_id && <span className="ml-2 font-semibold">Your answer</span>}</p>)}</div>{question.explanation && <p className="mt-3 rounded-lg bg-canvas p-3 text-xs leading-5 text-muted"><span className="font-semibold text-ink">Explanation: </span>{question.explanation}</p>}</div></div></li>;
    })}</ul></section></div></main></div>;
}
