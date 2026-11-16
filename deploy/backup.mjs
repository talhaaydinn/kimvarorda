// Veritabanının tutarlı bir kopyasını alır (site çalışırken de güvenli).
//   node deploy/backup.mjs [db yolu] [yedek klasörü] [saklanacak adet]
// Sunucuda her gece cron ile çalışır (bkz. deploy/setup.sh).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [db = process.env.DB_PATH || 'data/kimvarorda.db', dir = 'data/backups', keep = '14'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const file = resolve(join(dir, `kimvarorda-${stamp}.db`));
rmSync(file, { force: true });
const conn = new DatabaseSync(db);
conn.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
conn.close();

const old = readdirSync(dir).filter((f) => /^kimvarorda-\d+\.db$/.test(f)).sort().reverse().slice(Number(keep));
old.forEach((f) => rmSync(join(dir, f)));
console.log(`${new Date().toISOString()} yedek: ${file}${old.length ? ` (silinen eski: ${old.length})` : ''}`);
