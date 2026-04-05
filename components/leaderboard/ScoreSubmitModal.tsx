"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { GameType } from "@/types/game";

interface ScoreSubmitModalProps {
  open: boolean;
  onClose: () => void;
  score: number;
  gameType: GameType;
  metadata?: { max_tile?: number; time_seconds?: number; [key: string]: unknown };
  onSubmit: (nickname: string) => Promise<{ globalRank: number; themeRank?: number }>;
  onViewLeaderboard?: () => void;
}

export function ScoreSubmitModal({
  open,
  onClose,
  score,
  metadata,
  onSubmit,
  onViewLeaderboard,
}: ScoreSubmitModalProps) {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ globalRank: number; themeRank?: number } | null>(null);
  const toast = useToast();

  async function handleSubmit() {
    if (!nickname.trim()) {
      toast("닉네임을 입력해주세요", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await onSubmit(nickname.trim());
      setResult(res);
      toast("점수가 등록되었습니다!", "success");
    } catch {
      toast("점수 등록에 실패했습니다", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="게임 종료!" className="max-w-sm">
      <div className="text-center mb-6">
        <p className="text-4xl font-black text-indigo-600">{score.toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-1">최종 점수</p>
        {metadata?.max_tile && (
          <p className="text-sm text-gray-500 mt-1">최고 타일: {String(metadata.max_tile)}</p>
        )}
        {metadata?.time_seconds && (
          <p className="text-sm text-gray-500 mt-1">
            시간: {formatTime(Number(metadata.time_seconds))}
          </p>
        )}
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">전체 순위</p>
            <p className="text-3xl font-black text-indigo-600">{result.globalRank}위</p>
          </div>
          {result.themeRank && (
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">이 테마 순위</p>
              <p className="text-3xl font-black text-emerald-600">{result.themeRank}위</p>
            </div>
          )}
          <Button className="w-full" onClick={onViewLeaderboard ?? onClose}>
            리더보드 보기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="닉네임 입력 (최대 20자)"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "등록 중..." : "점수 등록"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            그냥 닫기
          </Button>
        </div>
      )}
    </Modal>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
