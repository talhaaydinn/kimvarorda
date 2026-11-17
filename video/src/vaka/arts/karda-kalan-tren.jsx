// "Karda Kalan Tren" vakasının çizimleri: kapak dünyası, 9 öğe ve 6 POV ipucu sahnesi.
//
// KURAL: Çizimler çözümü ele vermez — hiçbir şüpheli bir silahla ya da bir mekânda gösterilmez,
// POV sahneleri yalnızca ipucunun söylediğini gösterir (atkı kimsenin boynunda değil, bıçak hiçbir odada değil).
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { Fog, Steam, rnd } from '../../art/kit.jsx';
import { Panel, Person, Spot, Table } from '../../art/people.jsx';
import { Flake, Hand, Mountains, PovCam, Snow, Train } from '../../art/winter.jsx';
import { FPS, cue } from '../../timeline.js';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const lerp = (a, b, t) => a + (b - a) * t;

// ================= Dünya: tipide karlara saplanmış tren (1080×1920) =================
function World({ variant = 'sakin', frames = 300 }) {
  const frame = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const ground = 860;
  const zoom = variant === 'yakin' ? interpolate(frame, [0, frames], [1.35, 1.6], CL) : variant === 'kapak' ? interpolate(frame, [0, frames], [1, 1.1], CL) : 1;
  const pan = variant === 'kapak' ? interpolate(frame, [0, frames], [40, -40], CL) : 0;
  const dim = variant === 'sakin' ? 0.45 : 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: dim }}>
      <defs>
        <linearGradient id="trSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070c" />
          <stop offset="0.5" stopColor="#111826" />
          <stop offset="1" stopColor="#273041" />
        </linearGradient>
        <linearGradient id="trSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c2cf" />
          <stop offset="1" stopColor="#3a4250" />
        </linearGradient>
        <radialGradient id="trGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f2b84b" stopOpacity="0.22" />
          <stop offset="1" stopColor="#f2b84b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#0e0d0b" stopOpacity="0" />
          <stop offset="0.68" stopColor="#0e0d0b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0e0d0b" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${W / 2},${ground - 60}) scale(${zoom}) translate(${-W / 2 + pan},${-(ground - 60)})`}>
        <rect width={W} height={H} fill="url(#trSky)" />
        <Fog w={W} y={420} h={300} count={6} speed={0.5} opacity={0.12} id="trFogHigh" seed={14} color="#c9d2de" />
        <Mountains w={W} y={ground - 40} height={430} peaks={4} color="#141a25" snowOpacity={0.45} seed={5} />
        <Mountains w={W} y={ground} height={260} peaks={6} color="#1b2230" snowOpacity={0.6} seed={11} />
        <path d={`M0,${ground} Q300,${ground - 30} 600,${ground - 6} T${W},${ground - 20} L${W},${H} L0,${H} Z`} fill="url(#trSnow)" />
        <ellipse cx={540} cy={ground - 50} rx={460} ry={140} fill="url(#trGlow)" />
        <Train x={190} y={ground - 178} s={0.7} wagons={3} />
        <Fog w={W} y={ground - 90} h={160} count={8} speed={0.9} opacity={0.18} id="trFogLow" seed={21} color="#dfe5ec" />
        <Snow w={W} h={H} count={90} size={3} wind={1.6} speed={1} opacity={0.55} seed={3} />
      </g>
      <Snow w={W} h={H} count={40} size={6} wind={2.4} speed={1.6} opacity={0.75} seed={9} />
      <rect width={W} height={H} fill="url(#trFade)" />
    </svg>
  );
}

// ================= Ortak iç mekân çizimleri =================
/** Basit perspektif: yakın çerçeve (0,0)-(800,H) → uzak duvar f. t: derinlik 0..1, u: yatay 0..1, v: dikey 0..1 */
const persp = (H, f) => (t, u, v) => [lerp(u * 800, f.x0 + u * (f.x1 - f.x0), t), lerp(v * H, f.y0 + v * (f.y1 - f.y0), t)];
const poly = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';

/** Pencere içi: gece ve yağan kar (clip ile) */
function NightWindow({ d, id, seed = 1 }) {
  return (
    <g>
      <clipPath id={id}><path d={d} /></clipPath>
      <path d={d} fill="#0f1726" />
      <g clipPath={`url(#${id})`}>
        <Snow w={800} h={720} count={40} size={2.4} wind={0.8} speed={0.8} opacity={0.8} seed={seed} />
      </g>
      <path d={d} fill="none" stroke="#6b5236" strokeWidth={6} />
    </g>
  );
}

