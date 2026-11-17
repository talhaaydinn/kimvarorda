// "Karda Kalan Tren" — baştan sona birinci şahıs 3B hikâye videosu.
// Ekranda yalnızca: başlık, şüphelilerin isimleri (tanışırken), "İpucu n/6" işareti ve kapanış.
// Özellikler ve ipucu listesi sitede. Hiçbir sahne çözümü göstermez.
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { C, MONO, SANS, SERIF } from '../theme.js';
import { FPS, H, W, cue, makeTimeline } from '../timeline.js';
import { Brand, Kicker, Sfx, Track, clamp, fadeUp, useSpring } from '../ui.jsx';
import { NO, SCENES, SITE, TITLE } from './script.js';
import manifest from './voice-manifest.json';
import {
  CameraRig, CarShell, Character, DiningTable, EYE, Landscape, M, NERMIN, Puffs, RASIM, SELIN, Snowfall, SpotAt, Stove, TrainOutside,
} from './world.jsx';
import { rnd } from '../art/kit.jsx';

const { TIMELINE, TOTAL } = makeTimeline(SCENES, manifest, { lead: 0.25 });
export const VAKA3D_TOTAL = TOTAL;
const CLUES = 6;

/** Sahne tuvali: dikey 9:16, gölgeler açık */
function Stage3D({ children, bg = '#0b1018', fog = null, fov = 58 }) {
  return (
    <ThreeCanvas width={W} height={H} shadows camera={{ fov, near: 0.03, far: 300, position: [0, EYE, 2] }} style={{ position: 'absolute', inset: 0 }}>
      <color attach="background" args={[bg]} />
      {fog && <fog attach="fog" args={fog} />}
      {children}
    </ThreeCanvas>
  );
}

// ---------- yazı katmanları ----------
function ClueChip({ s }) {
  if (!s.clue) return null;
  const at = cue(s, s.clueAt, 0.5);
  const p = useSpring(at, { damping: 12, stiffness: 150 });
  return (
    <>
      <div style={{ position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * -30}px) scale(${0.8 + p * 0.2})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(14,13,11,0.78)', border: `2px solid ${C.gold}`, borderRadius: 999, padding: '12px 30px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <span style={{ fontSize: 34 }}>🔍</span>
          <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 32, letterSpacing: '0.14em', color: C.gold }}>{`İPUCU ${s.clue} / ${CLUES}`}</span>
        </div>
      </div>
      <Sfx name="ding" at={at} volume={0.35} />
    </>
  );
}

function NameTag({ at, until, name }) {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 140 } });
  const out = interpolate(frame, [until - 8, until], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 70, bottom: 520, opacity: Math.min(p, out), transform: `translateX(${(1 - p) * -60}px)` }}>
      <div style={{ width: 70, height: 6, background: C.suspect, borderRadius: 3, marginBottom: 14 }} />
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: C.text, textShadow: '0 4px 24px rgba(0,0,0,0.9)' }}>{name}</div>
    </div>
  );
}

/** Ekranı ısıtan / karartan geçiş */
function Wash({ from, to, color, max = 1 }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, to], [0, max], clamp);
  return <AbsoluteFill style={{ background: color, opacity: o }} />;
}

/** Alt kısmı hafif karartan sinema degradesi (yazılar okunsun) */
const Grade = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)' }} />
);

