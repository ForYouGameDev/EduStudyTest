import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <BookOpenCheck size={19} strokeWidth={2.2} />
      </span>
      <span className="text-[17px]">EduTest<span className={light ? "text-emerald-200" : "text-brand"}> AI</span></span>
    </Link>
  );
}
