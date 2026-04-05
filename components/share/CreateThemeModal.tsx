"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MultiSlotUploader } from "@/components/image/MultiSlotUploader";
import { SingleImageUploader } from "@/components/image/SingleImageUploader";
import { useToast } from "@/components/ui/Toast";
import { GAME_META, TILE_2048_LABELS, SUIKA_LEVELS } from "@/constants/games";
import type { GameType, Visibility } from "@/types/game";

interface CreateThemeModalProps {
  open: boolean;
  onClose: () => void;
  defaultGameType?: GameType;
}

export function CreateThemeModal({ open, onClose, defaultGameType = "2048" }: CreateThemeModalProps) {
  const router = useRouter();
  const toast = useToast();

  const [gameType, setGameType] = useState<GameType>(defaultGameType);
  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("link_only");
  const [puzzleSize, setPuzzleSize] = useState<3 | 4>(3);
  const [loading, setLoading] = useState(false);

  // 다중 슬롯 상태
  const [slotUrls, setSlotUrls] = useState<Record<number, string>>({});
  const [tmpShortId, setTmpShortId] = useState<string>("");
  const [uploadedSlots, setUploadedSlots] = useState<number[]>([]);

  // 단일 이미지 상태 (슬라이드 퍼즐)
  const [singleTmpShortId, setSingleTmpShortId] = useState<string>("");
  const [singleImageUploaded, setSingleImageUploaded] = useState(false);

  const handleSlotsChange = useCallback(
    (slots: Record<number, string>, tmpId: string, uploaded: number[]) => {
      setSlotUrls(slots);
      setTmpShortId(tmpId);
      setUploadedSlots(uploaded);
    },
    []
  );

  const handleSingleUploaded = useCallback((_url: string, tmpId: string) => {
    setSingleTmpShortId(tmpId);
    setSingleImageUploaded(true);
  }, []);

  async function handleCreate() {
    const isMulti = gameType !== "slide_puzzle";
    const hasImage = isMulti ? uploadedSlots.length > 0 : singleImageUploaded;

    if (!hasImage) {
      toast("이미지를 최소 1개 업로드해주세요", "error");
      return;
    }

    setLoading(true);
    try {
      const body = {
        gameType,
        title: title.trim() || undefined,
        visibility,
        creatorNickname: nickname.trim() || undefined,
        puzzleSize: gameType === "slide_puzzle" ? puzzleSize : undefined,
        tmpShortId: isMulti ? tmpShortId : singleTmpShortId,
        uploadedSlots: isMulti ? uploadedSlots : [0],
      };

      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.shortId) throw new Error("Failed");

      toast("테마가 생성되었습니다!", "success");
      onClose();

      const gamePath = gameType === "slide_puzzle" ? "slide-puzzle" : gameType;
      router.push(`/games/${gamePath}/${data.shortId}`);
    } catch {
      toast("테마 생성에 실패했습니다", "error");
    } finally {
      setLoading(false);
    }
  }

  const labels =
    gameType === "2048"
      ? TILE_2048_LABELS
      : SUIKA_LEVELS.map((l) => l.label);

  return (
    <Modal open={open} onClose={onClose} title="나만의 테마 만들기" className="max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="space-y-5">
        {/* 게임 선택 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">게임 선택</label>
          <div className="flex gap-2">
            {(["2048", "suika", "slide_puzzle"] as GameType[]).map((type) => (
              <button
                key={type}
                onClick={() => setGameType(type)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  gameType === type
                    ? `bg-gradient-to-r ${GAME_META[type].color} text-white`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {GAME_META[type].label}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            {gameType === "slide_puzzle"
              ? "이미지 (1개)"
              : `이미지 슬롯 (최대 ${GAME_META[gameType].maxImages}개)`}
          </label>
          {gameType === "slide_puzzle" ? (
            <SingleImageUploader onUploaded={handleSingleUploaded} />
          ) : (
            <MultiSlotUploader
              maxSlots={GAME_META[gameType].maxImages}
              labels={labels}
              onSlotsChange={handleSlotsChange}
            />
          )}
        </div>

        {/* 슬라이드 퍼즐 크기 */}
        {gameType === "slide_puzzle" && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">퍼즐 크기</label>
            <div className="flex gap-2">
              {([3, 4] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPuzzleSize(size)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    puzzleSize === size ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 테마 이름 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">테마 이름 (선택)</label>
          <input
            type="text"
            placeholder="내 귀여운 강아지 테마"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">닉네임 (선택)</label>
          <input
            type="text"
            placeholder="테마 제작자 이름"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 공개 설정 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">공개 설정</label>
          <div className="space-y-2">
            {[
              { value: "public", label: "공개", desc: "사이트에서 다른 사람들이 찾아볼 수 있어요" },
              { value: "link_only", label: "링크 공유", desc: "링크를 아는 사람만 플레이할 수 있어요" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => setVisibility(opt.value as Visibility)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleCreate} disabled={loading}>
          {loading ? "생성 중..." : "테마 만들고 게임 시작"}
        </Button>
      </div>
    </Modal>
  );
}
