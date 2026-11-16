import './env.js';
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { db, q } from './db.js';
import { checkPassword, setAdminCookie, clearAdminCookie, isAdmin, requireAdmin, deviceId, hashIp } from './auth.js';
import { isCorrectAnswer, murderAnswer } from '../shared/engine.js';
import { normalizeUsername, usernameKey, USERNAME_RE } from '../shared/format.js';

const PORT = Number(process.env.PORT || 3001);
// Mobil operatörler (CGNAT) binlerce kişiyi aynı IP'den çıkarır — bu sınırları çok düşük tutmayın.
const MAX_PER_IP = Number(process.env.MAX_SUBMISSIONS_PER_IP || 25);
const SUBMIT_RATE = Number(process.env.SUBMIT_RATE_PER_MIN || 20);
// Ağ kilidi: aynı ağdan BURST_WINDOW içinde BURST_LIMIT cevap gelirse, son cevaptan itibaren BURST_COOLDOWN boyunca kilit.
const BURST_LIMIT = Number(process.env.BURST_LIMIT || 5);
const BURST_WINDOW = Number(process.env.BURST_WINDOW_MIN || 10) * 60_000;
const BURST_COOLDOWN = Number(process.env.BURST_COOLDOWN_MIN || 15) * 60_000;

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false);
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});

// ---------- yardımcılar ----------
const parse = (row) => (row ? { ...row, data: JSON.parse(row.data) } : null);
const now = () => Date.now();
const isLive = (row) => row.status === 'open' && row.publish_at != null && row.publish_at <= now();

function caseSummary(row) {
  const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  return {
    no: row.no,
    title: d.title,
    status: row.status,
    publishAt: row.publish_at,
    closedAt: row.closed_at,
    live: isLive(row),
    solved: row.solved ?? undefined,
    attempts: row.attempts ?? undefined,
    emojis: d.categories?.[0]?.items?.map((i) => i.emoji).filter(Boolean) ?? [],
  };
}

/** Oyuncuya giden vaka: çözüm ve kural yapısı GİZLİ (kapanana kadar). */
function publicCase(row) {
  const d = row.data;
  const base = caseSummary({ ...row, data: d });
  if (row.status === 'open' && !isLive(row)) return { ...base, scheduled: true };
  const out = {
    ...base,
    story: d.story,
    categories: d.categories.map((c) => ({
      key: c.key,
      label: c.label,
      items: c.items.map(({ id, name, emoji, desc, traits, proper, forms }) => ({ id, name, emoji, desc, traits, proper, forms })),
    })),
    clues: d.clues.map(({ id, text, speaker }) => ({ id, text, speaker: speaker || undefined })),
    liar: d.clues.some((c) => c.speaker),
  };
  if (row.status === 'closed') {
    out.solution = d.solution;
    out.killer = d.killer;
    out.answer = murderAnswer(d);
  }
  return out;
}

const lbCache = new Map(); // case_id -> { at, body }
function leaderboard(row) {
  const hit = lbCache.get(row.id);
  if (hit && now() - hit.at < 2000) return hit.body;
  const list = q.correctList.all(row.id, 1000).map((s, i) => ({
    rank: i + 1,
    username: s.username,
    ms: row.publish_at ? Math.max(0, s.created_at - row.publish_at) : null,
  }));
  const { total, correct } = q.counts.get(row.id);
  const body = { no: row.no, status: row.status, publishAt: row.publish_at, list, total, correct, wrong: total - correct };
  lbCache.set(row.id, { at: now(), body });
  return body;
}

function getCaseOr404(req, res) {
  const row = parse(q.caseByNo.get(Number(req.params.no)));
  if (!row || (row.status === 'draft' && !isAdmin(req))) {
    res.status(404).json({ error: 'Vaka bulunamadı' });
    return null;
  }
  return row;
}

// Çok basit bellek içi hız sınırı (IP başına dakikada N istek)
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const t = now();
    const arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Çok hızlısın dedektif — biraz bekleyip tekrar dene.' });
    arr.push(t);
    hits.set(key, arr);
    next();
  };
}
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

/** Bu ağ kilitliyse kilidin kalkacağı an (ms), değilse 0. Veritabanından hesaplanır: yeniden başlatmada kaybolmaz. */
function networkLockedUntil(ipHash) {
  if (!BURST_LIMIT) return 0;
  const rows = q.ipRecent.all(ipHash, BURST_LIMIT);
  if (rows.length < BURST_LIMIT) return 0;
  const newest = rows[0].created_at;
  const oldest = rows[rows.length - 1].created_at;
  if (newest - oldest > BURST_WINDOW) return 0;
  const until = newest + BURST_COOLDOWN;
  return until > now() ? until : 0;
}

