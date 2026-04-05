# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (TypeScript 타입 검사 포함)
npm run lint     # ESLint 실행
npm run start    # 프로덕션 서버 실행
```

테스트 프레임워크는 설정되어 있지 않음.

## Architecture

**Next.js 16 App Router** 기반. 모든 게임 로직은 클라이언트 컴포넌트, 점수 검증·이미지 업로드·테마 저장은 API Routes(서버)에서만 처리.

### 핵심 데이터 흐름

```
이미지 업로드: 클라이언트 리사이즈(Canvas) → /api/upload → Supabase Storage (game-images 버킷)
테마 저장:    /api/themes POST → themes + theme_images 테이블 생성 → nanoid 8자리 short_id 반환
점수 제출:    /api/sessions POST(세션 토큰 발급) → 게임 플레이 → /api/scores POST(HMAC 검증 후 저장)
공유:         /share/[shortId] 또는 /games/[game]/[shortId] 직접 접근
```

### API Routes (`app/api/`)

| 엔드포인트 | 역할 |
|---|---|
| `POST /api/upload` | 이미지를 Supabase Storage에 업로드, 임시 shortId(`tmp_` 접두사) 경로로 저장 |
| `POST /api/themes` | 임시 경로 이미지를 확정 경로로 copy 후 themes/theme_images 레코드 생성 |
| `GET /api/themes/[shortId]` | 테마 조회 + play_count 증가 + image_url 변환 |
| `GET /api/themes` | 공개 테마 목록 (visibility='public') |
| `POST /api/sessions` | 게임 세션 토큰 발급 (점수 위조 방지용) |
| `POST /api/scores` | 세션 검증·HMAC 검증 후 점수 저장 |
| `GET /api/scores` | 리더보드 조회 (gameType 필수, themeId·filter 선택) |

모든 DB 변경 API는 `createServiceClient()`(service_role 키)를 사용. 클라이언트는 anon 키로 읽기만 가능(RLS).

### Supabase DB 구조 (`supabase/migrations/001_initial_schema.sql`)

- **themes**: 게임 설정 메타데이터. `short_id`(8자리, nanoid)로 공유 URL 생성. `visibility`: `public` | `link_only`
- **theme_images**: 슬롯별 이미지 경로. 2048·수박게임은 slot_index 0~15(최대 16개), 슬라이드 퍼즐은 slot_index=0 하나만
- **game_sessions**: 점수 제출 전 발급하는 세션 토큰. 만료(2시간), 중복 제출 방지
- **scores**: `is_verified=true`인 점수만 RLS로 노출. HMAC checksum으로 위조 탐지

### 게임별 이미지 적용 방식

| 게임 | 이미지 수 | 렌더링 방식 |
|---|---|---|
| **2048** | 1~16개 | `log2(tile값)-1` = slot_index → `<img>` 직접 표시 |
| **수박게임** | 1~16개 | Canvas 2D에서 `matter-js` body 위치로 직접 drawImage (커스텀 렌더러) |
| **슬라이드 퍼즐** | 1개 | CSS `background-size: N*100% N*100%` + `background-position`으로 조각 표현 |

### 게임 로직 훅

- `useGame2048`: 4×4 보드 상태, 타일 이동(row slide + rotate), 키보드/터치 이벤트 처리
- `useSlidePuzzle`: Fisher-Yates 셔플 + 홀짝성 검증으로 반드시 풀 수 있는 초기 상태 보장
- `useSuikaGame`: `matter-js`를 동적 import(`await import("matter-js")`). `collisionStart` 이벤트로 병합 처리. Canvas 렌더링은 `SuikaGame.tsx`의 별도 `requestAnimationFrame` 루프에서 수행

### Supabase 클라이언트

- `lib/supabase/client.ts`: 클라이언트 컴포넌트용 (`createBrowserClient`)
- `lib/supabase/server.ts`: Server Component/Route Handler용 (`createServerClient` + `createServiceClient`)
- `lib/supabase/storage.ts`: Storage URL 생성 유틸

### 점수 위조 방지

`lib/games/scoreValidator.ts`:
- 게임 시작 시 서버가 세션 토큰 발급
- 게임 종료 시 세션 토큰 + HMAC(SHA-256) checksum 검증
- 최소 플레이 시간·최대 점수 한계 체크
- IP 해시 기반 1분 3회 Rate Limit

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # API Routes에서만 사용
SCORE_HMAC_SECRET                # 점수 HMAC 서명 키
NEXT_PUBLIC_SITE_URL             # API 내부 fetch에서 사용 (배포 시 실제 URL로 변경)
```

## 주의사항

- `matter-js`는 SSR 불가 → `useSuikaGame.ts`에서 `await import("matter-js")`로 동적 로드. 관련 컴포넌트에 `"use client"` 필수
- Zod v4 사용 중: `z.record()`는 키·값 두 인자 필요 (`z.record(z.string(), z.unknown())`)
- `lib/games/imageUtils.ts`에 `"use client"` 지시어 포함 — 서버에서 import 금지
- 테마 이미지는 Storage에서 `themes/{shortId}/{slotIndex}.webp` 경로로 저장. 업로드 시 임시 경로(`themes/tmp_xxx/{slotIndex}.webp`) → 테마 생성 시 확정 경로로 copy 후 삭제
