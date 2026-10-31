"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, WandSparkles } from "lucide-react";

export function TestBuilder() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function createTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: data.get("subject"),
          questionCount: Number(data.get("questionCount")),
          durationMinutes: Number(data.get("durationMinutes")),
          difficulty: data.get("difficulty"),
          mode: data.get("mode")
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create the test.");
      router.push(`/tests/${result.attemptId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the test.");
      setBusy(false);
    }
  }

  return <form onSubmit={createTest} className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
    <label className="block"><span className="text-xs font-semibold text-ink">Subject</span><input name="subject" required maxLength={100} placeholder="e.g. Mathematics" className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="text-xs font-semibold text-ink">Questions</span><select name="questionCount" defaultValue="15" className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand">{[5, 10, 15, 20, 30, 50].map((count) => <option key={count} value={count}>{count} questions</option>)}</select></label>
      <label className="block"><span className="text-xs font-semibold text-ink">Duration</span><select name="durationMinutes" defaultValue="30" className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand">{[0, 15, 30, 45, 60, 90, 120].map((time) => <option key={time} value={time}>{time === 0 ? "Untimed" : `${time} minutes`}</option>)}</select></label>
      <label className="block"><span className="text-xs font-semibold text-ink">Difficulty</span><select name="difficulty" defaultValue="any" className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="any">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label className="block"><span className="text-xs font-semibold text-ink">Practice mode</span><select name="mode" defaultValue="practice" className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="practice">Practice (review after submit)</option><option value="exam">Exam simulation</option></select></label>
    </div>
    {message && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{message}</p>}
    <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}{busy ? "Creating your test…" : "Create practice test"}</button>
  </form>;
}
