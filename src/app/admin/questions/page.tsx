import { AppSidebar } from "@/components/app-sidebar";
import { QuestionReview } from "@/components/question-review";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const { supabase } = await requireAdmin(["super_admin", "content_manager", "question_reviewer"]);
  let questions: {
    id: string;
    prompt: string;
    review_status: string;
    subject: string | null;
    topic: string | null;
    page_number: number | null;
    options: { label: string; content: string; sort_order: number }[];
    answer_label: string | null;
    explanation: string | null;
    extraction_confidence: number | null;
    document_id: string;
    document: { file_name: string } | null;
  }[] = [];
  let issue = "";
  if (supabase) {
    const { data, error } = await supabase.from("extracted_questions").select("id,prompt,review_status,subject,topic,page_number,document_id,options,answer_label,explanation,extraction_confidence,document:pdf_documents(file_name)").eq("review_status", "pending").order("created_at", { ascending: false }).limit(100);
    if (error) issue = `Review queue could not be loaded: ${error.message}`;
    else questions = (data || []).map(({ document, ...question }) => ({ ...question, document: document?.[0] || null }));
  }
  return <div className="min-h-screen bg-canvas lg:flex"><AppSidebar admin /><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-medium text-muted">CONTENT WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Question review</h1><p className="mt-3 text-sm leading-6 text-muted">Only approved questions can appear in student practice tests.</p>{issue && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-800">{issue}</p>}<div className="mt-7"><QuestionReview initial={questions} /></div></div></main></div>;
}
