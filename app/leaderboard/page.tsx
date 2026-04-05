"use client";

import { useState } from "react";
import Link from "next/link";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { GAME_META, GAME_TYPES } from "@/constants/games";
import type { GameType } from "@/types/game";

export default function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState<GameType>("2048");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-black text-gray-900">리더보드</h1>
        </div>

        {/* 게임 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {GAME_TYPES.map((type) => {
            const meta = GAME_META[type];
            return (
              <button
                key={type}
                onClick={() => setActiveGame(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeGame === type
                    ? `bg-gradient-to-r ${meta.color} text-white shadow-md`
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <LeaderboardTable gameType={activeGame} />
        </div>
      </div>
    </div>
  );
}
