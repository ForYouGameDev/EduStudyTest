import { AppSidebar } from "@/components/app-sidebar";
import { TestBuilder } from "@/components/test-builder";
import { requireUser } from "@/lib/auth";

export default async function NewTestPage() {
  await requireUser();
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><p className="text-xs font-medium text-muted">CUSTOM PRACTICE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Build your practice test.</h1><p className="mt-3 text-sm leading-6 text-muted">Choose a subject and test settings. EduTest AI will only create a test when enough approved questions are available.</p><div className="mt-7"><TestBuilder /></div></div></main></div>;
}
