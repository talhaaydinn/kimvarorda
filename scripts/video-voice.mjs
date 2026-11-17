// Videolar için ElevenLabs seslendirmesi ve ses efektleri.
//
//   npm run video:voice -- --vaka         → vaka videosu (önce: npm run video:vaka -- <vaka.json>)
//   npm run video:voice                 → değişen sahneleri seslendirir (önbellekli)
//   npm run video:voice -- --sfx        → ses efektlerini de üretir (bir kez)
//   npm run video:voice -- --voices     → hesabındaki sesleri listeler (ELEVENLABS_VOICE_ID seçmek için)
//   npm run video:voice -- --force      → hepsini yeniden üretir
//
// .env:  ELEVENLABS_API_KEY=...   ELEVENLABS_VOICE_ID=...   (isteğe bağlı) ELEVENLABS_MODEL=eleven_multilingual_v2
//
// Çıktı: video/public/voice/<sahne>.mp3, video/public/sfx/<ad>.mp3 ve video/src/voice-manifest.json
// (kelime zamanlamaları — altyazı ve ekrandaki vurgular bunlarla senkron).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

try {
  process.loadEnvFile();
} catch {
  /* .env yok */
}

const API = 'https://api.elevenlabs.io/v1';
const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

const args = new Set(process.argv.slice(2));
const PUB = resolve('video/public');
// --vaka: vaka videosu, --tablo: tablo rehberi, --vaka3d: 3B POV hikâye videosu
// (her biri ayrı senaryo, manifest ve ses klasörü); bayrak yoksa "Nasıl oynanır?"
const MODE = ['vaka', 'tablo', 'vaka3d'].find((m) => args.has(`--${m}`)) ?? null;
const SCRIPT = await import(MODE ? `../video/src/${MODE}/script.js` : '../video/src/script.js');
const { SCENES } = SCRIPT;
// Senaryo kendi sesini/hızını seçebilir (export VOICE / SPEED); yoksa .env'deki ses
const VOICE = SCRIPT.VOICE || process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
// Vaka videoları ~1 dk olmalı: anlatım daha hızlı (ElevenLabs speed 0.7–1.2)
const SPEED = SCRIPT.SPEED ?? { vaka: 1.2, tablo: 1.1 }[MODE];
const SETTINGS = { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, ...(SPEED ? { speed: SPEED } : {}) };
const { SFX } = await import('../video/src/script.js');
const MANIFEST = resolve(MODE ? `video/src/${MODE}/voice-manifest.json` : 'video/src/voice-manifest.json');
const VOICE_DIR = MODE ? `${MODE}/voice` : 'voice';

// process.exit() açık fetch bağlantılarıyla Windows'ta libuv "Assertion failed" hatası veriyor;
// bunun yerine hata fırlatıp süreci kendi hâlinde kapatıyoruz.
class Fail extends Error {}
function fail(msg) {
  throw new Fail(msg);
}
process.on('uncaughtException', (e) => {
  console.error(e instanceof Fail ? `\n✕ ${e.message}\n` : e);
  process.exitCode = 1;
});

if (!KEY) {
  fail(
    'ELEVENLABS_API_KEY tanımlı değil.\n' +
      '  Proje klasöründeki .env dosyasına şu satırı ekle (dosya yoksa oluştur):\n' +
      '    ELEVENLABS_API_KEY=sk_...\n' +
      '  Anahtar: elevenlabs.io → Profil → API Keys. Video, seslendirme olmadan da (sessiz) render edilebilir.',
  );
}

async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    let detail = body;
    try {
      const j = JSON.parse(body);
      detail = j.detail?.message || j.detail?.status || JSON.stringify(j.detail || j);
    } catch {}
    fail(`ElevenLabs ${res.status}: ${detail}`);
  }
  return res;
}

// ---------- ses listesi ----------
if (args.has('--voices')) {
  const { voices } = await (await api('/voices')).json();
  console.log('\nHesabındaki sesler (ELEVENLABS_VOICE_ID için ilk sütunu kopyala):\n');
  for (const v of voices) {
    const l = v.labels || {};
    console.log(`  ${v.voice_id}  ${v.name.padEnd(28)} ${[l.gender, l.age, l.accent, l.description].filter(Boolean).join(', ')}`);
  }
  console.log('\nSeçtiğin sesi .env dosyasına ELEVENLABS_VOICE_ID=... olarak yaz. Varsayılan:', VOICE);
  process.exit(0);
}

// ---------- seslendirme ----------
const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const manifest = { scenes: {}, sfx: old.sfx || {}, voice: VOICE, model: MODEL };
mkdirSync(resolve(PUB, VOICE_DIR), { recursive: true });

/** Karakter zamanlamalarından kelime listesi: [{ w, s, e }] (saniye) */
function toWords(al) {
  const words = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { w: '', s: al.character_start_times_seconds[i], e: 0 };
    cur.w += ch;
    cur.e = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words.map((x) => ({ w: x.w, s: +x.s.toFixed(3), e: +x.e.toFixed(3) }));
}

let spent = 0;
for (const [i, sc] of SCENES.entries()) {
  const hash = createHash('sha1').update(JSON.stringify([sc.say, VOICE, MODEL, SETTINGS])).digest('hex').slice(0, 12);
  const file = resolve(PUB, VOICE_DIR, `${sc.id}.mp3`);
  const prev = old.scenes?.[sc.id];
  if (!args.has('--force') && prev?.hash === hash && existsSync(file)) {
    manifest.scenes[sc.id] = prev;
    console.log(`  = ${sc.id} (değişmedi)`);
    continue;
  }
  const body = {
    text: sc.say,
    model_id: MODEL,
    voice_settings: SETTINGS,
    previous_text: SCENES[i - 1]?.say,
    next_text: SCENES[i + 1]?.say,
  };
  if (/turbo|flash/.test(MODEL)) body.language_code = 'tr';
  const res = await api(`/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const j = await res.json();
  writeFileSync(file, Buffer.from(j.audio_base64, 'base64'));
  const al = j.alignment || j.normalized_alignment;
  const words = toWords(al);
  const duration = al.character_end_times_seconds.at(-1);
  manifest.scenes[sc.id] = { hash, file: `${VOICE_DIR}/${sc.id}.mp3`, duration: +duration.toFixed(3), words };
  spent += sc.say.length;
  console.log(`  ✓ ${sc.id}: ${duration.toFixed(1)} sn, ${words.length} kelime`);
}

// ---------- ses efektleri ----------
if (args.has('--sfx') && !MODE) {
  mkdirSync(resolve(PUB, 'sfx'), { recursive: true });
  for (const [name, fx] of Object.entries(SFX)) {
    const file = resolve(PUB, 'sfx', `${name}.mp3`);
    if (!args.has('--force') && existsSync(file) && manifest.sfx[name]) {
      console.log(`  = sfx/${name} (var)`);
      continue;
    }
    const res = await api('/sound-generation?output_format=mp3_44100_128', {
      method: 'POST',
      body: JSON.stringify({ text: fx.prompt, duration_seconds: fx.seconds, prompt_influence: 0.6 }),
    });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    manifest.sfx[name] = `sfx/${name}.mp3`;
    console.log(`  ✓ sfx/${name}`);
  }
}

// arka plan müziği: video/public/music.mp3 koyarsan kısık sesle eklenir
manifest.music = existsSync(resolve(PUB, 'music.mp3')) ? 'music.mp3' : null;

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest yazıldı. Bu çalıştırmada seslendirilen karakter: ${spent}. Önizleme: npm run video:studio`);
