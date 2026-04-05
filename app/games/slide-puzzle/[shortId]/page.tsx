import { notFound } from "next/navigation";
import { SlidePuzzle } from "@/components/games/SlidePuzzle/SlidePuzzle";

async function getTheme(shortId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/themes/${shortId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

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
      gridSize={theme.puzzle_size ?? 3}
    />
  );
}
