import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  if (!z.string().uuid().safeParse(documentId).success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  const { supabase, status } = await getAdminApiContext(["super_admin", "content_manager", "question_reviewer"]);
  if (!supabase) return NextResponse.json({ error: "Private document access is not available." }, { status });
  const rate = await checkApiRateLimit(supabase, "pdf_preview");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Too many preview requests. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const { data: document, error } = await supabase.from("pdf_documents").select("storage_path").eq("id", documentId).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load this document." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { data: signed, error: signedError } = await supabase.storage.from("pdf-documents").createSignedUrl(document.storage_path, 300);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Could not create a private preview link." }, { status: 502 });
  const page = new URL(request.url).searchParams.get("page");
  const pageNumber = page && /^\d{1,4}$/.test(page) ? Number(page) : null;
  const target = pageNumber ? `${signed.signedUrl}#page=${pageNumber}` : signed.signedUrl;
  return NextResponse.redirect(target);
}
