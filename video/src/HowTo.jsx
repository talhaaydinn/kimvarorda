import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { C, MONO, SANS, SERIF } from './theme.js';
import { FPS, cue, makeTimeline } from './timeline.js';
import { Background, Brand, Kicker, Mark, Sfx, Stage, Track, clamp, fadeUp, useSpring } from './ui.jsx';
import { SCENES } from './script.js';
import manifest from './voice-manifest.json';
import { sampleCase } from '../../scripts/sample-case.js';

const { TIMELINE, TOTAL, MUSIC } = makeTimeline(SCENES, manifest);
export const HOWTO_TOTAL = TOTAL;

// Örnek vakadaki öğeler (tamamen özgün kurgu)
const CATS = Object.fromEntries(sampleCase.categories.map((c) => [c.key, c.items]));
const byId = (id) => sampleCase.categories.flatMap((c) => c.items).find((i) => i.id === id);

// ---------- 1. Giriş ----------
function Hook({ s }) {
  const frame = useCurrentFrame();
  const logo = useSpring(0, { damping: 10, stiffness: 120 });
  const words = [
    ['KİM?', C.suspect, cue(s, 'Kim', 0.7)],
    ['NEREDE?', C.location, cue(s, 'nerede', 0.8)],
    ['NEYLE?', C.weapon, cue(s, 'neyle', 0.9)],
  ];
  const flicker = frame > 20 && frame < 30 && frame % 3 === 0 ? 0.35 : 1;
  return (
    <Stage>
      <div style={{ transform: `scale(${logo})`, opacity: flicker }}>
        <Mark size={220} />
      </div>
      <Kicker style={{ marginTop: 30, ...fadeUp(useSpring(8)) }}>Bir cinayet işlendi</Kicker>
      <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {words.map(([w, color, at]) => {
          const p = spring({ frame: frame - at, fps: FPS, config: { damping: 9, stiffness: 180 } });
          return (
            <div key={w} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, lineHeight: 1.02, color, opacity: Math.min(1, p * 1.4), transform: `scale(${interpolate(p, [0, 1], [2.2, 1])})` }}>
              {w}
            </div>
          );
        })}
      </div>
      <Sfx name="hit" at={0} volume={0.7} />
      {words.map(([w, , at]) => <Sfx key={w} name="pop" at={at} volume={0.5} />)}
    </Stage>
  );
}

