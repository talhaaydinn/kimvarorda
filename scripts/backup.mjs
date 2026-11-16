// Veritabanının tamamını JSON olarak bilgisayarına indirir (vakalar + cevaplar).
//
//   npm run backup                                   → yerel veritabanı
//   npm run backup -- libsql://...turso.io <token>   → canlıdaki Turso veritabanı
//
// Turso adresini ve token'ı .env'e YAZMA: yazarsan yerel geliştirme sunucun canlı veritabanını kullanır.
import { createClient } from '@libsql/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [url, authToken] = process.argv.slice(2);
const client = url
  ? createClient({ url, authToken })
  : createClient({ url: 'file:' + resolve(process.env.DB_PATH || 'data/kimvarorda.db').replaceAll('\\', '/') });

const dump = { at: new Date().toISOString(), source: url ? url.replace(/\?.*$/, '') : 'yerel' };
for (const table of ['cases', 'submissions']) {
  dump[table] = (await client.execute(`SELECT * FROM ${table} ORDER BY id`)).rows;
}
client.close();

mkdirSync('data/yedekler', { recursive: true });
const file = resolve(`data/yedekler/yedek-${dump.at.slice(0, 16).replace(/[-:T]/g, '')}.json`);
writeFileSync(file, JSON.stringify(dump, null, 1));
console.log(`✓ ${dump.cases.length} vaka, ${dump.submissions.length} cevap → ${file}`);
