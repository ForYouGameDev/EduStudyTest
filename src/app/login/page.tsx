import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { GoogleSignIn } from "@/components/google-sign-in";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#1d5147] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 top-28 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -right-5 top-44 h-52 w-52 rounded-full border border-white/10" />
        <Brand light />
        <div className="relative max-w-lg"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Your next chapter starts here</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">A little focus can take you a long way.</h1><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">Practice with intention. See how far you have come. Make your next step count.</p></div>
        <p className="text-xs text-white/45">EduTest AI · Learn. Practice. Test. Improve.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[390px]">
          <Link href="/" className="mb-12 inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-brand"><ArrowLeft size={14} /> Back to home</Link>
          <div className="mb-8 lg:hidden"><Brand /></div>
          {data.user ? (
            <><h2 className="text-2xl font-semibold tracking-tight text-ink">You’re signed in</h2><p className="mt-2 text-sm leading-6 text-muted">Continue to your learning dashboard.</p><Link href="/dashboard" className="mt-7 block rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white">Go to dashboard</Link></>
          ) : (
            <><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Welcome to EduTest AI</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Sign in to keep learning.</h2><p className="mt-3 text-sm leading-6 text-muted">Use your Google account to securely access your personal learning space.</p><div className="mt-8"><GoogleSignIn /></div><div className="mt-6 flex items-start gap-2 rounded-xl bg-canvas p-3.5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" /><p className="text-[11px] leading-5 text-muted">We only support Google sign-in. Your account is protected by Supabase authentication.</p></div></>
          )}
          {!supabase && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Sign-in setup is required: configure the Supabase URL and public anon key to enable authentication.</p>}
          <p className="mt-8 text-center text-[11px] leading-5 text-muted">By continuing, you agree to our <Link className="underline underline-offset-2" href="/terms">Terms</Link> and <Link className="underline underline-offset-2" href="/privacy">Privacy Policy</Link>.</p>
        </div>
      </section>
    </main>
  );
}
