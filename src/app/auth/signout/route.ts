import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set({ name, value, ...(options as object) }); },
        remove(name: string, options: Record<string, unknown>) { cookieStore.set({ name, value: "", ...(options as object) }); }
      }
    });
    const { error } = await supabase.auth.signOut();
    if (error) return NextResponse.redirect(`${origin}/dashboard?error=signout`, 303);
  }
  return NextResponse.redirect(`${origin}/`, 303);
}
