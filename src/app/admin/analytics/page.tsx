import { Activity, CircleHelp, FileText, Users } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [attempts, documents, questions, students] = supabase ? await Promise.all([
    supabase.from("test_attempts").select("id", { count: "exact", head: true }),
    supabase.from("pdf_documents").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]) : [];
  const cards = [
    { label: "Assessment attempts", count: attempts?.count, icon: Activity },
    { label: "Source PDFs", count: documents?.count, icon: FileText },
    { label: "Approved questions", count: questions?.count, icon: CircleHelp },
    { label: "Learner profiles", count: students?.count, icon: Users }
  ];
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Platform analytics</h1><p className="mt-3 text-sm text-muted">Counts are read from the configured Supabase project; no demo activity is included.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{cards.map(({ label, count, icon: Icon }) => <section key={label} className="rounded-2xl border border-line bg-white p-5"><Icon size={17} className="text-brand" /><p className="mt-4 text-xs text-muted">{label}</p><p className="mt-1 text-2xl font-semibold text-ink">{count ?? "—"}</p></section>)}</div></div></main></div>;
}