// ================= 1. Giriş: tipide tren, kapıdan içeri =================
function Giris({ s }) {
  const frame = useCurrentFrame();
  const aDoor = cue(s, 'Donmuş kapıyı', 0.45);
  const aIn = cue(s, 'içeri giriyorsun', 0.55);
  const doorOpen = interpolate(frame, [aDoor + 10, aDoor + 40], [0, 1], clamp);
  const path = [
    { f: 0, p: [9, 2.6, 17], l: [0, 1.8, 0] },
    { f: aDoor - 10, p: [0.4, 1.9, 6.5], l: [-1.2, 1.9, 1.4] },
    { f: aIn + 10, p: [-1.2, 1.7, 2.9], l: [-1.2, 1.75, 1.2] },
    { f: s.frames, p: [-1.2, 1.66, 2.05], l: [-1.2, 1.6, -2] },
  ];
  const t = useSpring(8);
  const tOut = interpolate(frame, [110, 130], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Stage3D fog={['#0d121b', 6, 70]}>
        <CameraRig path={path} bob={0.8} />
        <hemisphereLight args={['#4a5a7a', '#c9d1dc', 0.55]} />
        <directionalLight position={[-20, 30, 20]} intensity={0.5} color="#a9bddc" />
        <Landscape />
        <TrainOutside doorOpen={doorOpen} doorX={-1.2} />
        <Snowfall center={[-1, 4, 6]} size={[26, 10, 26]} count={1600} wind={[0.02, 0.006]} />
      </Stage3D>
      <Grade />
      <Wash from={s.frames - 40} to={s.frames - 4} color="#ffb766" max={1} />
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: Math.min(t, tOut) }}>
        <Kicker style={{ fontSize: 34 }}>{`Vaka #${NO}`}</Kicker>
        <div style={{ marginTop: 14, fontFamily: SERIF, fontWeight: 900, fontSize: 120, lineHeight: 1, color: C.text, textShadow: '0 8px 40px rgba(0,0,0,0.8)', ...fadeUp(t, 50) }}>{TITLE}</div>
      </div>
      <Sfx name="hit" at={0} volume={0.6} />
    </AbsoluteFill>
  );
}

// ================= 2. Koridor: üç yolcu + Rasim'in eldivenleri =================
const SUS_POS = { rasim: [-0.55, 0, -2.6, 0.2], nermin: [0.6, 0, -3.6, -0.3], selin: [-0.45, 0, -4.9, 0.15] };

function Sparkles({ at, center, n = 6 }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 10], [0, 1], clamp);
  return (
    <group position={center}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + frame / 30;
        const k = p * (0.5 + 0.5 * Math.sin(frame / 4 + i * 2));
        return (
          <mesh key={i} position={[Math.cos(a) * 0.12, Math.sin(a) * 0.09, 0.05]} scale={0.005 + k * 0.006}>
            <octahedronGeometry args={[1, 0]} />
            <M c="#ffffff" e="#ffffff" ei={4 * k} transparent opacity={p} />
          </mesh>
        );
      })}
    </group>
  );
}

function Koridor({ s }) {
  const frame = useCurrentFrame();
  const aR = cue(s, 'Kondüktör Rasim', 0.15);
  const aN = cue(s, 'Aşçı Nermin', 0.25);
  const aS = cue(s, 'Fotoğrafçı Selin', 0.35);
  const aG = cue(s, 'O gece', 0.5);
  const aH = cue(s, 'Rasim elini', 0.7);
  const aK = cue(s, 'kurum lekesi', 0.85);
  const head = (k, y) => [SUS_POS[k][0], y, SUS_POS[k][2]];
  const path = [
    { f: 0, p: [0.1, EYE, 1.4], l: [0, 1.5, -4] },
    { f: aR + 6, p: [0.15, EYE, 0.7], l: head('rasim', 1.68) },
    { f: aN + 6, p: [0.05, EYE, 0.5], l: head('nermin', 1.36) },
    { f: aS + 6, p: [0.0, EYE, 0.4], l: head('selin', 1.68) },
    { f: aG + 10, p: [0.0, EYE, 0.6], l: [0, 1.45, -4] },
    { f: aH + 4, p: [0.05, 1.62, -0.95], l: [-0.2, 1.3, -2.1] },
    { f: s.frames, p: [0.02, 1.58, -1.1], l: [-0.2, 1.3, -2.1] },
  ];
  const arm = interpolate(frame, [aH, aH + 22], [0, 1], clamp);
  const [rx, , rz, rr] = SUS_POS.rasim;
  return (
    <AbsoluteFill>
      <Stage3D bg="#120c08" fog={['#120c08', 4, 14]}>
        <CameraRig path={path} bob={0.6} />
        <ambientLight intensity={0.35} color="#ffd9a8" />
        <CarShell z0={2.2} z1={-10} lamps={[0.2, -2.8, -5.8]} lampPower={7} />
        <Character {...RASIM} position={[rx, 0, rz]} rotation={rr} pose={{ arm, yaw: frame > aH ? 0.1 : 0 }} seed={1} />
        <Character {...NERMIN} position={[SUS_POS.nermin[0], 0, SUS_POS.nermin[2]]} rotation={SUS_POS.nermin[3]} seed={2} />
        <Character {...SELIN} position={[SUS_POS.selin[0], 0, SUS_POS.selin[2]]} rotation={SUS_POS.selin[3]} seed={3} />
        <Sparkles at={aK} center={[-0.17, 1.36, -2.07]} />
      </Stage3D>
      <Grade />
      <NameTag at={aR} until={aN - 2} name="Kondüktör Rasim" />
      <NameTag at={aN} until={aS - 2} name="Aşçı Nermin" />
      <NameTag at={aS} until={aG + 30} name="Fotoğrafçı Selin" />
      <ClueChip s={s} />
    </AbsoluteFill>
  );
}

