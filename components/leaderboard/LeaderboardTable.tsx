"use client";

import { useState } from "react";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import type { GameType, LeaderboardFilter } from "@/types/game";

interface LeaderboardTableProps {
  gameType: GameType;
  themeId?: string;
  highlightNickname?: string;
}

export function LeaderboardTable({ gameType, themeId, highlightNickname }: LeaderboardTableProps) {
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const { scores, loading } = useLeaderboard(gameType, themeId, filter);

  const filters: { key: LeaderboardFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "weekly", label: "이번 주" },
    { key: "monthly", label: "이번 달" },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : scores.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">아직 기록이 없습니다</p>
      ) : (
        <div className="space-y-1.5">
          {scores.map((entry) => {
            const isMe = highlightNickname && entry.nickname === highlightNickname;
            const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                  isMe ? "bg-indigo-50 border border-indigo-200" : "bg-white"
                }`}
              >
                <span
                  className={`w-7 text-center font-black text-sm ${
                    entry.rank <= 3 ? rankColors[entry.rank - 1] : "text-gray-400"
                  }`}
                >
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {entry.nickname}
                  {isMe && <span className="ml-1 text-xs text-indigo-400">(나)</span>}
                </span>
                {entry.themes?.title && (
                  <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[80px]">
                    {entry.themes.title}
                  </span>
                )}
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
