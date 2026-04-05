import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET, getThemeImagePath, MAX_IMAGE_SIZE_BYTES } from "@/constants/storage";
import { nanoid } from "nanoid";
import { z } from "zod";

const uploadSchema = z.object({
  themeId: z.string().optional(),
  slotIndex: z.coerce.number().int().min(0).max(15),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const themeId = formData.get("themeId") as string | undefined;
    const slotIndexRaw = formData.get("slotIndex");

    const parsed = uploadSchema.safeParse({
      themeId,
      slotIndex: slotIndexRaw ?? 0,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    const { slotIndex } = parsed.data;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 파일 크기 검증
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    // MIME 타입 검증
    const allowedTypes = ["image/webp", "image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // themeId가 없으면 임시 short_id 발급 (나중에 테마 생성 시 확정)
    const shortId = themeId ?? `tmp_${nanoid(8)}`;

    const imagePath = getThemeImagePath(shortId, slotIndex);
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(imagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(imagePath);

    return NextResponse.json({
      shortId,
      slotIndex,
      imagePath,
      imageUrl: urlData.publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
