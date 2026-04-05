"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ShareButtonProps {
  shortId: string;
  title?: string;
}

export function ShareButton({ shortId, title }: ShareButtonProps) {
  const toast = useToast();
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${shortId}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title ?? "커스텀 이미지 게임",
          url,
        });
        return;
      } catch {
        // 취소 시 무시
      }
    }
    await navigator.clipboard.writeText(url);
    toast("링크가 복사되었습니다!", "success");
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleShare}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      공유
    </Button>
  );
}
