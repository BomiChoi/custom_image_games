"use client";

import { useState, useEffect } from "react";
import type { GameType } from "@/types/game";

export function useGameSession(gameType: GameType, themeId?: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    async function start() {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, themeId }),
      });
      const data = await res.json();
      if (data.sessionToken) setSessionToken(data.sessionToken);
    }
    start();
  }, [gameType, themeId]);

  async function submitScore(
    score: number,
    nickname: string,
    metadata?: Record<string, unknown>
  ) {
    if (!sessionToken) throw new Error("No session");
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, nickname, score, metadata }),
    });
    return res.json();
  }

  return { sessionToken, submitScore };
}