/** Yemekli vagonun içi (800×H): uzakta soba, iki yanda beyaz örtülü masalar, karlı pencereler */
function DiningCar({ H = 600, id = 'dc' }) {
  const frame = useCurrentFrame();
  const f = { x0: 310, y0: H * 0.3, x1: 490, y1: H * 0.6 };
  const P = persp(H, f);
  const flick = 0.75 + 0.25 * Math.sin(frame / 4) * Math.sin(frame / 11);
  const wins = [[0.08, 0.3], [0.42, 0.58], [0.68, 0.78]];
  const tables = [[0.1, 0.28], [0.44, 0.56], [0.7, 0.78]];
  return (
    <g>
      {/* tavan, zemin, duvarlar */}
      <path d={poly([P(0, 0, 0), P(0, 1, 0), P(1, 1, 0), P(1, 0, 0)])} fill="#1b140f" />
      <path d={poly([P(0, 0, 1), P(0, 1, 1), P(1, 1, 1), P(1, 0, 1)])} fill="#2b1c16" />
      <path d={poly([P(0, 0.38, 1), P(0, 0.62, 1), P(1, 0.56, 1), P(1, 0.44, 1)])} fill="#5a1f1c" />
      <path d={poly([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)])} fill="#3a281c" />
      <path d={poly([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)])} fill="#35251a" />
      <rect x={f.x0} y={f.y0} width={f.x1 - f.x0} height={f.y1 - f.y0} fill="#2c1f16" />
      {/* pencereler */}
      {wins.map(([a, b], i) => (
        <g key={i}>
          <NightWindow id={`${id}-wl${i}`} seed={i + 2} d={poly([P(a, 0, 0.22), P(b, 0, 0.22), P(b, 0, 0.5), P(a, 0, 0.5)])} />
          <NightWindow id={`${id}-wr${i}`} seed={i + 7} d={poly([P(a, 1, 0.22), P(b, 1, 0.22), P(b, 1, 0.5), P(a, 1, 0.5)])} />
        </g>
      ))}
      {/* masalar: beyaz örtü */}
      {tables.map(([a, b], i) => (
        <g key={i}>
          {[[0, 0.2], [0.8, 1]].map(([u1, u2], k) => (
            <g key={k}>
              <path d={poly([P(a, u1, 0.68), P(a, u2, 0.68), P(b, u2, 0.68), P(b, u1, 0.68)])} fill="#d9d2c4" />
              <path d={poly([P(a, k ? u1 : u2, 0.68), P(b, k ? u1 : u2, 0.68), P(b, k ? u1 : u2, 0.73), P(a, k ? u1 : u2, 0.73)])} fill="#a99f8f" />
            </g>
          ))}
        </g>
      ))}
      {/* tavan lambaları */}
      {[0.15, 0.45, 0.72].map((t, i) => {
        const [x, y] = P(t, 0.5, 0.05);
        const r = 16 * (1 - t * 0.7);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r * 4} fill="#f2b84b" opacity={0.08 * flick} />
            <circle cx={x} cy={y} r={r} fill="#ffd98a" opacity={0.9} />
          </g>
        );
      })}
      {/* uzaktaki soba */}
      <rect x={378} y={f.y1 - 70} width={44} height={66} rx={6} fill="#141414" />
      <rect x={388} y={f.y1 - 48} width={24} height={16} rx={3} fill="#ff7a2e" opacity={flick} />
      <rect x={394} y={f.y0} width={12} height={f.y1 - f.y0 - 70} fill="#1a1a1a" />
      <circle cx={400} cy={f.y1 - 40} r={60} fill="#ff7a2e" opacity={0.1 * flick} />
    </g>
  );
}

