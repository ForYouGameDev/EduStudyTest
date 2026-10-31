"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Plus, Save } from "lucide-react";

type Entry = { id: string; name: string; active: boolean };
type Entity = "level" | "board" | "subject";

export function EducationManager({ levels: initialLevels, boards: initialBoards, subjects: initialSubjects }: { levels: Entry[]; boards: Entry[]; subjects: Entry[] }) {
  const [levels, setLevels] = useState(initialLevels);
  const [boards, setBoards] = useState(initialBoards);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>, type: Entity) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: data.name,
          educationLevelId: data.educationLevelId || null,
          boardId: data.boardId || null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this item.");
      if (type === "level") setLevels((items) => [...items, result.item]);
      if (type === "board") setBoards((items) => [...items, result.item]);
      if (type === "subject") setSubjects((items) => [...items, result.item]);
      form.reset();
      setMessage(`${result.item.name} added.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this item.");
    } finally { setBusy(false); }
  }

  function renderList(title: string, items: Entry[]) {
    return <section className="rounded-xl bg-canvas p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-ink">{title}</p><span className="text-[10px] text-muted">{items.length}</span></div>{items.length ? <ul className="mt-3 max-h-52 space-y-2 overflow-auto">{items.map((item) => <li key={item.id} className="flex justify-between gap-2 text-[11px]"><span className="text-ink">{item.name}</span><span className={item.active ? "text-brand" : "text-muted"}>{item.active ? "Active" : "Inactive"}</span></li>)}</ul> : <p className="mt-3 text-[11px] text-muted">No entries yet.</p>}</section>;
  }

  function renderAddForm(type: Entity, label: string) {
    return <form onSubmit={(event) => void submit(event, type)} className="mt-3 flex flex-wrap gap-2"><input name="name" required maxLength={100} placeholder={`New ${label.toLowerCase()}`} className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-xs outline-none focus:border-brand" />{type === "subject" && <><select name="educationLevelId" defaultValue="" className="rounded-lg border border-line bg-white px-2 py-2 text-xs"><option value="">All levels</option>{levels.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select name="boardId" defaultValue="" className="rounded-lg border border-line bg-white px-2 py-2 text-xs"><option value="">All boards</option>{boards.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></>}<button disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{busy ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}Add</button></form>;
  }

  return <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
    {message && <p role="status" className="rounded-lg bg-brand-pale p-3 text-xs text-brand">{message}</p>}
    <div className="grid gap-4 md:grid-cols-3">
      <div>{renderList("Education levels", levels)}{renderAddForm("level", "Level")}</div>
      <div>{renderList("Boards", boards)}{renderAddForm("board", "Board")}</div>
      <div>{renderList("Subjects", subjects)}{renderAddForm("subject", "Subject")}</div>
    </div>
    <p className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-[10px] leading-5 text-muted"><Save size={13} className="mt-0.5 shrink-0 text-brand" />Changes are saved to Supabase. Seed initial boards, levels, chapters and topics with SQL; this page adds levels, boards and subjects.</p>
  </div>;
}
