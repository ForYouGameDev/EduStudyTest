import { AppSidebar } from "@/components/app-sidebar";
import { TestRunner } from "@/components/test-runner";

export default async function TestPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar /><main className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-8"><div className="mx-auto max-w-5xl"><TestRunner attemptId={attemptId} /></div></main></div>;
}
