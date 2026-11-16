// Sahne zamanlaması: seslendirme varsa gerçek kelime zamanları, yoksa tahmini süreler.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
const LEAD = 0.4; // sahne başladıktan sonra sesin girdiği an (sn)
const TAIL = 0.7; // ses bittikten sonra sahnenin sürdüğü süre (sn) — sahne `tail` ile değiştirebilir

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

/**
 * Sahne listesinden zaman çizelgesi. scenes: [{ id, say, kind?, tail?, ... }], manifest: video:voice çıktısı
 * → { TIMELINE: [{ ...sahne, from, frames, lead, audio, raw }], TOTAL, MUSIC }
 */
export function makeTimeline(scenes, manifest = {}) {
  let from = 0;
  const TIMELINE = scenes.map((sc) => {
    const v = manifest.scenes?.[sc.id];
    const raw = v?.words?.length ? v.words : estimateWords(sc.say);
    const dur = v?.duration ?? raw.at(-1).e;
    const frames = Math.ceil((LEAD + dur + (sc.tail ?? TAIL)) * FPS);
    const item = { ...sc, from, frames, lead: LEAD, audio: v?.file ?? null, raw };
    from += frames;
    return item;
  });
  return { TIMELINE, TOTAL: from, MUSIC: manifest.music || null };
}

/**
 * `phrase` seslendirmede söylendiği an (sahne içi frame). Ekler tolere edilir: "ampul" → "ampulün".
 * Kelime tekrar ediyorsa çok kelimeli öbek kullan ("Ampul mahzeni"). Bulunamazsa sahnenin `fallback` oranı.
 */
export function cue(scene, phrase, fallback = 0.5) {
  const pat = phrase.split(/\s+/).map(norm).filter(Boolean);
  const ws = scene.raw;
  for (let i = 0; i < ws.length; i++) {
    if (pat.every((p, k) => ws[i + k] && norm(ws[i + k].w).startsWith(p))) {
      return Math.round((scene.lead + ws[i].s) * FPS);
    }
  }
  return Math.round(scene.frames * fallback);
}

/** Seslendirmenin bittiği an (sahne içi frame) */
export const voiceEnd = (scene) => Math.round((scene.lead + scene.raw.at(-1).e) * FPS);
