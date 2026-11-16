// Sahne zamanlaması: seslendirme varsa gerçek kelime zamanları, yoksa tahmini süreler.
import manifest from './voice-manifest.json';
import { SCENES } from './script.js';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
const LEAD = 0.4; // sahne başladıktan sonra sesin girdiği an (sn)
const TAIL = 0.7; // ses bittikten sonra sahnenin sürdüğü süre (sn)

const norm = (s) => s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]/gu, '');

/** Seslendirme yokken kaba tahmin: kelime uzunluğu + noktalama duraklaması */
function estimateWords(text) {
  let t = 0;
  return text.split(/\s+/).filter(Boolean).map((w) => {
    const d = 0.14 + w.replace(/[^\p{L}]/gu, '').length * 0.06;
    const s = t;
    t += d + (/[.?!]$/.test(w) ? 0.45 : /[,;:]$/.test(w) ? 0.25 : 0.04);
    return { w, s, e: s + d };
  });
}

/** Okunuşu farklı yazılan öbekleri altyazıda birleştirir: "kimvarorda nokta ey ay" → "kimvarorda.ai" */
function fixCaptions(words, fixes = []) {
  let out = words;
  for (const [from, to] of fixes) {
    const pat = from.split(' ').map(norm);
    const next = [];
    for (let i = 0; i < out.length; i++) {
      if (pat.every((p, k) => out[i + k] && norm(out[i + k].w) === p)) {
        const last = out[i + pat.length - 1];
        next.push({ w: to + (last.w.match(/[^\p{L}\p{N}]+$/u)?.[0] || ''), s: out[i].s, e: last.e });
        i += pat.length - 1;
      } else next.push(out[i]);
    }
    out = next;
  }
  return out;
}

export const TIMELINE = (() => {
  let from = 0;
  return SCENES.map((sc) => {
    const v = manifest.scenes?.[sc.id];
    const raw = v?.words?.length ? v.words : estimateWords(sc.say);
    const dur = v?.duration ?? raw.at(-1).e;
    const frames = Math.ceil((LEAD + dur + TAIL) * FPS);
    const item = { ...sc, from, frames, lead: LEAD, audio: v?.file ?? null, raw, words: fixCaptions(raw, sc.captions) };
    from += frames;
    return item;
  });
})();

export const TOTAL = TIMELINE.at(-1).from + TIMELINE.at(-1).frames;
export const HAS_VOICE = TIMELINE.every((s) => s.audio);
export const SFX = manifest.sfx || {};
export const MUSIC = manifest.music || null;

/**
 * `phrase` seslendirmede söylendiği an (sahne içi frame). Ekler tolere edilir: "ampul" → "ampulün".
 * Bulunamazsa sahnenin `fallback` oranındaki frame.
 */
export function cue(scene, phrase, fallback = 0.5) {
  const pat = phrase.split(/\s+/).map(norm);
  const ws = scene.raw;
  for (let i = 0; i < ws.length; i++) {
    if (pat.every((p, k) => ws[i + k] && norm(ws[i + k].w).startsWith(p))) {
      return Math.round((scene.lead + ws[i].s) * FPS);
    }
  }
  return Math.round(scene.frames * fallback);
}
