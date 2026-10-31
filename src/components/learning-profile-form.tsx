"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

const levels = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`), "Diploma", "Polytechnic", "Undergraduate", "Postgraduate", "College", "University", "Competitive exam"];

export function LearningProfileForm({ initial, enabled }: { initial: { education_level?: string | null; board?: string | null; exam_goal?: string | null } | null; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your learning path.");
      setStatus("Your learning path is saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save your learning path.");
    }
    setBusy(false);
  }
  return <form onSubmit={save} className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7"><label className="block"><span className="text-xs font-semibold text-ink">Education level</span><select name="education_level" defaultValue={initial?.education_level || ""} required className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="" disabled>Select a level</option>{levels.map((level) => <option key={level}>{level}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-xs font-semibold text-ink">Board (optional)</span><select name="board" defaultValue={initial?.board || ""} className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="">Not applicable</option>{["CBSE", "ICSE", "State Board", "Other"].map((board) => <option key={board}>{board}</option>)}</select></label><label className="block"><span className="text-xs font-semibold text-ink">Exam or course goal (optional)</span><input name="exam_goal" defaultValue={initial?.exam_goal || ""} maxLength={120} placeholder="e.g. NEET, JEE Main" className="mt-2 w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-brand" /></label></div>{status && <p role="status" className="text-xs text-muted">{status}</p>}<button disabled={!enabled || busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Save learning path</button></form>;
}
