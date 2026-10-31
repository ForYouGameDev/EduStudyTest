import { NextResponse } from "next/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { extractQuestionsFromPage, pdfPageText } from "@/lib/pdf/questions";
import { checkApiRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_PAGES = 12;
const OCRPageSchema = z.object({
  page: z.number().int().positive(),
  text: z.string().max(200_000),
  confidence: z.number().min(0).max(1)
});
const OCRResponseSchema = z.object({ pages: z.array(OCRPageSchema).max(BATCH_PAGES) });

type PdfTextPage = { page: number; text: string; confidence: number };

async function extractPageBatch(bytes: Uint8Array, startPage: number) {
  const pdf = await getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const pages: PdfTextPage[] = [];
  const fromPage = startPage > pdf.numPages ? 1 : startPage;
  const toPage = Math.min(pdf.numPages, fromPage + BATCH_PAGES - 1);
  try {
    for (let pageNumber = fromPage; pageNumber <= toPage; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = pdfPageText(content.items.filter((item) => "str" in item));
      pages.push({ page: pageNumber, text, confidence: 0.9 });
    }
    return { totalPages: pdf.numPages, fromPage, toPage, pages };
  } finally {
    await pdf.destroy();
  }
}

async function requestOcr(
  workerUrl: string,
  secret: string,
  sourceUrl: string,
  pages: number[]
): Promise<PdfTextPage[]> {
  const endpoint = new URL(workerUrl);
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
    throw new Error("The OCR worker URL must use HTTPS.");
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ sourceUrl, pages }),
    signal: AbortSignal.timeout(45_000)
  });
  if (!response.ok) throw new Error(`OCR worker returned HTTP ${response.status}.`);
  const parsed = OCRResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("OCR worker returned an invalid response.");
  return parsed.data.pages;
}

export async function POST(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  if (!z.string().uuid().safeParse(documentId).success) {
    return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  }
  const { supabase, user, status } = await getAdminApiContext(["super_admin", "content_manager"]);
  if (!supabase || !user) {
    return NextResponse.json({ error: status === 401 ? "Sign in with an administrator account." : "You do not have permission to process PDFs." }, { status });
  }
  const rate = await checkApiRateLimit(supabase, "pdf_process");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "PDF processing limit reached. Try again later." }, { status: rate.unavailable ? 503 : 429 });

  const { data: document, error: documentError } = await supabase
    .from("pdf_documents").select("id,storage_path,status").eq("id", documentId).maybeSingle();
  if (documentError) return NextResponse.json({ error: "Unable to load PDF document." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "PDF document not found." }, { status: 404 });

  const { data: job, error: jobError } = await supabase
    .from("pdf_processing_jobs").select("id,status,current_page,total_pages,retry_count")
    .eq("document_id", document.id).maybeSingle();
  if (jobError || !job) return NextResponse.json({ error: "PDF processing job not found." }, { status: 404 });
  if (job.status === "completed") return NextResponse.json({ error: "This PDF has already been processed." }, { status: 409 });

  const { data: file, error: downloadError } = await supabase.storage
    .from("pdf-documents").download(document.storage_path);
  if (downloadError || !file) return NextResponse.json({ error: "The private PDF could not be downloaded." }, { status: 502 });
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const batch = await extractPageBatch(bytes, job.current_page + 1);
    const { totalPages, fromPage, toPage } = batch;
    if (totalPages > 500) throw new Error("This PDF has more than 500 pages. Split it into smaller files before processing.");
    let pages = batch.pages;
    let ocrRequired: number[] = pages.filter((page) => page.text.length < 20).map((page) => page.page);
    const workerUrl = process.env.PDF_OCR_WORKER_URL;
    const workerSecret = process.env.PDF_OCR_WORKER_SECRET;

    if (ocrRequired.length && workerUrl && workerSecret) {
      const { data: signed, error: signedError } = await supabase.storage
        .from("pdf-documents").createSignedUrl(document.storage_path, 300);
      if (signedError || !signed?.signedUrl) throw new Error("Could not create a short-lived URL for the private OCR request.");
      const ocrPages = await requestOcr(workerUrl, workerSecret, signed.signedUrl, ocrRequired);
      const ocrByPage = new Map(ocrPages.map((page) => [page.page, page]));
      pages = pages.map((page) => ocrByPage.get(page.page)?.text
        ? { ...page, ...ocrByPage.get(page.page)! }
        : page);
      ocrRequired = pages.filter((page) => page.text.length < 20).map((page) => page.page);
    }

    let questionsAdded = 0;
    for (const page of pages) {
      for (const question of extractQuestionsFromPage(page.text, page.confidence)) {
        const fingerprint = await sha256(`${document.id}:${page.page}:${question.prompt.toLocaleLowerCase().replace(/\s+/g, " ")}`);
        const { data: inserted, error: insertError } = await supabase.from("extracted_questions").upsert({
          document_id: document.id,
          page_number: page.page,
          prompt: question.prompt,
          question_type: question.questionType,
          options: question.options,
          answer_label: question.answerLabel,
          explanation: question.explanation,
          extraction_confidence: question.confidence,
          review_status: "pending",
          source_fingerprint: fingerprint
        }, { onConflict: "source_fingerprint", ignoreDuplicates: true }).select("id");
        if (insertError) throw new Error(`Could not save an extracted question: ${insertError.message}`);
        questionsAdded += inserted?.length || 0;
      }
    }

    const nextPage = toPage;
    const isComplete = nextPage >= totalPages;
    const nextStatus = ocrRequired.length ? "needs_ocr" : isComplete ? "completed" : "processing";
    const errorDetails = ocrRequired.length
      ? process.env.PDF_OCR_WORKER_URL
        ? `OCR did not return readable text for page(s): ${ocrRequired.join(", ")}.`
        : `Scanned page(s) need OCR: ${ocrRequired.join(", ")}. Configure an OCR worker and retry.`
      : null;
    const { error: updateJobError } = await supabase.from("pdf_processing_jobs").update({
      status: nextStatus,
      current_page: nextPage,
      total_pages: totalPages,
      error_details: errorDetails,
      retry_count: job.retry_count + 1
    }).eq("id", job.id);
    if (updateJobError) throw new Error("Could not save PDF processing progress.");
    const { error: updateDocumentError } = await supabase.from("pdf_documents").update({ status: nextStatus }).eq("id", document.id);
    if (updateDocumentError) throw new Error("Could not update PDF processing status.");

    return NextResponse.json({
      status: nextStatus,
      processedPages: `${fromPage}-${toPage}`,
      totalPages,
      questionsAdded,
      message: errorDetails || (isComplete ? "Text extraction complete. Review extracted questions before approval." : "Page batch saved. Continue processing to resume this document.")
    }, { status: ocrRequired.length ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF processing failed.";
    await supabase.from("pdf_processing_jobs").update({
      status: "failed",
      error_details: message.slice(0, 1000),
      retry_count: job.retry_count + 1
    }).eq("id", job.id);
    await supabase.from("pdf_documents").update({ status: "failed" }).eq("id", document.id);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
