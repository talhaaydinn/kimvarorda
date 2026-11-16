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

const sentences = (p) => p.match(/[^.!?…]+[.!?…]+/g)?.map((x) => x.trim()) ?? [p];
const FIRST = sentences(STORY_OPEN)[0] || '';

// ~1 dakikalık akış: kapakta hikâyenin ilk cümlesi; nitelikler/açıklamalar ekranda görünür ama okunmaz;
// ipuçları numarasız okunur. Hikâyenin geri kalanı sitede.
export const SCENES = [
  { id: 'kapak', kind: 'kapak', say: `Vaka ${VAKA.no ?? ''}: ${VAKA.title}. ${FIRST}`, tail: 0.3 },
  ...VAKA.categories.map((c) => ({ id: `kat-${c.key}`, kind: 'kategori', cat: c.key, say: `${c.label}: ${c.items.map((it) => it.name).join(', ')}.`, tail: 0.4 })),
  ...VAKA.clues.map((cl, i) => ({ id: `ipucu-${i + 1}`, kind: 'ipucu', clue: i, say: cl.text, tail: 0.4 })),
  { id: 'gorev', kind: 'gorev', say: 'Sıra sende: sitede tabloyu doldur, katili bul, adın sıralamaya yazılsın.', tail: 0.4 },
  { id: 'ozet', kind: 'ozet', say: `Ekran görüntüsünü al, cevabını ${SITE_SAY} adresinde gönder.`, tail: 1.6 },
];
