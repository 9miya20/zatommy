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

-- 共有設定（将来Phase）
CREATE TABLE IF NOT EXISTS shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('memo', 'folder')),
  resource_id INTEGER NOT NULL,
  shared_with_user_id INTEGER NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX idx_shares_user ON shares(shared_with_user_id);

-- 全文検索
CREATE VIRTUAL TABLE IF NOT EXISTS memos_fts USING fts5(title, content, content=memos, content_rowid=id);

-- FTS同期トリガー
CREATE TRIGGER memos_ai AFTER INSERT ON memos BEGIN
  INSERT INTO memos_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER memos_ad AFTER DELETE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER memos_au AFTER UPDATE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
  INSERT INTO memos_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- ダミーユーザー（開発用）
INSERT INTO users (email, name) VALUES ('dev@example.com', 'Developer');
