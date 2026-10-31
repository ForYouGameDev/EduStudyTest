import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next") || "/dashboard";
  const safePath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !code) return NextResponse.redirect(`${origin}/login?error=auth_callback`);

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set({ name, value, ...(options as object) }); },
      remove(name: string, options: Record<string, unknown>) { cookieStore.set({ name, value: "", ...(options as object) }); }
    }
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  return NextResponse.redirect(`${origin}${safePath}`);
}
