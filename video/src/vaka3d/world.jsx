// 3B POV videonun yapı taşları (Three.js / @react-three/fiber, @remotion/three içinde).
// Birim: metre. Tren koridoru -z yönüne uzanır; göz hizası 1.62 m.
// Her şey kare numarasından hesaplanır: render deterministik.
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { rnd } from '../art/kit.jsx';

export const EYE = 1.62;
const smooth = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Anahtar karelerden konum: path = [{ f, p:[x,y,z], l:[x,y,z] }] (f artan) → { p, l } */
export function samplePath(path, frame) {
  if (frame <= path[0].f) return path[0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (frame <= b.f) {
      const t = smooth((frame - a.f) / Math.max(1, b.f - a.f));
      return { p: lerp3(a.p, b.p, t), l: lerp3(a.l, b.l, t) };
    }
  }
  return path[path.length - 1];
}

/** Kamerayı yola oturtur; yürürken hafif baş sallantısı (bob) ekler */
export function CameraRig({ path, bob = 1, fov = 58 }) {
  const { camera } = useThree();
  const frame = useCurrentFrame();
  const { p, l } = samplePath(path, frame);
  const n = samplePath(path, frame + 1).p;
  const speed = Math.min(1, Math.hypot(n[0] - p[0], n[2] - p[2]) * 40);
  const by = Math.sin(frame / 4.6) * 0.035 * speed * bob;
  const bx = Math.sin(frame / 9.2) * 0.02 * speed * bob;
  camera.position.set(p[0] + bx, p[1] + by, p[2]);
  camera.lookAt(l[0], l[1] + by * 0.5, l[2]);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
}

/** Yağan kar (Points): center etrafında size kutusunda; wind: [x, z] m/kare */
export function Snowfall({ count = 1200, center = [0, 4, 0], size = [24, 10, 24], speed = 0.03, wind = [0.012, 0], pointSize = 0.045, opacity = 0.9 }) {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = speed * (0.6 + rnd(i * 3 + 1) * 0.8);
      const y = (((rnd(i + 7) * size[1] - frame * v) % size[1]) + size[1]) % size[1];
      const x = (((rnd(i * 5 + 2) * size[0] + frame * wind[0] * (0.7 + rnd(i)) + Math.sin(frame / 20 + i) * 0.15) % size[0]) + size[0]) % size[0];
      const z = (((rnd(i * 11 + 3) * size[2] + frame * wind[1]) % size[2]) + size[2]) % size[2];
      pos[i * 3] = center[0] - size[0] / 2 + x;
      pos[i * 3 + 1] = center[1] - size[1] / 2 + y;
      pos[i * 3 + 2] = center[2] - size[2] / 2 + z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [frame, count, center[0], center[1], center[2], size[0], size[1], size[2], speed, wind[0], wind[1]]);
  return (
    <points geometry={geo}>
      <pointsMaterial size={pointSize} color="#f4f7fb" transparent opacity={opacity} depthWrite={false} />
    </points>
  );
}