/** Yataklı kompartıman (800×H): solda iki kat ranza, karşıda perdeli pencere, sağda lamba */
function Compartment({ H = 600, id = 'cp', shadow = null }) {
  const frame = useCurrentFrame();
  const f = { x0: 170, y0: H * 0.16, x1: 630, y1: H * 0.8 };
  const P = persp(H, f);
  const flick = 0.8 + 0.2 * Math.sin(frame / 6) * Math.sin(frame / 17);
  const bunk = (v) => (
    <g>
      <path d={poly([P(0, 0, v), P(0, 0.34, v), P(1, 0.34, v), P(1, 0, v)])} fill="#6b2d2a" />
      <path d={poly([P(0, 0.34, v), P(1, 0.34, v), P(1, 0.34, v + 0.06), P(0, 0.34, v + 0.06)])} fill="#4a2a1c" />
    </g>
  );
  return (
    <g>
      <path d={poly([P(0, 0, 0), P(0, 1, 0), P(1, 1, 0), P(1, 0, 0)])} fill="#1a1410" />
      <path d={poly([P(0, 0, 1), P(0, 1, 1), P(1, 1, 1), P(1, 0, 1)])} fill="#24180f" />
      <path d={poly([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)])} fill="#33241a" />
      <path d={poly([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)])} fill="#3a291d" />
      <rect x={f.x0} y={f.y0} width={f.x1 - f.x0} height={f.y1 - f.y0} fill="#2e2118" />
      {/* karşı duvarda perdeli pencere */}
      <NightWindow id={`${id}-w`} seed={4} d={`M${f.x1 - 170},${f.y0 + 60} h130 v${(f.y1 - f.y0) * 0.36} h-130 Z`} />
      <path d={`M${f.x1 - 186},${f.y0 + 46} h50 q-6,110 -18,${(f.y1 - f.y0) * 0.42} h-32 Z`} fill="#6e2a2c" />
      <path d={`M${f.x1 - 22},${f.y0 + 46} h-50 q6,110 18,${(f.y1 - f.y0) * 0.42} h32 Z`} fill="#6e2a2c" />
      {/* lamba ışığı (sağ duvar) */}
      <circle cx={P(0.55, 1, 0.3)[0]} cy={P(0.55, 1, 0.3)[1]} r={90} fill="#f2b84b" opacity={0.12 * flick} />
      <circle cx={P(0.55, 1, 0.3)[0]} cy={P(0.55, 1, 0.3)[1]} r={14} fill="#ffd98a" />
      {shadow?.(f, flick)}
      {bunk(0.4)}
      {bunk(0.74)}
      {/* merdiven */}
      {(() => {
        const [x1, y1] = P(0.2, 0.36, 0.4);
        const [, y2] = P(0.2, 0.36, 1);
        return (
          <g stroke="#7a5a3a" strokeWidth={8}>
            <line x1={x1} y1={y1} x2={x1} y2={y2} />
            <line x1={x1 + 50} y1={y1} x2={x1 + 50} y2={y2} />
            {[0.2, 0.45, 0.7].map((k) => <line key={k} x1={x1} y1={lerp(y1, y2, k)} x2={x1 + 50} y2={lerp(y1, y2, k)} />)}
          </g>
        );
      })()}
    </g>
  );
}

/** Son vagonun arka balkonu (800×H): tipi, ray, buz tutmuş korkuluk */
function Balcony({ H = 600, id = 'bl', glint = -1 }) {
  const frame = useCurrentFrame();
  const top = H * 0.6;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a10" />
          <stop offset="1" stopColor="#1f2836" />
        </linearGradient>
        <linearGradient id={`${id}-ice`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf4fb" />
          <stop offset="1" stopColor="#8fb0c4" />
        </linearGradient>
      </defs>
      <rect width={800} height={H} fill={`url(#${id}-sky)`} />
      <Mountains w={800} y={H * 0.46} height={170} peaks={4} color="#161c27" snowOpacity={0.5} seed={8} />
      <path d={`M0,${H * 0.46} L800,${H * 0.46} L800,${H} L0,${H} Z`} fill="#c3ccd8" />
      {/* geride kalan raylar */}
      <path d={`M330,${H} L396,${H * 0.46} M470,${H} L404,${H * 0.46}`} stroke="#4a515c" strokeWidth={6} />
      {Array.from({ length: 8 }, (_, i) => {
        const k = i / 8;
        const y = lerp(H, H * 0.46, Math.pow(k, 0.6));
        const w = lerp(200, 12, Math.pow(k, 0.6));
        return <rect key={i} x={400 - w / 2} y={y - 4} width={w} height={6} fill="#5c5348" opacity={0.7} />;
      })}
      <Fog w={800} y={H * 0.38} h={120} count={5} speed={1.2} opacity={0.25} id={`${id}-fog`} seed={5} color="#e3e9f0" />
      <Snow w={800} h={H} count={90} size={3.4} wind={3} speed={1.4} opacity={0.85} seed={12} />
      {/* vagonun yan duvarları ve kırmızı lamba */}
      <path d={`M0,0 L70,0 L70,${H} L0,${H} Z M730,0 L800,0 L800,${H} L730,${H} Z`} fill="#1d2430" />
      <circle cx={52} cy={top - 70} r={14} fill="#ff4f3b" opacity={0.6 + 0.4 * Math.sin(frame / 9)} />
      <circle cx={52} cy={top - 70} r={60} fill="#ff4f3b" opacity={0.12} />
      {/* korkuluk */}
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={70 + i * 64} y={top} width={12} height={H - top} fill="#232a35" />
      ))}
      <rect x={60} y={top - 18} width={680} height={30} rx={14} fill={`url(#${id}-ice)`} />
      <rect x={60} y={top - 18} width={680} height={8} rx={4} fill="#ffffff" opacity={0.6} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 90 + i * 48 + rnd(i) * 20;
        const l = 20 + rnd(i + 4) * 40;
        return <path key={i} d={`M${x - 7},${top + 12} L${x + 7},${top + 12} L${x},${top + 12 + l} Z`} fill="#d6e7f2" opacity={0.85} />;
      })}
      {/* buzun üstünde gezinen parıltı: tek bir çizik yok */}
      {glint >= 0 && glint <= 1 && (
        <rect x={60 + glint * 640} y={top - 18} width={60} height={30} rx={14} fill="#ffffff" opacity={0.7 * Math.sin(glint * Math.PI)} />
      )}
      <rect y={H - 60} width={800} height={60} fill="#2a2018" />
      <rect y={H - 64} width={800} height={10} fill="#e6ebf0" opacity={0.8} />
    </g>
  );
}

