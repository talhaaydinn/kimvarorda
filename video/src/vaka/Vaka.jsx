// Vaka videosu: kapak → hikâye → Dosya (şüpheliler, silahlar, yerler) → ipuçları → özet → çağrı.
// Çözüm videoda YOK; oyuncular cevabı sitede gönderir.
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { C, MONO, SANS, SERIF } from '../theme.js';
import { FPS, cue, makeTimeline } from '../timeline.js';
import { Background, Brand, Kicker, Mark, Sfx, Stage, Track, clamp, fadeUp, useSpring } from '../ui.jsx';
import { VAKA } from './vaka.js';
import { SCENES, SITE, STORY_OPEN, STORY_REST, clueText } from './script.js';
import manifest from './voice-manifest.json';
import { ART } from './art.jsx';

const { TIMELINE, TOTAL } = makeTimeline(SCENES, manifest, { lead: 0.2 });
export const VAKA_TOTAL = TOTAL;

// Çizimler yalnızca yazıldıkları vakada kullanılır (art.jsx); yoksa emojili sade görünüm
const World = ART?.World;

const CAT_COLOR = { suspect: C.suspect, weapon: C.weapon, location: C.location, motive: '#a98bff' };
const norm = (w) => w.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]/gu, '');

/** "Kim? Nerede? Neyle?" kelimelerinin söylendiği kareler (sahnenin sonundaki ilk eşleşme) */
function questionCues(s) {
  const ws = s.raw.map((x) => norm(x.w));
  for (let i = ws.length - 3; i >= 0; i--) {
    if (ws[i] === 'kim' && ws[i + 1] === 'nerede' && ws[i + 2] === 'neyle') {
      return [0, 1, 2].map((k) => Math.round((s.lead + s.raw[i + k].s) * FPS));
    }
  }
  return [0.7, 0.8, 0.9].map((r) => Math.round(s.frames * r));
}

const QUESTIONS = [['KİM?', C.suspect], ['NEREDE?', C.location], ['NEYLE?', C.weapon]];

function Questions({ ats, size = 132 }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {QUESTIONS.map(([w, color], i) => {
        const p = spring({ frame: frame - ats[i], fps: FPS, config: { damping: 9, stiffness: 180 } });
        return (
          <div key={w} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: size, lineHeight: 1.02, color, textShadow: '0 6px 30px rgba(0,0,0,0.7)', opacity: Math.min(1, p * 1.4), transform: `scale(${interpolate(p, [0, 1], [2.2, 1])})` }}>
            {w}
          </div>
        );
      })}
      {ats.map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.5} />)}
    </div>
  );
}

const Paragraph = ({ children, at = 6, size = 46 }) => (
  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.32, color: C.text, textAlign: 'center', textShadow: '0 4px 24px rgba(0,0,0,0.85)', ...fadeUp(useSpring(at)) }}>
    {children}
  </div>
);

/** Dosya özeti: kategori başına bir sütun, öğeler ve özellikleri (ipuçlarının çoğu özelliklere dayanır) */
function MiniDosya({ at = 8, style }) {
  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: `repeat(${VAKA.categories.length}, 1fr)`, gap: 22, ...fadeUp(useSpring(at), 30), ...style }}>
      {VAKA.categories.map((c) => (
        <div key={c.key} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: '0.1em', color: CAT_COLOR[c.key] }}>{c.label.toLocaleUpperCase('tr')}</span>
          {c.items.map((it) => (
            <div key={it.id}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, lineHeight: 1.2, color: C.text }}>{it.emoji} {it.name}</div>
              {it.traits.length > 0 && <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 21, lineHeight: 1.3, color: C.muted, marginTop: 2 }}>{it.traits.join(' · ')}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Çizimli vakada sahnenin arkasında soluk gece denizi */
const Backdrop = ({ s }) => (ART ? <World variant="sakin" frames={s.frames} /> : null);

// ---------- sahneler ----------
function Kapak({ s }) {
  const logo = useSpring(0, { damping: 10, stiffness: 120 });
  const storyAt = cue(s, STORY_OPEN.split(/\s+/).slice(0, 2).join(' '), 0.25) - 6;
  const kicker = VAKA.no ? `Vaka #${VAKA.no}` : 'Yeni vaka';
  if (!ART) {
    return (
      <Stage>
        <div style={{ transform: `scale(${logo})` }}><Mark size={150} /></div>
        <Kicker style={{ marginTop: 24, ...fadeUp(useSpring(4)) }}>{kicker}</Kicker>
        <div style={{ marginTop: 16, fontFamily: SERIF, fontWeight: 900, fontSize: 132, lineHeight: 1, letterSpacing: '-0.02em', color: C.text, textAlign: 'center', ...fadeUp(useSpring(8), 60) }}>
          {VAKA.title}
        </div>
        <div style={{ marginTop: 60 }}><Paragraph at={storyAt} size={44}>{STORY_OPEN}</Paragraph></div>
        <Sfx name="hit" at={0} volume={0.6} />
      </Stage>
    );
  }
  return (
    <AbsoluteFill>
      <World variant="kapak" frames={s.frames} />
      <Stage style={{ justifyContent: 'flex-end', paddingBottom: 10 }}>
        <Kicker style={fadeUp(useSpring(4))}>{kicker}</Kicker>
        <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 900, fontSize: 124, lineHeight: 1, letterSpacing: '-0.02em', color: C.text, textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,0.8)', ...fadeUp(useSpring(8), 60) }}>
          {VAKA.title}
        </div>
        <div style={{ marginTop: 40 }}><Paragraph at={storyAt} size={40}>{STORY_OPEN}</Paragraph></div>
      </Stage>
      <Sfx name="hit" at={0} volume={0.6} />
    </AbsoluteFill>
  );
}

