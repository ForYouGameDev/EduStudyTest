import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin(["super_admin", "content_manager", "question_reviewer", "test_manager"]);
  const query = q?.trim().slice(0, 100) || "";
  let questions: { id: string; prompt: string; subject: string | null; topic: string | null; difficulty: string | null; source_page: number | null }[] = [];
  let errorMessage = "";
  if (supabase) {
    let request = supabase.from("questions").select("id,prompt,subject,topic,difficulty,source_page").eq("status", "approved").order("created_at", { ascending: false }).limit(100);
    if (query) request = request.ilike("prompt", `%${query}%`);
    const { data, error } = await request;
    if (error) errorMessage = `Question bank could not be loaded: ${error.message}`;
    else questions = data || [];
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">CONTENT WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Approved question bank</h1><p className="mt-3 text-sm text-muted">Published questions, with their source references. Answer keys remain restricted to authorized roles.</p><form className="mt-6 flex gap-2"><input name="q" defaultValue={query} maxLength={100} placeholder="Search question text" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-brand" /><button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white">Search</button></form>{errorMessage && <p role="alert" className="mt-4 text-xs text-red-700">{errorMessage}</p>}<section className="mt-5 rounded-2xl border border-line bg-white p-5"><p className="text-xs font-semibold text-ink">{questions.length} questions shown</p>{questions.length ? <ul className="mt-3 divide-y divide-line">{questions.map((question) => <li key={question.id} className="py-4"><p className="text-sm leading-6 text-ink">{question.prompt}</p><p className="mt-2 text-[10px] text-muted">{[question.subject, question.topic, question.difficulty, question.source_page ? `Source page ${question.source_page}` : null].filter(Boolean).join(" · ") || "No classification"}</p></li>)}</ul> : <p className="mt-4 rounded-xl bg-canvas p-6 text-center text-xs text-muted">Approved questions will appear after admin review.</p>}</section><Link href="/admin/questions" className="mt-5 inline-block text-xs font-semibold text-brand">Go to question review →</Link></div></main></div>;
}
