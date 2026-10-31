import Link from "next/link";
import { ArrowRight, BookOpenCheck, Info } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminTestsPage() {
  await requireAdmin(["super_admin", "test_manager"]);
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">CONTENT WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Test manager</h1><p className="mt-3 text-sm leading-6 text-muted">Tests are assembled from approved questions and generated from student-selected criteria.</p><section className="mt-7 rounded-2xl border border-line bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pale text-brand"><BookOpenCheck size={19} /></span><h2 className="mt-4 text-sm font-semibold text-ink">Question-bank driven tests</h2><p className="mt-2 max-w-xl text-xs leading-6 text-muted">The student test generator selects only approved, non-duplicate questions and refuses to create an incomplete test when there are not enough matching questions.</p><div className="mt-5 flex items-start gap-2 rounded-xl bg-canvas p-3 text-[11px] leading-5 text-muted"><Info size={14} className="mt-0.5 shrink-0 text-brand" />Test scheduling and manually composed exams require the education taxonomy and question bank to be configured.</div><Link href="/admin/questions" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2.5 text-xs font-semibold text-white">Review questions <ArrowRight size={14} /></Link></section></div></main></div>;
}