// ================= 3. Ceset: paltoda erimemiş kar =================
function Ceset({ s }) {
  const frame = useCurrentFrame();
  const aK = cue(s, 'diz çöküyorsun', 0.2);
  const aP = cue(s, 'Paltosunun', 0.5);
  const path = [
    { f: 0, p: [0.5, EYE, 1.0], l: [0, 0.3, -1.8] },
    { f: aK + 28, p: [0.35, 1.25, -0.05], l: [0, 0.18, -1.95] },
    { f: s.frames, p: [0.3, 1.12, -0.25], l: [0, 0.2, -1.95] },
  ];
  const sweep = -1.8 + Math.sin(frame / 18) * 0.6;
  const glint = interpolate(frame, [aP, aP + 12], [0.3, 1], clamp);
  return (
    <AbsoluteFill>
      <Stage3D bg="#07080a" fog={['#07080a', 3, 10]}>
        <CameraRig path={path} bob={0.5} />
        <ambientLight intensity={0.08} color="#8aa0c0" />
        <CarShell z0={2} z1={-5} lamps={[-3.5]} lampPower={1.6} doors={false} />
        <SpotAt position={[0.4, 1.3, -0.4]} target={[0, 0.3, sweep]} angle={0.45} penumbra={0.6} intensity={14} distance={5} color="#e8eeff" castShadow />
        {/* paltoyla örtülü beden (ayrıntısız) */}
        <group position={[0, 0, -1.8]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7]} castShadow receiveShadow>
            <capsuleGeometry args={[0.24, 1.1, 6, 16]} />
            <M c="#211b17" r={1} />
          </mesh>
          <mesh position={[0.95, 0.08, 0.06]}><boxGeometry args={[0.28, 0.14, 0.12]} /><M c="#111" /></mesh>
          <mesh position={[0.95, 0.08, -0.08]}><boxGeometry args={[0.28, 0.14, 0.12]} /><M c="#111" /></mesh>
          {/* yakası kalkık palto ve yere düşmüş şapka */}
          <mesh position={[-0.62, 0.3, 0]} rotation={[0, 0, 0.4]} scale={[0.5, 1, 1.1]}>
            <coneGeometry args={[0.26, 0.3, 12, 1, true]} />
            <M c="#251e19" r={1} side={2} />
          </mesh>
          <group position={[-1.02, 0.05, 0.28]} rotation={[0.2, 0.6, 0.1]}>
            <mesh><cylinderGeometry args={[0.2, 0.2, 0.015, 24]} /><M c="#1c1a1a" /></mesh>
            <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.11, 0.12, 0.12, 20]} /><M c="#1c1a1a" /></mesh>
          </group>
          {[-0.3, 0.05, 0.4].map((x) => (
            <mesh key={x} position={[x, 0.37, 0.12]}><sphereGeometry args={[0.025, 10, 8]} /><M c="#1a1410" /></mesh>
          ))}
          {/* erimemiş kar taneleri */}
          {Array.from({ length: 30 }, (_, i) => {
            const k = glint * (0.5 + 0.5 * Math.sin(frame / 5 + i * 1.7));
            return (
              <mesh key={i} position={[-0.6 + rnd(i) * 1.2, 0.37 + rnd(i + 5) * 0.05, -0.1 + rnd(i + 9) * 0.22]} rotation={[rnd(i) * 3, rnd(i + 1) * 3, 0]} scale={0.009 + rnd(i + 2) * 0.008}>
                <octahedronGeometry args={[1, 0]} />
                <M c="#f4f9ff" e="#dff0ff" ei={2 + k * 5} />
              </mesh>
            );
          })}
        </group>
        {/* kapıdan savrulmuş kar */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.8 + rnd(i) * 1.6, 0.01, 0.6 + rnd(i + 3) * 1.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.3 + rnd(i) * 0.4, 0.2 + rnd(i + 1) * 0.3, 1]}>
            <circleGeometry args={[1, 16]} />
            <M c="#dfe8f2" r={1} />
          </mesh>
        ))}
      </Stage3D>
      <Grade />
      <ClueChip s={s} />
    </AbsoluteFill>
  );
}

