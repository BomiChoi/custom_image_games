"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function useSlidePuzzle(gridSize: number) {
  const [tiles, setTiles] = useState<number[]>(() => createSolvable(gridSize));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = gridSize * gridSize;
  const solved_ = tiles.every((v, i) => v === (i === total - 1 ? 0 : i + 1));

  // 타이머
  useEffect(() => {
    if (running && !solved) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, solved]);

  // 완성 감지
  useEffect(() => {
    if (solved_) {
      setSolved(true);
      setRunning(false);
    }
  }, [solved_]);

  const moveTile = useCallback(
    (index: number) => {
      if (solved) return;
      setTiles((prev) => {
        const emptyIdx = prev.indexOf(0);
        const canMove = [
          emptyIdx - 1, emptyIdx + 1,
          emptyIdx - gridSize, emptyIdx + gridSize,
        ].includes(index);
        if (!canMove) return prev;
        // 같은 행인지 확인 (좌우 이동)
        if (index === emptyIdx - 1 && emptyIdx % gridSize === 0) return prev;
        if (index === emptyIdx + 1 && index % gridSize === 0) return prev;
        const next = [...prev];
        [next[emptyIdx], next[index]] = [next[index], next[emptyIdx]];
        return next;
      });
      setMoves((m) => m + 1);
      setRunning(true);
    },
    [solved, gridSize]
  );

  const reset = useCallback(() => {
    setTiles(createSolvable(gridSize));
    setMoves(0);
    setSeconds(0);
    setSolved(false);
    setRunning(false);
  }, [gridSize]);

  // score 계산: 이동횟수 + 시간 기반 (완성 시)
  const score = solved
    ? Math.max(1000, Math.floor(100000 / (moves * 2 + seconds + 1)))
    : 0;

  return { tiles, moves, seconds, solved, score, moveTile, reset };
}

function createSolvable(gridSize: number): number[] {
  const total = gridSize * gridSize;
  let tiles: number[];
  do {
    tiles = shuffle(Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1)));
  } while (!isSolvable(tiles, gridSize));
  return tiles;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSolvable(tiles: number[], gridSize: number): boolean {
  const inversions = countInversions(tiles.filter((v) => v !== 0));
  const emptyRow = Math.floor(tiles.indexOf(0) / gridSize);
  const fromBottom = gridSize - emptyRow;

  if (gridSize % 2 !== 0) {
    return inversions % 2 === 0;
  } else {
    if (fromBottom % 2 !== 0) return inversions % 2 === 0;
    else return inversions % 2 !== 0;
  }
}

function countInversions(arr: number[]): number {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) count++;
    }
  }
  return count;
}
