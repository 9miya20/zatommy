# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                # ローカル開発サーバー起動 (port 38200)
pnpm build              # dry-run デプロイ (wrangler deploy --dry-run)
pnpm test               # 全テスト実行 (vitest run)
pnpm test:watch         # テスト監視モード
pnpm test -- tests/pkce.test.ts  # 単一テストファイル実行
pnpm types              # wrangler.jsonc から Cloudflare 型定義生成

# モノレポルート (../../) から
pnpm dev:auth           # auth アプリのみ起動
pnpm -r test            # 全パッケージのテスト実行

# Docker
docker compose up auth  # Docker 環境で auth のみ起動 (ルートの docker-compose.yaml)
```

## Architecture

Auth0 を使った OAuth 2.0 + PKCE 認証フローを提供する Cloudflare Workers アプリ。Hono フレームワーク上で動作し、`that-me` アプリなど他サービスの認証基盤として機能する。

### モノレポ構成での位置づけ

```
zatommy/                    # pnpm workspace モノレポ
├── apps/auth/              # ← このアプリ (認証フロー担当)
├── apps/that-me/           # メモアプリ (SvelteKit、auth の消費者)
└── packages/auth-utils/    # @zatommy/auth-utils (JWT 検証ライブラリ、消費者側で使用)
```

- **auth**: ログイン/コールバック/トークンリフレッシュ/ログアウトの HTTP エンドポイントを提供
- **@zatommy/auth-utils**: 消費者アプリが `access_token` Cookie を検証するためのライブラリ。`auth` アプリの `/auth/config` から domain/audience を取得して JWT 検証を行う

### 認証フロー

```
1. 消費者アプリ → /login?redirect_uri=... (ログインページ表示)
2. ユーザー → /login/:provider (PKCE 生成 → state+codeVerifier を KV 保存 → Auth0 /authorize にリダイレクト)
3. Auth0 → /callback (KV から codeVerifier 取得 → Auth0 でコード交換 → Cookie セット → redirect_uri に戻す)
4. 消費者アプリ → /token/refresh (refresh_token Cookie → 新しい access_token 取得)
5. 消費者アプリ → /logout (Cookie 削除 → Auth0 /v2/logout → return_to にリダイレクト)
```

### ルート構成

- `src/routes/login.tsx` — ログインページ (Hono JSX) + Auth0 リダイレクト。プロバイダー別 connection マッピング (`google` → `google-oauth2`)
- `src/routes/callback.ts` — Auth0 コールバック。PKCE コード交換 → トークン Cookie セット
- `src/routes/token.ts` — `POST /token/refresh` トークンリフレッシュ
- `src/routes/logout.ts` — Cookie 削除 + Auth0 ログアウト (2段階: Auth0 → /logout/callback → return_to)
- `GET /auth/config` — domain/audience を公開 (消費者アプリの JWT 検証用)
- `GET /health` — ヘルスチェック

### 重要な設計判断

- **PKCE state は KV に保存** (5分 TTL)。コールバック時に取得後即削除で再利用防止
- **トークンは HTTP-only Cookie に保存**: `access_token` (Path=/, 1時間), `refresh_token` (Path=/token, 30日)。SameSite=None で cross-origin 対応
- **CORS**: `ALLOWED_REDIRECT_URIS` に含まれるオリジンのみ許可
- **redirect_uri / return_to のバリデーション**: 全ルートで `ALLOWED_REDIRECT_URIS` 許可リストと照合。末尾スラッシュは `normalizeUri` で正規化

### 環境変数 (.dev.vars)

`.dev.vars.example` を参照。`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`, `ALLOWED_REDIRECT_URIS` が必要。

### テスト

Vitest (通常 Node.js モード)。テストは `tests/` ディレクトリ。現在 `pkce.test.ts` と `cookies.test.ts` がある。

### 設定ファイル

- `wrangler.jsonc` (TOML ではない): KV binding あり。`database_id` / KV `id` は `LOCAL_PLACEHOLDER`、デプロイ前に実際の ID に置換が必要
- `tsconfig.json`: JSX は `hono/jsx` を使用 (`jsxImportSource: "hono/jsx"`)