// ================= 4–5. Yemekli vagon: ekmek tahtası ve buğulu ayna =================
function DiningSet({ knifePulse = 0, mirrorClear = 0 }) {
  const frame = useCurrentFrame();
  const pulse = knifePulse * (0.55 + 0.45 * Math.sin(frame / 4));
  // bıçağın olması gereken yer: kesik çizgili kırmızı siluet (masanın üstünde)
  const dash = [];
  const outline = [[0.6, -0.84], [1.02, -0.84], [1.06, -0.81], [1.02, -0.78], [0.6, -0.78], [0.6, -0.84]];
  outline.slice(0, -1).forEach(([x1, z1], i) => {
    const [x2, z2] = outline[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.round(len / 0.035));
    for (let k = 0; k < n; k += 2) {
      const t = (k + 0.5) / n;
      dash.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, Math.atan2(-(z2 - z1), x2 - x1)]);
    }
  });
  return (
    <group>
      <ambientLight intensity={0.3} color="#ffd9a8" />
      <CarShell z0={2.2} z1={-9} lamps={[0.4, -3, -6.4]} lampPower={6} doors={false} />
      {[-1, -3.2, -5.4, -7.6].map((z) => (
        <group key={z}>
          <DiningTable x={-0.85} z={z} />
          <DiningTable x={0.85} z={z} />
        </group>
      ))}
      <Stove z={-9} />
      {/* ekmek tahtası, yarım ekmek, kırıntılar */}
      <group>
        <mesh position={[0.78, 0.775, -1.08]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.025, 0.26]} />
          <M c="#a8743f" />
        </mesh>
        <mesh position={[0.7, 0.79, -1.08]} rotation={[0, 0, Math.PI / 2]} scale={[0.6, 1, 0.7]}>
          <sphereGeometry args={[0.1, 16, 12, 0, Math.PI]} />
          <M c="#c9893f" />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[0.78 + rnd(i) * 0.18, 0.792, -1.18 + rnd(i + 4) * 0.2]} scale={0.006 + rnd(i + 2) * 0.006}>
            <sphereGeometry args={[1, 6, 4]} />
            <M c="#e2c08c" />
          </mesh>
        ))}
        {dash.map(([x, z, a], i) => (
          <mesh key={i} position={[x, 0.766, z]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.03, 0.004, 0.007]} />
            <M c="#ff4f3b" e="#ff4f3b" ei={2.5 * pulse} transparent opacity={knifePulse} />
          </mesh>
        ))}
      </group>
      {/* sol duvarda buğulu ayna; önündeki masada çorba */}
      <group position={[-1.28, 1.5, -2.1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[0.9, 0.7, 0.03]} />
          <M c="#a07d45" m={0.6} r={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.78, 0.58]} />
          <M c="#2a3440" m={0.4} r={0.15} />
        </mesh>
        {/* yansıma: yalnızca bulanık bir baş ve kalın, kır bir bıyık */}
        <mesh position={[0.02, 0.03, 0.014]}>
          <circleGeometry args={[0.13, 24]} />
          <M c="#6a5648" transparent opacity={0.75} />
        </mesh>
        <mesh position={[0.02, -0.25, 0.013]} scale={[1, 0.6, 1]}>
          <circleGeometry args={[0.25, 24]} />
          <M c="#2a3242" transparent opacity={0.6} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[0.02 + k * 0.042, -0.03, 0.016]} rotation={[0, 0, k * 1.25]}>
            <capsuleGeometry args={[0.019, 0.07, 4, 10]} />
            <M c="#eeeae2" e="#cfc8bb" ei={0.3 * mirrorClear} transparent opacity={0.3 + mirrorClear * 0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.78, 0.58]} />
          <M c="#eef2f5" transparent opacity={0.6 - mirrorClear * 0.4} r={1} />
        </mesh>
      </group>
      <group position={[-0.85, 0.78, -1.6]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.11, 0.07, 0.06, 20]} />
          <M c="#f1ece2" />
        </mesh>
        <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 20]} />
          <M c="#c9762f" />
        </mesh>
        <Puffs at={[0, 0.08, 0]} count={12} rise={0.8} spread={0.12} size={0.05} opacity={0.4} period={60} seed={9} />
      </group>
    </group>
  );
}

