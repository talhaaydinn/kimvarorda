// "Son Vapur" vakasının çizimleri. Başka bir vaka için bu dosya yeniden yazılır (ART_FOR başlığı eşleşmezse
// video otomatik olarak emojili sade görünüme döner).
//
// KURAL: Çizimler çözümü ele vermez — hiçbir şüpheli bir silahla ya da bir mekânda gösterilmez;
// herkes yalnızca kendi açıklamasındaki eşyayla görünür.
import { interpolate, useCurrentFrame } from 'remotion';
import { Ferry, Fog, Gull, Skyline, Steam, Waves, gearPath, rnd } from '../art/kit.jsx';

export const ART_FOR = 'Son Vapur';

const SKIN = '#c99a74';
const clampX = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// ================= Dünya: gece Boğazı (tam ekran arka plan) =================
/**
 * variant: 'kapak' (vapur karşıdan geçer) | 'yakin' (vapura yaklaşan kamera) | 'sakin' (soluk, ipuçlarının arkası)
 * frames: sahnenin uzunluğu (vapurun yolculuğu buna göre)
 */
export function World({ variant = 'sakin', frames = 300 }) {
  const frame = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const horizon = 900;
  const ferryX = variant === 'kapak'
    ? interpolate(frame, [0, frames], [-560, 620], clampX)
    : variant === 'yakin' ? 250 : 680;
  const zoom = variant === 'yakin' ? interpolate(frame, [0, frames], [1.35, 1.75], clampX) : variant === 'kapak' ? interpolate(frame, [0, frames], [1, 1.08], clampX) : 1;
  const dim = variant === 'sakin' ? 0.45 : 1;
  const anchor = variant === 'yakin' ? 820 : horizon; // yakınlaşmanın merkezi (y)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: dim }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07080c" />
          <stop offset="0.45" stopColor="#141722" />
          <stop offset="1" stopColor="#262533" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14202a" />
          <stop offset="1" stopColor="#05080b" />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#efe6cf" stopOpacity="0.35" />
          <stop offset="1" stopColor="#efe6cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* yakın çekimde kamera vapurun ortasına kilitlenir: üstteki yazılarla çakışmaz */}
      <g transform={`translate(${W / 2},${anchor}) scale(${zoom}) translate(${-W / 2},${-anchor})`}>
        <rect width={W} height={H} fill="url(#sky)" />
        <circle cx={790} cy={420} r={220} fill="url(#moonGlow)" />
        <circle cx={790} cy={420} r={62} fill="#e8dfc8" opacity={0.85} />
        <Fog w={W} y={360} h={260} count={6} speed={0.25} opacity={0.1} id="fogHigh" seed={4} />
        <Skyline w={W} y={horizon - 8} color="#1b1b25" />
        <rect y={horizon} width={W} height={H - horizon} fill="url(#sea)" />
        {/* ay yansıması */}
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={760 + Math.sin(frame / 12 + i) * 14} y={horizon + 20 + i * 34} width={60 - i * 6} height={4} rx={2} fill="#e8dfc8" opacity={0.25 - i * 0.03} />
        ))}
        <Ferry x={ferryX} y={horizon - 175} s={0.62} />
        <Waves w={W} y={horizon + 40} rows={7} gap={34} amp={5} color="#5d7d86" opacity={0.3} />
        <Fog w={W} y={horizon - 120} h={200} count={8} speed={0.6} opacity={0.16} id="fogLow" seed={9} />
      </g>
      {/* alt kısım: yazılar okunsun diye kararır */}
      <rect width={W} height={H} fill="url(#fade)" />
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#0e0d0b" stopOpacity="0" />
          <stop offset="0.68" stopColor="#0e0d0b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0e0d0b" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ================= Panel çerçevesi (800×600) =================
