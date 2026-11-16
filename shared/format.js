export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d} g ${h} sa`;
  if (h) return `${h} sa ${m} dk`;
  if (m) return `${m} dk ${sec} sn`;
  return `${sec} sn`;
}

export function normalizeUsername(raw) {
  return String(raw || '').trim().replace(/^@+/, '');
}

/**
 * Karşılaştırma anahtarı: ALI / ali / alı / ALİ hepsi aynı kişi sayılır.
 * (Türkçe yerelinde 'I' → 'ı' olduğu için düz toLocaleLowerCase yetmez.)
 */
export function usernameKey(name) {
  return String(name || '').toLocaleLowerCase('tr').replace(/ı/g, 'i');
}

export const USERNAME_RE = /^[\p{L}\p{N}._]{2,30}$/u;
