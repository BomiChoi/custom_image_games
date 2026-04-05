import { createServiceClient } from "./server";
import { STORAGE_BUCKET } from "@/constants/storage";

function toPublicUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function getTheme(shortId: string) {
  const supabase = createServiceClient();

  const { data: theme, error } = await supabase
    .from("themes")
    .select("*, theme_images(slot_index, image_path)")
    .eq("short_id", shortId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !theme) return null;

  // play_count 증가 (비동기, 실패해도 무시)
  supabase
    .from("themes")
    .update({ play_count: theme.play_count + 1 })
    .eq("id", theme.id)
    .then(() => {});

  const theme_images = (theme.theme_images ?? []).map(
    (img: { slot_index: number; image_path: string }) => ({
      ...img,
      image_url: toPublicUrl(img.image_path),
    })
  );

  return { ...theme, theme_images };
}
