-- ユーザー管理
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_users_email ON users(email);

-- フォルダ
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  parent_folder_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE INDEX idx_folders_owner ON folders(owner_id);

-- メモ本体
CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  owner_id INTEGER NOT NULL,
  folder_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE INDEX idx_memos_owner ON memos(owner_id);
CREATE INDEX idx_memos_folder ON memos(folder_id);
CREATE INDEX idx_memos_updated ON memos(updated_at);


-- 全文検索（FTS5）仮想テーブル
-- content=memos: データ本体はmemosテーブルを参照し、FTS5は検索インデックスのみ保持（ストレージ節約）
-- content_rowid=id: memosテーブルのidカラムをFTSのrowidとして使用
CREATE VIRTUAL TABLE IF NOT EXISTS memos_fts USING fts5(title, content, content=memos, content_rowid=id);

-- FTS同期トリガー
-- content syncモードではFTS5が自動更新しないため、トリガーで手動同期する

-- INSERT: memosに行追加時、FTSインデックスにも追加
CREATE TRIGGER memos_ai AFTER INSERT ON memos BEGIN
  INSERT INTO memos_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- DELETE: memosから行削除時、FTSインデックスからも除去
-- 第1カラムにテーブル名自体を指定し値'delete'を渡すのがFTS5の削除構文
CREATE TRIGGER memos_ad AFTER DELETE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
END;

-- UPDATE: FTS5にはUPDATE操作がないため、旧データ削除→新データ追加の2ステップで更新
CREATE TRIGGER memos_au AFTER UPDATE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
  INSERT INTO memos_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- ダミーユーザー（開発用）
INSERT INTO users (email, name) VALUES ('dev@example.com', 'Developer');
