// Videoların ortak parçaları: arka plan, marka, sahne geçişi, yerleşim, ses efektleri, sahne şeridi.
import {
  AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import { C, MONO, SERIF } from './theme.js';
import { FPS } from './timeline.js';
import mainManifest from './voice-manifest.json';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
// Ses efektleri tek yerde üretilir (npm run video:voice -- --sfx) ve tüm videolarda kullanılır
export const SFX = mainManifest.sfx || {};

/** f karesinde başlayan yaylı giriş (0 → 1) */
export function useSpring(at, config = { damping: 14, stiffness: 140 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
}
export const fadeUp = (p, dist = 40) => ({ opacity: p, transform: `translateY(${(1 - p) * dist}px)` });

export function Background() {
  const frame = useCurrentFrame();
  const x = 50 + Math.sin(frame / 90) * 18;
  const y = 30 + Math.cos(frame / 120) * 8;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${x}% ${y}%, rgba(255,79,59,0.13), transparent 60%),
                       radial-gradient(1200px 800px at 50% 110%, rgba(76,194,168,0.06), transparent 60%)`,
        }}
      />
      {/* film greni */}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.09, mixBlendMode: 'overlay' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(frame / 2) % 50} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)' }} />
    </AbsoluteFill>
  );
}

export function Mark({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="25" r="10" fill={C.accent} />
      <path d="M26 31h12l4 20H22z" fill={C.accent} />
    </svg>
  );
}

/** Üstteki marka: "kimvarorda" + vurgulu son ek (.ai gibi) */
export function Brand({ suffix = '.ai' }) {
  return (
    <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <Mark size={56} />
      <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: C.text, letterSpacing: '-0.01em' }}>
        kimvarorda<span style={{ color: C.accent }}>{suffix}</span>
      </span>
    </div>
  );
}

/** Sahne geçişi: hafif yakınlaşarak girer, solarak çıkar */
export function SceneWrap({ frames, children }) {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: ease });
  const outP = interpolate(frame, [frames - 9, frames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: Math.min(inP, outP), transform: `scale(${0.96 + inP * 0.04})` }}>
      {children}
    </AbsoluteFill>
  );
}

export const Kicker = ({ children, color = C.accent, style }) => (
  // CSS uppercase "i"yi "I" yapar; Türkçe kurallarıyla elle büyütüyoruz (Bir → BİR)
  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: '0.16em', color, ...style }}>
    {typeof children === 'string' ? children.toLocaleUpperCase('tr') : children}
  </div>
);

/** Ortadaki içerik alanı: üstte marka, altta Instagram arayüzü (açıklama, butonlar) için boşluk */
export const Stage = ({ children, style }) => (
  <div style={{ position: 'absolute', top: 280, left: 70, right: 70, height: 1220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style }}>
    {children}
  </div>
);

export function Sfx({ name, at, volume = 0.6 }) {
  if (!SFX[name]) return null;
  return (
    <Sequence from={Math.max(0, at)} layout="none">
      <Audio src={staticFile(SFX[name])} volume={volume} />
    </Sequence>
  );
}

/** Sahneleri sırayla oynatır: görüntü + seslendirme + geçiş sesi. views: { sahneId | sahneTürü: Bileşen } */
export function Track({ timeline, views }) {
  return timeline.map((s, i) => {
    const View = views[s.id] || views[s.kind];
    return (
      <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={s.id}>
        <SceneWrap frames={s.frames}>{View && <View s={s} />}</SceneWrap>
        {s.audio && (
          <Sequence from={Math.round(s.lead * FPS)} layout="none">
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        )}
        {i > 0 && <Sfx name="whoosh" at={0} volume={0.35} />}
      </Sequence>
    );
  });
}
