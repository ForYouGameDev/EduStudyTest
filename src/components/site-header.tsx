import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Brand } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-line/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex" aria-label="Main navigation">
          <Link className="hover:text-brand" href="/#features">Features</Link>
          <Link className="hover:text-brand" href="/#exams">Exam categories</Link>
          <Link className="hover:text-brand" href="/#how-it-works">How it works</Link>
          <Link className="hover:text-brand" href="/about">About</Link>
        </nav>
        <div className="hidden items-center gap-5 md:flex">
          <Link href="/login" className="text-sm font-semibold text-ink hover:text-brand">Log in</Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
        <details className="group relative md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg border border-line text-ink"><Menu size={19} /></summary>
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-line bg-white p-3 shadow-soft">
            <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas" href="/#features">Features</Link>
            <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas" href="/#exams">Exam categories</Link>
            <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas" href="/about">About</Link>
            <Link className="mt-1 block rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white" href="/login">Get started</Link>
          </div>
        </details>
      </div>
    </header>
  );
}
