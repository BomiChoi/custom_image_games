"use client";

import { useState, useCallback } from "react";
import { ImageUploader } from "./ImageUploader";
import { nanoid } from "nanoid";

interface SingleImageUploaderProps {
  onUploaded: (imageUrl: string, tmpShortId: string) => void;
}

export function SingleImageUploader({ onUploaded }: SingleImageUploaderProps) {
  const [tmpShortId] = useState(() => `tmp_${nanoid(8)}`);
  const [imageUrl, setImageUrl] = useState<string>();

  const handleUploaded = useCallback(
    (_slot: number, url: string) => {
      setImageUrl(url);
      onUploaded(url, tmpShortId);
    },
    [tmpShortId, onUploaded]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <ImageUploader
        slotIndex={0}
        currentUrl={imageUrl}
        label="이미지 추가"
        tmpShortId={tmpShortId}
        onUploaded={handleUploaded}
        size={160}
      />
      {imageUrl && (
        <p className="text-xs text-emerald-600 font-medium">이미지가 설정되었습니다</p>
      )}
    </div>
  );
}
