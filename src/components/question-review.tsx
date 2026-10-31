"use client";

import { useState } from "react";
import { Check, CircleHelp, LoaderCircle, X } from "lucide-react";

type Option = { label: string; content: string; sort_order: number };
type Item = {
  id: string;
  prompt: string;
  review_status: string;
  subject: string | null;
  topic: string | null;
  page_number: number | null;
  options: Option[];
  answer_label: string | null;
  explanation: string | null;
  extraction_confidence: number | null;
  document_id: string;
  document: { file_name: string } | null;
  optionsText: string;
};

function optionText(options: Option[]) {
  return options.map((option) => `${option.label}. ${option.content}`).join("\n");
}

export function QuestionReview({ initial }: { initial: Omit<Item, "optionsText">[] }) {
  const [items, setItems] = useState<Item[]>(initial.map((item) => ({ ...item, optionsText: optionText(item.options || []) })));
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  function update(id: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function review(item: Item, action: "approve" | "reject") {
    setBusyId(item.id);
    setMessage("");
    try {
      const options = item.optionsText.split(/\r?\n/).map((line, index) => {
        const match = /^([A-D])\s*[.)|:-]\s*(.+)$/i.exec(line.trim());
        if (!match) throw new Error(`Fix option line ${index + 1}; use “A. option text”.`);
        return { label: match[1].toUpperCase(), content: match[2].trim(), sort_order: index };
      });
      if (action === "approve" && options.length > 0 && options.length < 2) throw new Error("A multiple-choice question needs at least two options.");
      const response = await fetch(`/api/admin/questions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { action } : {
          action,
          prompt: item.prompt,
          options,
          answerLabel: item.answer_label?.trim() || null,
          explanation: item.explanation?.trim() || null,
          subject: item.subject?.trim() || null,
          topic: item.topic?.trim() || null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update this question.");
      setItems((current) => current.filter((question) => question.id !== item.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this question.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="rounded-2xl border border-line bg-white p-5">
    <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-ink">Pending questions</h2><p className="mt-1 text-[11px] text-muted">{items.length} awaiting review</p></div><CircleHelp size={17} className="text-brand" /></div>
    {message && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-800">{message}</p>}
    {items.length ? <ul className="mt-4 divide-y divide-line">{items.map((item) => <li key={item.id} className="py-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <label className="block"><span className="text-[10px] font-semibold text-muted">QUESTION</span><textarea rows={3} value={item.prompt} onChange={(event) => update(item.id, { prompt: event.target.value })} className="mt-1 w-full resize-y rounded-lg border border-line p-2.5 text-xs leading-5 text-ink outline-none focus:border-brand" /></label>
          <label className="block"><span className="text-[10px] font-semibold text-muted">OPTIONS · one per line</span><textarea rows={Math.max(3, (item.optionsText.match(/\n/g)?.length || 0) + 1)} value={item.optionsText} onChange={(event) => update(item.id, { optionsText: event.target.value })} placeholder={"A. First option\nB. Second option"} className="mt-1 w-full resize-y rounded-lg border border-line p-2.5 font-mono text-xs leading-5 text-ink outline-none focus:border-brand" /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-[10px] font-semibold text-muted">ANSWER LABEL</span><input value={item.answer_label || ""} onChange={(event) => update(item.id, { answer_label: event.target.value.toUpperCase() || null })} placeholder="Pending" className="mt-1 w-full rounded-lg border border-line px-2.5 py-2 text-xs outline-none focus:border-brand" /></label>
            <label className="block"><span className="text-[10px] font-semibold text-muted">SUBJECT</span><input value={item.subject || ""} onChange={(event) => update(item.id, { subject: event.target.value || null })} placeholder="Add subject" className="mt-1 w-full rounded-lg border border-line px-2.5 py-2 text-xs outline-none focus:border-brand" /></label>
            <label className="block"><span className="text-[10px] font-semibold text-muted">TOPIC</span><input value={item.topic || ""} onChange={(event) => update(item.id, { topic: event.target.value || null })} placeholder="Add topic" className="mt-1 w-full rounded-lg border border-line px-2.5 py-2 text-xs outline-none focus:border-brand" /></label>
          </div>
          <label className="block"><span className="text-[10px] font-semibold text-muted">EXPLANATION</span><textarea rows={2} value={item.explanation || ""} onChange={(event) => update(item.id, { explanation: event.target.value || null })} className="mt-1 w-full resize-y rounded-lg border border-line p-2.5 text-xs leading-5 outline-none focus:border-brand" /></label>
          <p className="text-[10px] text-muted">{item.document?.file_name || "Source PDF"}{item.page_number ? ` · page ${item.page_number}` : ""} · Confidence {item.extraction_confidence === null ? "not available" : `${Math.round(item.extraction_confidence * 100)}%`}{!item.answer_label && <span className="ml-2 font-semibold text-amber-700">Answer pending</span>}<a href={`/api/admin/documents/${item.document_id}/preview${item.page_number ? `?page=${item.page_number}` : ""}`} target="_blank" rel="noreferrer" className="ml-2 font-semibold text-brand underline underline-offset-2">Preview source</a></p>
        </div>
        <div className="flex gap-2 lg:flex-col">
          <button disabled={Boolean(busyId)} onClick={() => void review(item, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{busyId === item.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}Approve</button>
          <button disabled={Boolean(busyId)} onClick={() => void review(item, "reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[10px] font-semibold text-muted hover:text-red-700 disabled:opacity-50"><X size={13} />Reject</button>
        </div>
      </div>
    </li>)}</ul> : <p className="mt-4 rounded-xl bg-canvas p-6 text-center text-xs text-muted">Nothing is waiting for review. New extractions will show here.</p>}
  </section>;
}
