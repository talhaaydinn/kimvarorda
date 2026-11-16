import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDuration, usernameKey } from '@shared/format.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ no, live, me, limit, refreshKey }) {
  const [lb, setLb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stop = false;
    const load = () =>
      api.get(`/api/cases/${no}/leaderboard`).then(
        (d) => !stop && (setLb(d), setError(null)),
        (e) => !stop && setError(e),
      );
    load();
    if (!live) return () => (stop = true);
    const t = setInterval(load, 10000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [no, live, refreshKey]);

  if (error) return <div className="notice error">{error.message}</div>;
  if (!lb) return <p className="muted">Yükleniyor…</p>;

  const list = limit ? lb.list.slice(0, limit) : lb.list;
  const meKey = me && usernameKey(me);

  return (
    <div>
      <div className="lb-stats">
        <span className="chip">✓ {lb.correct} doğru</span>
        <span className="chip">✕ {lb.wrong} yanlış</span>
        <span className="chip">{lb.total} cevap</span>
        {live && <span className="chip live">canlı</span>}
      </div>
      {list.length === 0 ? (
        <div className="notice">Henüz doğru cevap yok. İlk sen ol!</div>
      ) : (
        <ol className="lb">
          {list.map((r) => (
            <li key={r.rank} className={meKey && usernameKey(r.username) === meKey ? 'me' : ''}>
              <span className={`rk${r.rank <= 3 ? ' medal' : ''}`}>{MEDALS[r.rank - 1] || `#${r.rank}`}</span>
              <span className="un">@{r.username}</span>
              <span className="tm" title="Vaka yayınlandıktan sonra geçen süre">{formatDuration(r.ms)}</span>
            </li>
          ))}
        </ol>
      )}
      {limit && lb.list.length > limit && (
        <p className="small muted" style={{ marginTop: 10 }}>+{lb.list.length - limit} kişi daha</p>
      )}
    </div>
  );
}
