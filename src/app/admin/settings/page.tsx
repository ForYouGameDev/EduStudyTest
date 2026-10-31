import { AppSidebar } from "@/components/app-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { supabase, user } = await requireAdmin();
  let roles: { role: string }[] = [];
  if (supabase && user) {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (error) throw new Error(`Unable to load administrator roles: ${error.message}`);
    roles = data || [];
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><p className="text-xs font-medium text-muted">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Admin settings</h1><section className="mt-7 rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold text-ink">Your assigned permissions</h2><p className="mt-2 text-xs text-muted">Roles are managed server-side. You cannot grant yourself administrator access.</p><div className="mt-4 flex flex-wrap gap-2">{roles.map(({ role }) => <span key={role} className="rounded-full bg-brand-pale px-3 py-1.5 text-[11px] font-medium capitalize text-brand">{role.replaceAll("_", " ")}</span>)}</div></section><p className="mt-4 text-[11px] leading-5 text-muted">Configure OAuth providers, redirect URLs, private buckets, and database policies in the Supabase project dashboard.</p></div></main></div>;
}
