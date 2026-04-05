# 설정 가이드

## 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/migrations/001_initial_schema.sql` 내용 실행
3. **Storage** → **New bucket** → `game-images` (Public) 생성
4. 프로젝트 Settings → API에서 키 확인

## 2. 환경 변수 설정

`.env.local` 파일을 채워주세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SCORE_HMAC_SECRET=랜덤한_긴_문자열
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 배포 시 실제 URL로 변경
```

## 3. 로컬 실행

```bash
npm install
npm run dev
```

## 4. Vercel 배포

1. GitHub에 Push
2. [vercel.com](https://vercel.com)에서 Import
3. Environment Variables에 `.env.local`의 변수들 추가
4. `NEXT_PUBLIC_SITE_URL`을 실제 배포 URL로 변경
5. Deploy

## 주의사항

- `SCORE_HMAC_SECRET`은 충분히 긴 랜덤 문자열을 사용하세요 (예: `openssl rand -hex 32`)
- Supabase Storage의 `game-images` 버킷은 반드시 **Public**으로 설정해야 이미지가 표시됩니다
- Supabase 무료 플랜의 경우 테마 만료(`expires_at`) 정리는 수동 또는 pg_cron으로 처리해야 합니다
