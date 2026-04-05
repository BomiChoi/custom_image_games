import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";

const startSchema = z.object({
  gameType: z.enum(["2048", "suika", "slide_puzzle"]),
  themeId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { gameType, themeId } = parsed.data;
    const token = nanoid(32);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        token,
        game_type: gameType,
        theme_id: themeId ?? null,
      })
      .select("id, token")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ sessionToken: data.token });
  } catch (err) {
    console.error("Session create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
