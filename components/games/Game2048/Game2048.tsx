"use client";

import { useRef, TouchEvent, useState } from "react";
import { useGame2048 } from "./useGame2048";
import { Tile } from "./Tile";
import { GameLayout } from "@/components/layout/GameLayout";
import { ScoreSubmitModal } from "@/components/leaderboard/ScoreSubmitModal";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useGameSession } from "@/lib/hooks/useGameSession";
import { Button } from "@/components/ui/Button";
import type { ThemeImage } from "@/types/game";

interface Game2048Props {
  themeId?: string;
  shortId?: string;
  themeImages?: ThemeImage[];
}

const BOARD_SIZE = 360;
const TILE_GAP = 8;
const TILE_SIZE = Math.floor((BOARD_SIZE - TILE_GAP * 5) / 4);

// slot_index → image_url 매핑
function buildImageMap(images?: ThemeImage[]): Record<number, string> {
  const map: Record<number, string> = {};
  images?.forEach((img) => {
    if (img.image_url) map[img.slot_index] = img.image_url;
  });
  return map;
}

// tile value → slot_index (0~15)
function tileToSlot(value: number): number {
  return Math.log2(value) - 1;
}

export function Game2048({ themeId, shortId, themeImages }: Game2048Props) {
  const { board, score, bestScore, gameOver, won, maxTile, moves, move, reset } =
    useGame2048();
  const { submitScore } = useGameSession("2048", themeId);
  const imageMap = buildImageMap(themeImages);

  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lbTab, setLbTab] = useState<"theme" | "global">("global");
  const [lastNickname, setLastNickname] = useState<string>();

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
  }

  async function handleSubmit(nickname: string) {
    setLastNickname(nickname);
    return submitScore(score, nickname, { max_tile: maxTile, moves });
  }

  return (
    <GameLayout
      title="2048"
      score={score}
      bestScore={bestScore}
      shortId={shortId}
      onNewGame={reset}
    >
      {/* 게임 보드 */}
      <div
        className="relative mx-auto bg-amber-100 rounded-2xl p-2 select-none touch-none"
        style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 빈 셀 배경 */}
        <div
          className="absolute inset-2 grid"
          style={{
            gridTemplateColumns: `repeat(4, ${TILE_SIZE}px)`,
            gap: TILE_GAP,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-amber-200/60" style={{ width: TILE_SIZE, height: TILE_SIZE }} />
          ))}
        </div>

        {/* 타일 */}
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `repeat(4, ${TILE_SIZE}px)`,
            gap: TILE_GAP,
          }}
        >
          {board.flat().map((value, i) => (
            <div key={i} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
              {value !== null && (
                <Tile
                  value={value}
                  imageUrl={imageMap[tileToSlot(value)]}
                  size={TILE_SIZE}
                />
              )}
            </div>
          ))}
        </div>

        {/* 게임 오버 / 승리 오버레이 */}
        {(gameOver || won) && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-4">
            <p className="text-2xl font-black text-white">
              {won ? "🎉 2048 달성!" : "게임 종료"}
            </p>
            <div className="flex gap-2">
              <Button onClick={reset} variant="primary">다시 하기</Button>
              <Button onClick={() => setShowModal(true)} variant="secondary">점수 등록</Button>
            </div>
          </div>
        )}
      </div>

      {/* 리더보드 탭 */}
      <div className="mt-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
          {themeId && (
            <button
              onClick={() => { setShowLeaderboard(true); setLbTab("theme"); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showLeaderboard && lbTab === "theme"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              이 테마 순위
            </button>
          )}
          <button
            onClick={() => { setShowLeaderboard(true); setLbTab("global"); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showLeaderboard && lbTab === "global"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            전체 순위
          </button>
        </div>

        {showLeaderboard && (
          <LeaderboardTable
            gameType="2048"
            themeId={lbTab === "theme" ? themeId : undefined}
            highlightNickname={lastNickname}
          />
        )}
      </div>

      <ScoreSubmitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        score={score}
        gameType="2048"
        metadata={{ max_tile: maxTile, moves }}
        onSubmit={handleSubmit}
        onViewLeaderboard={() => { setShowModal(false); setShowLeaderboard(true); }}
      />
    </GameLayout>
  );
}