function Yemekli({ s }) {
  const frame = useCurrentFrame();
  const aE = cue(s, 'Ekmek tahtasında', 0.4);
  const aY = cue(s, 'yerinde yok', 0.75);
  const path = [
    { f: 0, p: [0, EYE, 1.9], l: [0, 1.4, -6] },
    { f: aE + 6, p: [0.3, 1.5, -0.35], l: [0.82, 0.78, -1.0] },
    { f: s.frames, p: [0.35, 1.42, -0.42], l: [0.86, 0.77, -0.92] },
  ];
  const knife = interpolate(frame, [aY - 4, aY + 8], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Stage3D bg="#120c08" fog={['#120c08', 5, 16]}>
        <CameraRig path={path} bob={0.7} />
        <DiningSet knifePulse={knife} />
      </Stage3D>
      <Grade />
      <ClueChip s={s} />
    </AbsoluteFill>
  );
}

function Ayna({ s }) {
  const frame = useCurrentFrame();
  const aB = cue(s, 'kır bıyığı', 0.75);
  const path = [
    { f: 0, p: [0.3, 1.45, -0.6], l: [0.4, 0.9, -1.6] },
    { f: 40, p: [0.0, 1.5, -1.3], l: [-1.28, 1.45, -2.1] },
    { f: s.frames, p: [-0.3, 1.5, -1.65], l: [-1.28, 1.48, -2.1] },
  ];
  const clear = interpolate(frame, [aB - 8, aB + 18], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Stage3D bg="#120c08" fog={['#120c08', 5, 16]}>
        <CameraRig path={path} bob={0.4} />
        <DiningSet knifePulse={0} mirrorClear={clear} />
      </Stage3D>
      <Grade />
      <ClueChip s={s} />
    </AbsoluteFill>
  );
}

