import { STORAGE_BUCKET } from "@/constants/storage";
import { createClient } from "./client";

export function getPublicUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImage(
  path: string,
  file: Blob,
  contentType = "image/webp"
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return getPublicUrl(path);
}

export async function deleteThemeImages(shortId: string): Promise<void> {
  const supabase = createClient();
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`themes/${shortId}`);

  if (!files?.length) return;

  const paths = files.map((f) => `themes/${shortId}/${f.name}`);
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}
