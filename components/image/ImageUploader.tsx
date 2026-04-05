"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { resizeImageToSquare } from "@/lib/games/imageUtils";
import { IMAGE_TARGET_SIZE } from "@/constants/storage";

interface ImageUploaderProps {
  slotIndex: number;
  currentUrl?: string;
  label?: string;
  tmpShortId: string;
  onUploaded: (slotIndex: number, imageUrl: string) => void;
  size?: number; // px
}

export function ImageUploader({
  slotIndex,
  currentUrl,
  label,
  tmpShortId,
  onUploaded,
  size = 80,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const resized = await resizeImageToSquare(file, IMAGE_TARGET_SIZE);
      const form = new FormData();
      form.append("file", resized, `${slotIndex}.webp`);
      form.append("themeId", tmpShortId);
      form.append("slotIndex", String(slotIndex));

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.imageUrl) onUploaded(slotIndex, data.imageUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        dragging ? "border-indigo-500 bg-indigo-50" : "border-dashed border-gray-300 hover:border-indigo-400"
      }`}
      style={{ width: size, height: size }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      {currentUrl ? (
        <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-400">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              {label && <span className="text-[10px] font-medium text-center leading-tight px-1">{label}</span>}
            </>
          )}
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {currentUrl && !uploading && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
          <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z" />
          </svg>
        </div>
      )}
    </div>
  );
}
