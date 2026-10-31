import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(1).max(500),
  fileSize: z.number().int().positive().max(25 * 1024 * 1024)
});

export async function POST(request: Request) {
  const { supabase, user, status } = await getAdminApiContext(["super_admin", "content_manager"]);
  if (!supabase || !user) return NextResponse.json({ error: status === 401 ? "Sign in with an administrator account." : "You do not have permission to manage PDF documents." }, { status });
  const rate = await checkApiRateLimit(supabase, "pdf_upload");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "PDF upload limit reached. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success || !input.data.fileName.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files up to 25 MB are accepted." }, { status: 400 });
  const { data, error } = await supabase.from("pdf_documents").insert({
    file_name: input.data.fileName,
    storage_path: input.data.storagePath,
    file_size: input.data.fileSize,
    status: "queued",
    uploaded_by: user.id
  }).select("id,file_name,status,created_at,file_size").single();
  if (error) return NextResponse.json({ error: "The uploaded file could not be registered." }, { status: 500 });
  const { error: jobError } = await supabase.from("pdf_processing_jobs").insert({
    document_id: data.id,
    status: "queued",
    created_by: user.id
  });
  if (jobError) {
    await supabase.storage.from("pdf-documents").remove([input.data.storagePath]);
    await supabase.from("pdf_documents").delete().eq("id", data.id);
    return NextResponse.json({ error: "A processing job could not be created." }, { status: 500 });
  }
  return NextResponse.json({ document: data }, { status: 201 });
}
