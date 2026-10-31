import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function DELETE(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  if (!z.string().uuid().safeParse(documentId).success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  const { supabase, user, status } = await getAdminApiContext(["super_admin", "content_manager"]);
  if (!supabase || !user) return NextResponse.json({ error: status === 401 ? "Sign in with an administrator account." : "You do not have permission to manage PDF documents." }, { status });
  const rate = await checkApiRateLimit(supabase, "pdf_delete");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "PDF deletion limit reached. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const { data: document, error: readError } = await supabase.from("pdf_documents").select("storage_path").eq("id", documentId).maybeSingle();
  if (readError) return NextResponse.json({ error: "Unable to find this document." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { error: storageError } = await supabase.storage.from("pdf-documents").remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: "Private file could not be deleted; document record was kept." }, { status: 500 });
  const { error } = await supabase.from("pdf_documents").delete().eq("id", documentId);
  if (error) return NextResponse.json({ error: "Document record could not be deleted." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
