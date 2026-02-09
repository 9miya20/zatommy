# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # ローカル開発サーバー起動
pnpm build            # プロダクションビルド
pnpm check            # TypeScript + Svelte型チェック
pnpm test             # 全テスト実行 (vitest run)
pnpm test:watch       # テスト監視モード
pnpm test -- tests/cache.test.ts  # 単一テストファイル実行

# DB操作
pnpm db:migrate:local   # D1マイグレーションをローカル適用
pnpm db:migrate:remote  # D1マイグレーションをリモート適用
pnpm db:generate        # Drizzleスキーマからマイグレーション生成
pnpm types              # wrangler.jsoncからCloudflare型定義生成

# wrangler直接操作
npx wrangler dev --persist-to=./.wrangler/state  # Cloudflare環境ローカルテスト
```

## Architecture

パフォーマンス特化メモアプリ。SvelteKit (Svelte 5) + Cloudflare Workers + D1 + KV。

### リクエストフロー

```
Browser → Service Worker (アセットキャッシュ)
       → SvelteKit Server (Cloudflare Worker)
         → hooks.server.ts (認証ミドルウェア: cookie → AuthProvider → locals.user)
           → API Route (+server.ts)
             → requireAuth/requirePlatform (api-utils.ts)
             → Zod validation (validation.ts)
             → Drizzle ORM (schema.ts) → D1
```

### 認証

Auth0 ベースの認証。`apps/auth` が認証フロー（ログイン/ログアウト/トークンリフレッシュ）を担当し、`that-me` は `access_token` Cookie の検証のみ行う。`AuthProvider` インターフェース (`src/lib/server/auth.ts`) は `getCurrentUser` のみ。ログイン/ログアウトは `apps/auth` への外部リダイレクト (`AUTH_APP_URL`)。

### API設計パターン

全APIルートは `api-utils.ts` の共通ヘルパーを使用:
- `requireAuth(event)` / `requirePlatform(event)` — discriminated union型で返し、`if (error) return error` パターンでnarrowingする
- `parseBody(request, zodSchema)` / `parseQuery(url, zodSchema)` — Zodの`output`型を正しく推論するため `<S extends ZodType>` + `ZodOutput<S>` を使用（`ZodSchema<T>` では `default()` の型が消える）

### 3階層キャッシュ (`src/lib/server/cache.ts`)

```
Memory Map (<1ms, 60秒TTL) → Cloudflare KV (<5ms, 300秒TTL) → D1 (<30ms, 永続)
```

`getCached(key, kv, fetcher)` で統一的にアクセス。KVへの書き戻しはノンブロッキング。

### オフライン対応

- **Service Worker** (`src/service-worker.ts`): 静的アセットはcache-first、API呼び出しはnetwork-first
- **IndexedDB** (`src/lib/stores/local-db.ts`): `idb`ライブラリで `memos`/`folders`/`pendingOps` ストア管理
- **同期** (`src/lib/stores/sync.ts`): Last-Write-Wins方式。30秒間隔 + `online`イベントで同期。unsynced flag で差分追跡

### DB

- **ORM**: Drizzle ORM (SQLite dialect)。スキーマは `src/lib/server/schema.ts`、SQLマイグレーションは `migrations/`
- **FTS5**: `memos_fts` 仮想テーブル + INSERT/UPDATE/DELETE トリガーで自動同期。検索APIでは Drizzle ORM を使わず `platform.env.DB.prepare().bind()` で直接FTS5クエリ実行
- **自己参照FK**: `folders.parentFolderId → folders.id` はDrizzleの型が通らないため、Drizzleスキーマでは `integer('parent_folder_id')` のみ（FK制約なし）、実際のFK制約はSQLマイグレーションで定義

### テスト

Vitest (通常Node.jsモード、Workers Poolではない)。テストは `tests/` ディレクトリ。`$lib` エイリアスは `vitest.config.ts` で設定済み。Cloudflareバインディング (`KVNamespace` 等) の型はグローバルに利用可能 (`@cloudflare/workers-types`)。

### 重要な注意点

- **D1のSQLインジェクション防止**: FTS5検索など Drizzle ORM を使わない場合は必ず `prepare().bind()` を使用
- **pnpm**: `onlyBuiltDependencies` で esbuild/workerd/sharp を許可。初回 `pnpm install` 後に `pnpm rebuild esbuild workerd` が必要な場合がある
- **wrangler.jsonc**: `database_id` と KV `id` は `LOCAL_PLACEHOLDER`。デプロイ前に実際のIDに置換が必要
- **Svelte 5**: runes (`$state`, `$derived`, `$effect`, `$props`) を使用。Svelte 4構文は使用禁止
- **設定ファイル**: `wrangler.jsonc` (TOMLではない)
