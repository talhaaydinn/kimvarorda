// "Tablo nasıl doldurulur?" videosu: tıklama döngüsü (boş → ✕ → ✓ → boş), satır/sütun kuralı,
// uydurma bir mini vakayla adım adım eleme ve basamaklı tablonun tamamı.
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { C, MONO, SANS, SERIF } from '../theme.js';
import { FPS, cue, makeTimeline } from '../timeline.js';
import { Background, Brand, Kicker, Sfx, Stage, Track, clamp, fadeUp, useSpring } from '../ui.jsx';
import { SCENES, SITE } from './script.js';
import manifest from './voice-manifest.json';

const { TIMELINE, TOTAL } = makeTimeline(SCENES, manifest, { lead: 0.25 });
export const TABLO_TOTAL = TOTAL;

// ---------- Uydurma örnek ----------
const SUS = [
  { id: 's1', name: 'Selim', emoji: '🎩' },
  { id: 's2', name: 'Leyla', emoji: '🎤' },
  { id: 's3', name: 'Rıza', emoji: '🌿' },
];
const WEP = [
  { id: 'w1', name: 'Şamdan', emoji: '🕯️' },
  { id: 'w2', name: 'Zehirli çay', emoji: '🍵' },
  { id: 'w3', name: 'Perde kordonu', emoji: '🪢' },
];
const LOC = [
  { id: 'l1', name: 'Kütüphane', emoji: '📚' },
  { id: 'l2', name: 'Limonluk', emoji: '🍋' },
  { id: 'l3', name: 'Mahzen', emoji: '🍷' },
];
// Örneğin çözümü (yalnızca bu videoya özel)
const SOL = { s1: ['w3', 'l1'], s2: ['w2', 'l2'], s3: ['w1', 'l3'] };

const key = (a, b) => `${a}|${b}`;

/** Olay listesinden (k, v, at) o karedeki işaretler: { k: { v, at } } — v: 1 = ✕, 2 = ✓, 0 = boş */
function marksAt(frame, events) {
  const m = {};
  for (const e of events) {
    if (frame < e.at) continue;
    if (e.v) m[e.k] = { v: e.v, at: e.at };
    else delete m[e.k];
  }
  return m;
}

// ---------- Büyük 3×3 blok ----------
const HEAD_W = 290;
const HEAD_H = 150;

function Cell({ mark, size, glow }) {
  const frame = useCurrentFrame();
  const p = mark ? spring({ frame: frame - mark.at, fps: FPS, config: { damping: 10, stiffness: 200 } }) : 0;
  const v = mark?.v;
  return (
    <div
      style={{
        width: size, height: size, display: 'grid', placeItems: 'center', boxSizing: 'border-box',
        border: `2px solid ${glow ? C.gold : C.line2}`,
        background: v === 2 ? 'rgba(95,211,154,0.16)' : C.surface,
        boxShadow: glow ? `0 0 0 4px ${C.gold}, 0 0 40px rgba(242,184,75,0.45)` : 'none',
        position: 'relative', zIndex: glow ? 2 : 1,
        fontFamily: SANS, fontWeight: 700, fontSize: size * 0.55, color: v === 2 ? C.ok : C.bad,
      }}
    >
      {v ? <span style={{ transform: `scale(${0.3 + p * 0.7})`, opacity: Math.min(1, p * 1.5) }}>{v === 2 ? '✓' : '✕'}</span> : null}
    </div>
  );
}

/**
 * rows × cols bloğu. marks: { k: {v,at} }. hlRow / hlCol: vurgulanan satır/sütun indeksi (veya null), op: vurgu opaklığı.
 * glow: parlayan hücre anahtarı. children: blok üstüne mutlak konumlanan katmanlar (imleç vb.)
 */
