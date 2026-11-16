// Oyun motoru: kaba kuvvet çözücü, benzersizlik kontrolü ve ipucu üretici.
//
// Model: categories[0] her zaman şüphelilerdir. Her şüpheli diğer her kategoriden
// tam olarak BİR öğeyle eşleşir (permütasyon). Katil şüphelilerden biridir;
// cinayet = katilin eşleşmesi (silahı, yeri, sebebi).
//
// Kural biçimleri (clue.rule):
//   { t:'link',   a:<öğeId>, aTrait?:<metin>, b:{cat, ids:[...]} | {cat, trait}, neg:bool }
//       → a'nın b.cat kategorisindeki eşi, b kümesinde(dir/değildir)
//   { t:'murder', b:{cat, ids|trait}, neg:bool }
//       → cinayetin b.cat bileşeni b kümesinde(dir/değildir)
// clue.speaker = şüpheliId ise bu bir İFADEDİR: katil yalan söyler, diğerleri doğruyu.

import { renderRule } from './tr.js';

export const CAT_META = {
  suspect: { label: 'Şüpheliler', one: 'Kim?', prefix: 's' },
  weapon: { label: 'Silahlar', one: 'Neyle?', prefix: 'w' },
  location: { label: 'Yerler', one: 'Nerede?', prefix: 'l' },
  motive: { label: 'Sebepler', one: 'Neden?', prefix: 'm' },
};

export const LIMITS = { minN: 3, maxN: 5, maxNWithMotive: 4 };

// ---------- indeksleme ----------
export function buildIndex(data) {
  const cats = data.categories;
  const N = cats[0].items.length;
  const pos = new Map();
  cats.forEach((c, ci) => c.items.forEach((it, ii) => pos.set(it.id, { c: ci, i: ii })));
  const catIdx = Object.fromEntries(cats.map((c, ci) => [c.key, ci]));
  return { cats, N, K: cats.length, pos, catIdx };
}

function permutations(n) {
  const out = [];
  const a = [...Array(n).keys()];
  const rec = (k) => {
    if (k === n) return out.push(a.slice());
    for (let i = k; i < n; i++) {
      [a[k], a[i]] = [a[i], a[k]];
      rec(k + 1);
      [a[k], a[i]] = [a[i], a[k]];
    }
  };
  rec(0);
  return out;
}
const inverse = (p) => {
  const inv = new Array(p.length);
  p.forEach((v, i) => (inv[v] = i));
  return inv;
};

/** Tüm olası dünyaları üretir: her kategori için bir permütasyon × katil seçimi */
export function enumerateStates(N, K) {
  const perms = permutations(N).map((p) => ({ p, inv: inverse(p) }));
  const id = [...Array(N).keys()];
  const states = [];
  const rec = (depth, p, inv) => {
    if (depth === K) {
      for (let k = 0; k < N; k++) states.push({ p, inv, k });
      return;
    }
    for (const pr of perms) rec(depth + 1, [...p, pr.p], [...inv, pr.inv]);
  };
  rec(1, [id], [id]);
  return states;
}

export function stateCount(N, K) {
  let f = 1;
  for (let i = 2; i <= N; i++) f *= i;
  return Math.pow(f, K - 1) * N;
}

// ---------- kural derleme ----------
function selectorSet(idx, sel) {
  const ci = idx.catIdx[sel.cat];
  if (ci === undefined) return null;
  const items = idx.cats[ci].items;
  const set = new Set();
  if (sel.trait) items.forEach((it, i) => (it.traits || []).includes(sel.trait) && set.add(i));
  else (sel.ids || []).forEach((id) => {
    const p = idx.pos.get(id);
    if (p && p.c === ci) set.add(p.i);
  });
  return { ci, set };
}

export function compileRule(rule, idx) {
  if (!rule || !rule.b) return null;
  const s = selectorSet(idx, rule.b);
  if (!s) return null;
  const { ci: Y, set } = s;
  const neg = !!rule.neg;
  if (rule.t === 'murder') {
    return (st) => set.has(Y === 0 ? st.k : st.p[Y][st.k]) !== neg;
  }
  if (rule.t === 'link') {
    const a = idx.pos.get(rule.a);
    if (!a || a.c === Y) return null;
    const { c: X, i: ai } = a;
    return (st) => {
      const sus = X === 0 ? ai : st.inv[X][ai];
      return set.has(Y === 0 ? sus : st.p[Y][sus]) !== neg;
    };
  }
  return null;
}

