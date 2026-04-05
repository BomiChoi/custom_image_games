import { GameType } from "@/types/game";

export const GAME_META: Record<
  GameType,
  { label: string; path: string; description: string; color: string; maxImages: number }
> = {
  "2048": {
    label: "2048",
    path: "/games/2048",
    description: "타일을 합쳐 2048을 만드세요",
    color: "from-orange-400 to-amber-500",
    maxImages: 16,
  },
  suika: {
    label: "수박게임",
    path: "/games/suika",
    description: "과일을 합쳐 수박을 만드세요",
    color: "from-green-400 to-emerald-500",
    maxImages: 16,
  },
  slide_puzzle: {
    label: "슬라이드 퍼즐",
    path: "/games/slide-puzzle",
    description: "조각을 맞춰 사진을 완성하세요",
    color: "from-blue-400 to-indigo-500",
    maxImages: 1,
  },
};

export const GAME_TYPES: GameType[] = ["2048", "suika", "slide_puzzle"];

// 2048 타일 단계별 라벨
export const TILE_2048_LABELS: string[] = [
  "2", "4", "8", "16", "32", "64", "128", "256",
  "512", "1024", "2048", "4096", "8192", "16384", "32768", "65536",
];

// 수박게임 레벨별 라벨 및 기본 색상
export const SUIKA_LEVELS = [
  { label: "체리", size: 30, color: "#FF6B6B", score: 1 },
  { label: "딸기", size: 45, color: "#FF4757", score: 3 },
  { label: "포도", size: 60, color: "#7B2FBE", score: 6 },
  { label: "금귤", size: 75, color: "#FFA502", score: 10 },
  { label: "오렌지", size: 90, color: "#FF6348", score: 15 },
  { label: "사과", size: 110, color: "#FF4757", score: 21 },
  { label: "배", size: 130, color: "#F9CA24", score: 28 },
  { label: "복숭아", size: 150, color: "#FFBE76", score: 36 },
  { label: "파인애플", size: 170, color: "#F9CA24", score: 45 },
  { label: "멜론", size: 190, color: "#6AB04C", score: 55 },
  { label: "수박", size: 220, color: "#2ECC71", score: 66 },
];