/** Yükselen buhar/duman (yarı saydam küreler) */
export function Puffs({ at = [0, 0, 0], count = 10, rise = 1.2, spread = 0.25, size = 0.12, color = '#ffffff', opacity = 0.35, period = 70, seed = 1 }) {
  const frame = useCurrentFrame();
  return (
    <group position={at}>
      {Array.from({ length: count }, (_, i) => {
        const t = ((frame + rnd(seed + i) * period) % period) / period;
        return (
          <mesh key={i} position={[Math.sin(t * 5 + i) * spread * t, t * rise, Math.cos(t * 4 + i) * spread * t * 0.6]} scale={size * (0.6 + t * 1.6)}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={color} transparent opacity={opacity * Math.sin(t * Math.PI)} depthWrite={false} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Hedefe bakan spot ışık (hedef nesnesi sahneye eklenir) */
export function SpotAt({ position, target, ...props }) {
  const t = useMemo(() => new THREE.Object3D(), []);
  t.position.set(target[0], target[1], target[2]);
  return (
    <>
      <primitive object={t} />
      <spotLight position={position} target={t} {...props} />
    </>
  );
}

export const M = ({ c, r = 0.8, m = 0, e, ei = 1, ...rest }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || '#000000'} emissiveIntensity={e ? ei : 0} {...rest} />
);

// ================= Karakterler =================
/**
 * Basit, düz renkli 3B figür (yüz +z yönüne bakar). Yükseklik: tall 1.86 m, değilse 1.58 m.
 * look: { outfit, pants, skin, hair: 'cap'|'chef'|'long', hairColor, mustache, mustacheColor, glasses,
 *         gloves, buttons, apron, camera }
 * pose: { arm: 0..1 sağ kolu öne uzatma, bend: rad (belden öne eğilme), yaw: baş dönüşü }
 */
export function Character({ tall, look = {}, pose = {}, position = [0, 0, 0], rotation = 0, shadowOnly = false, seed = 1 }) {
  const frame = useCurrentFrame();
  const s = tall ? 1 : 0.85;
  const breathe = 1 + Math.sin(frame / 20 + seed) * 0.012;
  const yaw = (pose.yaw ?? 0) + Math.sin(frame / 47 + seed) * 0.06;
  const arm = pose.arm ?? 0;
  const bend = pose.bend ?? 0;
  const skin = look.skin ?? '#c99a74';
  const hand = look.gloves ? '#f6f4ee' : skin;
  // yalnızca gölge düşüren (görünmez) figür
  const mat = (c, extra = {}) =>
    shadowOnly ? <meshBasicMaterial colorWrite={false} depthWrite={false} /> : <M c={c} {...extra} />;
  const mesh = (geo, c, props = {}, extra) => (
    <mesh castShadow receiveShadow={!shadowOnly} {...props}>
      {geo}
      {mat(c, extra)}
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={s}>
      {/* bacaklar */}
      {mesh(<cylinderGeometry args={[0.085, 0.075, 0.86, 10]} />, look.pants ?? '#22252c', { position: [-0.1, 0.43, 0] })}
      {mesh(<cylinderGeometry args={[0.085, 0.075, 0.86, 10]} />, look.pants ?? '#22252c', { position: [0.1, 0.43, 0] })}
      {mesh(<boxGeometry args={[0.12, 0.07, 0.26]} />, '#111', { position: [-0.1, 0.035, 0.05] })}
      {mesh(<boxGeometry args={[0.12, 0.07, 0.26]} />, '#111', { position: [0.1, 0.035, 0.05] })}
      {/* belden yukarısı (eğilebilir) */}
      <group position={[0, 0.9, 0]} rotation={[bend, 0, 0]}>
        <group scale={[1, breathe, 1]}>
          {mesh(<capsuleGeometry args={[0.2, 0.42, 6, 14]} />, look.outfit ?? '#3a3f4a', { position: [0, 0.32, 0], scale: [1.1, 1, 0.75] })}
          {look.apron && mesh(<boxGeometry args={[0.34, 0.6, 0.02]} />, '#f6f2ea', { position: [0, 0.18, 0.16] })}
          {look.buttons && [0.5, 0.36, 0.22, 0.08].map((y) => mesh(<sphereGeometry args={[0.018, 8, 6]} />, '#d9b45a', { key: y, position: [0, y, 0.155] }, { m: 0.8, r: 0.3 }))}
          {look.camera && (
            <group position={[0, 0.36, 0.17]}>
              {mesh(<boxGeometry args={[0.17, 0.11, 0.07]} />, '#1b1b1f')}
              {mesh(<cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />, '#2c3440', { position: [0, 0, 0.05], rotation: [Math.PI / 2, 0, 0] })}
            </group>
          )}
        </group>
        {/* kollar */}
        <group position={[-0.27, 0.6, 0]} rotation={[0, 0, 0.08]}>
          {mesh(<capsuleGeometry args={[0.06, 0.5, 4, 10]} />, look.outfit ?? '#3a3f4a', { position: [0, -0.3, 0] })}
          {mesh(<sphereGeometry args={[0.065, 12, 10]} />, hand, { position: [0, -0.62, 0] })}
        </group>
        <group position={[0.27, 0.6, 0]} rotation={[-arm * 1.35, 0, -0.08]}>
          {mesh(<capsuleGeometry args={[0.06, 0.5, 4, 10]} />, look.outfit ?? '#3a3f4a', { position: [0, -0.3, 0] })}
          {mesh(<sphereGeometry args={[0.065, 12, 10]} />, hand, { position: [0, -0.64, 0.01], scale: [0.85, 1.25, 0.6] })}
        </group>
        {/* boyun ve baş */}
        {mesh(<cylinderGeometry args={[0.05, 0.055, 0.1, 10]} />, skin, { position: [0, 0.74, 0] })}
        <group position={[0, 0.88, 0]} rotation={[0, yaw, 0]}>
          {mesh(<sphereGeometry args={[0.125, 20, 16]} />, skin)}
          {!shadowOnly && (
            <group>
              <mesh position={[-0.045, 0.02, 0.112]}><sphereGeometry args={[0.014, 8, 6]} /><M c="#1a1410" /></mesh>
              <mesh position={[0.045, 0.02, 0.112]}><sphereGeometry args={[0.014, 8, 6]} /><M c="#1a1410" /></mesh>
              {look.mustache && (
                <mesh position={[0, -0.035, 0.118]} rotation={[0, 0, 0]} scale={[1, 0.45, 0.5]}>
                  <capsuleGeometry args={[0.022, 0.07, 4, 8]} />
                  <M c={look.mustacheColor ?? '#2c2019'} />
                </mesh>
              )}
              {look.glasses && (
                <group position={[0, 0.02, 0.122]}>
                  <mesh position={[-0.045, 0, 0]}><torusGeometry args={[0.032, 0.006, 6, 18]} /><M c="#141414" /></mesh>
                  <mesh position={[0.045, 0, 0]}><torusGeometry args={[0.032, 0.006, 6, 18]} /><M c="#141414" /></mesh>
                  <mesh><boxGeometry args={[0.03, 0.006, 0.006]} /><M c="#141414" /></mesh>
                  {look.fogged && (
                    <>
                      <mesh position={[-0.045, 0, 0]}><circleGeometry args={[0.03, 16]} /><M c="#ffffff" transparent opacity={0.45} /></mesh>
                      <mesh position={[0.045, 0, 0]}><circleGeometry args={[0.03, 16]} /><M c="#ffffff" transparent opacity={0.45} /></mesh>
                    </>
                  )}
                </group>
              )}
            </group>
          )}
          {look.hair === 'cap' && (
            <group position={[0, 0.07, 0]}>
              {mesh(<cylinderGeometry args={[0.135, 0.135, 0.08, 20]} />, '#1d2a44')}
              {mesh(<boxGeometry args={[0.2, 0.015, 0.1]} />, '#141c2e', { position: [0, -0.035, 0.13] })}
              {mesh(<cylinderGeometry args={[0.137, 0.137, 0.02, 20]} />, '#c9a24a', { position: [0, -0.02, 0] }, { m: 0.6, r: 0.4 })}
            </group>
          )}
          {look.hair === 'chef' && (
            <group position={[0, 0.1, 0]}>
              {mesh(<cylinderGeometry args={[0.13, 0.12, 0.08, 20]} />, '#ddd6c8')}
              {mesh(<sphereGeometry args={[0.15, 16, 12]} />, '#f6f2ea', { position: [0, 0.12, 0], scale: [1, 0.8, 1] })}
            </group>
          )}
          {look.hair === 'long' && (
            <group>
              {mesh(<sphereGeometry args={[0.132, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />, look.hairColor ?? '#1c1714', { position: [0, 0.01, -0.005] })}
              {mesh(<boxGeometry args={[0.26, 0.34, 0.08]} />, look.hairColor ?? '#1c1714', { position: [0, -0.13, -0.08] })}
            </group>
          )}
          {look.hair === 'short' && mesh(<sphereGeometry args={[0.13, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2.4]} />, look.hairColor ?? '#2a211b')}
        </group>
      </group>
    </group>
  );
}

// Üç şüphelinin görünüşü (özellikler ekranda yazmaz; yalnızca bakınca görülür)
export const RASIM = { tall: true, look: { outfit: '#1f2a44', pants: '#1a2236', hair: 'cap', mustache: true, mustacheColor: '#cfc8bb', gloves: true, buttons: true } };
export const NERMIN = { tall: false, look: { outfit: '#e6e0d4', pants: '#2a2a30', hair: 'chef', glasses: true, fogged: true, apron: true } };
export const SELIN = { tall: true, look: { outfit: '#3d5a6c', pants: '#25262c', hair: 'long', hairColor: '#1c1714', glasses: true, camera: true, skin: '#c99a74' } };

// ================= Tren: dış =================
function Wagon({ x, len = 7, color = '#2a3344', lit = 1, door = null }) {
  const frame = useCurrentFrame();
  const win = (i) => 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frame / (12 + (i % 5)) + i * 2.1));
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 2.7, 2.8]} />
        <M c={color} r={0.6} m={0.2} />
      </mesh>
      <mesh position={[0, 3.36, 0]}>
        <boxGeometry args={[len + 0.1, 0.16, 2.9]} />
        <M c="#e9eef3" r={1} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[len - 0.4, 0.4, 2.4]} />
        <M c="#111318" />
      </mesh>
      {Array.from({ length: Math.floor(len / 1.1) }, (_, i) => {
        const wx = -len / 2 + 0.7 + i * 1.1;
        if (door != null && Math.abs(wx - door) < 0.7) return null;
        return (
          <mesh key={i} position={[wx, 2.3, 1.41]}>
            <planeGeometry args={[0.62, 0.7]} />
            <M c="#f2b84b" e="#f2b84b" ei={1.4 * win(i) * lit} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.4, 1.41]}>
        <planeGeometry args={[len, 0.06]} />
        <M c="#7a2a22" />
      </mesh>
    </group>
  );
}

/** Karlara saplanmış tren: lokomotif x≈-10, vagonlar sağa doğru. doorX: kapısı olan vagon yerinde kapı */
export function TrainOutside({ doorOpen = 0, doorX = -1.2 }) {
  return (
    <group>
      {/* lokomotif */}
      <group position={[-11, 0, 0]}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[6, 2.4, 2.6]} />
          <M c="#1e232c" r={0.5} m={0.4} />
        </mesh>
        <mesh position={[-1.6, 3.3, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.9, 16]} />
          <M c="#121419" />
        </mesh>
        <mesh position={[1.9, 3.3, 0]}>
          <boxGeometry args={[2, 1.2, 2.6]} />
          <M c="#252b35" />
        </mesh>
        <mesh position={[-3.02, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.24, 20]} />
          <M c="#fff1c9" e="#fff1c9" ei={3} />
        </mesh>
        <SpotAt position={[-3.2, 1.7, 0]} target={[-20, 0.6, 0]} angle={0.45} penumbra={0.6} intensity={120} distance={40} color="#ffe7b0" />
        <Puffs at={[-1.6, 3.8, 0]} count={14} rise={3.2} spread={0.9} size={0.35} color="#8a8f99" opacity={0.45} period={110} seed={5} />
        <mesh position={[0, 3.1, 0]}>
          <boxGeometry args={[6.1, 0.12, 2.7]} />
          <M c="#e9eef3" r={1} />
        </mesh>
      </group>
      <Wagon x={-4.3} />
      <Wagon x={3.0} door={doorX - 3.0} />
      <Wagon x={10.3} />
      {/* kapı (menteşesi solda), içerden sıcak ışık */}
      <group position={[doorX - 0.45, 1.05, 1.42]} rotation={[0, -doorOpen * 1.45, 0]}>
        <mesh position={[0.45, 1.0, 0]} castShadow>
          <boxGeometry args={[0.9, 2.0, 0.06]} />
          <M c="#26303f" r={0.5} m={0.3} />
        </mesh>
        <mesh position={[0.45, 1.45, 0.035]}>
          <planeGeometry args={[0.5, 0.55]} />
          <M c="#f2b84b" e="#f2b84b" ei={0.9} />
        </mesh>
      </group>
      <mesh position={[doorX, 2.05, 1.38]}>
        <planeGeometry args={[0.9, 2.0]} />
        <M c="#3a2516" e="#f2a24b" ei={0.6 + doorOpen * 1.2} />
      </mesh>
      <pointLight position={[doorX, 2.0, 1.0 + doorOpen * 0.8]} intensity={doorOpen * 18} distance={6} color="#ffbf6b" />
      {/* basamak */}
      <mesh position={[doorX, 0.75, 1.65]}>
        <boxGeometry args={[1, 0.08, 0.4]} />
        <M c="#1a1d22" />
      </mesh>
      {/* tekerlekleri gömen kar */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-14 + i * 2.1, 0.2, 1.45 + rnd(i) * 0.2]} scale={[1.6, 0.55 + rnd(i + 3) * 0.3, 0.7]}>
          <sphereGeometry args={[1, 16, 10]} />
          <M c="#dfe5ec" r={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Karlı arazi ve dağlar */
export function Landscape() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <M c="#b9c3cf" r={1} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 1.2 - Math.PI * 0.1;
        const d = 55 + rnd(i) * 30;
        const h = 18 + rnd(i + 4) * 22;
        const x = Math.cos(a) * d - 10;
        const z = -Math.sin(a) * d - 10;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[h * 0.75, h, 7]} />
              <M c="#1b2230" r={1} />
            </mesh>
            <mesh position={[0, h * 0.82, 0]}>
              <coneGeometry args={[h * 0.75 * 0.36, h * 0.36, 7]} />
              <M c="#dfe5ec" r={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ================= Tren: iç =================
/** Vagon kabuğu: z0 → z1 (z1 < z0), genişlik 2.6, yükseklik 2.4. Sağ duvarda pencereler, solda kapılar */
export function CarShell({ z0 = 2, z1 = -12, lamps = [], wood = '#3a281c', doors = true, windows = true, carpet = '#5a1f1c', lampPower = 6 }) {
  const frame = useCurrentFrame();
  const L = z0 - z1;
  const zc = (z0 + z1) / 2;
  const flick = (i) => 0.85 + 0.15 * Math.sin(frame / 5 + i * 3) * Math.sin(frame / 13 + i);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow>
        <planeGeometry args={[2.6, L]} />
        <M c="#2b1c16" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, zc]} receiveShadow>
        <planeGeometry args={[1.1, L]} />
        <M c={carpet} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.4, zc]}>
        <planeGeometry args={[2.6, L]} />
        <M c="#1b140f" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-1.3, 1.2, zc]} receiveShadow>
        <planeGeometry args={[L, 2.4]} />
        <M c={wood} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[1.3, 1.2, zc]} receiveShadow>
        <planeGeometry args={[L, 2.4]} />
        <M c={wood} />
      </mesh>
      {/* uç duvar */}
      <mesh position={[0, 1.2, z1]} receiveShadow>
        <planeGeometry args={[2.6, 2.4]} />
        <M c="#2c1f16" />
      </mesh>
      {/* pirinç tırabzan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.25, 1.0, zc]}>
        <cylinderGeometry args={[0.018, 0.018, L, 8]} />
        <M c="#b8925a" m={0.8} r={0.3} />
      </mesh>
      {windows &&
        Array.from({ length: Math.floor(L / 1.7) }, (_, i) => (
          <group key={i} position={[1.29, 1.45, z0 - 1 - i * 1.7]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[0.95, 0.75]} />
              <M c="#0c1422" e="#16233a" ei={0.6} />
            </mesh>
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[1.05, 0.85]} />
              <M c="#6b5236" />
            </mesh>
          </group>
        ))}
      {doors &&
        Array.from({ length: Math.floor(L / 2.4) }, (_, i) => (
          <group key={i} position={[-1.27, 1.05, z0 - 1.6 - i * 2.4]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[0.85, 2.0, 0.05]} />
              <M c="#4a3324" />
            </mesh>
            <mesh position={[0, 0.45, 0.03]}>
              <planeGeometry args={[0.45, 0.5]} />
              <M c="#e8c88a" e="#e8c88a" ei={0.25} />
            </mesh>
            <mesh position={[0.32, 0, 0.05]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <M c="#c9a24a" m={0.8} r={0.3} />
            </mesh>
          </group>
        ))}
      {lamps.map((z, i) => (
        <group key={i} position={[0, 2.32, z]}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 10]} />
            <M c="#ffd98a" e="#ffd98a" ei={2.5} />
          </mesh>
          <pointLight intensity={lampPower * flick(i)} distance={6} decay={2} color="#ffc777" castShadow={i === 0} shadow-mapSize={[512, 512]} />
        </group>
      ))}
    </group>
  );
}

/** Beyaz örtülü yemek masası (x: sol −0.8 / sağ 0.8) */
export function DiningTable({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.04, 1.0]} />
        <M c="#ece6da" />
      </mesh>
      <mesh position={[Math.sign(-x) * 0.405, 0.62, 0]}>
        <boxGeometry args={[0.01, 0.24, 1.0]} />
        <M c="#d9d2c4" />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.72, 8]} />
        <M c="#2a1d14" />
      </mesh>
      {[-0.75, 0.75].map((dz) => (
        <group key={dz} position={[0, 0, dz]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.42]} />
            <M c="#5a1f1c" />
          </mesh>
          <mesh position={[0, 0.85, dz > 0 ? 0.19 : -0.19]}>
            <boxGeometry args={[0.7, 0.8, 0.06]} />
            <M c="#5a1f1c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Uçta tıkırdayan soba */
export function Stove({ z }) {
  const frame = useCurrentFrame();
  const fl = 0.7 + 0.3 * Math.sin(frame / 3.3) * Math.sin(frame / 7.1);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.5, 0.35]} castShadow>
        <cylinderGeometry args={[0.28, 0.3, 1.0, 20]} />
        <M c="#141414" m={0.6} r={0.5} />
      </mesh>
      <mesh position={[0, 0.45, 0.64]}>
        <planeGeometry args={[0.2, 0.14]} />
        <M c="#ff7a2e" e="#ff7a2e" ei={3 * fl} />
      </mesh>
      <mesh position={[0, 1.7, 0.35]}>
        <cylinderGeometry args={[0.07, 0.07, 1.4, 10]} />
        <M c="#1a1a1a" />
      </mesh>
      <pointLight position={[0, 0.6, 0.9]} intensity={4 * fl} distance={5} color="#ff8a3a" />
    </group>
  );
}