export function compileClue(clue, idx) {
  const fn = compileRule(clue.rule, idx);
  if (!fn) return null;
  if (clue.speaker) {
    const sp = idx.pos.get(clue.speaker);
    if (!sp || sp.c !== 0) return fn;
    const si = sp.i;
    return (st) => fn(st) === (st.k !== si); // katil yalan söyler
  }
  return fn;
}

// ---------- gerçek çözüm ----------
export function realState(data, idx = buildIndex(data)) {
  const { cats, N, K } = idx;
  const p = [[...Array(N).keys()]];
  for (let c = 1; c < K; c++) {
    const arr = new Array(N).fill(-1);
    cats[0].items.forEach((s, si) => {
      const id = data.solution?.[s.id]?.[cats[c].key];
      const pp = idx.pos.get(id);
      if (pp && pp.c === c) arr[si] = pp.i;
    });
    p.push(arr);
  }
  const k = cats[0].items.findIndex((s) => s.id === data.killer);
  const valid = k >= 0 && p.every((arr) => new Set(arr).size === N && !arr.includes(-1));
  return valid ? { p, inv: p.map(inverse), k } : null;
}

/** Çözümden okunabilir cevap: { suspect, weapon, location, motive? } (id'ler) */
export function murderAnswer(data) {
  const out = { suspect: data.killer };
  for (const c of data.categories.slice(1)) out[c.key] = data.solution?.[data.killer]?.[c.key];
  return out;
}

export function isCorrectAnswer(data, answer) {
  const truth = murderAnswer(data);
  return data.categories.every((c) => answer?.[c.key] && answer[c.key] === truth[c.key]);
}

// ---------- doğrulama ----------
export function checkCase(data) {
  const idx = buildIndex(data);
  const real = realState(data, idx);
  const compiled = data.clues.map((c) => ({ clue: c, fn: compileClue(c, idx) }));
  const active = compiled.filter((x) => x.fn);
  const states = enumerateStates(idx.N, idx.K);
  const alive = states.filter((st) => active.every((x) => x.fn(st)));
  const answers = new Set(alive.map((st) => answerKey(st, idx)));
  return {
    solutionValid: !!real,
    total: states.length,
    remaining: alive.length,
    unique: alive.length === 1,
    answerUnique: answers.size === 1,
    possibleAnswers: answers.size,
    matchesReal: !!real && alive.length >= 1 && alive.some((st) => sameState(st, real)),
    falseClues: real ? active.filter((x) => !x.fn(real)).map((x) => x.clue.id) : [],
    freeTextClues: compiled.filter((x) => !x.fn).map((x) => x.clue.id),
  };
}

function answerKey(st, idx) {
  return [st.k, ...st.p.slice(1).map((arr) => arr[st.k])].join(',');
}
function sameState(a, b) {
  return a.k === b.k && a.p.every((arr, c) => arr.every((v, i) => v === b.p[c][i]));
}

// ---------- rastgele çözüm ----------
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSolution(data) {
  const cats = data.categories;
  const solution = {};
  const shuffled = cats.slice(1).map((c) => shuffle(c.items.map((x) => x.id)));
  cats[0].items.forEach((s, si) => {
    solution[s.id] = {};
    cats.slice(1).forEach((c, j) => (solution[s.id][c.key] = shuffled[j][si]));
  });
  const killer = cats[0].items[Math.floor(Math.random() * cats[0].items.length)].id;
  return { solution, killer };
}

// ---------- ipucu üretici ----------
const uid = () => 'c' + Math.random().toString(36).slice(2, 9);

