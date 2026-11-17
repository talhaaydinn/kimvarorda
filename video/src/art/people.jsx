// Vaka çizimlerinde ortak parçalar: 800×600 panel, sorgu ışığı, düz figür, masa.
import { useCurrentFrame } from 'remotion';

export const SKIN = '#c99a74';

// ================= Panel çerçevesi (800×600) =================
export function Panel({ children, bg = ['#1d1b18', '#0d0c0a'], id }) {
  return (
    <svg viewBox="0 0 800 600" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${id}-bg)`} />
      {children}
      <rect width="800" height="600" fill={`url(#${id}-vig)`} />
    </svg>
  );
}

/** Tepeden vuran sorgu ışığı */
export function Spot({ x = 400, color = '#f1eadc', opacity = 0.13 }) {
  const frame = useCurrentFrame();
  const flick = 0.85 + 0.15 * Math.sin(frame / 5) * Math.sin(frame / 13);
  return <path d={`M${x - 40},0 L${x + 40},0 L${x + 230},600 L${x - 230},600 Z`} fill={color} opacity={opacity * flick} />;
}

// ================= Şüpheliler =================
/**
 * Düz illüstrasyon tarzı figür. Ayaklar (200,580), uzun boy ~500 birim; kısa boy 0.84 ölçek.
 * opts: { tall, hair: 'short'|'long'|'cap'|'bald', mustache, glasses, outfit, accent, prop: (frame)=>JSX }
 */
export function Person({ tall, hair = 'short', mustache, glasses, outfit = '#3a3f4a', accent = '#5a5f6a', hairColor = '#2a211b', prop, extra }) {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame / 18) * 2.2;
  const blink = frame % 96 > 90 ? 0.15 : 1;
  const s = tall ? 1 : 0.84;
  return (
    <g transform={`translate(200,580) scale(${s}) translate(-200,-580)`}>
      <ellipse cx={200} cy={582} rx={95} ry={12} fill="#000" opacity={0.45} />
      {/* bacaklar ve ayakkabılar */}
      <rect x={168} y={400} width={28} height={176} rx={8} fill="#22252c" />
      <rect x={204} y={400} width={28} height={176} rx={8} fill="#22252c" />
      <ellipse cx={180} cy={576} rx={22} ry={8} fill="#111" />
      <ellipse cx={220} cy={576} rx={22} ry={8} fill="#111" />
      <g transform={`translate(0,${breathe})`}>
        {/* gövde */}
        <path d="M146,218 Q200,198 254,218 L266,412 L134,412 Z" fill={outfit} />
        <path d="M200,212 L200,412" stroke={accent} strokeWidth={3} opacity={0.5} />
        {/* kollar */}
        <path d="M150,224 Q126,300 122,380" stroke={outfit} strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M250,224 Q272,262 286,300" stroke={outfit} strokeWidth={30} strokeLinecap="round" fill="none" />
        <circle cx={122} cy={386} r={15} fill={SKIN} />
        <circle cx={290} cy={306} r={15} fill={SKIN} />
        {extra}
        {/* boyun ve baş */}
        <rect x={188} y={182} width={24} height={34} fill={SKIN} />
        <circle cx={200} cy={140} r={48} fill={SKIN} />
        {hair === 'short' && <path d="M152,138 Q152,86 200,86 Q248,86 248,138 Q240,110 200,108 Q160,110 152,138 Z" fill={hairColor} />}
        {hair === 'bald' && <path d="M152,150 Q150,128 160,118 Q158,140 162,156 Z M248,150 Q250,128 240,118 Q242,140 238,156 Z" fill="#cfcac0" />}
        {hair === 'long' && <path d="M148,142 Q148,82 200,82 Q252,82 252,142 L262,262 Q240,244 236,196 Q232,120 200,112 Q168,120 164,196 Q160,244 138,262 Z" fill={hairColor} />}
        {hair === 'cap' && (
          <g>
            <path d="M150,124 Q154,80 200,80 Q246,80 250,124 Z" fill="#283a52" />
            <path d="M196,122 Q240,118 268,130 Q236,136 196,130 Z" fill="#1e2c3f" />
          </g>
        )}
        {/* yüz */}
        <g transform={`translate(0,140) scale(1,${blink}) translate(0,-140)`}>
          <circle cx={183} cy={140} r={4.5} fill="#1a1410" />
          <circle cx={217} cy={140} r={4.5} fill="#1a1410" />
        </g>
        {glasses && (
          <g fill="none" stroke="#1b1b1b" strokeWidth={3.5}>
            <circle cx={183} cy={141} r={15} />
            <circle cx={217} cy={141} r={15} />
            <path d="M198,141 L202,141 M168,138 L154,132 M232,138 L246,132" />
          </g>
        )}
        {mustache
          ? <path d="M176,164 Q189,155 200,162 Q211,155 224,164 Q212,174 200,167 Q188,174 176,164 Z" fill={hairColor === '#cfcac0' ? '#bdb6aa' : '#2c2019'} />
          : <path d="M192,168 Q200,172 208,168" stroke="#7a4c39" strokeWidth={3} fill="none" strokeLinecap="round" />}
        {prop?.(frame)}
      </g>
    </g>
  );
}

export function Table({ children, id, glow = '#f2b84b' }) {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 26) * 6;
  return (
    <Panel id={id} bg={['#1a1714', '#0a0908']}>
      <g transform={`rotate(${sway},400,0)`}>
        <line x1={400} y1={0} x2={400} y2={120} stroke="#3a352e" strokeWidth={3} />
        <path d="M352,150 Q400,100 448,150 Z" fill="#2a2620" />
        <ellipse cx={400} cy={152} rx={10} ry={6} fill={glow} />
        <path d="M360,152 L440,152 L620,600 L180,600 Z" fill={glow} opacity={0.07} />
      </g>
      <path d="M60,600 L170,390 L630,390 L740,600 Z" fill="#2e2620" />
      <path d="M170,390 L630,390" stroke="#4a3e33" strokeWidth={3} />
      <ellipse cx={400} cy={480} rx={230} ry={60} fill={glow} opacity={0.06} />
      {children}
    </Panel>
  );
}