function Panel({ children, bg = ['#1d1b18', '#0d0c0a'], id }) {
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
function Spot({ x = 400, color = '#f1eadc', opacity = 0.13 }) {
  const frame = useCurrentFrame();
  const flick = 0.85 + 0.15 * Math.sin(frame / 5) * Math.sin(frame / 13);
  return <path d={`M${x - 40},0 L${x + 40},0 L${x + 230},600 L${x - 230},600 Z`} fill={color} opacity={opacity * flick} />;
}

// ================= Şüpheliler =================
/**
 * Düz illüstrasyon tarzı figür. Ayaklar (200,580), uzun boy ~500 birim; kısa boy 0.84 ölçek.
 * opts: { tall, hair: 'short'|'long'|'cap'|'bald', mustache, glasses, outfit, accent, prop: (frame)=>JSX }
 */
function Person({ tall, hair = 'short', mustache, glasses, outfit = '#3a3f4a', accent = '#5a5f6a', hairColor = '#2a211b', prop, extra }) {
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

function TulipGlass({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-11,-30 Q-5,-14 -9,0 L9,0 Q5,-14 11,-30 Z" fill="#a1311f" opacity={0.9} />
      <path d="M-11,-30 Q-5,-14 -9,0 L9,0 Q5,-14 11,-30" fill="none" stroke="#f1eadc" strokeWidth={1.5} opacity={0.6} />
      <ellipse cx={0} cy={3} rx={14} ry={4} fill="#d8d2c4" />
    </g>
  );
}

export function Husnu() {
  return (
    <Panel id="husnu" bg={['#2a1f17', '#0d0a08']}>
      <Spot x={400} color="#f2b84b" opacity={0.1} />
      <Fog w={800} y={500} h={80} count={4} speed={0.3} opacity={0.08} id="hf" seed={2} />
      <g transform="translate(200,10)">
        <Person
          tall={false} hair="bald" mustache hairColor="#cfcac0" outfit="#e9e2d3" accent="#a59d8e"
          extra={<rect x={168} y={226} width={64} height={150} rx={6} fill="#2b2a2e" />}
          prop={() => (
            <g>
              <ellipse cx={316} cy={300} rx={74} ry={11} fill="#b9b4aa" />
              <TulipGlass x={292} y={296} />
              <TulipGlass x={338} y={296} />
              <Steam x={292} y={262} count={5} rise={70} spread={10} size={6} opacity={0.4} seed={5} />
              <Steam x={338} y={262} count={5} rise={70} spread={10} size={6} opacity={0.4} seed={8} />
            </g>
          )}
        />
      </g>
    </Panel>
  );
}

export function Lale() {
  return (
    <Panel id="lale" bg={['#1f1a24', '#0b0a0d']}>
      <Spot x={400} color="#d9c7ff" opacity={0.09} />
      {/* şövale */}
      <g opacity={0.55}>
        <path d="M600,560 L650,240 L700,560 M650,240 L650,560" stroke="#6d5a45" strokeWidth={8} fill="none" />
        <rect x={585} y={250} width={130} height={170} fill="#e9e2d3" />
        <path d="M595,390 Q630,330 650,360 T705,320" stroke="#4cc2a8" strokeWidth={6} fill="none" />
        <circle cx={680} cy={285} r={14} fill="#f2b84b" opacity={0.8} />
      </g>
      <g transform="translate(130,10)">
        <Person
          tall hair="long" glasses hairColor="#3b2416" outfit="#5a3d5c" accent="#8a6a8c"
          prop={(frame) => (
            <g transform={`rotate(${Math.sin(frame / 20) * 4},122,386)`}>
              <path d="M70,372 Q80,330 130,336 Q170,340 166,380 Q160,412 120,410 Q118,394 104,398 Q74,408 70,372 Z" fill="#d9b48a" />
              {['#ff4f3b', '#f2b84b', '#4cc2a8', '#7aa7ff', '#f1eadc'].map((c, i) => (
                <circle key={c} cx={88 + (i % 3) * 22} cy={358 + Math.floor(i / 3) * 22} r={7} fill={c} />
              ))}
            </g>
          )}
          extra={
            <g>
              {/* boyalı parmaklar */}
              <circle cx={284} cy={314} r={5} fill="#4cc2a8" />
              <circle cx={296} cy={300} r={4} fill="#ff4f3b" />
              <path d="M292,300 L330,250" stroke="#6d5a45" strokeWidth={5} strokeLinecap="round" />
              <circle cx={331} cy={248} r={5} fill="#f2b84b" />
            </g>
          }
        />
      </g>
    </Panel>
  );
}

export function Cemil() {
  return (
    <Panel id="cemil" bg={['#171c22', '#08090b']}>
      <Spot x={400} color="#9fb6c8" opacity={0.1} />
      <g transform="translate(200,10)">
        <Person
          tall hair="cap" mustache hairColor="#2a211b" outfit="#2f4a63" accent="#6f8aa3"
          extra={
            <g>
              {/* tulum askıları ve yağ lekeleri */}
              <path d="M168,220 L176,330 M232,220 L224,330" stroke="#22384d" strokeWidth={8} />
              <ellipse cx={176} cy={360} rx={14} ry={9} fill="#141a20" opacity={0.8} />
              <ellipse cx={236} cy={300} rx={10} ry={7} fill="#141a20" opacity={0.7} />
              {/* belde bez */}
              <path d="M240,400 Q260,404 258,450 Q246,458 238,446 Q244,424 236,404 Z" fill="#b84a3a" />
            </g>
          }
        />
      </g>
    </Panel>
  );
}

// ================= Silahlar (masa + sarkan lamba) =================
function Table({ children, id, glow = '#f2b84b' }) {
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

export function Anahtar() {
  const frame = useCurrentFrame();
  const glint = ((frame % 90) / 90) * 640 - 120;
  // Yerel çizim: sap yatay, sağda çatal ağız (açık uç), solda yıldız ağız (halka uç); sonra masaya döndürülür
  const shape = (
    <g>
      <rect x={-150} y={-17} width={300} height={34} rx={14} />
      <circle cx={190} cy={0} r={56} />
      <circle cx={-182} cy={0} r={44} />
    </g>
  );
  return (
    <Table id="anahtar">
      <defs>
        <linearGradient id="metal" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#c3c9cf" />
          <stop offset="0.5" stopColor="#7b828a" />
          <stop offset="1" stopColor="#3a3f45" />
        </linearGradient>
        <mask id="wrenchMask" maskUnits="userSpaceOnUse" x={-260} y={-120} width={560} height={240}>
          <g fill="#fff">{shape}</g>
          {/* çatal ağzın boşluğu */}
          <path d="M184,-22 L262,-34 L262,34 L184,22 Z" fill="#000" />
          <circle cx={184} cy={0} r={22} fill="#000" />
          {/* yıldız ağzın deliği */}
          <polygon points={Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; const r = i % 2 ? 17 : 23; return `${-182 + Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ')} fill="#000" />
        </mask>
      </defs>
      <ellipse cx={400} cy={498} rx={230} ry={22} fill="#000" opacity={0.45} />
      <g transform="translate(400,462) rotate(-9) scale(0.92)">
        <g mask="url(#wrenchMask)">
          <rect x={-260} y={-70} width={540} height={140} fill="url(#metal)" />
          {/* parlama */}
          <rect x={glint - 260} y={-80} width={46} height={160} fill="#fff" opacity={0.35} transform="skewX(-25)" />
          {/* yağ bulaşığı */}
          <ellipse cx={120} cy={4} rx={60} ry={14} fill="#16110a" opacity={0.75} />
          <ellipse cx={200} cy={30} rx={26} ry={12} fill="#16110a" opacity={0.6} />
        </g>
        <rect x={-120} y={-6} width={220} height={4} rx={2} fill="#2b2f34" opacity={0.6} />
      </g>
      {/* damlayan yağ */}
      {[0, 1].map((i) => {
        const t = ((frame + i * 35) % 70) / 70;
        return <ellipse key={i} cx={598 + i * 12} cy={462 + t * 60} rx={5} ry={7} fill="#1a140c" opacity={1 - t} />;
      })}
      <ellipse cx={604} cy={530} rx={40} ry={7} fill="#120e08" opacity={0.75} />
    </Table>
  );
}

export function Seker() {
  const frame = useCurrentFrame();
  return (
    <Table id="seker" glow="#cfe0a8">
      <ellipse cx={400} cy={488} rx={130} ry={30} fill="#d8d2c4" />
      <ellipse cx={400} cy={482} rx={95} ry={20} fill="#c7c0b1" />
      <g transform={`translate(400,${462 + Math.sin(frame / 20) * 2})`}>
        <path d="M-58,0 L-104,-30 L-96,0 L-104,30 Z" fill="#7b4fa0" />
        <path d="M58,0 L104,-30 L96,0 L104,30 Z" fill="#7b4fa0" />
        <ellipse cx={0} cy={0} rx={62} ry={36} fill="#8e5bb8" />
        <path d="M-40,-20 Q0,-34 40,-20" stroke="#e7d6f5" strokeWidth={5} fill="none" opacity={0.6} />
      </g>
      {/* acı badem kokusu: kıvrılarak yükselen çizgiler */}
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 30) % 90) / 90;
        const y0 = 420 - t * 170;
        return (
          <path key={i} d={`M${370 + i * 30},${y0} q14,-18 0,-36 q-14,-18 0,-36`} stroke="#cfe0a8" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6 * Math.sin(t * Math.PI)} />
        );
      })}
      <rect x={560} y={452} width={34} height={34} rx={4} fill="#f1eadc" opacity={0.9} />
      <rect x={600} y={462} width={30} height={30} rx={4} fill="#e6dfd0" opacity={0.85} />
    </Table>
  );
}

export function Fener() {
  const frame = useCurrentFrame();
  const flick = (rnd(Math.floor(frame / 3)) > 0.82 ? 0.25 : 1) * (0.8 + 0.2 * Math.sin(frame / 4));
  return (
    <Table id="fener" glow="#9fb6c8">
      <path d="M520,440 L800,300 L800,600 L560,470 Z" fill="#f6efd8" opacity={0.18 * flick} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = ((frame * 0.6 + rnd(i) * 100) % 100) / 100;
        return <circle key={i} cx={560 + t * 220} cy={420 + rnd(i + 3) * 120 + Math.sin(frame / 15 + i) * 8} r={2.5} fill="#f6efd8" opacity={0.5 * flick} />;
      })}
      <ellipse cx={380} cy={492} rx={190} ry={20} fill="#000" opacity={0.45} />
      <rect x={220} y={430} width={250} height={52} rx={14} fill="#3e434a" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={250 + i * 30} y={434} width={6} height={44} fill="#2b2f34" />)}
      <path d="M470,420 L540,404 L540,508 L470,492 Z" fill="#555b63" />
      <ellipse cx={540} cy={456} rx={16} ry={52} fill="#e9e4d2" opacity={0.6 + 0.4 * flick} />
      {/* çatlak */}
      <path d="M538,420 L546,446 L532,462 L548,490 M546,446 L556,440" stroke="#1b1b1b" strokeWidth={2.5} fill="none" />
    </Table>
  );
}

// ================= Yerler =================
export function CayOcagi() {
  const frame = useCurrentFrame();
  const warm = 0.85 + 0.15 * Math.sin(frame / 25);
  return (
    <Panel id="cay" bg={['#3a2618', '#140c07']}>
      <ellipse cx={400} cy={330} rx={360} ry={260} fill="#f2b84b" opacity={0.08 * warm} />
      {/* raf ve bardaklar */}
      <rect x={90} y={150} width={620} height={10} fill="#5b3c25" />
      {Array.from({ length: 10 }, (_, i) => <TulipGlass key={i} x={130 + i * 60} y={146} s={1.1} />)}
      {/* tezgâh */}
      <rect x={40} y={430} width={720} height={170} fill="#4a301e" />
      <rect x={40} y={420} width={720} height={16} fill="#6a4529" />
      {/* semaver */}
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5520" />
          <stop offset="0.45" stopColor="#e0b35a" />
          <stop offset="1" stopColor="#6b4a1c" />
        </linearGradient>
      </defs>
      <path d="M330,420 L350,390 L450,390 L470,420 Z" fill="url(#brass)" />
      <path d="M340,392 Q326,300 360,250 L440,250 Q474,300 460,392 Z" fill="url(#brass)" />
      <rect x={372} y={224} width={56} height={30} rx={6} fill="url(#brass)" />
      <path d="M380,224 Q400,190 420,224 Z" fill="#c8963f" />
      {/* demlik */}
      <ellipse cx={400} cy={210} rx={34} ry={22} fill="#e9e2d3" />
      <path d="M432,206 Q456,196 458,184" stroke="#e9e2d3" strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* musluk */}
      <path d="M460,340 L500,340 L500,356 L492,356" stroke="#c8963f" strokeWidth={9} fill="none" strokeLinecap="round" />
      <Steam x={400} y={180} count={9} rise={170} spread={30} size={12} opacity={0.45} seed={31} />
      <Steam x={458} y={180} count={5} rise={90} spread={12} size={7} opacity={0.35} seed={37} />
      <TulipGlass x={560} y={420} s={1.4} />
      <Steam x={560} y={372} count={4} rise={60} spread={8} size={6} opacity={0.35} seed={41} />
    </Panel>
  );
}

export function MakineDairesi() {
  const frame = useCurrentFrame();
  const shake = Math.sin(frame * 1.7) * 1.2;
  const pist = (ph) => Math.sin(frame / 7 + ph) * 46;
  const red = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 6));
  return (
    <Panel id="makine" bg={['#1b2128', '#07090b']}>
      <g transform={`translate(${shake},0)`}>
        {/* borular */}
        <path d="M0,90 L800,90 M0,130 L620,130 L620,600 M710,0 L710,600" stroke="#39434e" strokeWidth={22} fill="none" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={30 + i * 66} cy={90} r={4} fill="#5c6875" />)}
        {/* dişliler */}
        <g transform={`translate(160,300) rotate(${frame * 2})`}>
          <path d={gearPath(14, 70, 88)} fill="#4b5560" />
          <circle r={26} fill="#2a3139" />
        </g>
        <g transform={`translate(268,388) rotate(${-frame * 2.5 + 8})`}>
          <path d={gearPath(11, 52, 68)} fill="#5c6774" />
          <circle r={18} fill="#2a3139" />
        </g>
        {/* pistonlar */}
        {[0, 1].map((i) => {
          const px = 420 + i * 120;
          return (
            <g key={i}>
              <rect x={px - 34} y={380} width={68} height={190} fill="#2c343d" />
              <rect x={px - 12} y={250 + pist(i * Math.PI)} width={24} height={150} fill="#9aa6b2" />
              <rect x={px - 30} y={236 + pist(i * Math.PI)} width={60} height={26} rx={4} fill="#c3ccd5" />
            </g>
          );
        })}
        {/* manometre */}
        <circle cx={680} cy={250} r={48} fill="#d9d2c3" stroke="#39434e" strokeWidth={8} />
        <line x1={680} y1={250} x2={680 + Math.cos(-1.2 + Math.sin(frame / 9) * 0.8) * 36} y2={250 + Math.sin(-1.2 + Math.sin(frame / 9) * 0.8) * 36} stroke="#ff4f3b" strokeWidth={4} />
        {/* uyarı lambası */}
        <circle cx={80} cy={480} r={16} fill="#ff4f3b" opacity={red} />
        <circle cx={80} cy={480} r={60} fill="#ff4f3b" opacity={0.08 * red} />
      </g>
      <Steam x={620} y={140} count={6} rise={110} spread={30} size={16} color="#8a96a3" opacity={0.25} drift={-40} seed={17} />
    </Panel>
  );
}

export function ArkaGuverte() {
  const frame = useCurrentFrame();
  const swing = Math.sin(frame / 18) * 10;
  return (
    <Panel id="guverte" bg={['#1c2530', '#070a0e']}>
      <rect y={300} width={800} height={300} fill="#0d151c" />
      <Waves w={800} y={320} rows={6} gap={26} amp={5} color="#6d8d96" opacity={0.35} />
      {[0, 1, 2].map((i) => (
        <Gull key={i} cx={((frame * (1.6 + i * 0.4) + i * 300) % 1000) - 100} cy={120 + i * 50 + Math.sin(frame / 20 + i) * 12} s={1 - i * 0.2} phase={i * 2} />
      ))}
      <Fog w={800} y={150} h={300} count={7} speed={0.8} opacity={0.22} id="gf" seed={23} />
      {/* fener direği */}
      <line x1={110} y1={600} x2={110} y2={170} stroke="#2a2f36" strokeWidth={10} />
      <g transform={`rotate(${swing},110,180)`}>
        <line x1={110} y1={180} x2={110} y2={224} stroke="#2a2f36" strokeWidth={4} />
        <circle cx={110} cy={258} r={80} fill="#f2b84b" opacity={0.09} />
        {/* gemi feneri: kapak, cam, kafes, taban */}
        <path d="M88,236 L110,220 L132,236 Z" fill="#2a2f36" />
        <rect x={92} y={236} width={36} height={44} rx={4} fill="#f2b84b" opacity={0.85 + 0.15 * Math.sin(frame / 5)} />
        <path d="M104,236 L104,280 M116,236 L116,280 M92,258 L128,258" stroke="#2a2f36" strokeWidth={3} />
        <rect x={88} y={280} width={44} height={8} rx={2} fill="#2a2f36" />
      </g>
      {/* ıslak tahtalar ve parmaklık */}
      <path d="M0,520 L800,520 L800,600 L0,600 Z" fill="#2a2018" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 100} y1={520} x2={i * 100 - 40} y2={600} stroke="#1a130d" strokeWidth={3} />)}
      <rect x={0} y={524} width={800} height={4} fill="#d9d0bf" opacity={0.08 + 0.05 * Math.sin(frame / 12)} />
      <line x1={0} y1={440} x2={800} y2={440} stroke="#4a3b2d" strokeWidth={10} />
      <line x1={0} y1={480} x2={800} y2={480} stroke="#4a3b2d" strokeWidth={5} />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={30 + i * 95} y={440} width={9} height={80} fill="#3d3024" />)}
    </Panel>
  );
}

export const ITEM_ART = {
  s1: Husnu, s2: Lale, s3: Cemil,
  w1: Anahtar, w2: Seker, w3: Fener,
  l1: CayOcagi, l2: MakineDairesi, l3: ArkaGuverte,
};