const BAD_WORDS =['orospu', 'yarrak', 'sikerim', 'siktir', 'amına', 'amina', 'ananı', 'anani', 'pezevenk', 'kahpe', 'göt', 'piç'];
const BAD_EXACT = ['amk', 'aq', 'sik', 'oç', 'oc', 'mk'];
function badName(name) {
  const n = usernameKey(name).replace(/[._0-9]/g, '');
  return BAD_WORDS.some((w) => n.includes(w)) || BAD_EXACT.includes(n);
}

// ---------- herkese açık API ----------
// Sağlık kontrolü (deploy sonrası). `ip`: sunucunun seni hangi IP ile gördüğü — proxy ayarı (TRUST_PROXY)
// yanlışsa herkes 127.0.0.1 görünür ve ağ kilidi herkesi birlikte kilitler.
app.get('/api/health', (req, res) => {
  q.nextNo.get();
  res.json({ ok: true, ip: req.ip });
});

app.get('/api/cases', (req, res) => {
  res.json(q.publicCases.all().map(caseSummary));
});

app.get('/api/cases/:no', (req, res) => {
  const row = getCaseOr404(req, res);
  if (row) res.json(publicCase(row));
});

app.get('/api/cases/:no/leaderboard', (req, res) => {
  const row = getCaseOr404(req, res);
  if (row) res.json(leaderboard(row));
});

app.get('/api/cases/:no/me', (req, res) => {
  const row = getCaseOr404(req, res);
  if (!row) return;
  const dev = deviceId(req, res);
  const s = q.subByDevice.get(row.id, dev);
  if (!s) return res.json({ submitted: false });
  res.json(submissionResult(row, s));
});

function submissionResult(row, s) {
  return {
    submitted: true,
    username: s.username,
    correct: !!s.correct,
    rank: s.correct ? q.rankOf.get(row.id, s.id).r : null,
    ms: row.publish_at ? Math.max(0, s.created_at - row.publish_at) : null,
    answer: JSON.parse(s.answer),
  };
}

app.post('/api/cases/:no/submit', rateLimit(SUBMIT_RATE, 60_000), (req, res) => {
  const row = getCaseOr404(req, res);
  if (!row) return;
  if (!isLive(row)) {
    return res.status(400).json({ error: row.status === 'closed' ? 'Bu vaka kapandı, artık cevap alınmıyor.' : 'Bu vaka henüz cevaba açılmadı.' });
  }
  const d = row.data;
  const username = normalizeUsername(req.body?.username);
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Kullanıcı adı 2–30 karakter olmalı; harf, rakam, nokta ve alt çizgi kullanabilirsin.' });
  }
  if (badName(username)) return res.status(400).json({ error: 'Bu kullanıcı adını kullanamazsın.' });

  const raw = req.body?.answer || {};
  const answer = {};
  for (const c of d.categories) {
    const id = raw[c.key];
    if (!c.items.some((it) => it.id === id)) return res.status(400).json({ error: `Lütfen bir seçim yap: ${c.label}` });
    answer[c.key] = id;
  }

  const dev = deviceId(req, res);
  const prev = q.subByDevice.get(row.id, dev);
  if (prev) return res.status(409).json({ error: 'Bu vaka için cevabını zaten gönderdin.', result: submissionResult(row, prev) });

  const key = usernameKey(username);
  if (q.subByName.get(row.id, key)) {
    return res.status(409).json({ error: 'Bu kullanıcı adıyla bu vakaya zaten cevap verilmiş.' });
  }
  const ipHash = hashIp(req.ip);
  const lockedUntil = isAdmin(req) ? 0 : networkLockedUntil(ipHash);
  if (lockedUntil) {
    const sec = Math.ceil((lockedUntil - now()) / 1000);
    res.set('Retry-After', String(sec));
    return res.status(429).json({
      error: `Bu ağdan kısa sürede çok fazla cevap geldi. ${Math.ceil(sec / 60)} dakika sonra tekrar dene.`,
      retryAfter: sec,
    });
  }
  if (q.ipCount.get(row.id, ipHash).n >= MAX_PER_IP) {
    return res.status(429).json({ error: 'Bu ağdan bu vaka için çok fazla cevap gönderildi.' });
  }

  const correct = isCorrectAnswer(d, answer);
  let info;
  const t = now();
  try {
    info = q.insertSub.run(row.id, username, key, JSON.stringify(answer), correct ? 1 : 0, dev, ipHash, t);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Bu kullanıcı adıyla bu vakaya zaten cevap verilmiş.' });
    throw e;
  }
  lbCache.delete(row.id);
  const s = { id: Number(info.lastInsertRowid), username, correct: correct ? 1 : 0, created_at: t, answer: JSON.stringify(answer) };
  res.json(submissionResult(row, s));
});

