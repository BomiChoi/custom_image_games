export type GameType = "2048" | "suika" | "slide_puzzle";

export type Visibility = "public" | "link_only";

export interface Theme {
  id: string;
  short_id: string;
  game_type: GameType;
  title: string | null;
  visibility: Visibility;
  creator_nickname: string | null;
  play_count: number;
  puzzle_size: number | null;
  created_at: string;
  expires_at: string;
  images?: ThemeImage[];
}

export interface ThemeImage {
  id: string;
  theme_id: string;
  slot_index: number;
  image_path: string;
  image_url?: string;
}

export interface Score {
  id: string;
  game_type: GameType;
  theme_id: string | null;
  nickname: string;
  score: number;
  metadata: ScoreMetadata;
  is_verified: boolean;
  created_at: string;
  rank?: number;
  themes?: Pick<Theme, "short_id" | "title">;
}

export interface ScoreMetadata {
  // 2048
  max_tile?: number;
  moves?: number;
  // suika
  highest_fruit?: number;
  total_merges?: number;
  // slide_puzzle
  time_seconds?: number;
  grid_size?: number;
}

export interface GameSession {
  id: string;
  token: string;
  game_type: GameType;
  theme_id: string | null;
  started_at: string;
  expires_at: string;
  is_score_submitted: boolean;
}

export interface LeaderboardEntry extends Score {
  rank: number;
}

export type LeaderboardFilter = "all" | "weekly" | "monthly";
