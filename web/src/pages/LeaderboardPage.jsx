import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, store } from '../api.js';
import Leaderboard from '../components/Leaderboard.jsx';
import { ErrorBox, Loading } from '../components/common.jsx';

export default function LeaderboardPage() {
  const { no } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.get(`/api/cases/${no}`).then(setC, setError);
  }, [no]);

  if (error) return <div className="wrap" style={{ paddingTop: 40 }}><ErrorBox error={error} /></div>;
  if (!c) return <Loading />;

  return (
    <div className="wrap narrow">
      <header className="case-head">
        <div className="kicker">Vaka #{c.no} · Sıralama</div>
        <h1 style={{ marginTop: 10 }}>{c.title}</h1>
        <p className="muted small">Doğru cevaplar, vaka yayınlandıktan sonraki geliş sırasına göre.</p>
      </header>
      <div style={{ marginTop: 20 }}>
        <Leaderboard no={c.no} live={c.live} me={store.get('kvo-username', '')} />
      </div>
      <p style={{ marginTop: 20 }}>
        <Link to={`/vaka/${c.no}`} className="btn">← Vakaya dön</Link>
      </p>
    </div>
  );
}