function Hikaye({ s }) {
  if (!ART) {
    return (
      <Stage>
        <Paragraph size={48}>{STORY_REST.join(' ')}</Paragraph>
        <div style={{ marginTop: 70 }}><Questions ats={questionCues(s)} /></div>
      </Stage>
    );
  }
  return (
    <AbsoluteFill>
      <World variant="yakin" frames={s.frames} />
      <Stage style={{ justifyContent: 'space-between', paddingTop: 20 }}>
        <Questions ats={questionCues(s)} size={96} />
        <Paragraph size={44}>{STORY_REST.join(' ')}</Paragraph>
      </Stage>
    </AbsoluteFill>
  );
}

function Kategori(props) {
  return ART ? <KategoriArt {...props} /> : <KategoriKart {...props} />;
}

/** Öğeler sırayla: üstte animasyonlu çizim, altta adı, özellikleri ve açıklaması */
function KategoriArt({ s }) {
  const frame = useCurrentFrame();
  const cat = VAKA.categories.find((c) => c.key === s.cat);
  const color = CAT_COLOR[cat.key];
  const n = cat.items.length;
  const ats = cat.items.map((it, i) => Math.max(i === 0 ? 4 : 0, cue(s, it.name, 0.12 + (0.8 * i) / n) - 6));
  const active = ats.reduce((a, at, i) => (frame >= at ? i : a), 0);
  // Sıralı geçiş: eski öğe tamamen kaybolur, sonra yenisi gelir (yazılar üst üste binmesin)
  const vis = (i) => {
    const inn = i === 0 ? interpolate(frame, [2, 12], [0, 1], clamp) : interpolate(frame, [ats[i], ats[i] + 10], [0, 1], clamp);
    const out = i < n - 1 ? interpolate(frame, [ats[i + 1] - 8, ats[i + 1]], [1, 0], clamp) : 1;
    return Math.min(inn, out);
  };
  return (
    <Stage style={{ justifyContent: 'flex-start', paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...fadeUp(useSpring(0)) }}>
        <Kicker color={color} style={{ fontSize: 34 }}>{cat.label}</Kicker>
        <div style={{ display: 'flex', gap: 10 }}>
          {cat.items.map((it, i) => (
            <span key={it.id} style={{ width: 16, height: 16, borderRadius: 99, background: i <= active ? color : C.line2, opacity: i === active ? 1 : 0.6 }} />
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 705, marginTop: 26 }}>
        {cat.items.map((it, i) => {
          const Art = ART.ITEM_ART[it.id];
          const o = vis(i);
          if (o <= 0) return null;
          const zoom = interpolate(frame, [ats[i], ats[i] + 240], [1, 1.07], clamp);
          return (
            <div key={it.id} style={{ position: 'absolute', inset: 0, opacity: o, borderRadius: 30, overflow: 'hidden', border: `3px solid ${color}`, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', transform: `translateY(${(1 - o) * 30}px)` }}>
              <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
                {Art ? <Art /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: 260, background: C.surface }}>{it.emoji}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 360, marginTop: 32 }}>
        {cat.items.map((it, i) => {
          const o = vis(i);
          if (o <= 0) return null;
          return (
            <div key={it.id} style={{ position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - o) * 24}px)` }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: C.text }}>{it.emoji} {it.name}</div>
              {it.traits.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
                  {it.traits.map((t) => (
                    <span key={t} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color, border: `2px solid ${color}`, borderRadius: 999, padding: '5px 20px' }}>{t}</span>
                  ))}
                </div>
              )}
              {it.desc && <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 500, fontSize: 34, lineHeight: 1.35, color: C.muted }}>{it.desc}</div>}
            </div>
          );
        })}
      </div>
      {ats.map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.4} />)}
    </Stage>
  );
}

/** Çizimsiz vakalar için: üç kart alt alta */
function KategoriKart({ s }) {
  const frame = useCurrentFrame();
  const cat = VAKA.categories.find((c) => c.key === s.cat);
  const color = CAT_COLOR[cat.key];
  const n = cat.items.length;
  const ats = cat.items.map((it, i) => cue(s, it.name, 0.12 + (0.8 * i) / n) - 4);
  const active = ats.reduce((a, at, i) => (frame >= at ? i : a), -1);
  return (
    <Stage>
      <Kicker color={color} style={{ fontSize: 34, ...fadeUp(useSpring(0)) }}>{cat.label}</Kicker>
      <div style={{ marginTop: 36, width: '100%', display: 'grid', gap: n > 4 ? 16 : 24 }}>
        {cat.items.map((it, i) => <ItemRow key={it.id} item={it} color={color} at={ats[i]} active={i === active} compact={n > 4} />)}
      </div>
      {ats.map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.4} />)}
    </Stage>
  );
}

function ItemRow({ item, color, at, active, compact }) {
  const p = useSpring(at, { damping: 13, stiffness: 150 });
  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', background: active ? C.surface2 : C.surface, border: `3px solid ${active ? color : C.line}`, borderRadius: 24, padding: compact ? '18px 26px' : '26px 30px', opacity: p, transform: `translateX(${(1 - p) * 120}px)` }}>
      <div style={{ fontSize: compact ? 72 : 92, lineHeight: 1, width: compact ? 84 : 104, textAlign: 'center' }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: compact ? 38 : 46, color: C.text, lineHeight: 1.1 }}>{item.name}</div>
        {item.traits.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {item.traits.map((t) => (
              <span key={t} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 25, color, border: `2px solid ${color}`, borderRadius: 999, padding: '4px 16px' }}>{t}</span>
            ))}
          </div>
        )}
        {item.desc && <div style={{ marginTop: 12, fontFamily: SANS, fontWeight: 500, fontSize: compact ? 27 : 31, lineHeight: 1.35, color: C.muted }}>{item.desc}</div>}
      </div>
    </div>
  );
}

/** POV ipucu: üstte birinci şahıs kamera, altta ipucu */
function PovIpucu({ s, cl, Pov }) {
  const text = clueText(cl.text);
  const size = text.length < 90 ? 44 : 39;
  return (
    <AbsoluteFill>
      <Backdrop s={s} />
      <Stage style={{ justifyContent: 'flex-start', top: 250 }}>
        <Kicker style={fadeUp(useSpring(0))}>{`İpucu ${s.clue + 1} / ${VAKA.clues.length}`}</Kicker>
        <div style={{ marginTop: 22, width: 940, height: 846, borderRadius: 30, overflow: 'hidden', border: `2px solid ${C.line2}`, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', ...fadeUp(useSpring(2), 30) }}>
          <Pov s={s} />
        </div>
        <div style={{ marginTop: 30, width: '100%', fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: C.text, textAlign: 'center', ...fadeUp(useSpring(6)) }}>{text}</div>
        <Sfx name="whoosh" at={4} volume={0.25} />
      </Stage>
    </AbsoluteFill>
  );
}

function Ipucu({ s }) {
  const cl = VAKA.clues[s.clue];
  const Pov = ART?.POV?.[cl.id];
  if (Pov) return <PovIpucu s={s} cl={cl} Pov={Pov} />;
  const len = cl.text.length;
  const size = len < 80 ? 64 : len < 130 ? 56 : 48;
  return (
    <AbsoluteFill>
      <Backdrop s={s} />
      <Stage>
        <Kicker style={fadeUp(useSpring(0))}>{`İpucu ${s.clue + 1} / ${VAKA.clues.length}`}</Kicker>
        <div style={{ marginTop: 40, width: '100%', background: 'rgba(27,25,21,0.92)', border: `2px solid ${C.line2}`, borderRadius: 28, padding: '52px 50px', boxShadow: '0 30px 90px rgba(0,0,0,0.5)', ...fadeUp(useSpring(4)) }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: C.text }}>{clueText(cl.text)}</div>
        </div>
        <MiniDosya at={10} style={{ marginTop: 64 }} />
        <Sfx name="type" at={6} volume={0.25} />
      </Stage>
    </AbsoluteFill>
  );
}

/** Nabız gibi atan site adresi (videonun kapanışı) */
function SiteButon({ at }) {
  const frame = useCurrentFrame();
  const p = useSpring(at);
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  return (
    <>
      <div style={{ marginTop: 44, background: C.accent, color: '#1a0905', borderRadius: 24, padding: '20px 40px', fontFamily: SERIF, fontWeight: 900, fontSize: 52, opacity: p, transform: `scale(${p * pulse})` }}>{SITE}</div>
      <Sfx name="hit" at={at} volume={0.5} />
    </>
  );
}

function Ozet({ s }) {
  return (
    <AbsoluteFill>
      <Backdrop s={s} />
      <Stage>
        <Kicker style={fadeUp(useSpring(0))}>📸 Ekran görüntüsü al</Kicker>
        <ol style={{ margin: '34px 0 0', padding: 0, listStyle: 'none', width: '100%', display: 'grid', gap: 16, ...fadeUp(useSpring(4)) }}>
          {VAKA.clues.map((cl, i) => (
            <li key={cl.id} style={{ display: 'flex', gap: 18, fontFamily: SANS, fontWeight: 500, fontSize: 31, lineHeight: 1.3, color: C.text }}>
              <span style={{ fontFamily: MONO, fontWeight: 600, color: C.accent, minWidth: 44 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{clueText(cl.text)}</span>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 44, width: '100%', borderTop: `2px solid ${C.line}`, paddingTop: 34 }}>
          <MiniDosya at={10} />
        </div>
        <SiteButon at={cue(s, 'kimvarorda', 0.5)} />
      </Stage>
    </AbsoluteFill>
  );
}

/** Görev kartı: numara + başlık + sağda küçük animasyon */
function Adim({ n, title, at, color, children }) {
  const p = useSpring(at);
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(27,25,21,0.88)', border: `2px solid ${p > 0.5 ? color : C.line}`, borderRadius: 30, padding: '30px 34px', ...fadeUp(p) }}>
      <div style={{ width: 84, height: 84, borderRadius: 999, background: color, color: '#1a0905', display: 'grid', placeItems: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 50, flex: 'none' }}>{n}</div>
      <div style={{ flex: 1, fontFamily: SERIF, fontWeight: 900, fontSize: 54, lineHeight: 1.08, color: C.text }}>{title}</div>
      <div style={{ width: 250, height: 190, flex: 'none', display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

/** 3×3 tablo, hücreler sırayla ✗ / ✓ ile dolar (rastgele örnek, çözüm değil) */
function MiniTablo({ at }) {
  const frame = useCurrentFrame();
  const marks = ['x', 'o', 'x', 'x', 'x', 'o', 'o', 'x', 'x'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 58px)', gap: 8 }}>
      {marks.map((m, i) => {
        const p = interpolate(frame, [at + 8 + i * 5, at + 14 + i * 5], [0, 1], clamp);
        return (
          <div key={i} style={{ width: 58, height: 58, borderRadius: 10, background: C.surface2, border: `2px solid ${C.line2}`, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 36, color: m === 'o' ? C.ok : C.bad }}>
            <span style={{ opacity: p, transform: `scale(${0.4 + p * 0.6})` }}>{m === 'o' ? '✓' : '✗'}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Siluet üzerinde gezinen büyüteç ve soru işareti */
function MiniBuyutec({ at }) {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - at);
  const x = 125 + Math.sin(t / 14) * 46;
  const y = 92 + Math.cos(t / 19) * 22;
  return (
    <svg width={250} height={190} viewBox="0 0 250 190">
      <g fill={C.line2}>
        <circle cx={125} cy={62} r={30} />
        <path d="M70,182 Q74,104 125,100 Q176,104 180,182 Z" />
      </g>
      <text x={125} y={78} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={44} fill={C.suspect} opacity={0.5 + 0.5 * Math.sin(t / 6)}>?</text>
      <g transform={`translate(${x},${y})`}>
        <circle r={38} fill="rgba(242,184,75,0.12)" stroke={C.gold} strokeWidth={8} />
        <line x1={27} y1={27} x2={62} y2={62} stroke={C.gold} strokeWidth={13} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Sıralama: en üste "Senin adın" kayarak girer */
function MiniSiralama({ at }) {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at - 10, fps: FPS, config: { damping: 13, stiffness: 120 } });
  const row = (rank, name, hl, style) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 48, padding: '0 14px', borderRadius: 10, background: hl ? 'rgba(242,184,75,0.18)' : C.surface2, border: `2px solid ${hl ? C.gold : C.line}`, fontFamily: SANS, fontWeight: 600, fontSize: 25, color: hl ? C.gold : C.muted, ...style }}>
      <span style={{ fontFamily: MONO, minWidth: 34 }}>{rank}</span>
      <span>{name}</span>
    </div>
  );
  return (
    <div style={{ width: 250, display: 'grid', gap: 8 }}>
      {row('🏆', 'Senin adın', true, { opacity: p, transform: `translateX(${(1 - p) * 120}px)` })}
      {row(p > 0.5 ? '2.' : '1.', '••••••', false, { transform: `translateY(${(1 - p) * -56}px)` })}
      {row(p > 0.5 ? '3.' : '2.', '••••', false, { transform: `translateY(${(1 - p) * -56}px)` })}
    </div>
  );
}

function Gorev({ s }) {
  const a1 = cue(s, 'tabloyu', 0.3);
  const a2 = cue(s, 'katili', 0.5);
  const a3 = cue(s, 'adın', 0.7);
  return (
    <AbsoluteFill>
      <Backdrop s={s} />
      <Stage>
        <Kicker style={fadeUp(useSpring(0))}>Sıra sende</Kicker>
        <div style={{ marginTop: 26, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.muted, ...fadeUp(useSpring(4)) }}>{SITE}</div>
        <div style={{ marginTop: 54, width: '100%', display: 'grid', gap: 30 }}>
          <Adim n={1} title="Tabloyu doldur" at={a1} color={C.location}><MiniTablo at={a1} /></Adim>
          <Adim n={2} title="Katili bul" at={a2} color={C.suspect}><MiniBuyutec at={a2} /></Adim>
          <Adim n={3} title="Adın sıralamaya yazılsın" at={a3} color={C.gold}><MiniSiralama at={a3} /></Adim>
        </div>
        <Sfx name="pop" at={a1} volume={0.35} />
        <Sfx name="pop" at={a2} volume={0.35} />
        <Sfx name="hit" at={a3} volume={0.45} />
      </Stage>
    </AbsoluteFill>
  );
}

function Cta({ s }) {
  const frame = useCurrentFrame();
  const urlAt = cue(s, 'kimvarorda', 0.5);
  const url = useSpring(urlAt);
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  return (
    <AbsoluteFill>
      <Backdrop s={s} />
      <Stage>
        <Questions ats={questionCues(s)} size={116} />
        <div style={{ marginTop: 56, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.muted, ...fadeUp(url) }}>Cevabını gönder:</div>
        <div style={{ marginTop: 18, background: C.accent, color: '#1a0905', borderRadius: 26, padding: '26px 44px', fontFamily: SERIF, fontWeight: 900, fontSize: 62, letterSpacing: '-0.01em', transform: `scale(${url * pulse})` }}>
          {SITE}
        </div>
        <div style={{ marginTop: 44, display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', ...fadeUp(useSpring(cue(s, 'Tek', 0.75))) }}>
          {['⚠ Tek hakkın var', '🏆 İlk doğru bilen zirvede'].map((t) => (
            <span key={t} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.gold, background: 'rgba(14,13,11,0.7)', border: `2px solid ${C.gold}`, borderRadius: 999, padding: '10px 26px' }}>{t}</span>
          ))}
        </div>
        <Sfx name="hit" at={urlAt} volume={0.5} />
      </Stage>
    </AbsoluteFill>
  );
}

const VIEWS = { kapak: Kapak, hikaye: Hikaye, kategori: Kategori, ipucu: Ipucu, ozet: Ozet, gorev: Gorev, cta: Cta };

export function Vaka() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS }}>
      <Background />
      <Track timeline={TIMELINE} views={VIEWS} />
      <Brand suffix="" />
    </AbsoluteFill>
  );
}
