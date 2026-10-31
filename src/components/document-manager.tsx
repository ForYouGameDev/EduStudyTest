"use client";

import { ChangeEvent, useState } from "react";
import { Eye, FileText, LoaderCircle, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type DocumentItem = { id: string; file_name: string; status: string; created_at: string; file_size: number; job: { current_page: number; total_pages: number | null; error_details: string | null } | null };
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function DocumentManager({ initial }: { initial: DocumentItem[] }) {
  const [documents, setDocuments] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [message, setMessage] = useState("");

  async function processDocument(documentId: string) {
    setProcessingId(documentId);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/process`, { method: "POST" });
      const result = await response.json();
      if (!response.ok && response.status !== 202) throw new Error(result.error || "PDF processing failed.");
      setDocuments((current) => current.map((item) => item.id === documentId ? { ...item, status: result.status } : item));
      setMessage(result.message || "PDF processing status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PDF processing failed.");
    } finally { setProcessingId(""); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setMessage("");
    const invalid = files.find((file) => (file.type && file.type !== "application/pdf") || !file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_FILE_SIZE || file.size === 0);
    if (invalid) {
      setMessage(`${invalid.name}: choose a non-empty PDF no larger than 25 MB.`);
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      for (const file of files) {
        const path = `${crypto.randomUUID()}/${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("pdf-documents").upload(path, file, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        const response = await fetch("/api/admin/documents", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, storagePath: path, fileSize: file.size })
        });
        const result = await response.json();
        if (!response.ok) {
          await supabase.storage.from("pdf-documents").remove([path]);
          throw new Error(result.error || `Could not record ${file.name}.`);
        }
        setDocuments((current) => [result.document, ...current]);
        await processDocument(result.document.id);
      }
      if (files.length > 1) setMessage(`${files.length} PDFs uploaded. The first page batch of each was processed where possible; continue any remaining batches below.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function remove(documentId: string) {
    if (!window.confirm("Delete this PDF document and its processing job?")) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete this document.");
      setDocuments((current) => current.filter((item) => item.id !== documentId));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to delete this document."); }
  }

  return <div className="space-y-5">
    <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-brand/30 bg-white px-5 py-9 text-center transition hover:bg-brand-pale/30"><input type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={upload} disabled={busy} /><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">{busy ? <LoaderCircle size={21} className="animate-spin" /> : <UploadCloud size={21} />}</span><span className="mt-4 text-sm font-semibold text-ink">{busy ? "Uploading documents…" : "Drop PDFs here or browse files"}</span><span className="mt-1 text-xs text-muted">PDF only · Up to 25 MB per file · Multiple files supported</span></label>
    {message && <p role="status" className="rounded-xl border border-line bg-white p-3 text-xs leading-5 text-muted">{message}</p>}
    <section className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-ink">Uploaded documents</h2><p className="mt-1 text-[11px] text-muted">{documents.length} recent documents</p></div><RefreshCw size={15} className="text-muted" /></div>{documents.length ? <ul className="mt-4 divide-y divide-line">{documents.map((doc) => <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand"><FileText size={16} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{doc.file_name}</p><p className="mt-1 text-[10px] text-muted">{(doc.file_size / 1024 / 1024).toFixed(1)} MB · {new Date(doc.created_at).toLocaleDateString()}{doc.job?.total_pages ? ` · ${doc.job.current_page}/${doc.job.total_pages} pages` : ""}</p>{doc.job?.error_details && <p className="mt-1 max-w-xl text-[10px] leading-4 text-amber-800">{doc.job.error_details}</p>}</div></div><div className="flex items-center gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium capitalize text-amber-800">{doc.status.replaceAll("_", " ")}</span><a href={`/api/admin/documents/${doc.id}/preview`} target="_blank" rel="noreferrer" aria-label={`Preview ${doc.file_name}`} className="rounded-lg border border-line p-2 text-muted hover:text-brand"><Eye size={14} /></a>{doc.status !== "completed" && <button disabled={Boolean(processingId)} onClick={() => void processDocument(doc.id)} className="rounded-lg border border-line px-2.5 py-2 text-[10px] font-semibold text-brand disabled:opacity-50">{processingId === doc.id ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />}</button>}<button aria-label={`Delete ${doc.file_name}`} onClick={() => void remove(doc.id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button></div></li>)}</ul> : <p className="mt-4 rounded-xl bg-canvas p-5 text-center text-xs text-muted">No source PDFs yet. Upload a question paper or learning resource to get started.</p>}</section>
    <p className="text-[11px] leading-5 text-muted">Files remain in private storage. Text-based PDFs are extracted in bounded batches. Scanned pages require a configured OCR worker; unanswered questions remain marked as answer pending.</p>
  </div>;
}