function Block({ rows, cols, marks = {}, size = 168, hlRow = null, hlRowOp = 1, hlCol = null, hlColOp = 1, glow = null, rowColor = C.suspect, colColor = C.weapon, children, style }) {
  const W = HEAD_W + cols.length * size;
  const H = HEAD_H + rows.length * size;
  return (
    <div style={{ position: 'relative', width: W, height: H, ...style }}>
      {/* vurgu bantları */}
      {hlRow != null && (
        <div style={{ position: 'absolute', left: 0, top: HEAD_H + hlRow * size, width: W, height: size, background: 'rgba(242,184,75,0.16)', borderRadius: 14, opacity: hlRowOp }} />
      )}
      {hlCol != null && (
        <div style={{ position: 'absolute', left: HEAD_W + hlCol * size, top: 0, width: size, height: H, background: 'rgba(242,184,75,0.16)', borderRadius: 14, opacity: hlColOp }} />
      )}
      {/* sütun başlıkları */}
      {cols.map((c, j) => (
        <div key={c.id} style={{ position: 'absolute', left: HEAD_W + j * size, top: 0, width: size, height: HEAD_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12, boxSizing: 'border-box' }}>
          <div style={{ fontSize: 58 }}>{c.emoji}</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 25, color: colColor, textAlign: 'center', lineHeight: 1.1 }}>{c.name}</div>
        </div>
      ))}
      {/* satır başlıkları */}
      {rows.map((r, i) => (
        <div key={r.id} style={{ position: 'absolute', left: 0, top: HEAD_H + i * size, width: HEAD_W - 16, height: size, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: rowColor }}>{r.name}</span>
          <span style={{ fontSize: 54 }}>{r.emoji}</span>
        </div>
      ))}
      {/* hücreler */}
      <div style={{ position: 'absolute', left: HEAD_W, top: HEAD_H, display: 'grid', gridTemplateColumns: `repeat(${cols.length}, ${size}px)`, borderRadius: 12, overflow: 'visible' }}>
        {rows.map((r) => cols.map((c) => <Cell key={key(r.id, c.id)} size={size} mark={marks[key(r.id, c.id)]} glow={glow === key(r.id, c.id)} />))}
      </div>
      {children}
    </div>
  );
}

/** Hücre merkezi (Block koordinatlarında) */
const cellXY = (i, j, size = 168) => [HEAD_W + j * size + size / 2, HEAD_H + i * size + size / 2];

