import Link from "next/link";
import { Activity, BookOpen, Bookmark, ChartNoAxesCombined, CircleHelp, FileText, GraduationCap, LayoutDashboard, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";

const studentLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/learning", label: "My learning", icon: GraduationCap },
  { href: "/practice", label: "Practice & tests", icon: BookOpen },
  { href: "/tests", label: "My tests", icon: FileText },
  { href: "/saved", label: "Saved questions", icon: Bookmark },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function AppSidebar({ admin = false, name }: { admin?: boolean; name?: string }) {
  const links = admin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/documents", label: "PDF documents", icon: FileText },
        { href: "/admin/questions", label: "Question review", icon: CircleHelp },
        { href: "/admin/question-bank", label: "Question bank", icon: BookOpen },
        { href: "/admin/education", label: "Education setup", icon: GraduationCap },
        { href: "/admin/tests", label: "Test manager", icon: BookOpen },
        { href: "/admin/analytics", label: "Analytics", icon: Activity },
        { href: "/admin/settings", label: "Settings", icon: Settings2 }
      ]
    : studentLinks;
  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-line bg-white px-5 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-[250px]">
      <Brand />
      <div className="mt-9">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted">{admin ? "Workspace" : "Study space"}</p>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${href === "/dashboard" || href === "/admin" ? "bg-brand-pale text-brand" : "text-muted hover:bg-canvas hover:text-ink"}`}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
      </div>
      {admin ? (
        <div className="mt-8 rounded-2xl bg-[#f0f5f2] p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand"><ShieldCheck size={17} /></div>
          <p className="text-xs font-semibold text-ink">Admin workspace</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">Role-gated tools; question review decisions are audit logged.</p>
        </div>
      ) : (
        <div className="mt-auto rounded-2xl bg-[#f2f6f3] p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand"><Sparkles size={16} /></div>
          <p className="text-xs font-semibold text-ink">Your next step</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">Small, consistent practice builds lasting progress.</p>
          <Link href="/practice" className="mt-3 inline-block text-[11px] font-semibold text-brand">Explore practice →</Link>
        </div>
      )}
      <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
        <span className="font-medium text-ink">{name || (admin ? "Administrator" : "Learner")}</span>
        <span className="mt-1 block">Learn. Practice. Test. Improve.</span>
        <form action="/auth/signout" method="post" className="mt-3">
          <button className="text-[11px] font-medium text-muted hover:text-brand">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
