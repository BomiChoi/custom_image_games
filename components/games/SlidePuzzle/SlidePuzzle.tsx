"use client";

import { useState } from "react";
import { useSlidePuzzle } from "./useSlidePuzzle";
import { GameLayout } from "@/components/layout/GameLayout";
import { ScoreSubmitModal } from "@/components/leaderboard/ScoreSubmitModal";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useGameSession } from "@/lib/hooks/useGameSession";
import { Button } from "@/components/ui/Button";
import type { ThemeImage } from "@/types/game";

interface SlidePuzzleProps {
  themeId?: string;
  shortId?: string;
  themeImages?: ThemeImage[];
  gridSize?: number;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function SlidePuzzle({
  themeId,
  shortId,
  themeImages,
  gridSize = 3,
}: SlidePuzzleProps) {
  const { tiles, moves, seconds, solved, score, moveTile, reset } =
    useSlidePuzzle(gridSize);
  const { submitScore } = useGameSession("slide_puzzle", themeId);

  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lbTab, setLbTab] = useState<"theme" | "global">("global");
  const [lastNickname, setLastNickname] = useState<string>();

  const imageUrl = themeImages?.find((img) => img.slot_index === 0)?.image_url;
  const BOARD = Math.min(360, typeof window !== "undefined" ? window.innerWidth - 32 : 360);
  const PIECE = Math.floor(BOARD / gridSize);
  const total = gridSize * gridSize;

  async function handleSubmit(nickname: string) {
    setLastNickname(nickname);
    return submitScore(score, nickname, {
      moves,
      time_seconds: seconds,
      grid_size: gridSize,
    });
  }

  return (
    <GameLayout
      title="슬라이드 퍼즐"
      score={solved ? score : moves}
      shortId={shortId}
      onNewGame={reset}
      extra={
        <div className="flex gap-3 text-sm text-gray-500 mb-3">
          <span>이동: {moves}</span>
          <span>시간: {formatTime(seconds)}</span>
          {solved && <span className="text-emerald-600 font-bold">완성!</span>}
        </div>
      }
    >
      <div className="mx-auto rounded-2xl overflow-hidden shadow-lg bg-gray-200" style={{ width: BOARD, height: BOARD }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${PIECE}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${PIECE}px)`,
          }}
        >
          {tiles.map((value, index) => {
            if (value === 0) {
              return <div key={index} className="bg-gray-300" style={{ width: PIECE, height: PIECE }} />;
            }

            // 이 조각이 원래 있어야 할 위치 (value는 1-based)
            const origIdx = value - 1;
            const origCol = origIdx % gridSize;
            const origRow = Math.floor(origIdx / gridSize);

            const style: React.CSSProperties = imageUrl
              ? {
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${BOARD}px ${BOARD}px`,
                  backgroundPosition: `-${origCol * PIECE}px -${origRow * PIECE}px`,
                  backgroundRepeat: "no-repeat",
                  cursor: "pointer",
                  width: PIECE,
                  height: PIECE,
                }
              : {
                  background: `hsl(${(value / total) * 240}, 70%, 65%)`,
                  cursor: "pointer",
                  width: PIECE,
                  height: PIECE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: PIECE > 80 ? "1.2rem" : "0.9rem",
                  fontWeight: "bold",
                  color: "white",
                };

            return (
              <div
                key={index}
                style={style}
                onClick={() => moveTile(index)}
                className="border border-gray-300 hover:brightness-110 transition-all active:scale-95"
              >
                {!imageUrl && value}
              </div>
            );
          })}
        </div>
      </div>

      {/* 완성 오버레이 */}
      {solved && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-lg font-black text-emerald-600">퍼즐 완성!</p>
          <p className="text-sm text-gray-500 mt-1">{moves}번 이동 · {formatTime(seconds)}</p>
          <div className="flex gap-2 mt-3">
            <Button className="flex-1" onClick={() => setShowModal(true)}>점수 등록</Button>
            <Button variant="secondary" className="flex-1" onClick={reset}>다시 하기</Button>
          </div>
        </div>
      )}

      {/* 리더보드 */}
      <div className="mt-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
          {themeId && (
            <button
              onClick={() => { setShowLeaderboard(true); setLbTab("theme"); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showLeaderboard && lbTab === "theme" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              이 테마 순위
            </button>
          )}
          <button
            onClick={() => { setShowLeaderboard(true); setLbTab("global"); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showLeaderboard && lbTab === "global" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
            }`}
          >
            전체 순위
          </button>
        </div>
        {showLeaderboard && (
          <LeaderboardTable
            gameType="slide_puzzle"
            themeId={lbTab === "theme" ? themeId : undefined}
            highlightNickname={lastNickname}
          />
        )}
      </div>

      <ScoreSubmitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        score={score}
        gameType="slide_puzzle"
        metadata={{ moves, time_seconds: seconds, grid_size: gridSize }}
        onSubmit={handleSubmit}
        onViewLeaderboard={() => { setShowModal(false); setShowLeaderboard(true); }}
      />
    </GameLayout>
  );
}
