import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  generateChecksum,
  validateNickname,
  isScoreSuspicious,
} from "@/lib/games/scoreValidator";
import { createHash } from "crypto";
import { z } from "zod";

const submitSchema = z.object({
  sessionToken: z.string().min(1),
  nickname: z.string().min(1).max(20),
  score: z.number().int().min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionToken, nickname, score, metadata = {} } = parsed.data;

    // 닉네임 검증
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("token", sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // 세션 만료 확인
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 400 });
    }

    // 중복 제출 확인
    if (session.is_score_submitted) {
      return NextResponse.json({ error: "Score already submitted" }, { status: 400 });
    }

    // 점수 이상 탐지
    if (isScoreSuspicious(score, session.started_at, session.game_type)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    // IP 해시 (개인정보 보호)
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").substring(0, 16);

    // 단시간 다중 제출 방지: 같은 IP로 1분 내 3회 초과
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("scores")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneMinAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
    }

    // checksum 생성
    const checksum = generateChecksum(sessionToken, score, nickname);

    // 점수 저장
    const { data: scoreData, error: scoreError } = await supabase
      .from("scores")
      .insert({
        game_type: session.game_type,
        theme_id: session.theme_id,
        nickname: nickname.trim(),
        score,
        metadata,
        game_session_token: sessionToken,
        checksum,
        ip_hash: ipHash,
        is_verified: true,
      })
      .select("id, score, nickname, created_at")
      .single();

    if (scoreError || !scoreData) {
      return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }

    // 세션 제출 완료 표시
    await supabase
      .from("game_sessions")
      .update({ is_score_submitted: true })
      .eq("token", sessionToken);

    // 내 순위 계산 (게임 전체)
    const { count: globalRank } = await supabase
      .from("scores")
      .select("id", { count: "exact", head: true })
      .eq("game_type", session.game_type)
      .eq("is_verified", true)
      .eq("is_hidden", false)
      .gt("score", score);

    // 테마 내 순위 계산
    let themeRank: number | null = null;
    if (session.theme_id) {
      const { count: tRank } = await supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .eq("theme_id", session.theme_id)
        .eq("game_type", session.game_type)
        .eq("is_verified", true)
        .eq("is_hidden", false)
        .gt("score", score);
      themeRank = (tRank ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      scoreId: scoreData.id,
      globalRank: (globalRank ?? 0) + 1,
      themeRank,
    });
  } catch (err) {
    console.error("Score submit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get("gameType");
    const themeId = searchParams.get("themeId");
    const filter = searchParams.get("filter") ?? "all"; // 'all' | 'weekly' | 'monthly'
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    if (!gameType) {
      return NextResponse.json({ error: "gameType required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    let query = supabase
      .from("scores")
      .select("id, nickname, score, metadata, created_at, theme_id, themes(short_id, title)")
      .eq("game_type", gameType)
      .eq("is_verified", true)
      .eq("is_hidden", false);

    if (themeId) query = query.eq("theme_id", themeId);

    if (filter === "weekly") {
      query = query.gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString());
    } else if (filter === "monthly") {
      query = query.gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString());
    }

    const { data, error } = await query
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ranked = (data ?? []).map((row: Record<string, unknown>, i: number) => ({ ...row, rank: i + 1 }));
    return NextResponse.json({ scores: ranked });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
