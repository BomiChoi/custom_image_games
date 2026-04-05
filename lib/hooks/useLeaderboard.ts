"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry, LeaderboardFilter, GameType } from "@/types/game";

export function useLeaderboard(
  gameType: GameType,
  themeId?: string,
  filter: LeaderboardFilter = "all"
) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ gameType, filter });
      if (themeId) params.set("themeId", themeId);
      const res = await fetch(`/api/scores?${params}`);
      const data = await res.json();
      setScores(data.scores ?? []);
    } finally {
      setLoading(false);
    }
  }, [gameType, themeId, filter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { scores, loading, refetch: fetch_ };
}
