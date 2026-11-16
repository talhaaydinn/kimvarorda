import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const file = resolve(process.env.DB_PATH || 'data/kimvarorda.db');
mkdirSync(dirname(file), { recursive: true });

export const db = new DatabaseSync(file);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS cases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    no          INTEGER NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'draft',   -- draft | open | closed
    publish_at  INTEGER,                          -- ms; saat bu andan itibaren işler
    closed_at   INTEGER,
    data        TEXT NOT NULL,                    -- vaka JSON'u (çözüm dahil)
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id      INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    username     TEXT NOT NULL,
    username_key TEXT NOT NULL,
    answer       TEXT NOT NULL,
    correct      INTEGER NOT NULL,
    device       TEXT NOT NULL,
    ip_hash      TEXT,
    created_at   INTEGER NOT NULL,
    UNIQUE (case_id, username_key),
    UNIQUE (case_id, device)
  );
  CREATE INDEX IF NOT EXISTS idx_sub_case_correct ON submissions(case_id, correct, id);
  CREATE INDEX IF NOT EXISTS idx_sub_ip ON submissions(ip_hash, id);
`);

export const q = {
  caseByNo: db.prepare('SELECT * FROM cases WHERE no = ?'),
  caseById: db.prepare('SELECT * FROM cases WHERE id = ?'),
  publicCases: db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id AND s.correct = 1) AS solved,
                (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id) AS attempts
    FROM cases c WHERE c.status != 'draft' ORDER BY c.no DESC`),
  allCases: db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id AND s.correct = 1) AS solved,
                (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id) AS attempts
    FROM cases c ORDER BY c.no DESC`),
  nextNo: db.prepare('SELECT COALESCE(MAX(no), 0) + 1 AS n FROM cases'),
  insertCase: db.prepare('INSERT INTO cases (no, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'),
  updateCaseData: db.prepare('UPDATE cases SET data = ?, updated_at = ? WHERE id = ?'),
  updateStatus: db.prepare('UPDATE cases SET status = ?, publish_at = ?, closed_at = ?, updated_at = ? WHERE id = ?'),
  deleteCase: db.prepare('DELETE FROM cases WHERE id = ?'),

  subByDevice: db.prepare('SELECT * FROM submissions WHERE case_id = ? AND device = ?'),
  subByName: db.prepare('SELECT id FROM submissions WHERE case_id = ? AND username_key = ?'),
  insertSub: db.prepare(`INSERT INTO submissions (case_id, username, username_key, answer, correct, device, ip_hash, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
  rankOf: db.prepare('SELECT COUNT(*) AS r FROM submissions WHERE case_id = ? AND correct = 1 AND id <= ?'),
  correctList: db.prepare('SELECT id, username, created_at FROM submissions WHERE case_id = ? AND correct = 1 ORDER BY id LIMIT ?'),
  counts: db.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(correct), 0) AS correct FROM submissions WHERE case_id = ?'),
  ipCount: db.prepare('SELECT COUNT(*) AS n FROM submissions WHERE case_id = ? AND ip_hash = ?'),
  ipRecent: db.prepare('SELECT created_at FROM submissions WHERE ip_hash = ? ORDER BY id DESC LIMIT ?'),
  subsForCase: db.prepare('SELECT * FROM submissions WHERE case_id = ? ORDER BY id'),
  deleteSub: db.prepare('DELETE FROM submissions WHERE id = ?'),
};
