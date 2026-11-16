// Türkçe ek uyumu ve ipucu cümlesi üretimi.
// Otomatik ekler çoğu kelimede doğru çalışır; tamlama gibi istisnalar için
// her öğede `forms.gen` / `forms.loc` ile elle biçim girilebilir.

const VOWELS = 'aeıioöuü';
const BACK = 'aıou';
const HARD = 'fstkçşhp';

const lower = (s) => s.toLocaleLowerCase('tr');
export const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr') + s.slice(1) : s);

function letters(w) {
  return lower(w).replace(/[^a-zçğıöşüâîû]+$/u, '');
}
function lastVowel(w) {
  const s = letters(w).replace(/[âîû]/g, (c) => ({ â: 'a', î: 'i', û: 'u' })[c]);
  for (let i = s.length - 1; i >= 0; i--) if (VOWELS.includes(s[i])) return s[i];
  return 'e';
}
function lastLetter(w) {
  const s = letters(w);
  return s[s.length - 1] || '';
}
const isVowel = (c) => VOWELS.includes(c) || 'âîû'.includes(c);
const h2 = (w) => (BACK.includes(lastVowel(w)) ? 'a' : 'e');
const h4 = (w) => ({ a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' })[lastVowel(w)];

function syllables(word) {
  return [...lower(word)].filter(isVowel).length;
}
// Ünsüz yumuşaması: bıçak → bıçağ-ın, kitap → kitab-ın, ağaç → ağac-ın (çok heceli, cins isim)
function soften(phrase) {
  const parts = phrase.split(' ');
  const w = parts[parts.length - 1];
  if (syllables(w) < 2) return phrase;
  let out = w;
  if (/nk$/.test(w)) out = w.slice(0, -1) + 'g';
  else if (/k$/.test(w)) out = w.slice(0, -1) + 'ğ';
  else if (/p$/.test(w)) out = w.slice(0, -1) + 'b';
  else if (/ç$/.test(w)) out = w.slice(0, -1) + 'c';
  parts[parts.length - 1] = out;
  return parts.join(' ');
}

/** -de/-da/-te/-ta */
export function locative(base, proper = false) {
  const d = HARD.includes(lastLetter(base)) ? 't' : 'd';
  return base + (proper ? "'" : '') + d + h2(base);
}
/** -in/-ın/-un/-ün, ünlüden sonra -nin */
export function genitive(base, proper = false) {
  const v = h4(base);
  if (isVowel(lastLetter(base))) return base + (proper ? "'" : '') + 'n' + v + 'n';
  return (proper ? base : soften(base)) + (proper ? "'" : '') + v + 'n';
}
/** geçmiş zaman eki: kütüphanede → kütüphanedeydi, mutfak → mutfaktı */
export function pastCopula(word) {
  const L = lastLetter(word);
  const v = h4(word);
  if (isVowel(L)) return word + 'yd' + v;
  return word + (HARD.includes(L) ? 't' : 'd') + v;
}

// ---- öğe biçimleri ----
export function itemName(item) {
  if (!item) return '?';
  return item.proper ? item.name : lower(item.name);
}
export function itemGen(item) {
  return item.forms?.gen?.trim() || genitive(itemName(item), item.proper);
}
export function itemLoc(item) {
  return item.forms?.loc?.trim() || locative(itemName(item), item.proper);
}

const CAT_NOUN = { suspect: 'kişi', weapon: 'silah', location: 'yer', motive: 'sebep' };
const TRAIT_PRED = {
  suspect: ['biriydi', 'biri değildi'],
  weapon: ['bir silahtı', 'bir silah değildi'],
  location: ['bir yerdi', 'bir yer değildi'],
  motive: ['bir sebepti', 'bir sebep değildi'],
};

function findItem(data, id) {
  for (const c of data.categories) {
    const it = c.items.find((x) => x.id === id);
    if (it) return { cat: c, item: it };
  }
  return null;
}

/** A öğesinin cümledeki hâlleri (öğe ya da "solak olan kişi" gibi özellik tarifi) */
function subjectForms(data, rule) {
  const f = findItem(data, rule.a);
  if (!f) return null;
  if (rule.aTrait) {
    const base = `${rule.aTrait} olan ${CAT_NOUN[f.cat.key]}`;
    return { key: f.cat.key, base, gen: genitive(base), loc: locative(base) };
  }
  return { key: f.cat.key, base: itemName(f.item), gen: itemGen(f.item), loc: itemLoc(f.item) };
}

function partnerPhrase(A, Y) {
  const X = A.key;
  const mot = `${A.base} sebebiyle hareket eden kişi`;
  const table = {
    'suspect>weapon': `${A.gen} silahı`,
    'suspect>location': `${A.gen} bulunduğu yer`,
    'suspect>motive': `${A.gen} sebebi`,
    'weapon>suspect': `${A.gen} sahibi`,
    'weapon>location': `${A.gen} bulunduğu yer`,
    'weapon>motive': `${A.gen} sahibinin sebebi`,
    'location>suspect': `${A.loc} bulunan kişi`,
    'location>weapon': `${A.loc} bulunan silah`,
    'location>motive': `${A.loc} bulunan kişinin sebebi`,
    'motive>suspect': mot,
    'motive>weapon': `${genitive(mot)} silahı`,
    'motive>location': `${genitive(mot)} bulunduğu yer`,
  };
  return table[`${X}>${Y}`];
}

function namesOf(data, ids) {
  return ids.map((id) => itemName(findItem(data, id)?.item));
}

function idsPredicate(names, neg) {
  if (names.length === 1) return `${names[0]} ${neg ? 'değildi' : 'idi'}`;
  if (names.length === 2) return neg ? `ne ${names[0]} ne de ${names[1]} idi` : `ya ${names[0]} ya da ${names[1]} idi`;
  const head = names.slice(0, -1).join(', ');
  return neg ? `${head} ya da ${names.at(-1)} değildi` : `${head} ya da ${names.at(-1)} idi`;
}

// ---------- dolaylı (sahne) anlatım ----------
// Her öğenin `izler` listesi, onu ADINI SÖYLEMEDEN tarif eden ifadelerdir. Oyuncu bunları
// Dosya'daki açıklamalardan çıkarmalı (Mahzen: "Şarap fıçıları ve tek bir titrek ampul").
//   kişi  → sıfat öbeği; sonuna "biri" eklenir   : "saatine sürekli bakan" → "saatine sürekli bakan biri"
//   yer   → -de hâlinde yer tarifi               : "titrek bir ampulün altında"
//   silah → yalın isim öbeği                     : "gümüş saplı bir şey"
export function itemIzler(item) {
  return (item?.izler || []).map((s) => s.trim()).filter(Boolean);
}

/** Tohumlu rastgele (mulberry32): aynı variant → aynı cümle (önizleme titremesin) */
function rng(seed) {
  let a = Math.floor((seed % 1) * 2 ** 32) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

function phraseRef(key, phrase, kind) {
  if (key === 'suspect') return { nom: `${phrase} biri`, gen: `${phrase} birinin` };
  if (key === 'location') return { loc: kind === 'trait' ? `${phrase} bir yerde` : phrase };
  return { nom: kind === 'trait' ? `${phrase} bir şey` : phrase };
}
function nameRef(key, item) {
  if (key === 'suspect') return { nom: itemName(item), gen: itemGen(item) };
  if (key === 'location') return { loc: itemLoc(item) };
  return { nom: itemName(item) };
}
/** Tek bir öğeye gönderme: izlerinden ya da yalnız ona ait bir özellikten biri; yoksa adı. */
function itemRef(cat, item, rnd) {
  const counts = new Map();
  cat.items.forEach((it) => (it.traits || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const opts = [
    ...itemIzler(item).map((p) => ['iz', p]),
    ...(item.traits || []).filter((t) => counts.get(t) === 1).map((t) => ['trait', t]),
  ];
  if (!opts.length) return nameRef(cat.key, item);
  const [kind, p] = pick(opts, rnd);
  return phraseRef(cat.key, p, kind);
}

// Her kalıp kesin bir mantık ifadesi taşımalı ("görülmedi" gibi kanıt-yokluğu belirsizliği yok).
const SCENES = {
  'location+suspect': {
    pos: [
      ({ S, L }) => `${cap(L.loc)}, ${S.gen} gölgesi gidip geliyordu.`,
      ({ S, L }) => `${cap(S.nom)}, bütün gece ${L.loc} oyalandı.`,
      ({ S, L }) => `${cap(L.loc)} ${S.gen} ayak sesleri yankılanıyordu.`,
    ],
    neg: [
      ({ S, L }) => `${cap(L.loc)} bekleyen kişi ${S.nom} değildi.`,
      ({ S, L }) => `${cap(S.nom)} o gece ${L.loc} hiç bulunmadı.`,
    ],
  },
  'suspect+weapon': {
    pos: [
      ({ S, W }) => `${cap(S.gen)} elinde ${W.nom} vardı.`,
      ({ S, W }) => `${cap(W.nom)} üzerinde ${S.gen} parmak izleri vardı.`,
    ],
    neg: [
      ({ S, W }) => `${cap(S.gen)} elinde ${W.nom} yoktu.`,
      ({ S, W }) => `${cap(W.nom)} hiçbir zaman ${S.gen} eline geçmedi.`,
    ],
  },
  'location+weapon': {
    pos: [
      ({ L, W }) => `${cap(L.loc)} ${W.nom} göze çarpıyordu.`,
      ({ L, W }) => `${cap(W.nom)} bütün gece ${L.loc} duruyordu.`,
    ],
    neg: [
      ({ L, W }) => `${cap(L.loc)} ${W.nom} yoktu.`,
      ({ L, W }) => `${cap(W.nom)} o gece ${L.loc} hiç bulunmadı.`,
    ],
  },
  'murder:location': {
    pos: [
      ({ L }) => `Ceset ${L.loc} bulundu.`,
      ({ L }) => `Son çığlık ${L.loc} yankılandı.`,
    ],
    neg: [
      ({ L }) => `${cap(L.loc)} tek bir damla kan bile yoktu; cinayet orada işlenmedi.`,
      ({ L }) => `Cinayet ${L.loc} işlenmedi.`,
    ],
  },
  'murder:weapon': {
    pos: [({ W }) => `Adli tıp raporu açıktı: ölüm ${W.nom} ile gerçekleşmişti.`],
    neg: [({ W }) => `Adli tıp, kurbanın ${W.nom} ile öldürülmediğini kesin olarak söyledi.`],
  },
  'murder:suspect': {
    pos: [({ S }) => `Kaçan gölgeyi gören tanık, katilin ${S.nom} olduğuna yemin etti.`],
    neg: [({ S }) => `Kaçan gölgeyi gören tanık emindi: katil ${S.nom} değildi.`],
  },
};
const ROLE = { suspect: 'S', location: 'L', weapon: 'W' };

// "ya A ya da B" / "ne A ne de B": X öğesinin Y kategorisindeki eşi iki seçenekten biri(dir/değildir)
function pairScene(Xkey, X, Ykey, [B1, B2], neg) {
  const [ya, da] = neg ? ['ne', 'ne de'] : ['ya', 'ya da'];
  switch (`${Xkey}>${Ykey}`) {
    case 'suspect>location': return `${cap(X.nom)} o gece ${ya} ${B1.loc} ${da} ${pastCopula(B2.loc)}.`;
    case 'weapon>location': return `${cap(X.nom)} o gece ${ya} ${B1.loc} ${da} ${pastCopula(B2.loc)}.`;
    case 'suspect>weapon': return `${cap(X.gen)} elinde ${ya} ${B1.nom} ${da} ${B2.nom} vardı.`;
    case 'location>weapon': return `${cap(X.loc)} ${ya} ${B1.nom} ${da} ${B2.nom} vardı.`;
    case 'location>suspect': return `${cap(X.loc)} bekleyen kişi ${ya} ${B1.nom} ${da} ${B2.nom} idi.`;
    case 'weapon>suspect': return `${cap(X.nom)} ${ya} ${B1.gen} ${da} ${B2.gen} elindeydi.`;
    default: return null;
  }
}

/** Dolaylı sahne cümlesi; desteklenmeyen kural biçiminde null (düz anlatıma düşer). */
function renderScene(rule, data, rnd) {
  const b = rule.b;
  if (b.ids && b.ids.length === 2 && rule.t === 'link') {
    const A = findItem(data, rule.a);
    const Bs = b.ids.map((id) => findItem(data, id));
    if (!A || Bs.some((x) => !x) || !ROLE[A.cat.key] || !ROLE[b.cat]) return null;
    const X = rule.aTrait ? phraseRef(A.cat.key, rule.aTrait, 'trait') : itemRef(A.cat, A.item, rnd);
    return pairScene(A.cat.key, X, b.cat, Bs.map((x) => itemRef(x.cat, x.item, rnd)), rule.neg);
  }
  if (b.ids && b.ids.length !== 1) return null; // 3+ seçenekli kalıplar düz kalır
  const catOf = (key) => data.categories.find((c) => c.key === key);
  const refB = () => {
    if (b.trait) return phraseRef(b.cat, b.trait, 'trait');
    const B = findItem(data, b.ids[0]);
    return B && itemRef(B.cat, B.item, rnd);
  };
  let key;
  const refs = {};
  if (rule.t === 'murder') {
    if (!ROLE[b.cat]) return null;
    key = `murder:${b.cat}`;
    refs[ROLE[b.cat]] = refB();
  } else {
    const A = findItem(data, rule.a);
    if (!A || !ROLE[A.cat.key] || !ROLE[b.cat]) return null;
    key = [A.cat.key, b.cat].sort().join('+');
    refs[ROLE[A.cat.key]] = rule.aTrait ? phraseRef(A.cat.key, rule.aTrait, 'trait') : itemRef(catOf(A.cat.key), A.item, rnd);
    refs[ROLE[b.cat]] = refB();
  }
  const set = SCENES[key]?.[rule.neg ? 'neg' : 'pos'];
  if (!set || Object.values(refs).some((r) => !r)) return null;
  return pick(set, rnd)(refs);
}

/**
 * Kuraldan okunabilir Türkçe cümle üretir.
 * style: 'duz' (isimlerle, varsayılan) | 'dolayli' (izler ve özelliklerle sahne anlatımı)
 */
export function renderRule(rule, data, variant = Math.random(), style = data?.settings?.style) {
  if (!rule) return '';
  if (style === 'dolayli') {
    const scene = renderScene(rule, data, rng(variant));
    if (scene) return scene;
  }
  const b = rule.b;
  if (rule.t === 'murder') return cap(renderMurder(rule, data)) + '.';

  const A = subjectForms(data, rule);
  if (!A) return '';
  const Y = b.cat;

  // Doğal, doğrudan kalıplar (tek öğe ↔ tek öğe)
  if (b.ids?.length === 1 && variant < 0.75) {
    const B = findItem(data, b.ids[0])?.item;
    const pair = [A.key, Y].sort().join('+');
    const Bf = { base: itemName(B), gen: itemGen(B), loc: itemLoc(B) };
    if (pair === 'location+suspect') {
      const S = A.key === 'suspect' ? A : Bf;
      const L = A.key === 'location' ? A : Bf;
      return cap(rule.neg ? `${S.base} ${L.loc} değildi.` : `${S.base} ${pastCopula(L.loc)}.`);
    }
    if (pair === 'location+weapon') {
      const W = A.key === 'weapon' ? A : Bf;
      const L = A.key === 'location' ? A : Bf;
      return cap(rule.neg ? `${W.base} ${L.loc} değildi.` : `${W.base} ${pastCopula(L.loc)}.`);
    }
    if (pair === 'suspect+weapon') {
      const S = A.key === 'suspect' ? A : Bf;
      const W = A.key === 'weapon' ? A : Bf;
      return cap(rule.neg ? `${W.base} ${S.gen} elinde değildi.` : `${W.base} ${S.gen} elindeydi.`);
    }
  }

  const subj = partnerPhrase(A, Y);
  if (b.trait) {
    const [pos, negP] = TRAIT_PRED[Y];
    return cap(`${subj} ${b.trait} ${rule.neg ? negP : pos}.`);
  }
  return cap(`${subj} ${idsPredicate(namesOf(data, b.ids), rule.neg)}.`);
}

function renderMurder(rule, data) {
  const { b, neg } = rule;
  if (b.trait) {
    const t = b.trait;
    switch (b.cat) {
      case 'suspect': return `katil ${t} ${neg ? 'biri değildi' : 'biriydi'}`;
      case 'weapon': return `cinayet silahı ${t} ${neg ? 'bir silah değildi' : 'bir silahtı'}`;
      case 'location': return `cinayet ${t} bir yerde ${neg ? 'işlenmedi' : 'işlendi'}`;
      default: return `cinayetin sebebi ${t} ${neg ? 'bir sebep değildi' : 'bir sebepti'}`;
    }
  }
  const names = namesOf(data, b.ids);
  switch (b.cat) {
    case 'suspect': return `katil ${idsPredicate(names, neg)}`;
    case 'weapon': return `cinayet silahı ${idsPredicate(names, neg)}`;
    case 'location': {
      if (names.length === 1) {
        const B = findItem(data, b.ids[0]).item;
        return `cinayet ${itemLoc(B)} ${neg ? 'işlenmedi' : 'işlendi'}`;
      }
      return `cinayetin işlendiği yer ${idsPredicate(names, neg)}`;
    }
    default: return `cinayetin sebebi ${idsPredicate(names, neg)}`;
  }
}

/** Admin panelinde kısa kural özeti */
export function ruleSummary(rule, data) {
  if (!rule) return 'serbest metin';
  const nm = (id) => findItem(data, id)?.item?.name ?? '?';
  const sel = rule.b.trait ? `«${rule.b.trait}» (${rule.b.cat})` : rule.b.ids.map(nm).join(' | ');
  const op = rule.neg ? '≠' : '=';
  if (rule.t === 'murder') return `CİNAYET ${op} ${sel}`;
  return `${rule.aTrait ? `«${rule.aTrait}» ` : ''}${nm(rule.a)} ${op} ${sel}`;
}