// ================= Şüpheliler =================
function Rasim() {
  return (
    <Panel id="rasim" bg={['#171c27', '#0a0b0f']}>
      <Spot x={400} color="#cfe0ff" opacity={0.1} />
      <g transform="translate(200,10)">
        <Person
          tall hair="cap" mustache hairColor="#cfcac0" outfit="#1f2a44" accent="#c9a24a"
          extra={
            <g>
              {[250, 290, 330, 370].map((y) => <circle key={y} cx={214} cy={y} r={5} fill="#d9b45a" />)}
              <path d="M150,226 L250,226" stroke="#c9a24a" strokeWidth={3} opacity={0.6} />
              {/* beyaz eldivenler */}
              <circle cx={122} cy={386} r={17} fill="#f4f1ea" />
              <circle cx={290} cy={306} r={17} fill="#f4f1ea" />
            </g>
          }
          prop={(frame) => (
            <g>
              {/* bilet zımbası ve dökülen delikler */}
              <g transform={`rotate(${Math.sin(frame / 14) * 8},290,306)`}>
                <path d="M292,300 L338,272 L344,282 L300,312 Z" fill="#b9bfc8" />
                <path d="M292,312 L336,300 L338,310 L296,320 Z" fill="#8f96a0" />
              </g>
              {Array.from({ length: 5 }, (_, i) => {
                const t = ((frame + i * 14) % 70) / 70;
                return <circle key={i} cx={338 + Math.sin(i * 3 + t * 6) * 10} cy={290 + t * 270} r={4} fill="#efe6cf" opacity={1 - t} />;
              })}
            </g>
          )}
        />
      </g>
    </Panel>
  );
}

function Nermin() {
  return (
    <Panel id="nermin" bg={['#221b16', '#0c0a08']}>
      <Spot x={400} color="#ffe2b8" opacity={0.1} />
      <g transform="translate(200,10)">
        <Person
          hair="short" glasses hairColor="#4a2c1e" outfit="#e6e0d4" accent="#b9b2a4"
          extra={
            <g>
              {/* önlükteki un */}
              {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={160 + rnd(i) * 80} cy={260 + rnd(i + 9) * 130} r={2 + rnd(i + 3) * 3} fill="#fffaf0" opacity={0.8} />)}
              {/* kepçe */}
              <path d="M122,386 L112,300" stroke="#9aa1aa" strokeWidth={7} strokeLinecap="round" />
              <path d="M96,300 Q112,326 128,300 Z" fill="#9aa1aa" />
            </g>
          }
          prop={(frame) => (
            <g>
              {/* aşçı şapkası */}
              <path d="M156,104 Q140,64 170,58 Q178,28 206,38 Q236,24 244,58 Q266,66 246,104 Z" fill="#f6f2ea" />
              <rect x={156} y={96} width={90} height={14} rx={4} fill="#ddd6c8" />
              {/* buğulu gözlük */}
              <circle cx={183} cy={141} r={13} fill="#ffffff" opacity={0.35 + 0.2 * Math.sin(frame / 10)} />
              <circle cx={217} cy={141} r={13} fill="#ffffff" opacity={0.35 + 0.2 * Math.sin(frame / 10)} />
              <Steam x={200} y={120} count={5} rise={80} spread={20} size={10} opacity={0.25} speed={0.8} seed={44} />
            </g>
          )}
        />
      </g>
    </Panel>
  );
}

function Selin() {
  return (
    <Panel id="selin" bg={['#18202a', '#0a0c10']}>
      <Spot x={400} color="#d7ecff" opacity={0.1} />
      <g transform="translate(200,10)">
        <Person
          tall hair="long" glasses hairColor="#1c1714" outfit="#3d5a6c" accent="#6c8a9c"
          extra={
            <g>
              {/* soğuktan kızarmış parmaklar */}
              <circle cx={122} cy={386} r={15} fill="#d98a7a" />
              <circle cx={290} cy={306} r={15} fill="#d98a7a" />
            </g>
          }
          prop={(frame) => (
            <g>
              {/* boynundaki fotoğraf makinesi */}
              <path d="M188,214 L176,276 M212,214 L226,276" stroke="#1b1b1f" strokeWidth={5} />
              <rect x={164} y={270} width={74} height={48} rx={8} fill="#1b1b1f" />
              <rect x={178} y={262} width={22} height={10} rx={3} fill="#1b1b1f" />
              <circle cx={201} cy={294} r={16} fill="#2c3440" stroke="#8a93a0" strokeWidth={3} />
              <circle cx={196} cy={289} r={4} fill="#ffffff" opacity={0.6} />
              {frame % 80 < 3 && <circle cx={201} cy={294} r={140} fill="#ffffff" opacity={0.35} />}
            </g>
          )}
        />
      </g>
    </Panel>
  );
}

