import Link from "next/link";
import { ArrowRight, CircleHelp, FileText, ShieldCheck, Users } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  if (!supabase || !user) return <main className="min-h-screen bg-canvas p-8 text-sm text-muted">Configure Supabase and sign in with an administrator account to open the admin workspace.</main>;
  const [documents, questions, pending, students] = await Promise.all([
    supabase.from("pdf_documents").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("extracted_questions").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);
  const failure = [documents, questions, pending, students].find((item) => item.error)?.error;
  if (failure) throw new Error(`Unable to load admin dashboard: ${failure.message}`);
  const cards = [
    { label: "PDF documents", value: documents.count, icon: FileText, href: "/admin/documents" },
    { label: "Question bank", value: questions.count, icon: CircleHelp, href: "/admin/questions" },
    { label: "Pending review", value: pending.count, icon: ShieldCheck, href: "/admin/questions" },
    { label: "Student profiles", value: students.count, icon: Users, href: "/admin/students" }
  ];
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin name={user.user_metadata.full_name || "Administrator"} /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl"><p className="text-xs font-medium text-muted">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Content overview.</h1><p className="mt-2 text-sm text-muted">Manage source documents, review extracted questions and publish trusted tests.</p><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label} className="rounded-2xl border border-line bg-white p-4 transition hover:border-brand/30"><div className="flex justify-between"><p className="text-xs text-muted">{label}</p><Icon size={16} className="text-brand" /></div><p className="mt-4 text-2xl font-semibold text-ink">{value ?? "—"}</p><p className="mt-1 text-[10px] text-muted">Live database count</p></Link>)}</div><section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="text-sm font-semibold text-ink">Content workflow</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Link href="/admin/documents" className="rounded-xl bg-canvas p-4"><FileText size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-ink">Upload source PDF</p><p className="mt-1 text-[11px] leading-5 text-muted">Private storage and traceable processing status.</p><p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-brand">Open manager <ArrowRight size={12} /></p></Link><Link href="/admin/questions" className="rounded-xl bg-canvas p-4"><CircleHelp size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-ink">Review questions</p><p className="mt-1 text-[11px] leading-5 text-muted">Approve, edit or reject items before publication.</p><p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-brand">Review queue <ArrowRight size={12} /></p></Link><Link href="/admin/tests" className="rounded-xl bg-canvas p-4"><ShieldCheck size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-ink">Manage tests</p><p className="mt-1 text-[11px] leading-5 text-muted">Control the assessment experience and visibility.</p><p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-brand">Test manager <ArrowRight size={12} /></p></Link></div></section><p className="mt-5 text-[11px] text-muted">Every action in this area is enforced by server-side role checks and database policies.</p></div></main></div>;
}
