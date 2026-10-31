"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type WeeklyPoint = { day: string; tests: number; average_percentage: number | null };
type SubjectPoint = { subject: string; attempts: number; average_percentage: number | null };

export function PerformanceCharts({ weekly, subjects }: { weekly: WeeklyPoint[]; subjects: SubjectPoint[] }) {
  const hasActivity = weekly.some((point) => point.tests > 0);
  return <div className="grid gap-4 lg:grid-cols-2">
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-xs font-semibold text-ink">Last 7 days</h2>
      <p className="mt-1 text-[10px] text-muted">Completed tests and average score</p>
      {hasActivity ? <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}><CartesianGrid stroke="#e9eeeb" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6d7885" }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6d7885" }} /><Tooltip cursor={{ fill: "#f6f8f7" }} contentStyle={{ borderRadius: 10, borderColor: "#e5eae7", fontSize: 11 }} /><Bar dataKey="tests" name="Tests" fill="#246b5d" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="mt-5 grid h-48 place-items-center rounded-xl bg-canvas text-center text-xs text-muted">Complete a test to start your progress history.</div>}
    </section>
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-xs font-semibold text-ink">By subject</h2>
      <p className="mt-1 text-[10px] text-muted">Average percentage across completed tests</p>
      {subjects.length ? <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjects} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 0 }}><CartesianGrid stroke="#e9eeeb" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6d7885" }} /><YAxis type="category" dataKey="subject" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6d7885" }} /><Tooltip cursor={{ fill: "#f6f8f7" }} contentStyle={{ borderRadius: 10, borderColor: "#e5eae7", fontSize: 11 }} formatter={(value) => [`${value ?? "—"}%`, "Average score"]} /><Bar dataKey="average_percentage" name="Average score" fill="#639d8e" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <div className="mt-5 grid h-48 place-items-center rounded-xl bg-canvas text-center text-xs text-muted">Subject insights appear after you complete tests.</div>}
    </section>
  </div>;
}