// ================= Silahlar =================
function Kurek() {
  const frame = useCurrentFrame();
  return (
    <Table id="kurek" glow="#ff9a4a">
      {/* kömür parçaları */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 230 + rnd(i) * 360;
        const y = 470 + rnd(i + 5) * 80;
        return (
          <g key={i}>
            <path d={`M${x},${y} l18,-10 l16,8 l-4,16 l-22,6 Z`} fill="#16161a" />
            <circle cx={x + 14} cy={y + 2} r={3} fill="#ff6a2a" opacity={0.3 + 0.3 * Math.sin(frame / 7 + i)} />
          </g>
        );
      })}
      <g transform={`rotate(${-8 + Math.sin(frame / 30) * 1.5},400,450)`}>
        {/* sap ve tutamak */}
        <rect x={360} y={432} width={260} height={16} rx={6} fill="#6d4a2e" />
        <path d="M612,424 h40 a18,18 0 0 1 0,36 h-40 Z M626,434 h22 a8,8 0 0 1 0,16 h-22 Z" fill="#6d4a2e" fillRule="evenodd" />
        {/* demir kürek ağzı */}
        <path d="M200,404 L370,418 L370,462 L200,476 Q186,440 200,404 Z" fill="#2a2c31" />
        <path d="M200,404 L370,418 L370,426 L204,414 Z" fill="#5a5e66" opacity={0.6} />
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={215 + rnd(i + 20) * 140} cy={418 + rnd(i + 30) * 46} r={4 + rnd(i) * 5} fill="#0c0c0e" opacity={0.6} />)}
      </g>
      <Steam x={290} y={400} count={6} rise={90} spread={30} size={8} color="#3a3a40" opacity={0.4} speed={0.6} seed={61} />
    </Table>
  );
}

function Bicak() {
  const frame = useCurrentFrame();
  const g = ((frame % 90) / 90) * 1.6 - 0.3;
  return (
    <Table id="bicak">
      <defs>
        <linearGradient id="bicak-blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9edf2" />
          <stop offset="1" stopColor="#8d949e" />
        </linearGradient>
        <linearGradient id="bicak-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset={Math.max(0, g - 0.08)} stopColor="#fff" stopOpacity="0" />
          <stop offset={Math.min(1, Math.max(0, g))} stopColor="#fff" stopOpacity="0.9" />
          <stop offset={Math.min(1, g + 0.08)} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={240 + rnd(i) * 330} cy={480 + rnd(i + 7) * 70} r={2 + rnd(i + 2) * 3} fill="#c8a06a" />)}
      <g transform="rotate(-6,400,450)">
        {/* dişli ağız */}
        <path
          d={`M220,430 L540,430 L560,446 L540,462 ${Array.from({ length: 16 }, (_, i) => `L${530 - i * 20},${462 + (i % 2 ? 0 : 6)}`).join(' ')} L220,462 Z`}
          fill="url(#bicak-blade)"
        />
        <path d="M220,430 L540,430 L560,446 L540,462 L220,462 Z" fill="url(#bicak-glint)" />
        <rect x={560} y={434} width={150} height={26} rx={10} fill="#5b3a24" />
        {[590, 630, 670].map((x) => <circle key={x} cx={x} cy={447} r={4} fill="#c9a24a" />)}
      </g>
    </Table>
  );
}

function Atki() {
  const frame = useCurrentFrame();
  const w = Math.sin(frame / 9) * 10;
  return (
    <Table id="atki">
      {/* S biçiminde kırmızı yün atkı */}
      <path d="M190,440 Q300,380 400,440 T610,440" stroke="#9c1f24" strokeWidth={64} fill="none" strokeLinecap="round" />
      <path d="M190,440 Q300,380 400,440 T610,440" stroke="#c8343a" strokeWidth={46} fill="none" strokeLinecap="round" strokeDasharray="14 10" opacity={0.6} />
      {/* püsküller */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={166 + i * 7} y1={466} x2={160 + i * 7} y2={510} stroke="#9c1f24" strokeWidth={5} strokeLinecap="round" />
      ))}
      {/* sökülmüş uç */}
      <path d={`M636,450 Q670,${470 + w} 700,${452 - w} T760,${470 + w}`} stroke="#c8343a" strokeWidth={4} fill="none" strokeLinecap="round" />
    </Table>
  );
}

// ================= Yerler =================
function YemekliVagon() {
  return (
    <Panel id="yemekli" bg={['#1c140f', '#0b0806']}>
      <DiningCar H={600} id="dcPanel" />
    </Panel>
  );
}

