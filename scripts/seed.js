// Örnek vakayı veritabanına ekler ve yayına alır: npm run seed
import '../server/env.js';
import { db, q } from '../server/db.js';
import { generateClues, checkCase } from '../shared/engine.js';
import { sampleCase } from './sample-case.js';

const data = structuredClone(sampleCase);
data.clues = generateClues(data, { difficulty: data.settings.difficulty, liar: data.settings.liar });
const check = checkCase(data);
if (!check.unique) throw new Error('Örnek vaka benzersiz değil');

const t = Date.now();
const no = q.nextNo.get().n;
const info = q.insertCase.run(no, 'draft', JSON.stringify(data), t, t);
q.updateStatus.run('open', t, null, t, Number(info.lastInsertRowid));
console.log(`Vaka #${no} eklendi ve yayına alındı (${data.clues.length} ipucu):`);
data.clues.forEach((c, i) => console.log(`  ${i + 1}. ${c.text}`));
db.close();
