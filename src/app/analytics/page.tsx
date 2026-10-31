import { AppSidebar } from "@/components/app-sidebar";
import { PerformanceCharts } from "@/components/performance-charts";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Performance = {
  weekly: { day: string; tests: number; average_percentage: number | null }[];
  subjects: { subject: string; attempts: number; average_percentage: number | null }[];
};

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (supabase && !user) redirect("/login");
  let performance: Performance = { weekly: [], subjects: [] };
  let message = "";
  if (supabase && user) {
    const { data, error } = await supabase.rpc("get_my_performance");
    if (error) message = `Performance data is temporarily unavailable: ${error.message}`;
    else performance = data as Performance;
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">YOUR PROGRESS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Performance insights</h1><p className="mt-3 text-sm text-muted">Progress and subject recommendations use your completed test attempts.</p>{message && <p role="alert" className="mt-4 text-xs text-red-700">{message}</p>}{user ? <div className="mt-7"><PerformanceCharts weekly={performance.weekly || []} subjects={performance.subjects || []} /></div> : <p className="mt-6 rounded-xl border border-line bg-white p-5 text-sm text-muted">Sign in to see analytics from your own attempts.</p>}<p className="mt-5 text-[11px] leading-5 text-muted">We only identify a weak area when there is enough completed test data to support that recommendation.</p></div></main></div>;
}