function Kompartiman() {
  return (
    <Panel id="kompartiman" bg={['#1a1410', '#0a0806']}>
      <Compartment H={600} id="cpPanel" />
    </Panel>
  );
}

function ArkaBalkon() {
  return (
    <Panel id="balkon" bg={['#070a10', '#1f2836']}>
      <Balcony H={600} id="blPanel" />
    </Panel>
  );
}

// ================= POV ipucu sahneleri (800×720) =================
const PH = 720;

/** c1 — cesedin paltosunda erimemiş kar taneleri (fener ışığıyla) */
function PovPalto({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'kar taneleri', 0.6);
  const fx = 400 + Math.sin(frame / 26) * 230;
  const fy = 380 + Math.cos(frame / 37) * 150;
  const flakes = Array.from({ length: 16 }, (_, i) => [110 + rnd(i + 3) * 580, 140 + rnd(i + 17) * 500, 7 + rnd(i) * 8, rnd(i + 5) * 60]);
  const burst = spring({ frame: frame - at, fps: FPS, config: { damping: 9, stiffness: 120 } });
  return (
    <PovCam frames={s.frames} h={PH} push={[1, 1.16]} focus={[400, 400]} id="pov-c1">
      <defs>
        <pattern id="c1-wool" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M0,12 L12,0 M12,24 L24,12 M0,12 L12,24 M12,0 L24,12" stroke="#5c4c40" strokeWidth={3} />
        </pattern>
        <radialGradient id="c1-torch" gradientUnits="userSpaceOnUse" cx={fx} cy={fy} r={300}>
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000" stopOpacity="0.8" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-100} width={1000} height={920} fill="#4a3d33" />
      <rect x={-100} y={-100} width={1000} height={920} fill="url(#c1-wool)" opacity={0.7} />
      {/* yaka ve düğmeler */}
      <path d="M260,-100 L420,330 L380,820 L-100,820 L-100,-100 Z" fill="#3e332b" />
      <path d="M260,-100 L420,330 L460,300 L340,-100 Z" fill="#2e2620" />
      {[400, 520, 640].map((y) => (
        <g key={y}>
          <circle cx={470} cy={y} r={18} fill="#14100d" />
          <circle cx={470} cy={y} r={18} fill="none" stroke="#4a3a2c" strokeWidth={3} />
        </g>
      ))}
      <rect x={-100} y={-100} width={1000} height={920} fill="url(#c1-torch)" />
      {flakes.map(([x, y, r, rot], i) => {
        const d = Math.hypot(x - fx, y - fy);
        const lit = Math.max(0, 1 - d / 260);
        return <g key={i} opacity={0.55 + 0.45 * Math.max(lit, burst)}><Flake x={x} y={y} r={r * (1 + burst * 0.2)} rot={rot + frame * 0.2} glow={lit * 0.5} /></g>;
      })}
      <circle cx={fx} cy={fy} r={60} fill="#fff6dc" opacity={0.06} />
    </PovCam>
  );
}

/** c2 — yemekli vagonda ekmek tahtasının yanındaki dişli kesici yok */
function PovEkmekTahtasi({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'yerinde yok', 0.75);
  const p = interpolate(frame, [at - 4, at + 8], [0, 1], CL);
  const pulse = 0.55 + 0.45 * Math.sin((frame - at) / 4);
  return (
    <PovCam frames={s.frames} h={PH} door push={[1, 1.12]} focus={[400, 520]} id="pov-c2">
      <DiningCar H={PH} id="dcPov" />
      {/* öndeki masa */}
      <path d="M-40,520 L840,520 L900,760 L-100,760 Z" fill="#ece6da" />
      <path d="M-40,520 L840,520" stroke="#cfc7b8" strokeWidth={6} />
      {/* ekmek tahtası, yarım ekmek, kırıntılar */}
      <path d="M120,548 L440,548 L456,650 L104,650 Z" fill="#a8743f" />
      <path d="M120,548 L440,548 L443,560 L118,560 Z" fill="#c48c50" />
      <path d="M150,630 Q160,572 236,570 Q300,572 302,630 Z" fill="#c9893f" />
      <path d="M302,630 L302,584 Q302,572 290,572" stroke="#f3dfb8" strokeWidth={10} fill="none" />
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={316 + rnd(i) * 120} cy={580 + rnd(i + 9) * 60} r={2 + rnd(i + 4) * 4} fill="#e2c08c" />)}
      {/* bıçağın olması gereken yer: kesik çizgili boş siluet */}
      <g opacity={p} transform="rotate(-8,600,600)">
        <path
          d="M480,590 L650,590 L666,602 L650,614 L480,614 Z M670,592 L740,592 L740,612 L670,612 Z"
          fill="#ff4f3b" fillOpacity={0.1 * pulse} stroke="#ff4f3b" strokeWidth={5} strokeDasharray="12 9" strokeOpacity={pulse}
        />
        <text x={610} y={560} textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontWeight={700} fontSize={64} fill="#ff4f3b" opacity={pulse}>?</text>
      </g>
    </PovCam>
  );
}

