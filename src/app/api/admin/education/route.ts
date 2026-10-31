import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminApiContext } from "@/lib/auth";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("level"), name: z.string().trim().min(1).max(100) }),
  z.object({ type: z.literal("board"), name: z.string().trim().min(1).max(100) }),
  z.object({
    type: z.literal("subject"),
    name: z.string().trim().min(1).max(100),
    educationLevelId: z.string().uuid().nullable(),
    boardId: z.string().uuid().nullable()
  })
]);

export async function POST(request: Request) {
  const { supabase, status } = await getAdminApiContext(["super_admin", "content_manager"]);
  if (!supabase) return NextResponse.json({ error: "Education management access is required." }, { status });
  const rate = await checkApiRateLimit(supabase, "education_change");
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Rate limiting is unavailable. Try again later." : "Education change limit reached. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Enter a valid education item." }, { status: 400 });
  const item = input.data;
  const result = item.type === "level"
    ? await supabase.from("education_levels").insert({ name: item.name, sort_order: 0 }).select("id,name,active").single()
    : item.type === "board"
      ? await supabase.from("education_boards").insert({ name: item.name }).select("id,name,active").single()
      : await supabase.from("subjects").insert({
        name: item.name,
        education_level_id: item.educationLevelId,
        board_id: item.boardId
      }).select("id,name,active").single();
  const { data, error } = result;
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That item already exists." : "Could not save this education item." }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
