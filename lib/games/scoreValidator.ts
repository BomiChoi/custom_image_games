import { createHmac } from "crypto";

const SECRET = process.env.SCORE_HMAC_SECRET!;

export function generateChecksum(
  sessionToken: string,
  score: number,
  nickname: string
): string {
  return createHmac("sha256", SECRET)
    .update(`${sessionToken}:${score}:${nickname}`)
    .digest("hex");
}

export function verifyChecksum(
  sessionToken: string,
  score: number,
  nickname: string,
  checksum: string
): boolean {
  const expected = generateChecksum(sessionToken, score, nickname);
  return expected === checksum;
}

// 닉네임 유효성 검사
export function validateNickname(nickname: string): string | null {
  if (!nickname || nickname.trim().length === 0) return "닉네임을 입력해주세요";
  if (nickname.trim().length > 20) return "닉네임은 20자 이내여야 합니다";
  return null;
}

// 점수 이상 감지: 세션 시작 후 경과 시간 대비 점수 급증 여부
export function isScoreSuspicious(
  finalScore: number,
  sessionStartedAt: string,
  gameType: string
): boolean {
  const elapsedSeconds =
    (Date.now() - new Date(sessionStartedAt).getTime()) / 1000;

  // 최소 플레이 시간 체크 (게임별)
  const minSeconds: Record<string, number> = {
    "2048": 30,
    suika: 10,
    slide_puzzle: 15,
  };

  if (elapsedSeconds < (minSeconds[gameType] ?? 10)) return true;

  // 최대 점수 한계
  const maxScores: Record<string, number> = {
    "2048": 200000,
    suika: 10000,
    slide_puzzle: 100000,
  };

  if (finalScore > (maxScores[gameType] ?? 99999)) return true;

  return false;
}
