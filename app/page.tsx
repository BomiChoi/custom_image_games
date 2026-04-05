"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreateThemeModal } from "@/components/share/CreateThemeModal";
import { Button } from "@/components/ui/Button";
import { GAME_META, GAME_TYPES } from "@/constants/games";
import type { GameType } from "@/types/game";

interface PublicTheme {
  id: string;
  short_id: string;
  game_type: GameType;
  title: string | null;
  creator_nickname: string | null;
  play_count: number;
  theme_images: { slot_index: number; image_path: string; image_url?: string }[];
}

function GameCard({ type, onCreateTheme }: { type: GameType; onCreateTheme: (t: GameType) => void }) {
  const meta = GAME_META[type];
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
      <div className={`h-16 bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
        <span className="text-lg font-black text-white/90 text-center px-2 leading-tight">{meta.label}</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-500 mb-3 flex-1">{meta.description}</p>
        <div className="flex gap-2">
          <Link
            href={meta.path}
            className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold bg-gradient-to-r ${meta.color} text-white hover:opacity-90 transition-opacity`}
          >
            바로 플레이
          </Link>
          <button
            onClick={() => onCreateTheme(type)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            내 이미지로
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: PublicTheme }) {
  const meta = GAME_META[theme.game_type];
  const thumbUrl = theme.theme_images?.[0]?.image_url;
  const gamePath = theme.game_type === "slide_puzzle" ? "slide-puzzle" : theme.game_type;

  return (
    <Link
      href={`/games/${gamePath}/${theme.short_id}`}
      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className={`h-24 bg-gradient-to-br ${meta.color} relative overflow-hidden`}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={theme.title ?? ""} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl font-black text-white/70">{meta.label}</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white`}>
            {meta.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 truncate">{theme.title ?? "커스텀 테마"}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {theme.creator_nickname ?? "익명"} · {theme.play_count}회
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [createModal, setCreateModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>("2048");
  const [publicThemes, setPublicThemes] = useState<PublicTheme[]>([]);
  const [themeFilter, setThemeFilter] = useState<GameType | "all">("all");

  useEffect(() => {
    const params = new URLSearchParams({ sort: "popular" });
    if (themeFilter !== "all") params.set("gameType", themeFilter);
    fetch(`/api/themes?${params}`)
      .then((r) => r.json())
      .then((data) => setPublicThemes(data.themes ?? []));
  }, [themeFilter]);

  function openCreate(type: GameType) {
    setSelectedGame(type);
    setCreateModal(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">커스텀 이미지 게임</h1>
            <p className="text-sm text-gray-400 mt-0.5">내 사진으로 게임을 즐겨보세요</p>
          </div>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              순위
            </Button>
          </Link>
        </div>

        {/* 게임 선택 */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 mb-3">게임 선택</h2>
          <div className="grid grid-cols-3 gap-3">
            {GAME_TYPES.map((type) => (
              <GameCard key={type} type={type} onCreateTheme={openCreate} />
            ))}
          </div>
        </section>

        {/* 공개 테마 탐색 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-500">공개 테마 탐색</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(["all", ...GAME_TYPES] as (GameType | "all")[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setThemeFilter(type)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    themeFilter === type
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {type === "all" ? "전체" : GAME_META[type].label}
                </button>
              ))}
            </div>
          </div>

          {publicThemes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-400 text-sm">아직 공개 테마가 없어요</p>
              <p className="text-gray-300 text-xs mt-1">첫 번째 공개 테마를 만들어보세요!</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => openCreate("2048")}
              >
                테마 만들기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {publicThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          )}
        </section>
      </div>

      <CreateThemeModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        defaultGameType={selectedGame}
      />
    </div>
  );
}
