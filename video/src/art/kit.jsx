// Kodla çizilmiş animasyon parçaları (SVG). Her vaka kendi sahnelerini bunlarla kurar.
// Tüm hareketler kare numarasından hesaplanır: render her seferinde aynı sonucu verir.
import { useCurrentFrame } from 'remotion';

/** Tohumlu sahte rastgele (0–1): aynı i → aynı değer */
export const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Sürüklenen sis katmanı (bulanık elipsler) */
export function Fog({ w, y, h, count = 7, speed = 0.4, opacity = 0.14, color = '#d9d0bf', seed = 1, id = 'fog' }) {
  const frame = useCurrentFrame();
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {Array.from({ length: count }, (_, i) => {
          const rw = 260 + rnd(seed + i) * 360;
          const span = w + rw * 2;
          const x = ((rnd(seed + i * 3) * span + frame * speed * (0.6 + rnd(seed + i * 7))) % span) - rw;
          return <ellipse key={i} cx={x} cy={y + rnd(seed + i * 5) * h} rx={rw} ry={40 + rnd(seed + i * 11) * 60} fill={color} />;
        })}
      </g>
    </g>
  );
}

/** Dalga çizgileri: base hizasında, genlik amp */
export function Waves({ w, y, rows = 5, gap = 26, amp = 6, color = '#4cc2a8', opacity = 0.35, speed = 1 }) {
  const frame = useCurrentFrame();
  return (
    <g fill="none" stroke={color} strokeLinecap="round" opacity={opacity}>
      {Array.from({ length: rows }, (_, r) => {
        const yy = y + r * gap * (1 + r * 0.25);
        const a = amp * (1 + r * 0.4);
        let d = '';
        for (let x = -20; x <= w + 20; x += 18) {
          const v = yy + Math.sin(x / (70 + r * 20) + (frame * speed) / 14 + r * 1.7) * a;
          d += `${x === -20 ? 'M' : 'L'}${x},${v.toFixed(1)}`;
        }
        return <path key={r} d={d} strokeWidth={1.5 + r * 0.6} opacity={0.4 + r * 0.12} />;
      })}
    </g>
  );
}

/** Kanat çırpan martı (merkez cx,cy; ölçek s) */
export function Gull({ cx, cy, s = 1, phase = 0, color = '#e9e2d3' }) {
  const frame = useCurrentFrame();
  const f = Math.sin(frame / 4 + phase) * 9;
  return (
    <path
      transform={`translate(${cx},${cy}) scale(${s})`}
      d={`M-26,${-f * 0.3} Q-13,${-12 - f} 0,0 Q13,${-12 - f} 26,${-f * 0.3}`}
      fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round"
    />
  );
}

/** Yükselen buhar/duman parçacıkları (kaynak x,y) */
export function Steam({ x, y, count = 7, rise = 120, spread = 26, size = 14, color = '#efe8da', opacity = 0.5, drift = 0, speed = 1, seed = 3 }) {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const period = 70 / speed;
        const t = ((frame + rnd(seed + i) * period) % period) / period; // 0→1
        const px = x + Math.sin(t * 5 + i) * spread * t + drift * t;
        const py = y - t * rise;
        return <circle key={i} cx={px} cy={py} r={size * (0.5 + t * 1.3)} fill={color} opacity={opacity * Math.sin(t * Math.PI)} />;
      })}
    </g>
  );
}

/** Dişli çark yolu: n diş, iç/dış yarıçap */
export function gearPath(n, r1, r2) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const step = (Math.PI * 2) / n;
    const pts = [
      [a, r1], [a + step * 0.15, r2], [a + step * 0.45, r2], [a + step * 0.6, r1],
    ];
    for (const [ang, r] of pts) d += `${d ? 'L' : 'M'}${(Math.cos(ang) * r).toFixed(1)},${(Math.sin(ang) * r).toFixed(1)}`;
  }
  return d + 'Z';
}