// ================= 6. Kompartıman: uzun bir gölge eğiliyor =================
function Kompartiman({ s }) {
  const frame = useCurrentFrame();
  const aG = cue(s, 'eğiliyor', 0.75);
  const slide = interpolate(frame, [8, 34], [0, 1], clamp);
  const bend = spring({ frame: frame - aG, fps: FPS, config: { damping: 14, stiffness: 60 } }) * 0.55;
  const path = [
    { f: 0, p: [0.55, EYE, 1.3], l: [0.2, 1.4, -2.2] },
    { f: s.frames, p: [0.5, EYE, 0.55], l: [-0.1, 1.3, -2.2] },
  ];
  const bunk = (y) => (
    <group>
      <mesh position={[-0.65, y, -1.15]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.14, 1.9]} />
        <M c="#4a2a1c" />
      </mesh>
      <mesh position={[-0.65, y + 0.1, -1.15]} receiveShadow>
        <boxGeometry args={[0.66, 0.08, 1.86]} />
        <M c="#6b2d2a" />
      </mesh>
    </group>
  );
  return (
    <AbsoluteFill>
      <Stage3D bg="#0a0806" fog={['#0a0806', 4, 12]}>
        <CameraRig path={path} bob={0.4} />
        <ambientLight intensity={0.06} color="#ffd9a8" />
        {/* oda: zemin, tavan, duvarlar */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.1]} receiveShadow><planeGeometry args={[2, 2.4]} /><M c="#24180f" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.35, -1.1]}><planeGeometry args={[2, 2.4]} /><M c="#1a1410" /></mesh>
        <mesh position={[0, 1.2, -2.2]} receiveShadow><planeGeometry args={[2, 2.4]} /><M c="#5a4330" /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-1, 1.2, -1.1]} receiveShadow><planeGeometry args={[2.4, 2.4]} /><M c="#4a3526" /></mesh>
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[1, 1.2, -1.1]} receiveShadow><planeGeometry args={[2.4, 2.4]} /><M c="#4a3526" /></mesh>
        {/* ön duvar ve kapı boşluğu (x 0.1…0.9) */}
        <mesh position={[-0.45, 1.2, 0.1]}><boxGeometry args={[1.1, 2.4, 0.06]} /><M c="#3a281c" /></mesh>
        <mesh position={[0.5, 2.25, 0.1]}><boxGeometry args={[0.8, 0.3, 0.06]} /><M c="#3a281c" /></mesh>
        <mesh position={[0.5 - slide * 0.85, 1.05, 0.16]}><boxGeometry args={[0.82, 2.1, 0.05]} /><M c="#4a3324" /></mesh>
        {bunk(0.45)}
        {bunk(1.5)}
        {/* pencere ve perdeler */}
        <mesh position={[0.72, 1.5, -2.19]}><planeGeometry args={[0.4, 0.5]} /><M c="#0c1422" e="#16233a" ei={0.6} /></mesh>
        <mesh position={[0.46, 1.45, -2.17]}><boxGeometry args={[0.14, 0.7, 0.02]} /><M c="#6e2a2c" /></mesh>
        <mesh position={[0.94, 1.45, -2.17]}><boxGeometry args={[0.18, 0.75, 0.02]} /><M c="#6e2a2c" /></mesh>
        {/* lamba ve gölgeyi düşüren ışık */}
                <SpotAt
          position={[0.85, 1.75, 0.25]} target={[0.0, 1.3, -2.2]} angle={0.7} penumbra={0.35} intensity={22} distance={7} decay={2} color="#ffc777"
          castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005}
        />
        {/* görünmeyen, yalnızca gölgesi düşen uzun biri */}
        <Character look={{}} tall shadowOnly position={[0.15, 0, -1.85]} rotation={-Math.PI / 2} pose={{ bend }} />
      </Stage3D>
      <Grade />
      <ClueChip s={s} />
    </AbsoluteFill>
  );
}

// ================= 7. Arka balkon: buzlu korkuluk =================
function Hand({ position, rotation, scale = 1 }) {
  const skin = '#c99a74';
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0.02, -0.17, 0.3]} rotation={[Math.PI / 2 - 0.55, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.45, 12]} />
        <M c="#1f2633" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.09, 0.03, 0.1]} />
        <M c={skin} />
      </mesh>
      {[-0.032, -0.011, 0.011, 0.032].map((x, i) => (
        <mesh key={i} position={[x, 0, -0.07 - (i === 1 || i === 2 ? 0.01 : 0)]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.011, 0.07, 4, 8]} />
          <M c={skin} />
        </mesh>
      ))}
      <mesh position={[-0.06, 0, 0.0]} rotation={[Math.PI / 2, 0, 0.6]}>
        <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
        <M c={skin} />
      </mesh>
    </group>
  );
}

