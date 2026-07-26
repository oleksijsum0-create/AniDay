CREATE TABLE IF NOT EXISTS title_links (
  aniliberty_id INTEGER PRIMARY KEY NOT NULL,
  anilist_id INTEGER,
  mal_id INTEGER,
  confidence REAL NOT NULL DEFAULT 0,
  matched_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  method TEXT NOT NULL DEFAULT 'fuzzy',
  aniliberty_name TEXT,
  anilist_name TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_title_links_anilist ON title_links(anilist_id);
CREATE INDEX IF NOT EXISTS idx_title_links_mal ON title_links(mal_id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  aniliberty_id INTEGER NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, aniliberty_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  aniliberty_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  watched_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, aniliberty_id);
