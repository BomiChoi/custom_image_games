"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSuikaGame } from "./useSuikaGame";
import { GameLayout } from "@/components/layout/GameLayout";
import { ScoreSubmitModal } from "@/components/leaderboard/ScoreSubmitModal";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useGameSession } from "@/lib/hooks/useGameSession";
import { Button } from "@/components/ui/Button";
import { SUIKA_LEVELS } from "@/constants/games";
import type { ThemeImage } from "@/types/game";

interface SuikaGameProps {
  themeId?: string;
  shortId?: string;
  themeImages?: ThemeImage[];
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 500;

function buildImageMap(images?: ThemeImage[]): Record<number, string> {
  const map: Record<number, string> = {};
  images?.forEach((img) => {
    if (img.image_url) map[img.slot_index] = img.image_url;
  });
  return map;
}

export function SuikaGame({ themeId, shortId, themeImages }: SuikaGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageMap = buildImageMap(themeImages);
  const preloadedImages = useRef<Record<number, HTMLImageElement>>({});

  const {
    engineRef, fruitsRef, score, gameOver, nextLevel, initialized,
    initEngine, dropFruit, step, reset, DROP_LINE_Y, WALL_THICKNESS,
  } = useSuikaGame(CANVAS_WIDTH, CANVAS_HEIGHT);

  const { submitScore } = useGameSession("suika", themeId);
  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lbTab, setLbTab] = useState<"theme" | "global">("global");
  const [lastNickname, setLastNickname] = useState<string>();
  const [dropX, setDropX] = useState(CANVAS_WIDTH / 2);
  const stepStarted = useRef(false);
  const maxMergeLevel = useRef(0);
  const totalMerges = useRef(0);

  // 이미지 미리 로드
  useEffect(() => {
    Object.entries(imageMap).forEach(([slot, url]) => {
      const img = new Image();
      img.src = url;
      preloadedImages.current[Number(slot)] = img;
    });
  }, []);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  useEffect(() => {
    if (!initialized || stepStarted.current) return;
    stepStarted.current = true;
    step();
  }, [initialized, step]);

  // Canvas 렌더링
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 배경
      ctx.fillStyle = "#fef9f0";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 드롭 가이드 라인
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, DROP_LINE_Y);
      ctx.lineTo(CANVAS_WIDTH, DROP_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 다음 과일 미리보기
      const nextR = SUIKA_LEVELS[nextLevel].size / 2;
      const previewImg = preloadedImages.current[nextLevel];
      if (previewImg?.complete && previewImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(dropX, DROP_LINE_Y / 2, nextR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(previewImg, dropX - nextR, DROP_LINE_Y / 2 - nextR, nextR * 2, nextR * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(dropX, DROP_LINE_Y / 2, nextR, 0, Math.PI * 2);
        ctx.fillStyle = SUIKA_LEVELS[nextLevel].color + "80";
        ctx.fill();
        ctx.strokeStyle = SUIKA_LEVELS[nextLevel].color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 과일 렌더링
      fruitsRef.current.forEach(({ body, level }) => {
        const { x, y } = body.position;
        const r = SUIKA_LEVELS[level].size / 2;
        const angle = body.angle;
        const img = preloadedImages.current[level];

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();

        if (img?.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -r, -r, r * 2, r * 2);
        } else {
          ctx.fillStyle = SUIKA_LEVELS[level].color;
          ctx.fill();
        }

        ctx.restore();

        // 테두리
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = SUIKA_LEVELS[level].color + "60";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 게임 오버 오버레이
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "white";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("게임 종료", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [initialized, gameOver, nextLevel, dropX, fruitsRef]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameOver) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      dropFruit(x);
    },
    [gameOver, dropFruit]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameOver) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropX(e.clientX - rect.left);
    },
    [gameOver]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (gameOver) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.changedTouches[0].clientX - rect.left;
      dropFruit(x);
    },
    [gameOver, dropFruit]
  );

  async function handleSubmit(nickname: string) {
    setLastNickname(nickname);
    return submitScore(score, nickname, {
      highest_fruit: maxMergeLevel.current,
      total_merges: totalMerges.current,
    });
  }

  async function handleReset() {
    await reset();
    stepStarted.current = false;
    step();
  }

  return (
    <GameLayout
      title="수박게임"
      score={score}
      shortId={shortId}
      onNewGame={handleReset}
    >
      <div className="relative mx-auto" style={{ width: CANVAS_WIDTH }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl cursor-crosshair touch-none shadow-lg"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* 레벨 범례 */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {SUIKA_LEVELS.map((level, i) => {
          const img = preloadedImages.current[i];
          return (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
              <div
                className="rounded-full overflow-hidden flex-shrink-0"
                style={{ width: 18, height: 18, backgroundColor: level.color }}
              >
                {img?.complete && img.naturalWidth > 0 && (
                  <img src={img.src} className="w-full h-full object-cover" alt={level.label} />
                )}
              </div>
              <span>{level.label}</span>
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="mt-4 flex gap-2 justify-center">
          <Button onClick={() => setShowModal(true)}>점수 등록</Button>
          <Button variant="secondary" onClick={handleReset}>다시 하기</Button>
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
            gameType="suika"
            themeId={lbTab === "theme" ? themeId : undefined}
            highlightNickname={lastNickname}
          />
        )}
      </div>

      <ScoreSubmitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        score={score}
        gameType="suika"
        metadata={{ highest_fruit: maxMergeLevel.current, total_merges: totalMerges.current }}
        onSubmit={handleSubmit}
        onViewLeaderboard={() => { setShowModal(false); setShowLeaderboard(true); }}
      />
    </GameLayout>
  );
}