function traitsOf(items) {
  const counts = new Map();
  items.forEach((it) => (it.traits || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  return counts;
}

/** Gerçek çözümde DOĞRU olan tüm aday kurallar (ağırlıklı) */
function candidateRules(data, idx, real, difficulty) {
  const { cats, N, K } = idx;
  const out = [];
  const W = {
    kolay: { pos: 3, neg: 2, one: 1, tpos: 2, tneg: 1, mpos: 2, mneg: 2 },
    orta: { pos: 1, neg: 3, one: 2, tpos: 3, tneg: 2, mpos: 1, mneg: 2 },
    zor: { pos: 0.15, neg: 3, one: 3, tpos: 3, tneg: 3, mpos: 0.3, mneg: 2 },
  }[difficulty] || {};
  const partner = (X, ai, Y) => {
    const sus = X === 0 ? ai : real.inv[X][ai];
    return Y === 0 ? sus : real.p[Y][sus];
  };
  const traitCounts = cats.map((c) => traitsOf(c.items));
  const uniqueTrait = (X, ai) => {
    const ts = (cats[X].items[ai].traits || []).filter((t) => traitCounts[X].get(t) === 1);
    return ts.length ? ts[Math.floor(Math.random() * ts.length)] : null;
  };
  const push = (rule, w) => {
    if (w <= 0) return;
    // özellik tarifiyle anlatım ("solak olan kişi…"): oyuncu kartlardan çıkarım yapsın
    if (rule.t === 'link' && Math.random() < (difficulty === 'kolay' ? 0.1 : 0.35)) {
      const a = idx.pos.get(rule.a);
      const t = uniqueTrait(a.c, a.i);
      if (t) rule = { ...rule, aTrait: t };
    }
    out.push({ rule, w });
  };

  for (let X = 0; X < K; X++) {
    for (let Y = 0; Y < K; Y++) {
      if (X === Y) continue;
      const catY = cats[Y];
      const traitsY = traitCounts[Y];
      for (let ai = 0; ai < N; ai++) {
        const a = cats[X].items[ai].id;
        const pi = partner(X, ai, Y);
        const p = catY.items[pi];
        if (X < Y) {
          push({ t: 'link', a, b: { cat: catY.key, ids: [p.id] }, neg: false }, W.pos);
          catY.items.forEach((q, qi) => qi !== pi &&
            push({ t: 'link', a, b: { cat: catY.key, ids: [q.id] }, neg: true }, W.neg / (N - 1) * 1.5));
          if (N >= 4) {
            const others = catY.items.filter((_, qi) => qi !== pi);
            const q = others[Math.floor(Math.random() * others.length)];
            push({ t: 'link', a, b: { cat: catY.key, ids: shuffle([p.id, q.id]) }, neg: false }, W.one);
          }
        }
        // özellik ipuçları: yalnızca her öğede olmayan özellikler bilgi taşır
        for (const [t, n] of traitsY) {
          if (n >= N) continue;
          const has = (p.traits || []).includes(t);
          if (has) push({ t: 'link', a, b: { cat: catY.key, trait: t }, neg: false }, W.tpos / 2);
          else push({ t: 'link', a, b: { cat: catY.key, trait: t }, neg: true }, W.tneg / 2);
        }
      }
    }
  }
  // cinayet ipuçları
  for (let Y = 0; Y < K; Y++) {
    const catY = cats[Y];
    const mi = Y === 0 ? real.k : real.p[Y][real.k];
    catY.items.forEach((q, qi) => {
      if (qi === mi) {
        if (Y !== 0) push({ t: 'murder', b: { cat: catY.key, ids: [q.id] }, neg: false }, W.mpos);
      } else push({ t: 'murder', b: { cat: catY.key, ids: [q.id] }, neg: true }, W.mneg / (N - 1) * 1.5);
    });
    for (const [t, n] of traitCounts[Y]) {
      if (n >= N) continue;
      const has = (catY.items[mi].traits || []).includes(t);
      push({ t: 'murder', b: { cat: catY.key, trait: t }, neg: !has }, has ? W.tpos : W.tneg);
    }
  }
  return out;
}

function weightedOrder(cands) {
  // Efraimidis–Spirakis ağırlıklı karıştırma
  return cands
    .map((c) => ({ c, key: Math.pow(Math.random(), 1 / Math.max(c.w, 1e-6)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.c);
}

/**
 * Gerçek çözümü tek başına belirleyen minimal bir ipucu seti üretir.
 * opts: { difficulty: 'kolay'|'orta'|'zor', liar: bool, keepManual: bool, style: 'duz'|'dolayli' }
 */
export function generateClues(data, opts = {}) {
  const difficulty = opts.difficulty || 'orta';
  const style = opts.style ?? data.settings?.style;
  const idx = buildIndex(data);
  const real = realState(data, idx);
  if (!real) throw new Error('Önce geçerli bir çözüm (her şüpheliye farklı silah/yer) ve katil seçin.');

  const states = enumerateStates(idx.N, idx.K);
  const fixed = []; // budanmayacak ipuçları: elle eklenenler + ifadeler
  if (opts.keepManual) {
    for (const c of data.clues || []) if (!c.auto) fixed.push(c);
  }

  const cands = candidateRules(data, idx, real, difficulty);

  if (opts.liar) {
    // Her şüpheli bir ifade verir; katilinki yanlış, diğerleri doğru
    const pool = weightedOrder(cands.filter((c) => c.rule.t === 'link' || c.rule.b.cat !== 'suspect'));
    idx.cats[0].items.forEach((s, si) => {
      const isKiller = si === real.k;
      const pick = pool.shift();
      const rule = isKiller ? { ...pick.rule, neg: !pick.rule.neg } : pick.rule;
      if (isKiller && rule.b.ids?.length > 1) rule.neg = true; // "ne A ne B" biçimi
      fixed.push({ id: uid(), text: renderRule(rule, data, Math.random(), style), rule, speaker: s.id, auto: true });
    });
  }

  const fixedFns = fixed.map((c) => compileClue(c, idx)).filter(Boolean);
  let alive = states.filter((st) => fixedFns.every((f) => f(st)));
  const chosen = [];

  const tryPool = (pool) => {
    for (const c of weightedOrder(pool)) {
      if (alive.length <= 1) return;
      const fn = compileRule(c.rule, idx);
      const next = alive.filter(fn);
      if (next.length < alive.length && next.length >= 1) {
        alive = next;
        chosen.push({ rule: c.rule, fn });
      }
    }
  };
  tryPool(cands);
  if (alive.length > 1) {
    // yedek: tüm doğrudan eşleşmeler (her zaman benzersizliğe götürür)
    tryPool(candidateRules(data, idx, real, 'kolay'));
  }
  if (alive.length !== 1) throw new Error('Benzersiz çözüm üretilemedi — tekrar deneyin.');

  // Budama: gereksiz ipuçlarını at
  shuffle(chosen);
  for (let i = chosen.length - 1; i >= 0; i--) {
    const rest = chosen.filter((_, j) => j !== i);
    let count = 0;
    for (const st of states) {
      if (fixedFns.every((f) => f(st)) && rest.every((c) => c.fn(st))) {
        if (++count > 1) break;
      }
    }
    if (count === 1) chosen.splice(i, 1);
  }

  const generated = chosen.map((c) => ({ id: uid(), text: renderRule(c.rule, data, Math.random(), style), rule: c.rule, auto: true }));
  // ifadeler sona, cinayet ipuçları en sona yakın
  const order = (c) => (c.speaker ? 2 : c.rule?.t === 'murder' ? 1 : 0);
  const normal = shuffle(generated).sort((a, b) => order(a) - order(b));
  const manual = fixed.filter((c) => !c.speaker);
  const statements = fixed.filter((c) => c.speaker);
  return [...manual, ...normal, ...statements];
}

// ---------- boş vaka şablonu ----------
export function makeItems(key, n, existing = []) {
  const p = CAT_META[key].prefix;
  const items = existing.slice(0, n);
  const used = new Set(items.map((x) => x.id));
  let k = 1;
  while (items.length < n) {
    while (used.has(p + k)) k++;
    used.add(p + k);
    items.push({ id: p + k, name: '', emoji: '', desc: '', traits: [], izler: [], proper: key === 'suspect' });
  }
  return items;
}

export function blankCase(N = 4, motive = false) {
  const keys = ['suspect', 'weapon', 'location', ...(motive ? ['motive'] : [])];
  return {
    title: '',
    story: '',
    settings: { difficulty: 'zor', liar: false, style: 'dolayli' },
    categories: keys.map((key) => ({ key, label: CAT_META[key].label, items: makeItems(key, N) })),
    solution: {},
    killer: null,
    clues: [],
  };
}
