"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Check, Clock3, Flag, LoaderCircle, Send } from "lucide-react";

type Question = { id: string; prompt: string; options: { id: string; label: string; content: string }[] };
type Attempt = { id: string; duration_minutes: number | null; started_at: string; questions: Question[] };

export function TestRunner({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const submissionLock = useRef(false);
  const submitRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/tests/${attemptId}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "This test could not be loaded.");
        return result;
      })
      .then((result) => {
        if (cancelled) return;
        const loadedAttempt = result.attempt as Attempt;
        setAttempt(loadedAttempt);
        setAnswers(result.answers || {});
        setSeconds(Math.max(0, Math.floor((Date.now() - new Date(loadedAttempt.started_at).getTime()) / 1000)));
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "This test could not be loaded.");
      });
    return () => { cancelled = true; };
  }, [attemptId]);
  const question = attempt?.questions[current];
  const remaining = useMemo(() => {
    if (!attempt?.duration_minutes) return null;
    return Math.max(0, attempt.duration_minutes * 60 - seconds);
  }, [attempt, seconds]);

  useEffect(() => {
    if (!attempt) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
      if (attempt.duration_minutes && Date.now() >= new Date(attempt.started_at).getTime() + attempt.duration_minutes * 60_000) {
        window.clearInterval(timer);
        submitRef.current();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  const save = useCallback(async (questionId: string, optionId: string) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: optionId }));
    try {
      const response = await fetch(`/api/tests/${attemptId}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, optionId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your answer could not be saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your answer could not be saved.");
    }
  }, [attemptId]);

  const submit = useCallback(async () => {
    if (submissionLock.current) return;
    submissionLock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/tests/${attemptId}/submit`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit your test.");
      router.push(`/results/${attemptId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit your test.");
      setBusy(false);
      submissionLock.current = false;
    }
  }, [attemptId, router]);

  useEffect(() => {
    submitRef.current = () => { void submit(); };
  }, [submit]);

  async function saveQuestion() {
    if (!question) return;
    try {
      const response = await fetch(`/api/tests/${attemptId}/save-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Question could not be saved.");
      setSavedQuestionId(question.id);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Question could not be saved.");
    }
  }

  if (error && !attempt) return <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-800">{error}<p className="mt-3"><Link href="/practice" className="font-semibold underline">Back to practice</Link></p></div>;
  if (!attempt) return <div className="flex items-center gap-2 rounded-2xl border border-line bg-white p-6 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} /> Loading your test…</div>;
  if (!question) return <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">This test has no questions.</div>;
  const clock = remaining === null ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} elapsed` : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-muted">PRACTICE TEST</p><h1 className="mt-1 text-xl font-semibold text-ink">Take your time and focus.</h1></div><div className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"><Clock3 size={15} className="text-brand" />{clock}</div></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><div className="flex items-center justify-between border-b border-line pb-4"><p className="text-xs font-semibold text-brand">QUESTION {current + 1} <span className="font-normal text-muted">/ {attempt.questions.length}</span></p><button onClick={() => void saveQuestion()} className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${savedQuestionId === question.id ? "text-brand" : "text-muted hover:text-brand"}`}><Bookmark size={13} fill={savedQuestionId === question.id ? "currentColor" : "none"} />{savedQuestionId === question.id ? "Saved" : "Save question"}</button></div><h2 className="py-6 text-base font-medium leading-7 text-ink">{question.prompt}</h2><div className="space-y-2.5">{question.options.map((option) => <button key={option.id} onClick={() => void save(question.id, option.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${answers[question.id] === option.id ? "border-brand bg-brand-pale/60" : "border-line hover:border-brand/40 hover:bg-canvas"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${answers[question.id] === option.id ? "border-brand bg-brand text-white" : "border-line text-muted"}`}>{answers[question.id] === option.id ? <Check size={13} /> : option.label}</span><span className="pt-0.5 leading-5 text-ink">{option.content}</span></button>)}</div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"><button disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink disabled:opacity-40"><ArrowLeft size={14} />Previous</button><button onClick={() => setCurrent((value) => Math.min(attempt.questions.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">Save & next <ArrowRight size={14} /></button></div>
      </section>
      <aside className="rounded-2xl border border-line bg-white p-4"><p className="text-xs font-semibold text-ink">Question palette</p><div className="mt-4 grid grid-cols-5 gap-2">{attempt.questions.map((item, index) => <button key={item.id} aria-label={`Question ${index + 1}`} onClick={() => setCurrent(index)} className={`grid aspect-square place-items-center rounded-lg border text-[11px] font-semibold ${index === current ? "border-brand bg-brand text-white" : answers[item.id] ? "border-brand/25 bg-brand-pale text-brand" : "border-line text-muted"}`}>{index + 1}</button>)}</div><div className="mt-4 space-y-2 border-t border-line pt-4 text-[10px] text-muted"><p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand" />Answered</p><p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-line" />Not answered</p></div><button onClick={() => { if (window.confirm("Submit this test now? You cannot change answers after submission.")) void submit(); }} disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink hover:bg-canvas disabled:opacity-60">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}Submit test</button><div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-muted"><Flag size={12} className="mt-0.5 shrink-0" />Answers are scored securely after submission.</div></aside>
    </div>
  </div>;
}
