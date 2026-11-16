import { useState } from 'react';
import { api } from '../../api.js';
import { toLocalInput } from './useAdmin.js';

export default function StatusControls({ id, status, onChange, compact, beforeAction }) {
  const [when, setWhen] = useState(null);
  const [busy, setBusy] = useState(false);

  async function set(next, publishAt) {
    if (beforeAction && !(await beforeAction(next))) return;
    if (next === 'closed' && !confirm('Vaka kapatılsın mı? Cevap alımı durur ve çözüm herkese açıklanır.')) return;
    if (next === 'draft' && !confirm('Vaka taslağa alınsın mı? Sayfa herkesten gizlenir.')) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/cases/${id}/status`, { status: next, publishAt });
      setWhen(null);
      onChange?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (when !== null) {
    return (
      <span className="row-actions">
        <input className="input sm" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ width: 'auto' }} />
        <button className="btn sm primary" disabled={busy} onClick={() => set('open', new Date(when).getTime())}>Zamanla</button>
        <button className="btn sm ghost" onClick={() => setWhen(null)}>İptal</button>
      </span>
    );
  }

  return (
    <span className="row-actions">
      {status !== 'open' && (
        <>
          <button className="btn sm primary" disabled={busy} onClick={() => set('open', Date.now())}>
            {status === 'closed' ? 'Yeniden aç' : 'Şimdi yayınla'}
          </button>
          {status === 'draft' && (
            <button className="btn sm" disabled={busy} onClick={() => setWhen(toLocalInput(Date.now() + 3600_000))}>
              Zamanla…
            </button>
          )}
        </>
      )}
      {status === 'open' && (
        <button className="btn sm" disabled={busy} onClick={() => set('closed')}>Kapat + çözümü açıkla</button>
      )}
      {status !== 'draft' && !compact && (
        <button className="btn sm ghost" disabled={busy} onClick={() => set('draft')}>Taslağa al</button>
      )}
    </span>
  );
}