// ---------- 2. Dosya ----------
function Dosya({ s }) {
  const rows = [
    ['suspect', 'Şüpheliler', C.suspect, cue(s, 'Şüphelileri', 0.3)],
    ['weapon', 'Silahlar', C.weapon, cue(s, 'silahları', 0.4)],
    ['location', 'Yerler', C.location, cue(s, 'yerleri', 0.5)],
  ];
  const rule = useSpring(cue(s, 'Her', 0.75));
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>01 · Videoyu izle</Kicker>
      <div style={{ marginTop: 40, display: 'grid', gap: 36, width: '100%' }}>
        {rows.map(([key, label, color, at]) => (
          <div key={key}>
            <Kicker color={color} style={{ fontSize: 26, marginBottom: 14, ...fadeUp(useSpring(at)) }}>{label}</Kicker>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {CATS[key].map((it, i) => <ItemCard key={it.id} item={it} color={color} at={at + i * 4} />)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 44, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.text, ...fadeUp(rule) }}>
        1 şüpheli = <span style={{ color: C.weapon }}>1 silah</span> + <span style={{ color: C.location }}>1 yer</span>
      </div>
      {rows.map(([key, , , at]) => <Sfx key={key} name="pop" at={at} volume={0.45} />)}
    </Stage>
  );
}

function ItemCard({ item, color, at }) {
  const p = useSpring(at, { damping: 12, stiffness: 160 });
  return (
    <div style={{ background: C.surface, border: `2px solid ${C.line}`, borderTop: `4px solid ${color}`, borderRadius: 18, padding: '18px 8px', textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.8 + p * 0.2})` }}>
      <div style={{ fontSize: 64, lineHeight: 1 }}>{item.emoji}</div>
      <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 600, fontSize: 25, color: C.text, lineHeight: 1.15 }}>{item.name}</div>
    </div>
  );
}

// ---------- 3. İpucu ----------
const CLUE = 'Titrek bir ampulün altında uzun boylu birinin ayak sesleri yankılanıyordu.';
const HL = [
  ['titrek bir ampulün', C.location],
  ['uzun boylu', C.suspect],
];

function Ipucu({ s }) {
  const frame = useCurrentFrame();
  const stamp = cue(s, 'isim', 0.3);
  const typeAt = cue(s, 'Titrek', 0.45) - 6;
  const hlAt = [cue(s, 'Ampul mahzeni', 0.7), cue(s, 'uzun boy ise', 0.82)];
  // anlatıcının okuma hızında yaz: ipucu cümlesi biterken ("…biri.") yazı da bitsin
  const typeEnd = Math.max(typeAt + 40, hlAt[0] - 8);
  const typed = Math.floor(interpolate(frame, [typeAt, typeEnd], [0, CLUE.length], clamp));
  const stampP = spring({ frame: frame - stamp, fps: FPS, config: { damping: 8, stiffness: 200 } });

  // yazılan metni vurgularla böl
  const shown = CLUE.slice(0, typed);
  const lower = CLUE.toLocaleLowerCase('tr');
  const marks = HL.map(([ph, color], i) => {
    const a = lower.indexOf(ph);
    return { a, b: a + ph.length, color, p: interpolate(frame, [hlAt[i], hlAt[i] + 10], [0, 1], clamp) };
  });
  const parts = [];
  let i = 0;
  for (const m of [...marks].sort((x, y) => x.a - y.a)) {
    if (m.a > i) parts.push({ t: shown.slice(i, m.a) });
    parts.push({ t: shown.slice(m.a, m.b), m });
    i = m.b;
  }
  parts.push({ t: shown.slice(i) });

  return (
    <Stage style={{ justifyContent: 'flex-start', paddingTop: 40 }}>
      <Kicker style={fadeUp(useSpring(0))}>02 · İpuçlarını topla</Kicker>
      <div style={{ position: 'relative', marginTop: 50, width: '100%', background: C.surface, border: `2px solid ${C.line2}`, borderRadius: 26, padding: '44px 46px 50px', ...fadeUp(useSpring(4)) }}>
        <Kicker color={C.muted} style={{ fontSize: 24 }}>İpucu #3</Kicker>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontWeight: 700, fontSize: 58, lineHeight: 1.22, color: C.text, minHeight: 215 }}>
          {parts.map((x, k) => (
            <span key={k} style={x.m ? { color: x.m.p > 0 ? x.m.color : C.text, backgroundImage: `linear-gradient(${x.m.color}, ${x.m.color})`, backgroundSize: `${x.m.p * 100}% 6px`, backgroundPosition: '0 92%', backgroundRepeat: 'no-repeat' } : null}>
              {x.t}
            </span>
          ))}
          {typed < CLUE.length && frame >= typeAt && <span style={{ color: C.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>▍</span>}
        </div>
        <div style={{ position: 'absolute', top: -30, right: 30, background: C.surface, transform: `rotate(-7deg) scale(${interpolate(stampP, [0, 1], [2.4, 1])})`, opacity: Math.min(1, stampP * 1.5), border: `5px solid ${C.accent}`, color: C.accent, fontFamily: MONO, fontWeight: 600, fontSize: 34, padding: '8px 18px', borderRadius: 10, letterSpacing: '0.12em' }}>
          İSİM YOK
        </div>
      </div>
      <div style={{ marginTop: 44, display: 'grid', gap: 22, width: '100%' }}>
        <Deduction at={hlAt[0]} color={C.location} from="💡 titrek ampul" to={[byId('l4')]} />
        <Deduction at={hlAt[1]} color={C.suspect} from="📏 uzun boylu" to={[byId('s1'), byId('s3')]} />
      </div>
      <Sfx name="type" at={typeAt} volume={0.35} />
      <Sfx name="hit" at={stamp} volume={0.35} />
    </Stage>
  );
}

function Deduction({ at, color, from, to }) {
  const p = useSpring(at);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', alignItems: 'center', gap: 16, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.text, ...fadeUp(p, 30) }}>
      <span style={{ color, whiteSpace: 'nowrap' }}>{from} <span style={{ color: C.faint }}>→</span></span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {to.map((it) => (
          <span key={it.id} style={{ background: C.surface2, border: `2px solid ${color}`, borderRadius: 999, padding: '8px 22px', whiteSpace: 'nowrap' }}>
            {it.emoji} {it.name}
          </span>
        ))}
      </span>
    </div>
  );
}

// ---------- 4. Tablo ----------
const SOL = sampleCase.solution;
function Tablo({ s }) {
  const frame = useCurrentFrame();
  const sus = CATS.suspect;
  const locs = CATS.location;
  const xAt = cue(s, 'çarpıyla', 0.45);
  const vAt = cue(s, 'tikle', 0.75);
  const cells = sus.flatMap((su, r) => locs.map((l, c) => ({ r, c, ok: SOL[su.id].location === l.id })));
  const xs = cells.filter((x) => !x.ok);
  const vs = cells.filter((x) => x.ok);
  const CELL = 170;
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>03 · Tabloda ele</Kicker>
      <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: `130px repeat(4, ${CELL}px)`, gap: 0, ...fadeUp(useSpring(4)) }}>
        <div />
        {locs.map((l) => (
          <div key={l.id} style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 }}>
            <div style={{ fontSize: 58 }}>{l.emoji}</div>
            <div style={{ fontFamily: SANS, fontSize: 22, color: C.location, fontWeight: 600 }}>{l.name}</div>
          </div>
        ))}
        {sus.map((su, r) => [
          <div key={su.id} style={{ height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70 }}>{su.emoji}</div>,
          ...locs.map((l, c) => {
            const ix = xs.findIndex((x) => x.r === r && x.c === c);
            const iv = vs.findIndex((x) => x.r === r && x.c === c);
            const at = ix >= 0 ? xAt + ix * 3 : vAt + iv * 5;
            const p = spring({ frame: frame - at, fps: FPS, config: { damping: 10, stiffness: 220 } });
            const ok = iv >= 0;
            return (
              <div key={l.id} style={{ height: CELL, border: `2px solid ${C.line2}`, marginLeft: -2, marginTop: -2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok && p > 0.1 ? 'rgba(95,211,154,0.14)' : C.surface }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: ok ? 92 : 78, color: ok ? C.ok : C.bad, opacity: p, transform: `scale(${interpolate(p, [0, 1], [1.8, 1])})` }}>
                  {ok ? '✓' : '✕'}
                </span>
              </div>
            );
          }),
        ])}
      </div>
      <div style={{ marginTop: 40, display: 'flex', gap: 40, fontFamily: SANS, fontWeight: 600, fontSize: 36 }}>
        <span style={{ color: C.bad, ...fadeUp(useSpring(xAt)) }}>✕ olamaz</span>
        <span style={{ color: C.ok, ...fadeUp(useSpring(vAt)) }}>✓ kesin</span>
      </div>
      <Sfx name="type" at={xAt} volume={0.3} />
      <Sfx name="pop" at={vAt} volume={0.5} />
    </Stage>
  );
}

// ---------- 5. Cevap ----------
function Cevap({ s }) {
  const frame = useCurrentFrame();
  const nameAt = cue(s, 'Kullanıcı', 0.35);
  const user = '@dedektif';
  const typed = user.slice(0, Math.floor(interpolate(frame, [nameAt, nameAt + 18], [0, user.length], clamp)));
  const picks = [
    ['Kim?', byId('s1'), cue(s, 'katili', 0.5), C.suspect],
    ['Nerede?', byId('l1'), cue(s, 'yeri', 0.58), C.location],
    ['Neyle?', byId('w4'), cue(s, 'silahı', 0.66), C.weapon],
  ];
  const pressAt = cue(s, 'Unutma', 0.78);
  const press = interpolate(frame, [pressAt, pressAt + 4, pressAt + 10], [1, 0.92, 1], clamp);
  const ripple = interpolate(frame, [pressAt, pressAt + 18], [0, 1], clamp);
  const once = useSpring(cue(s, 'tek hakkın', 0.85));
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>04 · Cevabını gönder</Kicker>
      <div style={{ marginTop: 30, width: 700, background: C.bg, border: `3px solid ${C.line2}`, borderRadius: 56, padding: '38px 44px 42px', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', ...fadeUp(useSpring(4), 80) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: C.text }}>Suçlama</div>
        <Field label="Kullanıcı adın">
          <span style={{ color: typed ? C.text : C.faint }}>{typed || 'kullanıcı adı'}</span>
          {frame >= nameAt && typed.length < user.length && <span style={{ color: C.accent }}>▍</span>}
        </Field>
        {picks.map(([q, it, at, color]) => {
          const p = interpolate(frame, [at, at + 8], [0, 1], clamp);
          return (
            <Field key={q} label={q} color={p > 0 ? color : undefined}>
              <span style={{ color: p > 0 ? C.text : C.faint, opacity: p > 0 ? p : 1 }}>{p > 0 ? `${it.emoji} ${it.name}` : 'Seç…'}</span>
            </Field>
          );
        })}
        <div style={{ position: 'relative', overflow: 'hidden', marginTop: 28, background: C.accent, color: '#1a0905', borderRadius: 18, padding: '22px 0', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 38, transform: `scale(${press})` }}>
          Suçlamayı yap
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 900, height: 900, marginLeft: -450, marginTop: -450, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', transform: `scale(${ripple})`, opacity: 1 - ripple }} />
        </div>
      </div>
      <div style={{ marginTop: 30, fontFamily: MONO, fontWeight: 600, fontSize: 36, color: C.gold, letterSpacing: '0.08em', ...fadeUp(once) }}>
        ⚠ TEK HAKKIN VAR
      </div>
      {picks.map(([q, , at]) => <Sfx key={q} name="pop" at={at} volume={0.4} />)}
      <Sfx name="type" at={nameAt} volume={0.3} />
    </Stage>
  );
}

function Field({ label, color, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 25, color: C.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ background: C.surface, border: `2px solid ${color || C.line2}`, borderRadius: 16, padding: '15px 24px', fontFamily: SANS, fontWeight: 600, fontSize: 34 }}>
        {children}
      </div>
    </div>
  );
}

// ---------- 6. Sıralama ----------
const BOARD = [
  ['🥇', 'gece_kusu', '1 dk 48 sn'],
  ['🥈', 'zeynep.k', '2 dk 31 sn'],
  ['🥉', 'muhtar_42', '3 dk 05 sn'],
  ['#4', 'dedektif', '3 dk 59 sn', true],
  ['#5', 'serra.ay', '4 dk 22 sn'],
];
function Siralama({ s }) {
  const frame = useCurrentFrame();
  const okAt = cue(s, 'Doğru', 0.1);
  const rowsAt = cue(s, 'sıralamaya', 0.3);
  const fastAt = cue(s, 'hızlı', 0.6);
  const toast = useSpring(okAt, { damping: 11, stiffness: 160 });
  return (
    <Stage>
      <Kicker style={fadeUp(useSpring(0))}>05 · Sıralamaya gir</Kicker>
      <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(95,211,154,0.12)', border: `3px solid ${C.ok}`, borderRadius: 24, padding: '22px 36px', transform: `scale(${toast})`, opacity: toast }}>
        <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 80, color: C.ok }}>#4</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 42, color: C.text }}>Doğru! Davayı çözdün.</span>
      </div>
      <div style={{ marginTop: 44, width: '100%', display: 'grid', gap: 14 }}>
        {BOARD.map(([rk, name, t, me], i) => {
          const p = spring({ frame: frame - rowsAt - i * 5, fps: FPS, config: { damping: 14, stiffness: 150 } });
          const glow = me ? interpolate(frame, [fastAt, fastAt + 10], [0, 1], clamp) : 0;
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 26, background: me ? `rgba(255,79,59,${0.08 + glow * 0.1})` : C.surface, border: `2px solid ${me ? C.accent : C.line}`, borderRadius: 20, padding: '24px 32px', opacity: p, transform: `translateX(${(1 - p) * 200}px)` }}>
              <span style={{ width: 80, fontFamily: SERIF, fontWeight: 900, fontSize: rk.startsWith('#') ? 44 : 56, color: C.gold }}>{rk}</span>
              <span style={{ flex: 1, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.text }}>@{name}{me && <span style={{ color: C.accent }}> (sen)</span>}</span>
              <span style={{ fontFamily: MONO, fontSize: 32, color: C.muted }}>{t}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 30, color: C.muted, ...fadeUp(useSpring(fastAt)) }}>
        ⏱ ilk doğru cevap önde
      </div>
      <Sfx name="ding" at={okAt} volume={0.55} />
    </Stage>
  );
}

// ---------- 7. Kapanış ----------
function Cta({ s }) {
  const frame = useCurrentFrame();
  const logo = useSpring(0, { damping: 10, stiffness: 110 });
  const urlAt = cue(s, 'kimvarorda', 0.6);
  const url = useSpring(urlAt);
  const pulse = 1 + Math.sin(frame / 6) * 0.03;
  return (
    <Stage>
      <div style={{ transform: `scale(${logo})` }}><Mark size={240} /></div>
      <Kicker style={{ marginTop: 30, ...fadeUp(useSpring(6)) }}>Yeni vaka çok yakında</Kicker>
      <div style={{ marginTop: 40, fontFamily: SERIF, fontWeight: 900, fontSize: 120, color: C.text, letterSpacing: '-0.02em', ...fadeUp(url, 60) }}>
        kimvarorda<span style={{ color: C.accent }}>.ai</span>
      </div>
      <div style={{ marginTop: 60, background: C.accent, color: '#1a0905', borderRadius: 999, padding: '26px 64px', fontFamily: SANS, fontWeight: 700, fontSize: 46, transform: `scale(${useSpring(cue(s, 'Takipte', 0.4)) * pulse})` }}>
        Takipte kal 🔔
      </div>
      <Sfx name="hit" at={urlAt} volume={0.5} />
    </Stage>
  );
}

// ---------- kompozisyon ----------
const SCENE_VIEW = { hook: Hook, dosya: Dosya, ipucu: Ipucu, tablo: Tablo, cevap: Cevap, siralama: Siralama, cta: Cta };

export function HowTo() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS }}>
      <Background />
      <Brand />
      {MUSIC && <Audio src={staticFile(MUSIC)} volume={(f) => interpolate(f, [0, 20, TOTAL - 40, TOTAL], [0, 0.12, 0.12, 0], clamp)} />}
      <Track timeline={TIMELINE} views={SCENE_VIEW} />
    </AbsoluteFill>
  );
}
