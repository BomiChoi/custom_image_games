import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET, getThemeImagePath } from "@/constants/storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { GameType, Visibility } from "@/types/game";

const createThemeSchema = z.object({
  gameType: z.enum(["2048", "suika", "slide_puzzle"]),
  title: z.string().max(50).optional(),
  visibility: z.enum(["public", "link_only"]).default("link_only"),
  creatorNickname: z.string().max(20).optional(),
  puzzleSize: z.number().int().min(3).max(4).optional(),
  // 슬롯별 임시 업로드 shortId (이미지가 tmp_ 경로에 있는 경우)
  tmpShortId: z.string().optional(),
  // 슬롯 인덱스 목록 (어떤 슬롯이 업로드됐는지)
  uploadedSlots: z.array(z.number().int().min(0).max(15)).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createThemeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { gameType, title, visibility, creatorNickname, puzzleSize, tmpShortId, uploadedSlots } =
      parsed.data;

    const supabase = createServiceClient();
    const shortId = nanoid(8);

    // 테마 레코드 생성
    const { data: theme, error: themeError } = await supabase
      .from("themes")
      .insert({
        short_id: shortId,
        game_type: gameType,
        title: title ?? null,
        visibility,
        creator_nickname: creatorNickname ?? null,
        puzzle_size: gameType === "slide_puzzle" ? (puzzleSize ?? 3) : null,
      })
      .select()
      .single();

    if (themeError || !theme) {
      return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }

    // 임시 경로에서 확정 경로로 이미지 이동
    if (tmpShortId && uploadedSlots.length > 0) {
      const imageRecords: { theme_id: string; slot_index: number; image_path: string }[] = [];

      for (const slot of uploadedSlots) {
        const tmpPath = getThemeImagePath(tmpShortId, slot);
        const finalPath = getThemeImagePath(shortId, slot);

        const { error: copyError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .copy(tmpPath, finalPath);

        if (!copyError) {
          imageRecords.push({
            theme_id: theme.id,
            slot_index: slot,
            image_path: finalPath,
          });
        }
      }

      if (imageRecords.length > 0) {
        await supabase.from("theme_images").insert(imageRecords);
      }

      // 임시 파일 삭제
      const tmpPaths = uploadedSlots.map((slot) => getThemeImagePath(tmpShortId, slot));
      await supabase.storage.from(STORAGE_BUCKET).remove(tmpPaths);
    }

    return NextResponse.json({ shortId, themeId: theme.id });
  } catch (err) {
    console.error("Theme create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get("gameType") as GameType | null;
    const sort = searchParams.get("sort") ?? "recent"; // 'recent' | 'popular'
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 12;
    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    let query = supabase
      .from("themes")
      .select("*, theme_images(slot_index, image_path)", { count: "exact" })
      .eq("visibility", "public")
      .gt("expires_at", new Date().toISOString());

    if (gameType) query = query.eq("game_type", gameType);
    if (sort === "popular") query = query.order("play_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ themes: data, total: count, page, limit });
  } catch (err) {
    console.error("Themes list error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
