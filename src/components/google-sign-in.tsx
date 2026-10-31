"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
      });
      if (authError) throw authError;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google sign-in could not be started.");
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <div>
      <button onClick={signIn} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-canvas disabled:opacity-60">
        {busy ? <LoaderCircle className="animate-spin" size={18} /> : <Chrome size={18} />}
        Continue with Google
      </button>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