/** c3 — kompartımanda başını üst ranzaya çarpmamak için eğilen uzun bir gölge */
function PovGolge({ s }) {
  const at = cue(s, 'eğiliyor', 0.75);
  return (
    <PovCam frames={s.frames} h={PH} door push={[1, 1.12]} focus={[360, 380]} id="pov-c3">
      <Compartment
        H={PH}
        id="cpPov"
        shadow={(f, flick) => <Shadow f={f} flick={flick} at={at} />}
      />
    </PovCam>
  );
}

function Shadow({ f, flick, at }) {
  const frame = useCurrentFrame();
  const bend = spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 70 } }) * 24;
  const x = f.x0 + 150;
  const base = f.y1;
  const hgt = (f.y1 - f.y0) * 0.72;
  return (
    <g opacity={0.78 * flick} filter="url(#cp-blur)">
      <defs>
        <filter id="cp-blur"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <g transform={`rotate(${-bend},${x + 40},${base - hgt * 0.5})`}>
        <circle cx={x + 40} cy={base - hgt + 34} r={32} fill="#000" />
        <path d={`M${x - 10},${base - hgt + 70} Q${x + 40},${base - hgt + 54} ${x + 90},${base - hgt + 70} L${x + 84},${base - hgt * 0.45} L${x - 4},${base - hgt * 0.45} Z`} fill="#000" />
      </g>
      <path d={`M${x - 4},${base - hgt * 0.47} L${x + 84},${base - hgt * 0.47} L${x + 76},${base} L${x + 46},${base} L${x + 40},${base - hgt * 0.2} L${x + 34},${base} L${x + 4},${base} Z`} fill="#000" />
    </g>
  );
}

/** c4 — yemekli vagonun buğulu aynasında, çorba buharının ardında kalın, kır bir bıyık */
function PovAyna({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'bıyık', 0.7);
  const clear = interpolate(frame, [at - 6, at + 16], [0, 1], CL);
  return (
    <PovCam frames={s.frames} h={PH} push={[1, 1.12]} focus={[400, 320]} id="pov-c4">
      <defs>
        <clipPath id="c4-mirror"><rect x={190} y={90} width={420} height={440} rx={30} /></clipPath>
        <filter id="c4-blur"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="c4-soft"><feGaussianBlur stdDeviation="2.5" /></filter>
        <linearGradient id="c4-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25303b" />
          <stop offset="1" stopColor="#11161c" />
        </linearGradient>
      </defs>
      <rect x={-100} y={-100} width={1000} height={920} fill="#3a281c" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-100 + i * 120} y={-100} width={6} height={920} fill="#2a1d14" />)}
      <rect x={176} y={76} width={448} height={468} rx={40} fill="#a07d45" />
      <rect x={190} y={90} width={420} height={440} rx={30} fill="url(#c4-glass)" />
      <g clipPath="url(#c4-mirror)">
        {/* bulanık yansıma: kimliği değil, yalnızca bıyığı seçilir */}
        <g filter="url(#c4-blur)" opacity={0.75}>
          <circle cx={400} cy={250} r={86} fill="#8a7464" />
          <path d="M260,560 Q270,380 400,370 Q530,380 540,560 Z" fill="#2a3242" />
        </g>
        <g filter="url(#c4-soft)" opacity={0.35 + clear * 0.65}>
          <path d="M352,298 Q378,276 400,292 Q422,276 448,298 Q424,322 400,306 Q376,322 352,298 Z" fill="#d8d2c6" />
        </g>
        {/* buğu */}
        <rect x={190} y={90} width={420} height={440} fill="#e9eef2" opacity={0.62 - clear * 0.32} filter="url(#c4-blur)" />
        <Fog w={800} y={150} h={300} count={6} speed={0.8} opacity={0.35} id="c4-fog" seed={33} color="#f4f6f8" />
        <rect x={210} y={100} width={40} height={420} fill="#ffffff" opacity={0.07} transform="rotate(12,230,300)" />
      </g>
      {/* öndeki çorba ve buharı */}
      <ellipse cx={400} cy={690} rx={230} ry={70} fill="#f1ece2" />
      <ellipse cx={400} cy={672} rx={190} ry={44} fill="#c9762f" />
      <ellipse cx={400} cy={672} rx={190} ry={44} fill="none" stroke="#fffaf0" strokeWidth={10} />
      <Steam x={400} y={650} count={12} rise={420} spread={90} size={30} opacity={0.32} speed={0.55} seed={71} />
      <Steam x={330} y={660} count={6} rise={300} spread={50} size={22} opacity={0.22} speed={0.7} seed={79} />
    </PovCam>
  );
}

