// Veritabanı: canlıda Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN), yerelde DB_PATH'teki SQLite dosyası.
// İkisi de aynı SQLite sözdizimini konuşur; sorgular aşağıda tek yerde.
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const remoteUrl = process.env.TURSO_DATABASE_URL;
export const isRemote = !!remoteUrl;

function localUrl() {
  const file = resolve(process.env.DB_PATH || 'data/kimvarorda.db');
  mkdirSync(dirname(file), { recursive: true });
  return 'file:' + file.replaceAll('\\', '/');
}

export const client = createClient(
  isRemote ? { url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN } : { url: localUrl() },
);

if (!isRemote) {
  await client.executeMultiple('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
}
await client.executeMultiple(`
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

/** Hazır sorgu: await q.x.get(...) → ilk satır | undefined, .all → satırlar, .run → { lastInsertRowid, changes } */
function stmt(sql) {
  const exec = (args) => client.execute({ sql, args });
  return {
    get: async (...args) => (await exec(args)).rows[0],
    all: async (...args) => (await exec(args)).rows,
    run: async (...args) => {
      const r = await exec(args);
      return { lastInsertRowid: r.lastInsertRowid == null ? undefined : Number(r.lastInsertRowid), changes: r.rowsAffected };
    },
  };
}

export const q = {
  caseByNo: stmt('SELECT * FROM cases WHERE no = ?'),
  caseById: stmt('SELECT * FROM cases WHERE id = ?'),
  publicCases: stmt(`
    SELECT c.*, (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id AND s.correct = 1) AS solved,
                (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id) AS attempts
    FROM cases c WHERE c.status != 'draft' ORDER BY c.no DESC`),
  allCases: stmt(`
    SELECT c.*, (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id AND s.correct = 1) AS solved,
                (SELECT COUNT(*) FROM submissions s WHERE s.case_id = c.id) AS attempts
    FROM cases c ORDER BY c.no DESC`),
  nextNo: stmt('SELECT COALESCE(MAX(no), 0) + 1 AS n FROM cases'),
  insertCase: stmt('INSERT INTO cases (no, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'),
  updateCaseData: stmt('UPDATE cases SET data = ?, updated_at = ? WHERE id = ?'),
  updateStatus: stmt('UPDATE cases SET status = ?, publish_at = ?, closed_at = ?, updated_at = ? WHERE id = ?'),
  // Uzak bağlantıda foreign key cascade'e güvenmiyoruz: cevapları açıkça siliyoruz
  deleteCase: {
    run: (id) => client.batch([
      { sql: 'DELETE FROM submissions WHERE case_id = ?', args: [id] },
      { sql: 'DELETE FROM cases WHERE id = ?', args: [id] },
    ], 'write'),
  },

  subByDevice: stmt('SELECT * FROM submissions WHERE case_id = ? AND device = ?'),
  subByName: stmt('SELECT id FROM submissions WHERE case_id = ? AND username_key = ?'),
  insertSub: stmt(`INSERT INTO submissions (case_id, username, username_key, answer, correct, device, ip_hash, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
  rankOf: stmt('SELECT COUNT(*) AS r FROM submissions WHERE case_id = ? AND correct = 1 AND id <= ?'),
  correctList: stmt('SELECT id, username, created_at FROM submissions WHERE case_id = ? AND correct = 1 ORDER BY id LIMIT ?'),
  counts: stmt('SELECT COUNT(*) AS total, COALESCE(SUM(correct), 0) AS correct FROM submissions WHERE case_id = ?'),
  ipCount: stmt('SELECT COUNT(*) AS n FROM submissions WHERE case_id = ? AND ip_hash = ?'),
  ipRecent: stmt('SELECT created_at FROM submissions WHERE ip_hash = ? ORDER BY id DESC LIMIT ?'),
  subsForCase: stmt('SELECT * FROM submissions WHERE case_id = ? ORDER BY id'),
  deleteSub: stmt('DELETE FROM submissions WHERE id = ?'),
};
