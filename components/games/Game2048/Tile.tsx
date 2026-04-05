"use client";

import { TILE_2048_LABELS } from "@/constants/games";

// log2(value) → slot index (2→0, 4→1, 8→2 ...)
function tileToSlot(value: number): number {
  return Math.log2(value) - 1;
}

const TILE_COLORS: Record<number, string> = {
  2: "bg-amber-100 text-gray-800",
  4: "bg-amber-200 text-gray-800",
  8: "bg-orange-300 text-white",
  16: "bg-orange-400 text-white",
  32: "bg-orange-500 text-white",
  64: "bg-orange-600 text-white",
  128: "bg-yellow-400 text-white",
  256: "bg-yellow-500 text-white",
  512: "bg-yellow-600 text-white",
  1024: "bg-indigo-500 text-white",
  2048: "bg-indigo-700 text-white",
};

interface TileProps {
  value: number;
  imageUrl?: string;
  size: number;
}

export function Tile({ value, imageUrl, size }: TileProps) {
  const slot = tileToSlot(value);
  const label = TILE_2048_LABELS[slot] ?? String(value);
  const colorClass = TILE_COLORS[value] ?? "bg-purple-700 text-white";
  const fontSize = value >= 1000 ? (value >= 10000 ? "text-xs" : "text-sm") : "text-lg";

  if (imageUrl) {
    return (
      <div
        className="rounded-xl overflow-hidden shadow-md"
        style={{ width: size, height: size }}
      >
        <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl flex items-center justify-center font-black shadow-md ${colorClass} ${fontSize}`}
      style={{ width: size, height: size }}
    >
      {label}
    </div>
  );
}
