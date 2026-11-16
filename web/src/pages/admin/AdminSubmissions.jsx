import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { ErrorBox, findItem } from '../../components/common.jsx';
import { formatDuration } from '@shared/format.js';
import { useAdminGuard, fmtDate } from './useAdmin.js';

export default function AdminSubmissions() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [subs, setSubs] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const guard = useAdminGuard();

  const load = useCallback(() => {
    api.get(`/api/admin/cases/${id}`).then(setC, guard(setError));
    api.get(`/api/admin/cases/${id}/submissions`).then((d) => setSubs(d.list), guard(setError));
  }, [id, guard]);
  useEffect(load, [load]);

  async function remove(s) {
    if (!confirm(`@${s.username} cevabı silinsin mi? (Uygunsuz kullanıcı adları için)`)) return;
    await api.del(`/api/admin/submissions/${s.id}`);
    load();
  }

  function exportCsv() {
    const rows = [['sira', 'kullanici', 'dogru', 'sure_sn', 'zaman', ...c.data.categories.map((x) => x.key)]];
    let rank = 0;
    subs.forEach((s) => {
      if (s.correct) rank++;
      rows.push([
        s.correct ? rank : '',
        s.username,
        s.correct ? 1 : 0,
        s.ms != null ? Math.round(s.ms / 1000) : '',
        new Date(s.createdAt).toISOString(),
        ...c.data.categories.map((x) => findItem(c.data.categories, s.answer[x.key])?.name ?? ''),
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = `vaka-${c.no}-cevaplar.csv`;
    a.click();
  }

  if (error) return <div className="wrap" style={{ paddingTop: 30 }}><ErrorBox error={error} /></div>;
  if (!c || !subs) return <div className="wrap" style={{ paddingTop: 30 }}><p className="muted">Yükleniyor…</p></div>;

  let rank = 0;
  const rows = subs.map((s) => ({ ...s, rank: s.correct ? ++rank : null }));
  const shown = rows.filter((s) => filter === 'all' || (filter === 'ok' ? s.correct : !s.correct));

  return (
    <div className="wrap">
      <div className="admin-bar">
        <div>
          <div className="kicker">Vaka #{c.no}</div>
          <h1 style={{ fontSize: 30, marginTop: 6 }}>Cevaplar</h1>
        </div>
        <div className="row-actions">
          <select className="select sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">Hepsi ({subs.length})</option>
            <option value="ok">Doğru ({rank})</option>
            <option value="bad">Yanlış ({subs.length - rank})</option>
          </select>
          <button className="btn sm" onClick={exportCsv} disabled={!subs.length}>CSV indir</button>
          <button className="btn sm" onClick={load}>Yenile</button>
          <Link className="btn sm ghost" to={`/admin/vaka/${id}`}>← Vaka</Link>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Kullanıcı</th>
              <th>Cevap</th>
              <th>Süre</th>
              <th>Zaman</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.correct ? `#${s.rank}` : <span style={{ color: 'var(--bad)' }}>✕</span>}</td>
                <td>@{s.username}</td>
                <td className="small">
                  {c.data.categories.map((x) => findItem(c.data.categories, s.answer[x.key])?.emoji).join(' ')}{' '}
                  <span className="muted">
                    {c.data.categories.map((x) => findItem(c.data.categories, s.answer[x.key])?.name).join(' · ')}
                  </span>
                </td>
                <td className="mono small">{formatDuration(s.ms)}</td>
                <td className="small muted">{fmtDate(s.createdAt)}</td>
                <td><button className="btn sm ghost danger" onClick={() => remove(s)}>Sil</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