/** Hedefler arasında kayan ve tıklayan imleç. path: [{ at, x, y, click? }] */
function Cursor({ path, appear = 0 }) {
  const frame = useCurrentFrame();
  if (!path.length) return null;
  let x = path[0].x;
  let y = path[0].y;
  for (let n = 1; n < path.length; n++) {
    const a = path[n - 1];
    const b = path[n];
    const t = interpolate(frame, [b.at - 12, b.at - 2], [0, 1], clamp);
    if (frame >= b.at - 12) {
      const e = t * t * (3 - 2 * t);
      x = a.x + (b.x - a.x) * e;
      y = a.y + (b.y - a.y) * e;
    }
  }
  const clicks = path.filter((p) => p.click);
  const press = clicks.some((p) => frame >= p.at && frame < p.at + 4);
  const op = interpolate(frame, [appear, appear + 8], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 5, opacity: op }}>
      {clicks.map((p, i) => {
        const r = interpolate(frame, [p.at, p.at + 14], [0, 1], clamp);
        if (frame < p.at || r >= 1) return null;
        return <div key={i} style={{ position: 'absolute', left: p.x - 60, top: p.y - 60, width: 120, height: 120, borderRadius: 999, border: `5px solid ${C.text}`, opacity: 1 - r, transform: `scale(${0.3 + r})` }} />;
      })}
      <svg width={70} height={84} viewBox="0 0 70 84" style={{ position: 'absolute', left: x - 8, top: y - 4, transform: `scale(${press ? 0.85 : 1})`, transformOrigin: '8px 4px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }}>
        <path d="M8,4 L8,64 L22,51 L32,74 L42,70 L32,47 L52,47 Z" fill="#f1eadc" stroke="#0e0d0b" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ---------- Basamaklı tablonun tamamı (sitedeki gibi: Ş×S, Ş×Y üstte; Y×S altta) ----------
function Staircase({ size = 92, fillAt = () => null, headScale = 1 }) {
  const frame = useCurrentFrame();
  const hw = 150 * headScale;
  const hh = 110 * headScale;
  const blocks = [
    { rows: SUS, cols: WEP, x: 0, y: 0, tick: (r, c) => SOL[r.id][0] === c.id, rc: C.suspect, cc: C.weapon },
    { rows: SUS, cols: LOC, x: 3, y: 0, tick: (r, c) => SOL[r.id][1] === c.id, rc: C.suspect, cc: C.location },
    { rows: LOC, cols: WEP, x: 0, y: 3, tick: (r, c) => Object.values(SOL).some(([w, l]) => l === r.id && w === c.id), rc: C.location, cc: C.weapon },
  ];
  const W = hw + 6 * size;
  const H = hh + 6 * size;
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {[...WEP, ...LOC].map((c, j) => (
        <div key={c.id} style={{ position: 'absolute', left: hw + j * size, top: 0, width: size, height: hh, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, boxSizing: 'border-box' }}>
          <div style={{ fontSize: size * 0.5 }}>{c.emoji}</div>
        </div>
      ))}
      {[...SUS, ...LOC].map((r, i) => (
        <div key={r.id + i} style={{ position: 'absolute', left: 0, top: hh + i * size, width: hw - 10, height: size, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: size * 0.27, color: i < 3 ? C.suspect : C.location }}>{r.name}</span>
          <span style={{ fontSize: size * 0.42 }}>{r.emoji}</span>
        </div>
      ))}
      {blocks.map((b, bi) =>
        b.rows.map((r, i) =>
          b.cols.map((c, j) => {
            const at = fillAt(bi, i, j);
            const isTick = b.tick(r, c);
            const mark = at != null && frame >= at ? { v: isTick ? 2 : 1, at } : null;
            const p = mark ? spring({ frame: frame - at, fps: FPS, config: { damping: 11, stiffness: 200 } }) : 0;
            return (
              <div
                key={`${bi}-${i}-${j}`}
                style={{
                  position: 'absolute', left: hw + (b.x + j) * size, top: hh + (b.y + i) * size, width: size, height: size, boxSizing: 'border-box',
                  border: `2px solid ${C.line2}`, background: mark?.v === 2 ? 'rgba(95,211,154,0.18)' : C.surface,
                  display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: size * 0.52, color: mark?.v === 2 ? C.ok : C.bad,
                }}
              >
                {mark && <span style={{ transform: `scale(${0.3 + p * 0.7})`, opacity: Math.min(1, p * 1.5) }}>{mark.v === 2 ? '✓' : '✕'}</span>}
              </div>
            );
          }),
        ),
      )}
      {/* blok ayraçları */}
      <div style={{ position: 'absolute', left: hw + 3 * size - 2, top: hh, width: 4, height: 3 * size, background: C.line2 }} />
      <div style={{ position: 'absolute', left: hw, top: hh + 3 * size - 2, width: 3 * size, height: 4, background: C.line2 }} />
    </div>
  );
}

// ---------- Sahneler ----------
function Giris({ s }) {
  const frame = useCurrentFrame();
  const t = useSpring(2);
  // dekor: hücreler rastgele sırayla dolar
  const order = (bi, i, j) => ((bi * 9 + i * 3 + j) * 7) % 27;
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>Rehber</Kicker>
      <div style={{ marginTop: 20, fontFamily: SERIF, fontWeight: 900, fontSize: 112, lineHeight: 1, color: C.text, textAlign: 'center', ...fadeUp(t) }}>
        Tabloyla<br />çözüm
      </div>
      <div style={{ marginTop: 60, opacity: interpolate(frame, [6, 18], [0, 1], clamp) }}>
        <Staircase size={88} fillAt={(bi, i, j) => 14 + order(bi, i, j) * 3} />
      </div>
      <Sfx name="hit" at={0} volume={0.5} />
    </Stage>
  );
}

