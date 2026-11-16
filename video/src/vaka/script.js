// Vaka videosunun senaryosu — vaka.js'ten (npm run video:vaka) otomatik kurulur.
// say: seslendirilecek metin. kind: hangi görünümle çizileceği. tail: ses bittikten sonra bekleme (sn).
import { VAKA } from './vaka.js';

export const SITE = 'kimvarorda.onrender.com';
const SITE_SAY = 'kimvarorda nokta onrender nokta com';

const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr') + s.slice(1) : s);
const isQuestions = (p) => /^kim\?\s*nerede\?\s*neyle\?/i.test(p.toLocaleLowerCase('tr'));

const paras = VAKA.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const STORY_OPEN = paras[0] || '';
export const STORY_REST = paras.slice(1).filter((p) => !isQuestions(p));

/** "Çaycı Hüsnü. Bıyıklı, kısa boylu. Yirmi yıldır…" */
const itemSay = (it) => [it.name + '.', it.traits.length ? cap(it.traits.join(', ')) + '.' : '', it.desc].filter(Boolean).join(' ');

export const SCENES = [
  { id: 'kapak', kind: 'kapak', say: `Vaka ${VAKA.no ?? ''}: ${VAKA.title}. ${STORY_OPEN}`, tail: 0.6 },
  { id: 'hikaye', kind: 'hikaye', say: `${STORY_REST.join(' ')} Kim? Nerede? Neyle?`, tail: 0.8 },
  ...VAKA.categories.map((c) => ({ id: `kat-${c.key}`, kind: 'kategori', cat: c.key, say: `${c.label}. ${c.items.map(itemSay).join(' ')}`, tail: 0.8 })),
  ...VAKA.clues.map((cl, i) => ({ id: `ipucu-${i + 1}`, kind: 'ipucu', clue: i, say: `İpucu ${i + 1}. ${cl.text}`, tail: 1.4 })),
  { id: 'ozet', kind: 'ozet', say: 'Bütün ipuçları ekranda. Videoyu durdur, ekran görüntüsünü al ve tabloyu doldur.', tail: 2.5 },
  { id: 'cta', kind: 'cta', say: `Kim? Nerede? Neyle? Cevabını ${SITE_SAY} adresinde gönder. Tek hakkın var; ilk doğru bilen zirveye çıkar.`, tail: 1.2 },
];
