import { AppSidebar } from "@/components/app-sidebar";
import { EducationManager } from "@/components/education-manager";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const { supabase } = await requireAdmin(["super_admin", "content_manager"]);
  let levels: { id: string; name: string; active: boolean }[] = [];
  let boards: { id: string; name: string; active: boolean }[] = [];
  let subjects: { id: string; name: string; active: boolean }[] = [];
  let error = "";
  if (supabase) {
    const results = await Promise.all([
      supabase.from("education_levels").select("id,name,active").order("sort_order"),
      supabase.from("education_boards").select("id,name,active").order("name"),
      supabase.from("subjects").select("id,name,active").order("name")
    ]);
    const failure = results.find((result) => result.error)?.error;
    if (failure) error = `Education settings could not be loaded: ${failure.message}`;
    else {
      levels = results[0].data || [];
      boards = results[1].data || [];
      subjects = results[2].data || [];
    }
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">CONTENT WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Education setup</h1><p className="mt-3 text-sm leading-6 text-muted">Maintain education levels, boards and subjects used to classify approved questions.</p>{error && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}<div className="mt-7"><EducationManager levels={levels} boards={boards} subjects={subjects} /></div></div></main></div>;
}
