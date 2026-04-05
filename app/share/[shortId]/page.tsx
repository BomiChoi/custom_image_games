import { notFound } from "next/navigation";
import Link from "next/link";
import { GAME_META } from "@/constants/games";
import { getTheme } from "@/lib/supabase/getTheme";
import type { GameType } from "@/types/game";

export async function generateMetadata({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await params;
  const theme = await getTheme(shortId);
  if (!theme) return { title: "테마를 찾을 수 없음" };
  return {
    title: theme.title ?? "커스텀 이미지 게임",
    description: `${GAME_META[theme.game_type as GameType]?.label} 커스텀 테마 · ${theme.creator_nickname ?? "익명"}`,
    openGraph: {
      images: theme.theme_images?.[0]?.image_url
        ? [{ url: theme.theme_images[0].image_url }]
        : [],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await params;
  const theme = await getTheme(shortId);
  if (!theme) notFound();

  const gameMeta = GAME_META[theme.game_type as GameType];
  const thumbnailUrl = theme.theme_images?.[0]?.image_url as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
        {/* 썸네일 */}
        {thumbnailUrl ? (
          <div className="w-full aspect-square bg-gray-100">
            <img src={thumbnailUrl} alt="테마 이미지" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`w-full aspect-square bg-gradient-to-br ${gameMeta?.color ?? "from-gray-300 to-gray-400"} flex items-center justify-center`}>
            <span className="text-6xl font-black text-white/80">{gameMeta?.label}</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${gameMeta?.color} text-white`}>
              {gameMeta?.label}
            </span>
            {theme.visibility === "public" && (
              <span className="text-xs text-gray-400">공개 테마</span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mt-2">
            {theme.title ?? "커스텀 테마"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {theme.creator_nickname ? `by ${theme.creator_nickname}` : "익명"}
            {" · "}
            {theme.play_count}회 플레이
          </p>

          {/* 이미지 슬롯 미리보기 */}
          {theme.theme_images?.length > 0 && (
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {theme.theme_images.slice(0, 8).map((img: { slot_index: number; image_url: string }) => (
                <img
                  key={img.slot_index}
                  src={img.image_url}
                  alt={`슬롯 ${img.slot_index}`}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                />
              ))}
              {theme.theme_images.length > 8 && (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                  +{theme.theme_images.length - 8}
                </div>
              )}
            </div>
          )}

          <Link
            href={`/games/${theme.game_type === "slide_puzzle" ? "slide-puzzle" : theme.game_type}/${shortId}`}
            className={`mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${gameMeta?.color} text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base`}
          >
            지금 플레이하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>

          <Link href="/" className="mt-3 w-full flex items-center justify-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
            내 테마 만들기
          </Link>
        </div>
      </div>
    </div>
  );
}
