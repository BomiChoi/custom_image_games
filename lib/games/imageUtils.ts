"use client";

/**
 * Canvas를 사용해 이미지를 정사각형으로 리사이즈하고 WebP Blob으로 반환
 */
export async function resizeImageToSquare(
  file: File | Blob,
  size: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/webp",
        0.9
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/**
 * Crop 영역에 따라 이미지를 자르고 리사이즈하여 WebP Blob 반환
 */
export async function cropAndResize(
  file: File | Blob,
  crop: { x: number; y: number; width: number; height: number },
  targetSize: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        targetSize,
        targetSize
      );
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/webp",
        0.9
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/**
 * 슬라이드 퍼즐용 background-position 계산
 * gridSize: 3 or 4
 * index: 0~(gridSize*gridSize-1)
 */
export function getPuzzlePieceStyle(
  imageUrl: string,
  index: number,
  gridSize: number,
  pieceSize: number
): React.CSSProperties {
  const col = index % gridSize;
  const row = Math.floor(index / gridSize);
  const pct = 100 / (gridSize - 1);
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${gridSize * pieceSize}px ${gridSize * pieceSize}px`,
    backgroundPosition: `${col * pct}% ${row * pct}%`,
    backgroundRepeat: "no-repeat",
  };
}