function Balkon({ s }) {
  const frame = useCurrentFrame();
  const aT = cue(s, 'korkuluğa dokunuyorsun', 0.45);
  const aG = cue(s, 'Buzun üstünde', 0.7);
  const open = interpolate(frame, [10, 40], [0, 1], clamp);
  const reach = spring({ frame: frame - aT, fps: FPS, config: { damping: 16, stiffness: 70 } });
  const glint = interpolate(frame, [aG, aG + 40], [-1.1, 1.1], clamp);
  const path = [
    { f: 0, p: [0.15, EYE, 1.3], l: [0, 1.3, -3] },
    { f: 60, p: [0.15, EYE, 0.25], l: [0.05, 1.2, -6] },
    { f: aT + 10, p: [0.15, 1.6, -0.1], l: [0.1, 0.85, -3.2] },
    { f: s.frames, p: [0.15, 1.58, -0.2], l: [0.05, 0.85, -3.2] },
  ];
  const hp = [0.45 + (0.22 - 0.45) * reach, 0.7 + (1.125 - 0.7) * reach, -0.3 + (-1.32 + 0.3) * reach];
  return (
    <AbsoluteFill>
      <Stage3D bg="#0b1018" fog={['#141b27', 3, 45]}>
        <CameraRig path={path} bob={0.5} />
        <hemisphereLight args={['#5a6c8c', '#c9d1dc', 0.6]} />
        <directionalLight position={[3, 8, -10]} intensity={0.5} color="#b8c8e0" />
        {/* kapı kasası ve açılan kapı */}
        <mesh position={[-0.75, 1.15, 0.45]}><boxGeometry args={[0.4, 2.3, 0.1]} /><M c="#1d2430" /></mesh>
        <mesh position={[0.95, 1.15, 0.45]}><boxGeometry args={[0.4, 2.3, 0.1]} /><M c="#1d2430" /></mesh>
        <mesh position={[0.1, 2.35, 0.45]}><boxGeometry args={[2.2, 0.3, 0.1]} /><M c="#1d2430" /></mesh>
        <group position={[-0.55, 0, 0.42]} rotation={[0, open * 1.9, 0]}>
          <mesh position={[0.6, 1.1, 0]}><boxGeometry args={[1.2, 2.2, 0.06]} /><M c="#2a3344" /></mesh>
        </group>
        {/* balkon zemini */}
        <mesh position={[0, -0.04, -0.6]} receiveShadow><boxGeometry args={[2.6, 0.08, 1.6]} /><M c="#2a2018" /></mesh>
        <mesh position={[0, 0.005, -0.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 1.4]} /><M c="#e6ebf0" r={1} transparent opacity={0.7} /></mesh>
        {/* buz tutmuş korkuluk */}
        <mesh position={[0, 1.08, -1.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 2.4, 16]} />
          <M c="#cfe3ef" r={0.12} m={0.1} e="#9fc3d9" ei={0.25} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[-1.1 + i * 0.245, 0.54, -1.35]}>
            <cylinderGeometry args={[0.015, 0.015, 1.08, 8]} />
            <M c="#232a35" m={0.5} />
          </mesh>
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[-1.1 + rnd(i) * 2.2, 1.0 - rnd(i + 3) * 0.05, -1.35]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.012, 0.08 + rnd(i + 7) * 0.12, 6]} />
            <M c="#dbeaf3" r={0.1} transparent opacity={0.9} />
          </mesh>
        ))}
        <mesh position={[glint, 1.112, -1.35]} scale={[0.12, 0.03, 0.05]}>
          <sphereGeometry args={[1, 12, 8]} />
          <M c="#ffffff" e="#ffffff" ei={frame >= aG && frame < aG + 40 ? 4 : 0} transparent opacity={frame >= aG && frame < aG + 40 ? 0.9 : 0} />
        </mesh>
        {/* kırmızı kuyruk lambası */}
        <mesh position={[-1.2, 1.7, -0.2]}><sphereGeometry args={[0.06, 12, 10]} /><M c="#ff4f3b" e="#ff4f3b" ei={2 + Math.sin(frame / 9)} /></mesh>
        <pointLight position={[-1.1, 1.7, -0.4]} intensity={1.2} distance={3} color="#ff4f3b" />
        {/* geride kalan raylar ve karlı ova */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, -40]}><planeGeometry args={[200, 80]} /><M c="#b9c3cf" r={1} /></mesh>
        {[-0.72, 0.72].map((x) => (
          <mesh key={x} position={[x, -1.02, -40]}><boxGeometry args={[0.07, 0.07, 78]} /><M c="#5b616b" m={0.6} r={0.4} /></mesh>
        ))}
        {Array.from({ length: 60 }, (_, i) => (
          <mesh key={i} position={[0, -1.06, -1.8 - i * 0.7]}><boxGeometry args={[1.9, 0.05, 0.18]} /><M c="#4a4038" /></mesh>
        ))}
        <group position={[10, -1.1, 0]}><Landscape /></group>
        <Snowfall center={[0, 2, -4]} size={[10, 7, 12]} count={1400} speed={0.05} wind={[0.03, 0.05]} pointSize={0.03} />
        {frame >= aT - 6 && <group scale={1}><Hand position={hp} rotation={[0.1, 0.25, 0]} scale={1.5} /></group>}
      </Stage3D>
      <Grade />
      <ClueChip s={s} />
      <Sfx name="whoosh" at={10} volume={0.5} />
    </AbsoluteFill>
  );
}

