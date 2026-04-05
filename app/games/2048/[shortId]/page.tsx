import { notFound } from "next/navigation";
import { Game2048 } from "@/components/games/Game2048/Game2048";

async function getTheme(shortId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/themes/${shortId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

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
