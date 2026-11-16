import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { StatusChip, ErrorBox } from '../../components/common.jsx';
import { useAdminGuard, fmtDate } from './useAdmin.js';
import StatusControls from './StatusControls.jsx';

export default function AdminCases() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const guard = useAdminGuard();
  const nav = useNavigate();

  const load = useCallback(() => {
    api.get('/api/admin/cases').then(setCases, guard(setError));
  }, [guard]);
  useEffect(load, [load]);

  async function logout() {
    await api.post('/api/admin/logout');
    nav('/admin/giris');
  }

  return (
    <div className="wrap">
      <div className="admin-bar">
        <h1 style={{ fontSize: 34 }}>Vakalar</h1>
        <div className="row-actions">
          <Link to="/admin/vaka/yeni" className="btn primary">+ Yeni vaka</Link>
          <button className="btn ghost" onClick={logout}>Çıkış</button>
        </div>
      </div>
      <ErrorBox error={error} />
      {cases && cases.length === 0 && <div className="notice">Henüz vaka yok. “Yeni vaka” ile başla.</div>}
      {cases && cases.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Başlık</th>
                <th>Durum</th>
                <th>Yayın</th>
                <th>Cevap</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="mono">#{c.no}</td>
                  <td>
                    <Link to={`/admin/vaka/${c.id}`}>{c.title || '(başlıksız)'}</Link>
                  </td>
                  <td><StatusChip c={c} /></td>
                  <td className="small muted">{fmtDate(c.publishAt)}</td>
                  <td className="small">
                    <Link to={`/admin/vaka/${c.id}/cevaplar`}>{c.solved}/{c.attempts}</Link>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn sm" to={`/admin/vaka/${c.id}`}>Düzenle</Link>
                      <Link className="btn sm" to={`/admin/vaka/${c.id}/sunum`}>Sunum</Link>
                      {c.status !== 'draft' && <Link className="btn sm ghost" to={`/vaka/${c.no}`}>Sayfa</Link>}
                      <StatusControls id={c.id} status={c.status} onChange={load} compact />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
