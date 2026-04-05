"use client";

import { useState, useCallback, useEffect } from "react";

export type Board = (number | null)[][];

const SIZE = 4;

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) return false;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const tiles = row.filter(Boolean) as number[];
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      merged.push(tiles[i] * 2);
      score += tiles[i] * 2;
      i += 2;
    } else {
      merged.push(tiles[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged.map((v) => v || null), score };
}

function moveBoard(
  board: Board,
  direction: "left" | "right" | "up" | "down"
): { board: Board; score: number; moved: boolean } {
  let rotated = board;

  if (direction === "right") rotated = board.map((row) => [...row].reverse());
  else if (direction === "up") {
    rotated = Array.from({ length: SIZE }, (_, c) => board.map((row) => row[c]));
  } else if (direction === "down") {
    rotated = Array.from({ length: SIZE }, (_, c) =>
      board.map((row) => row[c]).reverse()
    );
  }

  let totalScore = 0;
  let moved = false;
  const newBoard = rotated.map((row) => {
    const { row: newRow, score } = slideRow(row);
    totalScore += score;
    if (newRow.some((v, i) => v !== row[i])) moved = true;
    return newRow;
  });

  let result = newBoard;
  if (direction === "right") result = newBoard.map((row) => [...row].reverse());
  else if (direction === "up") {
    result = Array.from({ length: SIZE }, (_, r) =>
      newBoard.map((col) => col[r])
    );
  } else if (direction === "down") {
    result = Array.from({ length: SIZE }, (_, r) =>
      newBoard.map((col) => col[SIZE - 1 - r])
    );
  }

  return { board: result, score: totalScore, moved };
}

function initBoard(): Board {
  let b = createEmptyBoard();
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

export function useGame2048() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setBoard(initBoard());
  }, []);

  const maxTile = board.flat().reduce<number>((max, v) => Math.max(max, v ?? 0), 0);

  const move = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver) return;
      setBoard((prev) => {
        const { board: next, score: gained, moved } = moveBoard(prev, direction);
        if (!moved) return prev;
        const withTile = addRandomTile(next);
        setScore((s) => {
          const newScore = s + gained;
          setBestScore((b) => Math.max(b, newScore));
          return newScore;
        });
        setMoves((m) => m + 1);
        if (withTile.flat().includes(2048)) setWon(true);
        if (isGameOver(withTile)) setGameOver(true);
        return withTile;
      });
    },
    [gameOver]
  );

  const reset = useCallback(() => {
    setBoard(initBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setMoves(0);
  }, []);

  // 키보드 이벤트
  useEffect(() => {
    const keyMap: Record<string, "left" | "right" | "up" | "down"> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down",
    };
    const handler = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  return { board, score, bestScore, gameOver, won, maxTile, moves, move, reset };
}
