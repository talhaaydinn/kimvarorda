// Bir vaka dosyasından vaka videosunun verisini hazırlar.
//   npm run video:vaka -- data/vakalar/son-vapur.json
// Ardından: npm run video:voice -- --vaka  →  npm run video:render:vaka
//
// Videoya YALNIZCA herkese açık bilgiler gider: çözüm, katil, izler ve mantık kuralları gitmez
// (video/src/vaka/vaka.js git'e girer).
import { readFileSync, writeFileSync } from 'node:fs';
import { checkCase } from '../shared/engine.js';

const file = process.argv[2];
if (!file) {
  console.error('Kullanım: npm run video:vaka -- <vaka.json>');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(file, 'utf8'));
const d = raw.data ?? raw;

// Çözülemeyen bir vakanın videosunu çekmeyelim
const ck = checkCase(d);
if (!ck.answerUnique) {
  console.error(`✕ Bu vaka tek bir cevaba gitmiyor (${ck.possibleAnswers} farklı cevap mümkün). Önce ipuçlarını düzelt.`);
  process.exit(1);
}
if (ck.falseClues.length) {
  console.error(`✕ ${ck.falseClues.length} ipucu gerçek çözümle çelişiyor.`);
  process.exit(1);
}

const vaka = {
  no: raw.no ?? d.no ?? null,
  title: d.title,
  story: d.story,
  categories: d.categories.map((c) => ({
    key: c.key,
    label: c.label,
    items: c.items.map(({ id, name, emoji, desc, traits }) => ({ id, name, emoji, desc, traits: traits || [] })),
  })),
  clues: d.clues.map(({ id, text, speaker }) => ({ id, text, speaker: speaker || undefined })),
};

writeFileSync(
  'video/src/vaka/vaka.js',
  `// Otomatik üretildi: npm run video:vaka -- ${file.replaceAll('\\', '/')}\n// Yalnızca herkese açık bilgiler (çözüm yok).\nexport const VAKA = ${JSON.stringify(vaka, null, 2)};\n`,
);
console.log(`✓ "${vaka.title}" → video/src/vaka/vaka.js (${vaka.clues.length} ipucu; tek cevap doğrulandı)`);
console.log('Sıradaki: npm run video:voice -- --vaka   →   npm run video:render:vaka');
