import { notFound } from "next/navigation";
import { SuikaGame } from "@/components/games/SuikaGame/SuikaGame";
import { getTheme } from "@/lib/supabase/getTheme";

export default async function SuikaThemePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const theme = await getTheme(shortId);
  if (!theme) notFound();
  if (theme.game_type !== "suika") notFound();

  return (
    <SuikaGame
      themeId={theme.id}
      shortId={shortId}
      themeImages={theme.theme_images}
    />
  );
}