function Kutu({ s }) {
  const frame = useCurrentFrame();
  const aRow = cue(s, 'bu kişi', 0.4);
  const aCol = cue(s, 'bu silahı', 0.6);
  const rowOp = interpolate(frame, [aRow, aRow + 8], [0, 1], clamp);
  const colOp = interpolate(frame, [aCol, aCol + 8], [0, 1], clamp);
  const q = useSpring(aCol + 4);
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>Her kutu bir soru</Kicker>
      <div style={{ marginTop: 50, ...fadeUp(useSpring(3)) }}>
        <Block rows={SUS} cols={WEP} hlRow={0} hlRowOp={rowOp} hlCol={0} hlColOp={colOp} glow={frame >= aCol ? key('s1', 'w1') : null} />
      </div>
      <div style={{ marginTop: 50, background: C.gold, color: '#1a0905', borderRadius: 24, padding: '18px 34px', fontFamily: SANS, fontWeight: 700, fontSize: 44, whiteSpace: 'nowrap', opacity: q, transform: `scale(${0.6 + q * 0.4})` }}>
        🎩 Selim + 🕯️ Şamdan ?
      </div>
      <Sfx name="pop" at={aRow} volume={0.35} />
      <Sfx name="pop" at={aCol} volume={0.35} />
    </Stage>
  );
}

function Tik({ s }) {
  const frame = useCurrentFrame();
  const a1 = cue(s, 'bir kez', 0.15) + 6;
  const a2 = cue(s, 'İkinci kez', 0.45) + 6;
  const a3 = cue(s, 'Üçüncü', 0.75) + 6;
  const k = key('s2', 'w2');
  const marks = marksAt(frame, [{ k, v: 1, at: a1 }, { k, v: 2, at: a2 }, { k, v: 0, at: a3 }]);
  const [x, y] = cellXY(1, 1);
  const steps = [
    ['1. tık', '✕', 'Olamaz', C.bad, a1],
    ['2. tık', '✓', 'Kesin', C.ok, a2],
    ['3. tık', '▢', 'Boş', C.muted, a3],
  ];
  const active = frame >= a3 ? 2 : frame >= a2 ? 1 : frame >= a1 ? 0 : -1;
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>Tıkla ve işaretle</Kicker>
      <div style={{ marginTop: 40 }}>
        <Block rows={SUS} cols={WEP} marks={marks} glow={k}>
          <Cursor appear={4} path={[{ at: 0, x: x + 220, y: y + 260 }, { at: a1, x, y, click: true }, { at: a2, x, y, click: true }, { at: a3, x, y, click: true }]} />
        </Block>
      </div>
      <div style={{ marginTop: 50, display: 'flex', gap: 18 }}>
        {steps.map(([n, sym, word, color, at], i) => {
          const p = spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 160 } });
          const on = active === i;
          return (
            <div key={n} style={{ width: 270, padding: '20px 0', borderRadius: 24, textAlign: 'center', background: on ? 'rgba(27,25,21,0.95)' : 'rgba(27,25,21,0.6)', border: `3px solid ${on ? color : C.line}`, opacity: 0.25 + p * 0.75, transform: `scale(${on ? 1.06 : 1})` }}>
              <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 26, color: C.muted }}>{n}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 72, lineHeight: 1.1, color }}>{sym}</div>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: C.text }}>{word}</div>
            </div>
          );
        })}
      </div>
      {[a1, a2, a3].map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.5} />)}
    </Stage>
  );
}

function Kural({ s }) {
  const frame = useCurrentFrame();
  const aR = cue(s, 'satırda', 0.3);
  const aC = cue(s, 'sütunda', 0.45);
  const aW = cue(s, 'Çünkü', 0.7);
  const rowOp = interpolate(frame, [aR, aR + 8], [0, 1], clamp);
  const colOp = interpolate(frame, [aC, aC + 8], [0, 1], clamp);
  // Kuralı göstermek için: satırda tek ✓, sütunda tek ✓ (örneğin sonundaki Rıza–Şamdan)
  const marks = {};
  if (frame >= aR + 6) marks[key('s3', 'w1')] = { v: 2, at: aR + 6 };
  if (frame >= aR + 14) ['w2', 'w3'].forEach((w, i) => (marks[key('s3', w)] = { v: 1, at: aR + 14 + i * 3 }));
  if (frame >= aC + 8) ['s1', 's2'].forEach((r, i) => (marks[key(r, 'w1')] = { v: 1, at: aC + 8 + i * 3 }));
  const w = useSpring(aW);
  return (
    <Stage>
      <Kicker color={C.gold} style={fadeUp(useSpring(0))}>Altın kural</Kicker>
      <div style={{ marginTop: 40 }}>
        <Block rows={SUS} cols={WEP} marks={marks} hlRow={2} hlRowOp={rowOp} hlCol={0} hlColOp={colOp} />
      </div>
      <div style={{ marginTop: 46, display: 'grid', gap: 14, justifyItems: 'center' }}>
        {[['Her satırda', aR], ['Her sütunda', aC]].map(([t, at]) => (
          <div key={t} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: C.text, ...fadeUp(spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 140 } })) }}>
            {t} <span style={{ color: C.ok }}>tek ✓</span>
          </div>
        ))}
        <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.muted, ...fadeUp(w) }}>
          1 şüpheli = <span style={{ color: C.weapon }}>1 silah</span>
        </div>
      </div>
      <Sfx name="pop" at={aR + 6} volume={0.4} />
      <Sfx name="pop" at={aC + 8} volume={0.4} />
    </Stage>
  );
}

