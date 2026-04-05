import { notFound } from "next/navigation";
import { SlidePuzzle } from "@/components/games/SlidePuzzle/SlidePuzzle";
import { getTheme } from "@/lib/supabase/getTheme";

export default async function SlidePuzzleThemePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const theme = await getTheme(shortId);
  if (!theme) notFound();
  if (theme.game_type !== "slide_puzzle") notFound();

  return (
    <SlidePuzzle
      themeId={theme.id}
      shortId={shortId}
      themeImages={theme.theme_images}
      gridSize={theme.puzzle_size ?? 4}
    />
  );
}
