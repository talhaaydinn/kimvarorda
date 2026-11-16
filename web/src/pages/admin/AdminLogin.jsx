import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminLogin() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(null);
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/api/admin/login', { password: pw });
      nav('/admin');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="wrap narrow" style={{ paddingTop: 60, maxWidth: 420 }}>
      <div className="kicker">Yönetim</div>
      <h1 style={{ marginTop: 10, fontSize: 36 }}>Giriş</h1>
      <form onSubmit={submit} className="card" style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <label className="field">
          <span>Şifre</span>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        {error && <div className="notice error">{error}</div>}
        <button className="btn primary">Giriş yap</button>
      </form>
    </div>
  );
}
