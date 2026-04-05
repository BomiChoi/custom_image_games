"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ShareButton } from "@/components/share/ShareButton";
import { Button } from "@/components/ui/Button";

interface GameLayoutProps {
  title: string;
  score: number;
  bestScore?: number;
  shortId?: string;
  children: ReactNode;
  onNewGame: () => void;
  extra?: ReactNode;
}

export function GameLayout({
  title,
  score,
  bestScore,
  shortId,
  children,
  onNewGame,
  extra,
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          <div className="flex gap-2">
            {shortId && <ShareButton shortId={shortId} />}
            <Button variant="ghost" size="sm" onClick={onNewGame}>새 게임</Button>
          </div>
        </div>

        {/* 점수 */}
        <div className="flex gap-3 mb-4">
          <ScoreCard label="점수" value={score} />
          {bestScore !== undefined && <ScoreCard label="최고" value={bestScore} highlight />}
        </div>

        {extra}

        {children}
      </div>
    </div>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl px-4 py-2.5 text-center ${highlight ? "bg-indigo-600 text-white" : "bg-white shadow-sm"}`}>
      <p className={`text-xs font-medium ${highlight ? "text-indigo-200" : "text-gray-400"}`}>{label}</p>
      <p className={`text-xl font-black ${highlight ? "text-white" : "text-gray-800"}`}>{value.toLocaleString()}</p>
    </div>
  );
}