// Örnek: üç adımda bloğu çöz. Her adım öncekilerin işaretleriyle başlar.
function ornekEvents(step, s) {
  const ev = [];
  const old = -100;
  const add = (r, c, v, at) => ev.push({ k: key(r, c), v, at });
  const clicks = [];
  // 1. adım
  const t1 = step === 1 ? cue(s, 'kutusuna çarpı', 0.8) : old;
  add('s1', 'w1', 1, t1);
  if (step === 1) clicks.push([0, 0, t1]);
  if (step >= 2) {
    const t2 = step === 2 ? cue(s, 'kutuya tik', 0.4) + 8 : old;
    const tx = step === 2 ? cue(s, 'kendiliğinden', 0.75) : old;
    add('s2', 'w2', 2, t2);
    if (step === 2) clicks.push([1, 1, t2]);
    [['s2', 'w1'], ['s2', 'w3'], ['s1', 'w2'], ['s3', 'w2']].forEach(([r, c], i) => add(r, c, 1, tx + i * 4));
  }
  if (step >= 3) {
    const t3 = cue(s, 'perde kordonu', 0.55);
    const t4 = cue(s, 'şamdan düşer', 0.85);
    add('s1', 'w3', 2, t3);
    add('s3', 'w3', 1, t3 + 10);
    add('s3', 'w1', 2, t4);
    clicks.push([0, 2, t3], [2, 0, t4]);
  }
  return { ev, clicks };
}

const CLUE = {
  1: { label: 'İpucu', text: 'Selim şamdana hiç dokunmadı.', color: C.accent },
  2: { label: 'İpucu', text: 'Zehirli çay Leyla’nın elindeydi.', color: C.accent },
  3: { label: 'Eleme', text: 'Satırda iki ✕ varsa, kalan kutu ✓', color: C.gold },
};

