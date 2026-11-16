import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin');
const SECRET = process.env.SESSION_SECRET || createHash('sha256').update('kvo:' + ADMIN_PASSWORD).digest('hex');

if (!process.env.ADMIN_PASSWORD) {
  console.warn(isProd
    ? '⚠️  ADMIN_PASSWORD tanımlı değil — admin girişi kapalı.'
    : '⚠️  ADMIN_PASSWORD tanımlı değil — geliştirme şifresi: "admin"');
}

const ADMIN_COOKIE = 'kvo_admin';
const DEVICE_COOKIE = 'kvo_dev';
const WEEK = 7 * 24 * 3600 * 1000;

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookieStr(name, value, maxAgeMs) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeMs / 1000)}${isProd ? '; Secure' : ''}`;
}

const sign = (v) => createHmac('sha256', SECRET).update(v).digest('hex');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(pw) {
  return !!ADMIN_PASSWORD && safeEqual(pw, ADMIN_PASSWORD);
}

export function setAdminCookie(res) {
  const exp = String(Date.now() + WEEK);
  res.append('Set-Cookie', cookieStr(ADMIN_COOKIE, `${exp}.${sign('admin:' + exp)}`, WEEK));
}
export function clearAdminCookie(res) {
  res.append('Set-Cookie', cookieStr(ADMIN_COOKIE, '', 0));
}

export function isAdmin(req) {
  const v = parseCookies(req)[ADMIN_COOKIE];
  if (!v) return false;
  const [exp, sig] = v.split('.');
  return Number(exp) > Date.now() && safeEqual(sig, sign('admin:' + exp));
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Yetkisiz' });
}

/** Her ziyaretçiye kalıcı, imzalı bir cihaz kimliği verir (tek cevap hakkı için). */
export function deviceId(req, res) {
  const v = parseCookies(req)[DEVICE_COOKIE];
  if (v) {
    const [id, sig] = v.split('.');
    if (id && sig && safeEqual(sig, sign('dev:' + id).slice(0, 16))) return id;
  }
  const id = randomBytes(12).toString('hex');
  res.append('Set-Cookie', cookieStr(DEVICE_COOKIE, `${id}.${sign('dev:' + id).slice(0, 16)}`, 365 * 24 * 3600 * 1000));
  return id;
}

export function hashIp(ip) {
  return createHash('sha256').update(SECRET + '|' + (ip || '')).digest('hex').slice(0, 24);
}