// ---------- admin API ----------
app.post('/api/admin/login', rateLimit(10, 60_000), (req, res) => {
  if (!checkPassword(req.body?.password || '')) return res.status(401).json({ error: 'Şifre yanlış' });
  setAdminCookie(res);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});
app.get('/api/admin/me', (req, res) => res.json({ admin: isAdmin(req) }));

app.use('/api/admin', requireAdmin);

const adminCase = (row) => ({ id: row.id, no: row.no, status: row.status, publishAt: row.publish_at, closedAt: row.closed_at, data: row.data });

function validateData(d) {
  if (!d || typeof d !== 'object') return 'Geçersiz veri';
  if (!Array.isArray(d.categories) || d.categories.length < 3) return 'Kategoriler eksik';
  if (d.categories[0].key !== 'suspect') return 'İlk kategori şüpheliler olmalı';
  const N = d.categories[0].items.length;
  if (d.categories.some((c) => c.items.length !== N)) return 'Her kategoride aynı sayıda öğe olmalı';
  if (!Array.isArray(d.clues)) return 'İpuçları eksik';
  return null;
}

app.get('/api/admin/cases', (req, res) => {
  res.json(q.allCases.all().map((r) => ({ ...caseSummary(r), id: r.id })));
});

app.post('/api/admin/cases', (req, res) => {
  const err = validateData(req.body?.data);
  if (err) return res.status(400).json({ error: err });
  const t = now();
  const no = q.nextNo.get().n;
  const info = q.insertCase.run(no, 'draft', JSON.stringify(req.body.data), t, t);
  res.json(adminCase(parse(q.caseById.get(Number(info.lastInsertRowid)))));
});

app.get('/api/admin/cases/:id', (req, res) => {
  const row = parse(q.caseById.get(Number(req.params.id)));
  if (!row) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(adminCase(row));
});

app.put('/api/admin/cases/:id', (req, res) => {
  const row = q.caseById.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Bulunamadı' });
  const err = validateData(req.body?.data);
  if (err) return res.status(400).json({ error: err });
  q.updateCaseData.run(JSON.stringify(req.body.data), now(), row.id);
  lbCache.delete(row.id);
  res.json(adminCase(parse(q.caseById.get(row.id))));
});

app.post('/api/admin/cases/:id/status', (req, res) => {
  const row = q.caseById.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Bulunamadı' });
  const { status, publishAt } = req.body || {};
  if (!['draft', 'open', 'closed'].includes(status)) return res.status(400).json({ error: 'Geçersiz durum' });
  let pub = row.publish_at;
  let closed = row.closed_at;
  if (status === 'open') {
    pub = Number(publishAt) || now();
    closed = null;
  }
  if (status === 'closed') closed = now();
  if (status === 'draft') closed = null;
  q.updateStatus.run(status, pub, closed, now(), row.id);
  lbCache.delete(row.id);
  res.json(adminCase(parse(q.caseById.get(row.id))));
});

app.delete('/api/admin/cases/:id', (req, res) => {
  q.deleteCase.run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/cases/:id/submissions', (req, res) => {
  const row = q.caseById.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Bulunamadı' });
  const list = q.subsForCase.all(row.id).map((s) => ({
    id: s.id,
    username: s.username,
    answer: JSON.parse(s.answer),
    correct: !!s.correct,
    createdAt: s.created_at,
    ms: row.publish_at ? s.created_at - row.publish_at : null,
  }));
  res.json({ list });
});

app.delete('/api/admin/submissions/:id', (req, res) => {
  q.deleteSub.run(Number(req.params.id));
  lbCache.clear();
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Bulunamadı' }));

// ---------- statik site (production) ----------
const dist = resolve('dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(resolve(dist, 'index.html'));
  });
}

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// Sunucuda HOST=127.0.0.1: uygulamaya yalnızca Caddy (HTTPS) üzerinden erişilir
const HOST = process.env.HOST;
app.listen(...(HOST ? [PORT, HOST] : [PORT]), (err) => {
  // Express 5 dinleme hatasını (ör. port dolu) buraya verir — sessizce "açıldı" demesin
  if (err) {
    console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} kullanımda — başka bir sunucu açık olabilir.` : err);
    process.exit(1);
  }
  console.log(`kimvarorda sunucusu: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
