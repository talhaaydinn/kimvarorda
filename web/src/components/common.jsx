import { useEffect, useState } from 'react';
import { formatDuration } from '@shared/format.js';

export const CAT_COLOR = {
  suspect: 'var(--c-suspect)',
  weapon: 'var(--c-weapon)',
  location: 'var(--c-location)',
  motive: 'var(--c-motive)',
};

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

export function StatusChip({ c }) {
  const now = useNow(5000);
  if (c.status === 'draft') return <span className="chip draft">Taslak</span>;
  if (c.status === 'closed') return <span className="chip closed">Kapandı</span>;
  if (c.publishAt && c.publishAt > now) return <span className="chip soon">Yakında</span>;
  return <span className="chip live">Canlı</span>;
}

export function Countdown({ to, onDone }) {
  const now = useNow(250);
  const left = Math.max(0, to - now);
  useEffect(() => {
    if (left === 0) onDone?.();
  }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = Math.ceil(left / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const d = Math.floor(s / 86400);
  return (
    <div className="countdown">
      {d > 0 && `${d}g `}
      {pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </div>
  );
}

export function Elapsed({ from }) {
  const now = useNow(1000);
  return <>{formatDuration(now - from)}</>;
}

export function Loading() {
  return <div className="wrap" style={{ padding: '60px 16px' }}><p className="muted">Dosyalar açılıyor…</p></div>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="notice error">{String(error.message || error)}</div>;
}

export function findItem(categories, id) {
  for (const c of categories) {
    const it = c.items.find((x) => x.id === id);
    if (it) return { ...it, cat: c.key };
  }
  return null;
}
