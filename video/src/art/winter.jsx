// Kış ve tren parçaları + birinci şahıs (POV) kamera. Tüm hareket kare numarasından hesaplanır.
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { Steam, rnd } from './kit.jsx';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

/** Yağan kar: w×h alan, wind yatay sürüklenme (px/kare) */
export function Snow({ w, h, count = 60, speed = 1, wind = 0.4, size = 3, opacity = 0.85, seed = 1, color = '#f4f1ea' }) {
  const frame = useCurrentFrame();
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => {
        const v = speed * (1.4 + rnd(seed + i * 3) * 1.8);
        const y = ((rnd(seed + i) * (h + 40) + frame * v) % (h + 40)) - 20;
        const x = (((rnd(seed + i * 7) * w + frame * wind * (0.6 + rnd(seed + i)) + Math.sin(frame / 18 + i) * 10) % w) + w) % w;
        const r = size * (0.5 + rnd(seed + i * 11));
        return <circle key={i} cx={x} cy={y} r={r} opacity={opacity * (0.5 + rnd(seed + i * 13) * 0.5)} />;
      })}
    </g>
  );
}

/** Karlı dağ sırası: zirvelerde kar örtüsü */
export function Mountains({ w, y, height = 300, peaks = 5, color = '#1a1f2b', snow = '#d9dde3', seed = 2, snowOpacity = 0.85 }) {
  const pts = [];
  for (let i = 0; i <= peaks * 2; i++) {
    const x = (i / (peaks * 2)) * w;
    const up = i % 2 === 1;
    const hh = up ? height * (0.6 + rnd(seed + i) * 0.4) : height * (0.15 + rnd(seed + i) * 0.25);
    pts.push([x + (rnd(seed + i * 5) - 0.5) * (w / peaks) * 0.3, y - hh]);
  }
  const body = `M0,${y} ` + pts.map(([x, yy]) => `L${x.toFixed(1)},${yy.toFixed(1)}`).join(' ') + ` L${w},${y} Z`;
  const caps = pts
    .map(([x, yy], i) => {
      if (i % 2 === 0 || i === pts.length - 1) return '';
      const [lx, ly] = pts[i - 1];
      const [rx, ry] = pts[i + 1];
      const t = 0.3;
      const a = [x + (lx - x) * t, yy + (ly - yy) * t];
      const b = [x + (rx - x) * t, yy + (ry - yy) * t];
      return `M${x},${yy} L${a[0]},${a[1]} L${(a[0] + x) / 2},${a[1] - 10} L${x},${a[1] + 6} L${(b[0] + x) / 2},${b[1] - 8} L${b[0]},${b[1]} Z`;
    })
    .join(' ');
  return (
    <g>
      <path d={body} fill={color} />
      <path d={caps} fill={snow} opacity={snowOpacity} />
    </g>
  );
}

/**
 * Karlara saplanmış gece treni: lokomotif + vagonlar, yanan pencereler, tüten baca, çatılarda kar.
 * Yerel koordinatlar ~0..(260 + vagon×250) × 0..176; y=170 ray hizası.
 */
export function Train({ x, y, s = 1, wagons = 3, lit = 1 }) {
  const frame = useCurrentFrame();
  const win = (i) => (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(frame / (11 + (i % 5)) + i * 2.3))) * lit;
  const L = 250;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Steam x={71} y={18} count={10} rise={170} spread={36} size={16} color="#7d828c" opacity={0.4} drift={60} speed={0.6} seed={31} />
      {/* far ışığı */}
      <path d="M-4,108 L-420,30 L-420,210 Z" fill="#f6e7b8" opacity={0.07 + 0.02 * Math.sin(frame / 7)} />
      {/* lokomotif */}
      <rect x={58} y={20} width={26} height={44} rx={4} fill="#121419" />
      <path d="M0,150 L0,90 Q0,64 26,62 L170,62 L170,40 L250,40 L250,150 Z" fill="#20252e" />
      <rect x={180} y={52} width={56} height={36} rx={4} fill="#f2b84b" opacity={win(0)} />
      <circle cx={6} cy={108} r={11} fill="#fff1c9" />
      <rect x={0} y={128} width={250} height={8} fill="#7a2a22" />
      <path d="M-2,66 Q20,54 170,58 L170,64 L0,68 Z" fill="#e9edf2" opacity={0.85} />
      <path d="M168,42 Q210,30 252,42 L252,46 L168,46 Z" fill="#e9edf2" opacity={0.85} />
      {/* vagonlar */}
      {Array.from({ length: wagons }, (_, k) => {
        const wx = 260 + k * L;
        return (
          <g key={k}>
            <rect x={wx} y={50} width={L - 12} height={100} rx={8} fill="#2a3344" />
            <path d={`M${wx - 2},56 Q${wx + (L - 12) / 2},34 ${wx + L - 10},56 L${wx + L - 10},60 L${wx - 2},60 Z`} fill="#eef1f5" opacity={0.9} />
            {Array.from({ length: 5 }, (_, i) => (
              <rect key={i} x={wx + 16 + i * 44} y={74} width={30} height={34} rx={4} fill="#f2b84b" opacity={win(k * 5 + i + 1)} />
            ))}
            <rect x={wx} y={128} width={L - 12} height={6} fill="#1a1f2a" />
            <rect x={wx + L - 12} y={96} width={12} height={20} fill="#15181f" />
          </g>
        );
      })}
      {/* son vagonun kırmızı lambası */}
      <circle cx={260 + wagons * L - 16} cy={118} r={6} fill="#ff4f3b" opacity={0.55 + 0.45 * Math.sin(frame / 9)} />
      {/* tekerlekleri gömen kar */}
      <path d={`M-40,176 Q40,128 120,150 T${270 + wagons * L},146 L${290 + wagons * L},182 L-40,182 Z`} fill="#dfe3e8" />
    </g>
  );
}

