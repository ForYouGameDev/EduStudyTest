import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, BookOpenCheck, BrainCircuit, Check, ChevronRight, FileText, GraduationCap, Layers3, Play, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

const features = [
  { icon: FileText, title: "From PDFs to practice", text: "Turn study material into a traceable question bank with review before anything is published." },
  { icon: TimerReset, title: "Exam-ready test engine", text: "Build focused practice or timed mocks with autosaved answers and clear results." },
  { icon: BarChart3, title: "Progress you can act on", text: "See strengths and next steps from your own attempts, not generic study advice." },
  { icon: ShieldCheck, title: "Built with trust in mind", text: "Private files, protected answer keys and role-aware access are part of the foundation." }
];
const categories = ["School learning", "JEE & NEET", "University", "Government exams", "Diploma & ITI", "Custom practice"];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white">
      <SiteHeader />
      <section className="relative isolate">
        <div className="hero-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-pale/70 px-3 py-1.5 text-xs font-semibold text-brand"><Sparkles size={14} /> A calmer way to prepare</div>
            <h1 className="mt-7 text-[clamp(2.7rem,6.1vw,5.25rem)] font-semibold leading-[1.02] tracking-[-.055em] text-ink">Make every bit of practice <span className="text-brand">count.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">One focused place to learn, practice and understand your progress—from your first school test to your next big exam.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">Start learning <ArrowRight size={17} /></Link>
              <Link href="/#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-brand/30">See how it works <Play size={15} fill="currentColor" /></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-brand" />Practice at your pace</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-brand" />Clear, useful results</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-brand" />Your progress, your data</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[530px]">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#e6f3ee] blur-2xl" />
            <div className="relative rounded-[26px] border border-line bg-white p-3 shadow-[0_35px_90px_rgba(27,51,43,.13)] sm:p-5">
              <div className="flex items-center justify-between border-b border-line px-2 pb-4">
                <div><p className="text-[11px] font-medium text-muted">YOUR STUDY SPACE</p><p className="mt-1 text-sm font-semibold text-ink">A little progress, every day</p></div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-pale text-brand"><GraduationCap size={18} /></span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-4">
                <div className="rounded-2xl bg-canvas p-4"><div className="flex items-center gap-2 text-xs text-muted"><BookOpenCheck size={15} className="text-brand" /> Practice</div><p className="mt-3 text-xl font-semibold text-ink">Your pace</p><p className="mt-1 text-[11px] text-muted">Pick up where you left off</p></div>
                <div className="rounded-2xl bg-[#f4f6fb] p-4"><div className="flex items-center gap-2 text-xs text-muted"><BrainCircuit size={15} className="text-[#6379bd]" /> Insights</div><p className="mt-3 text-xl font-semibold text-ink">Your trends</p><p className="mt-1 text-[11px] text-muted">Based on your attempts</p></div>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-ink">Build a practice set</p><p className="mt-1 text-[11px] text-muted">Choose your subject and focus</p></div><Link href="/practice" aria-label="Explore practice" className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><ArrowUpRight size={15} /></Link></div>
                <div className="mt-4 flex gap-2"><span className="rounded-lg bg-brand-pale px-3 py-2 text-[11px] font-medium text-brand">Subject</span><span className="rounded-lg border border-line px-3 py-2 text-[11px] text-muted">Topic</span><span className="rounded-lg border border-line px-3 py-2 text-[11px] text-muted">Difficulty</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full w-[62%] rounded-full bg-brand" /></div>
                <div className="mt-2 flex justify-between text-[10px] text-muted"><span>Designed around your goals</span><span>Flexible</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2 px-1 text-[10px] text-muted"><ShieldCheck size={13} className="text-brand" /> Your question review and results stay private.</div>
            </div>
            <div className="absolute -bottom-5 -left-7 hidden items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-soft sm:flex"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff4df] text-gold"><Sparkles size={18} /></span><span><span className="block text-xs font-semibold text-ink">Keep your momentum</span><span className="mt-0.5 block text-[10px] text-muted">A short session is a good start</span></span></div>
          </div>
        </div>
      </section>
      <section id="features" className="bg-canvas py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">A better study rhythm</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Everything you need to move forward.</h2><p className="mt-4 text-sm leading-7 text-muted">Less time finding what to do next. More time learning what matters.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pale text-brand"><Icon size={19} /></span><h3 className="mt-5 text-sm font-semibold text-ink">{title}</h3><p className="mt-2 text-xs leading-6 text-muted">{text}</p></article>)}
          </div>
        </div>
      </section>
      <section id="exams" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">One learning home</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your goals set the direction.</h2><p className="mt-4 max-w-md text-sm leading-7 text-muted">Find your path across school, higher education and competitive exams. Your learning space is ready to grow with your syllabus.</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand" href="/login">Choose your learning path <ArrowRight size={16} /></Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((category, index) => <Link key={category} href="/login" className={`group rounded-2xl border border-line p-4 transition hover:border-brand/30 hover:bg-brand-pale/40 ${index === 0 ? "bg-[#f0f6f2]" : "bg-white"}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand shadow-sm"><Layers3 size={17} /></span><p className="mt-5 text-xs font-semibold text-ink">{category}</p><p className="mt-2 flex items-center gap-1 text-[10px] text-muted group-hover:text-brand">Explore <ChevronRight size={12} /></p></Link>)}</div>
        </div>
      </section>
      <section id="how-it-works" className="bg-[#1d5147] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200">Simple by design</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A clear loop that keeps you learning.</h2></div>
          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {[["01", "Choose your focus", "Select your class, course or exam and find a subject to work on."], ["02", "Practice with purpose", "Create a practice set or take a timed mock test that fits your day."], ["03", "Learn from the result", "Review every answer and use your real progress to plan what comes next."]].map(([number, title, text]) => <div key={number} className="border-t border-white/20 pt-5"><span className="text-xs font-semibold text-emerald-200">{number}</span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 max-w-xs text-xs leading-6 text-white/65">{text}</p></div>)}
          </div>
          <Link href="/login" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-emerald-50">Start your learning journey <ArrowRight size={16} /></Link>
        </div>
      </section>
      <footer className="bg-[#163f37] py-8 text-white/65">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand light /><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><Link href="/about" className="hover:text-white">About</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/contact" className="hover:text-white">Contact</Link></div><p className="text-[11px]">Learn. Practice. Test. Improve.</p></div>
      </footer>
    </main>
  );
}
