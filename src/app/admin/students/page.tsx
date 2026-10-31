import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = supabase ? await supabase.from("profiles").select("id,full_name,education_level,created_at").order("created_at", { ascending: false }).limit(100) : { data: [], error: null };
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Student profiles</h1>{error && <p role="alert" className="mt-4 text-xs text-red-700">Student profiles could not be loaded: {error.message}</p>}<div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white"><div className="border-b border-line px-5 py-4 text-xs font-semibold text-ink">Recently active profiles</div>{data?.length ? <ul className="divide-y divide-line">{data.map((student) => <li key={student.id} className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="text-xs font-semibold text-ink">{student.full_name || "Learner"}</p><p className="mt-1 text-[10px] text-muted">{student.education_level || "Learning level not set"}</p></div><span className="text-[10px] text-muted">{new Date(student.created_at).toLocaleDateString()}</span></li>)}</ul> : <p className="p-6 text-center text-xs text-muted">No student profiles to show.</p>}</div></div></main></div>;
}
