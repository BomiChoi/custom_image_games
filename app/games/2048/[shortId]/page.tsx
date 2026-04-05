import { notFound } from "next/navigation";
import { Game2048 } from "@/components/games/Game2048/Game2048";
import { getTheme } from "@/lib/supabase/getTheme";

export default async function Game2048ThemePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const theme = await getTheme(shortId);
  if (!theme) notFound();
  if (theme.game_type !== "2048") notFound();

  return (
    <Game2048
      themeId={theme.id}
      shortId={shortId}
      themeImages={theme.theme_images}
    />
  );
}
