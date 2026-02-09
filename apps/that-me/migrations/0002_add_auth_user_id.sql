-- Auth0 ユーザーID カラムを追加
-- SQLite の ALTER TABLE ADD COLUMN では UNIQUE 制約を直接付けられないため、
-- カラム追加後に UNIQUE インデックスで一意性を保証する
ALTER TABLE users ADD COLUMN auth_user_id TEXT;

-- Auth0 ユーザーID の一意インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