function Ornek({ s }) {
  const frame = useCurrentFrame();
  const { ev, clicks } = ornekEvents(s.step, s);
  const marks = marksAt(frame, ev);
  const clue = CLUE[s.step];
  const c = useSpring(2);
  let hlRow = null;
  let hlRowOp = 0;
  if (s.step === 3) {
    const aS = cue(s, 'Selime bak', 0.15);
    const aR = cue(s, 'Rızaya', 0.7);
    hlRow = frame >= aR ? 2 : 0;
    hlRowOp = frame >= aR ? interpolate(frame, [aR, aR + 8], [0, 1], clamp) : interpolate(frame, [aS, aS + 8], [0, 1], clamp);
  }
  const path = [{ at: 0, x: 900, y: 900 }, ...clicks.map(([i, j, at]) => { const [x, y] = cellXY(i, j); return { at, x, y, click: true }; })];
  const autoAt = s.step === 2 ? cue(s, 'kendiliğinden', 0.75) : null;
  const chip = useSpring(autoAt ?? 1e6);
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>{`Örnek · ${s.step}/3`}</Kicker>
      <div style={{ marginTop: 28, width: '100%', background: 'rgba(27,25,21,0.92)', border: `2px solid ${clue.color}`, borderRadius: 26, padding: '26px 34px', display: 'flex', gap: 20, alignItems: 'baseline', ...fadeUp(c) }}>
        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 28, color: clue.color, letterSpacing: '0.1em' }}>{clue.label.toLocaleUpperCase('tr')}</span>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, lineHeight: 1.2, color: C.text }}>{clue.text}</span>
      </div>
      <div style={{ marginTop: 40 }}>
        <Block rows={SUS} cols={WEP} marks={marks} hlRow={hlRow} hlRowOp={hlRowOp}>
          {clicks.length > 0 && <Cursor appear={4} path={path} />}
        </Block>
      </div>
      {autoAt != null && (
        <div style={{ marginTop: 34, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.muted, background: 'rgba(27,25,21,0.85)', border: `2px solid ${C.line2}`, borderRadius: 999, padding: '12px 28px', ...fadeUp(chip) }}>
          Sitede: <span style={{ color: C.text }}>✓ koyunca satır/sütunu otomatik ✕’le</span>
        </div>
      )}
      {ev.filter((e) => e.at > 0).map((e, i) => <Sfx key={i} name="pop" at={e.at} volume={e.v === 2 ? 0.55 : 0.3} />)}
      {s.step === 3 && <Sfx name="ding" at={cue(s, 'şamdan düşer', 0.85) + 4} volume={0.5} />}
    </Stage>
  );
}

function Hepsi({ s }) {
  const frame = useCurrentFrame();
  const aY = cue(s, 'Yerleri', 0.1);
  const aQ = [cue(s, 'kim nerede', 0.75), cue(s, 'nerede neyle', 0.82), cue(s, 'neyle', 0.9)];
  // Ş×S bloğu hazır gelir; Ş×Y ve Y×S sırayla dolar
  const fillAt = (bi, i, j) => (bi === 0 ? -100 : aY + 6 + ((bi - 1) * 9 + i * 3 + j) * 3);
  const Q = [['KİM?', C.suspect], ['NEREDE?', C.location], ['NEYLE?', C.weapon]];
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>Tablonun tamamı</Kicker>
      <div style={{ marginTop: 34 }}>
        <Staircase size={104} fillAt={fillAt} headScale={1.15} />
      </div>
      <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
        {Q.map(([q, color], i) => {
          const p = spring({ frame: frame - aQ[i], fps: FPS, config: { damping: 10, stiffness: 170 } });
          return (
            <div key={q} style={{ width: 290, textAlign: 'center', padding: '16px 0', borderRadius: 22, background: 'rgba(27,25,21,0.9)', border: `3px solid ${color}`, opacity: p, transform: `scale(${0.6 + p * 0.4})` }}>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color }}>{q}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: C.ok }}>✓</div>
            </div>
          );
        })}
      </div>
      {aQ.map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.45} />)}
    </Stage>
  );
}

function Cta({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'kimvarorda', 0.4);
  const p = useSpring(at);
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>Sıra sende</Kicker>
      <div style={{ marginTop: 30, fontFamily: SERIF, fontWeight: 900, fontSize: 96, lineHeight: 1.05, textAlign: 'center', color: C.text, ...fadeUp(useSpring(4)) }}>
        Tabloyu doldur,<br /><span style={{ color: C.accent }}>katili bul.</span>
      </div>
      <div style={{ marginTop: 60, background: C.accent, color: '#1a0905', borderRadius: 26, padding: '24px 44px', fontFamily: SERIF, fontWeight: 900, fontSize: 58, transform: `scale(${p * pulse})`, opacity: p }}>{SITE}</div>
      <div style={{ marginTop: 30, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.muted, ...fadeUp(useSpring(at + 10)) }}>Her vakanın sayfasında</div>
      <Sfx name="hit" at={at} volume={0.5} />
    </Stage>
  );
}

const VIEWS = { giris: Giris, kutu: Kutu, tik: Tik, kural: Kural, ornek: Ornek, hepsi: Hepsi, cta: Cta };

export function Tablo() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS }}>
      <Background />
      <Brand suffix="" />
      <Track timeline={TIMELINE} views={VIEWS} />
    </AbsoluteFill>
  );
}