// ================= 8. Final: trenden uzaklaşan kamera, soru ve site =================
function Final({ s }) {
  const frame = useCurrentFrame();
  const qs = ['Kim', 'Nerede', 'Neyle'].map((w, i) => cue(s, w, 0.05 + i * 0.05));
  const aSite = cue(s, 'kimvarorda', 0.45);
  const aT = cue(s, 'Tabloyu', 0.7);
  const path = [
    { f: 0, p: [-1.2, 1.8, 4.5], l: [-1.2, 1.8, 0] },
    { f: s.frames, p: [8, 15, 30], l: [-1, 1.5, 0] },
  ];
  const site = useSpring(aSite);
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  const Q = [['KİM?', C.suspect], ['NEREDE?', C.location], ['NEYLE?', C.weapon]];
  const dim = interpolate(frame, [aSite - 10, aSite + 10], [0, 0.45], clamp);
  return (
    <AbsoluteFill>
      <Stage3D fog={['#0d121b', 8, 90]}>
        <CameraRig path={path} bob={0} />
        <hemisphereLight args={['#4a5a7a', '#c9d1dc', 0.55]} />
        <directionalLight position={[-20, 30, 20]} intensity={0.5} color="#a9bddc" />
        <Landscape />
        <TrainOutside doorOpen={1} doorX={-1.2} />
        <Snowfall center={[0, 6, 10]} size={[40, 18, 40]} count={2200} wind={[0.02, 0.006]} pointSize={0.07} />
      </Stage3D>
      <AbsoluteFill style={{ background: '#0e0d0b', opacity: dim }} />
      <Grade />
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {Q.map(([w, color], i) => {
          const p = spring({ frame: frame - qs[i], fps: FPS, config: { damping: 9, stiffness: 180 } });
          return (
            <div key={w} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 124, lineHeight: 1.02, color, opacity: Math.min(1, p * 1.4), transform: `scale(${interpolate(p, [0, 1], [2, 1])})`, textShadow: '0 8px 40px rgba(0,0,0,0.85)' }}>
              {w}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 900, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.text, opacity: site, textAlign: 'center' }}>Şüpheliler, özellikleri ve bütün ipuçları:</div>
        <div style={{ marginTop: 20, background: C.accent, color: '#1a0905', borderRadius: 26, padding: '22px 40px', fontFamily: SERIF, fontWeight: 900, fontSize: 56, transform: `scale(${site * pulse})` }}>{SITE}</div>
        <div style={{ marginTop: 34, fontFamily: SERIF, fontWeight: 900, fontSize: 52, lineHeight: 1.15, color: C.text, textAlign: 'center', ...fadeUp(useSpring(aT)) }}>
          Tabloyu doldur, <span style={{ color: C.accent }}>katili bul.</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.gold, ...fadeUp(useSpring(aT + 20)) }}>🏆 Adın sıralamaya yazılsın</div>
      </div>
      {qs.map((at, i) => <Sfx key={i} name="pop" at={at} volume={0.5} />)}
      <Sfx name="hit" at={aSite} volume={0.5} />
    </AbsoluteFill>
  );
}

const VIEWS = { giris: Giris, koridor: Koridor, ceset: Ceset, yemekli: Yemekli, ayna: Ayna, kompartiman: Kompartiman, balkon: Balkon, final: Final };

export function Vaka3d() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Track timeline={TIMELINE} views={VIEWS} />
      <Brand suffix="" />
    </AbsoluteFill>
  );
}
