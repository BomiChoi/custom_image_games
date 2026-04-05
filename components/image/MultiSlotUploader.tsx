"use client";

import { useState, useCallback } from "react";
import { ImageUploader } from "./ImageUploader";
import { nanoid } from "nanoid";

interface MultiSlotUploaderProps {
  maxSlots: number;
  labels: string[];
  onSlotsChange: (slots: Record<number, string>, tmpShortId: string, uploadedSlots: number[]) => void;
}

export function MultiSlotUploader({ maxSlots, labels, onSlotsChange }: MultiSlotUploaderProps) {
  const [tmpShortId] = useState(() => `tmp_${nanoid(8)}`);
  const [slotUrls, setSlotUrls] = useState<Record<number, string>>({});

  const handleUploaded = useCallback(
    (slotIndex: number, imageUrl: string) => {
      setSlotUrls((prev) => {
        const next = { ...prev, [slotIndex]: imageUrl };
        onSlotsChange(next, tmpShortId, Object.keys(next).map(Number));
        return next;
      });
    },
    [tmpShortId, onSlotsChange]
  );

  const cols = maxSlots <= 4 ? maxSlots : 4;
  const slotSize = 72;

  return (
    <div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, ${slotSize}px)` }}
      >
        {Array.from({ length: maxSlots }).map((_, i) => (
          <ImageUploader
            key={i}
            slotIndex={i}
            currentUrl={slotUrls[i]}
            label={labels[i] ?? `${i + 1}`}
            tmpShortId={tmpShortId}
            onUploaded={handleUploaded}
            size={slotSize}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {Object.keys(slotUrls).length}/{maxSlots} 슬롯 설정됨 · 미설정 슬롯은 기본 스타일로 표시
      </p>
    </div>
  );
}
