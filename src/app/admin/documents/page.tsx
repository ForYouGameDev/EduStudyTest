import { AppSidebar } from "@/components/app-sidebar";
import { DocumentManager } from "@/components/document-manager";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { supabase } = await requireAdmin(["super_admin", "content_manager"]);
  let docs: { id: string; file_name: string; status: string; created_at: string; file_size: number; job: { current_page: number; total_pages: number | null; error_details: string | null } | null }[] = [];
  let issue = "";
  if (supabase) {
    const { data, error } = await supabase.from("pdf_documents").select("id,file_name,status,created_at,file_size,job:pdf_processing_jobs(current_page,total_pages,error_details)").order("created_at", { ascending: false }).limit(50);
    if (error) issue = `Documents could not be loaded: ${error.message}`;
    else docs = (data || []).map(({ job, ...doc }) => ({ ...doc, job: job?.[0] || null }));
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">CONTENT WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">PDF documents</h1><p className="mt-3 text-sm leading-6 text-muted">Upload a source file to private storage. Questions are never published without review.</p>{issue && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-800">{issue}</p>}<div className="mt-7"><DocumentManager initial={docs} /></div></div></main></div>;
}