/** Basit İstanbul silueti: kubbeler ve minareler (özgün çizim) */
export function Skyline({ w, y, color = '#16161d', scale = 1 }) {
  const parts = [];
  const dome = (cx, r) => `M${cx - r},${y} A${r},${r * 0.85} 0 0 1 ${cx + r},${y} Z`;
  const minaret = (x, hgt) => `M${x - 5},${y} L${x - 5},${y - hgt} L${x},${y - hgt - 26} L${x + 5},${y - hgt} L${x + 5},${y} Z`;
  // tepeler
  parts.push(`M0,${y} Q${w * 0.15},${y - 70} ${w * 0.3},${y - 30} T${w * 0.62},${y - 50} T${w},${y - 20} L${w},${y + 4} L0,${y + 4} Z`);
  // büyük cami
  const c = w * 0.42;
  parts.push(dome(c, 70 * scale), dome(c - 95 * scale, 38 * scale), dome(c + 95 * scale, 38 * scale));
  parts.push(minaret(c - 150 * scale, 150 * scale), minaret(c + 150 * scale, 150 * scale), minaret(c - 175 * scale, 120 * scale), minaret(c + 175 * scale, 120 * scale));
  // küçük cami
  const c2 = w * 0.8;
  parts.push(dome(c2, 40 * scale), minaret(c2 + 60 * scale, 105 * scale));
  // kule
  const t = w * 0.12;
  parts.push(`M${t - 18},${y} L${t - 18},${y - 120} L${t},${y - 160} L${t + 18},${y - 120} L${t + 18},${y} Z`);
  return <path d={parts.join(' ')} fill={color} />;
}

/**
 * İstanbul vapuru silueti: koyu gövde, krem üst yapı, yanan pencereler, tüten baca.
 * Yerel koordinatlar ~0..700 × 0..210; (0,200) su hattının sol ucu.
 */
export function Ferry({ x, y, s = 1, lit = 1 }) {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 22) * 3;
  const tilt = Math.sin(frame / 30) * 0.4;
  const win = (i) => 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frame / (9 + (i % 4)) + i * 1.9)) * lit;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s}) rotate(${tilt},350,180)`}>
      {/* yansıma */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={`r${i}`} x={110 + i * 55} y={215 + (i % 3) * 6} width={18} height={40 + (i % 4) * 14} fill="#f2b84b" opacity={0.08 * win(i) * lit} />
      ))}
      <Steam x={352} y={6} count={9} rise={150} spread={30} size={13} color="#8f8a80" opacity={0.35} drift={-90} speed={0.7} seed={21} />
      {/* baca */}
      <rect x={334} y={4} width={38} height={46} rx={4} fill="#14161b" />
      <rect x={334} y={16} width={38} height={8} fill="#c9c2b2" opacity={0.7} />
      {/* üst güverte */}
      <rect x={190} y={48} width={330} height={42} rx={8} fill="#7c766a" />
      <rect x={470} y={34} width={70} height={56} rx={6} fill="#867f72" />
      {/* ana güverte */}
      <rect x={70} y={88} width={560} height={66} rx={10} fill="#9a9384" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={`w${i}`} x={96 + i * 41} y={104} width={24} height={26} rx={4} fill="#f2b84b" opacity={win(i)} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`u${i}`} x={212 + i * 42} y={58} width={22} height={20} rx={3} fill="#f2b84b" opacity={win(i + 20) * 0.9} />
      ))}
      {/* gövde */}
      <path d="M10,150 L690,150 L655,206 L46,206 Z" fill="#1c2430" />
      <rect x={30} y={146} width={640} height={8} fill="#7a2a22" />
      {/* direk ve fener */}
      <line x1={600} y1={34} x2={600} y2={-30} stroke="#14161b" strokeWidth={4} />
      <circle cx={600} cy={-32} r={6} fill="#ff4f3b" opacity={0.5 + 0.5 * Math.sin(frame / 8)} />
    </g>
  );
}