/** c5 — kondüktörün yanından geçerken: beyaz eldivenlerde tek bir kurum lekesi yok */
function PovEldiven({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'kurum lekesi', 0.6);
  const sp = spring({ frame: frame - at, fps: FPS, config: { damping: 10, stiffness: 120 } });
  const star = (x, y, r, k) => {
    const a = sp * (0.6 + 0.4 * Math.sin(frame / 5 + k));
    return <path key={k} transform={`translate(${x},${y}) scale(${a})`} d={`M0,${-r} Q4,-4 ${r},0 Q4,4 0,${r} Q-4,4 ${-r},0 Q-4,-4 0,${-r} Z`} fill="#ffffff" />;
  };
  const glove = (x, y, flip) => (
    <g transform={`translate(${x},${y}) scale(${flip},1)`}>
      <path d="M-46,60 Q-56,-10 -36,-40 L40,-40 Q56,-6 46,60 Z" fill="#f6f4ee" />
      {[-30, -10, 10, 30].map((fx, i) => <rect key={i} x={fx - 11} y={-104 + Math.abs(fx) * 0.5} width={22} height={74} rx={11} fill="#f6f4ee" />)}
      <rect x={-78} y={-34} width={22} height={60} rx={11} fill="#f6f4ee" transform="rotate(-34,-67,-4)" />
      <path d="M-46,60 L46,60 L52,90 L-52,90 Z" fill="#e4e0d6" />
      <path d="M-20,-30 L-20,40 M0,-30 L0,40 M20,-30 L20,40" stroke="#dcd7cb" strokeWidth={3} />
    </g>
  );
  return (
    <PovCam frames={s.frames} h={PH} pan={[150, -150]} push={[1.02, 1.08]} id="pov-c5">
      {/* koridor: karlı pencere şeridi */}
      <rect x={-200} y={-100} width={1200} height={920} fill="#2f2219" />
      {[-160, 120, 400, 680, 960].map((x, i) => (
        <NightWindow key={x} id={`c5-w${i}`} seed={i + 40} d={`M${x},70 h220 v170 h-220 Z`} />
      ))}
      <rect x={-200} y={600} width={1200} height={220} fill="#4a1b1a" />
      {/* üniforma (yüz kadraj dışında) */}
      <path d="M180,820 Q170,300 260,180 Q400,120 540,180 Q630,300 620,820 Z" fill="#1f2a44" />
      <path d="M400,150 L400,820" stroke="#151d31" strokeWidth={6} />
      {[260, 340, 420, 500].map((y) => <circle key={y} cx={430} cy={y} r={9} fill="#d9b45a" />)}
      <path d="M330,150 L400,240 L470,150" fill="none" stroke="#c9a24a" strokeWidth={5} />
      {/* eldivenler ve bilet zımbası */}
      <path d="M300,520 L470,488 L476,506 L306,540 Z" fill="#b9bfc8" />
      {glove(300, 540, 1)}
      {glove(500, 520, -1)}
      {star(262, 470, 26, 1)}
      {star(530, 440, 20, 2)}
      {star(320, 590, 16, 3)}
      {star(470, 600, 22, 4)}
    </PovCam>
  );
}

/** c6 — arka balkonda buz tutmuş korkuluğa dokunuyorsun: tek bir dişli çizik bile yok */
function PovKorkuluk({ s }) {
  const frame = useCurrentFrame();
  const at = cue(s, 'dokunuyorsun', 0.35);
  const atG = cue(s, 'dişli çizik', 0.7);
  const reach = spring({ frame: frame - at, fps: FPS, config: { damping: 16, stiffness: 80 } });
  const glint = interpolate(frame, [atG - 4, atG + 26], [0, 1], CL);
  const top = PH * 0.6;
  return (
    <PovCam frames={s.frames} h={PH} door push={[1, 1.1]} focus={[480, top]} id="pov-c6">
      <Balcony H={PH} id="blPov" glint={frame >= atG - 4 ? glint : -1} />
      <Hand x={lerp(620, 520, reach)} y={lerp(PH + 220, top - 4, reach)} ang={-14} s={1.05} sleeve="#1f2633" />
    </PovCam>
  );
}

export const ITEM_ART = {
  s1: Rasim, s2: Nermin, s3: Selin,
  w1: Kurek, w2: Bicak, w3: Atki,
  l1: YemekliVagon, l2: Kompartiman, l3: ArkaBalkon,
};

/** İpucu kimliği → POV sahnesi */
export const POV = {
  c1: PovPalto,
  c2: PovEkmekTahtasi,
  c3: PovGolge,
  c4: PovAyna,
  c5: PovEldiven,
  c6: PovKorkuluk,
};

export default { title: 'Karda Kalan Tren', World, ITEM_ART, POV };
