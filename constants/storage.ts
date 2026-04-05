export const STORAGE_BUCKET = "game-images";

export const getThemeImagePath = (shortId: string, slotIndex: number): string =>
  `themes/${shortId}/${slotIndex}.webp`;

export const getThemeImageDir = (shortId: string): string =>
  `themes/${shortId}`;

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const IMAGE_TARGET_SIZE = 1024; // 1024x1024
export const THUMBNAIL_SIZE = 200;