/** Dört köşeli vizör ve yanıp sönen POV işareti */
function Viewfinder({ h }) {
  const frame = useCurrentFrame();
  const c = (x, y, dx, dy) => `M${x},${y + dy * 44} L${x},${y} L${x + dx * 44},${y}`;
  return (
    <g stroke="#f1eadc" strokeWidth={4} fill="none" opacity={0.8}>
      <path d={c(26, 26, 1, 1)} />
      <path d={c(774, 26, -1, 1)} />
      <path d={c(26, h - 26, 1, -1)} />
      <path d={c(774, h - 26, -1, -1)} />
      <circle cx={64} cy={66} r={8} fill="#ff4f3b" stroke="none" opacity={frame % 30 < 18 ? 1 : 0.2} />
      <text x={82} y={76} fill="#f1eadc" stroke="none" fontFamily="IBM Plex Mono, monospace" fontWeight={600} fontSize={28} letterSpacing={3}>POV</text>
    </g>
  );
}

/** İki kanatlı sürgülü kapı: open 0 → 1 */
function SlidingDoor({ open, h, color = '#3c2a1f', glass = '#e8c88a' }) {
  const off = open * 410;
  const leaf = (x, k) => (
    <g key={k} transform={`translate(${x},0)`}>
      <rect width={400} height={h} fill={color} />
      <rect x={14} y={14} width={372} height={h - 28} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={6} />
      <rect x={110} y={h * 0.16} width={180} height={h * 0.34} rx={10} fill={glass} opacity={0.3} />
      <rect x={k ? 22 : 356} y={h * 0.5} width={20} height={90} rx={8} fill="#b8925a" />
    </g>
  );
  return (
    <g>
      {leaf(-off, 0)}
      {leaf(400 + off, 1)}
    </g>
  );
}

/**
 * Birinci şahıs kamera (800×h sahne): yavaş yakınlaşma, yürüyüş sallantısı, açılan kapı, vizör.
 * pan: [başlangıç, bitiş] yatay kayma (birinin yanından geçerken). focus: yakınlaşmanın merkezi.
 */
export function PovCam({ children, frames = 200, h = 720, door = false, push = [1, 1.12], pan = [0, 0], focus = [400, 360], id = 'pov' }) {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, frames], push, CL);
  const px = interpolate(frame, [0, frames], pan, CL);
  const bx = Math.sin(frame / 15) * 4;
  const by = Math.abs(Math.sin(frame / 9)) * 6;
  const open = door ? interpolate(frame, [6, 26], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) }) : 1;
  return (
    <svg viewBox={`0 0 800 ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
      </defs>
      <rect width={800} height={h} fill="#08090b" />
      <g transform={`translate(${focus[0]},${focus[1]}) scale(${z}) translate(${-focus[0] + px + bx},${-focus[1] + by})`}>{children}</g>
      {door && open < 1 && <SlidingDoor open={open} h={h} />}
      <rect width={800} height={h} fill={`url(#${id}-vig)`} />
      <Viewfinder h={h} />
    </svg>
  );
}

/** Kadraja alttan uzanan el. (x,y) parmak uçlarının ortası; ang: kolun açısı (derece) */
export function Hand({ x, y, ang = -20, s = 1, skin = '#c99a74', sleeve = '#2b2f38' }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${ang}) scale(${s})`}>
      <path d="M-40,40 L40,40 L64,460 L-64,460 Z" fill={sleeve} />
      <rect x={-46} y={30} width={92} height={22} rx={8} fill="#1d2027" />
      <path d="M-38,36 Q-44,-10 -30,-30 L30,-30 Q44,-8 38,36 Z" fill={skin} />
      {[-27, -9, 9, 27].map((fx, i) => (
        <rect key={i} x={fx - 8} y={-78 + Math.abs(fx) * 0.6} width={16} height={58} rx={8} fill={skin} />
      ))}
      <rect x={-56} y={-20} width={16} height={46} rx={8} fill={skin} transform="rotate(-32,-48,4)" />
    </g>
  );
}

/** Altı kollu kar tanesi */
export function Flake({ x, y, r = 10, glow = 0, rot = 0 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} stroke="#f7fbff" strokeLinecap="round">
      {glow > 0 && <circle r={r * 1.5} fill="#e6f2ff" stroke="none" opacity={glow * 0.3} />}
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1={-r} y1={0} x2={r} y2={0} strokeWidth={r * 0.22} />
          <line x1={r * 0.55} y1={0} x2={r * 0.8} y2={-r * 0.25} strokeWidth={r * 0.14} />
          <line x1={r * 0.55} y1={0} x2={r * 0.8} y2={r * 0.25} strokeWidth={r * 0.14} />
          <line x1={-r * 0.55} y1={0} x2={-r * 0.8} y2={-r * 0.25} strokeWidth={r * 0.14} />
          <line x1={-r * 0.55} y1={0} x2={-r * 0.8} y2={r * 0.25} strokeWidth={r * 0.14} />
        </g>
      ))}
    </g>
  );
}
