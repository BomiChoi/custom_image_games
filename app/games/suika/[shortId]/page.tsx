import { notFound } from "next/navigation";
import { SuikaGame } from "@/components/games/SuikaGame/SuikaGame";

async function getTheme(shortId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/themes/${shortId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

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
