CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  account TEXT NOT NULL DEFAULT '',
  value REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  name TEXT NOT NULL,
  last_four TEXT NOT NULL DEFAULT '',
  expiry TEXT NOT NULL DEFAULT '',
  statement_day INTEGER,
  due_day INTEGER,
  credit_limit REAL NOT NULL DEFAULT 0,
  tone TEXT NOT NULL DEFAULT 'ink',
  logo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  statement_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'อื่น ๆ',
  card_id TEXT NOT NULL DEFAULT '',
  total_price REAL NOT NULL DEFAULT 0,
  interest REAL NOT NULL DEFAULT 0,
  total_installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_assets_user_category ON assets(user_id, category);
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_user_status ON installments(user_id, paid_installments, total_installments);

