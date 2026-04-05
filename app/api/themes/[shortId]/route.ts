import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    const supabase = createServiceClient();

    const { data: theme, error } = await supabase
      .from("themes")
      .select("*, theme_images(slot_index, image_path)")
      .eq("short_id", shortId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    // play_count 증가
    await supabase
      .from("themes")
      .update({ play_count: theme.play_count + 1 })
      .eq("id", theme.id);

    // image_path → public URL 변환
    const { createClient: createSupabase } = require("@supabase/supabase-js");
    const publicClient = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const images = (theme.theme_images ?? []).map(
      (img: { slot_index: number; image_path: string }) => ({
        ...img,
        image_url: publicClient.storage
          .from("game-images")
          .getPublicUrl(img.image_path).data.publicUrl,
      })
    );

    return NextResponse.json({ ...theme, theme_images: images });
  } catch (err) {
    console.error("Theme fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
