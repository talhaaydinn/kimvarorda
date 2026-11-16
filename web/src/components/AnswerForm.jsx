import { useState } from 'react';
import { api, store } from '../api.js';
import { normalizeUsername, USERNAME_RE, formatDuration } from '@shared/format.js';
import { findItem } from './common.jsx';
import { itemLoc, itemName } from '@shared/tr.js';
import { Link } from 'react-router-dom';

const QUESTION = { suspect: 'Kim?', weapon: 'Neyle?', location: 'Nerede?', motive: 'Neden?' };

export function verdictText(categories, answer) {
  const it = (k) => findItem(categories, answer[k]);
  const s = it('suspect');
  const l = it('location');
  const w = it('weapon');
  const m = it('motive');
  return (
    <>
      Katil <b>{s?.emoji} {s?.name}</b>. Cinayeti <b>{l?.emoji} {l && itemLoc(l)}</b>, <b>{w?.emoji} {w && itemName(w)}</b> ile işledi
      {m && <> — sebebi: <b>{m.emoji} {itemName(m)}</b></>}.
    </>
  );
}

export function ResultCard({ result, categories, no }) {
  return (
    <div className={`result ${result.correct ? 'ok' : 'bad'}`}>
      <div className="kicker">@{result.username}</div>
      {result.correct ? (
        <>
          <div className="big" style={{ marginTop: 12 }}>#{result.rank}</div>
          <h2 style={{ marginTop: 10 }}>Doğru! Davayı çözdün.</h2>
          <p className="muted">
            {result.rank}. sıradasın — vaka yayınlandıktan {formatDuration(result.ms)} sonra.
          </p>
        </>
      ) : (
        <>
          <div className="big" style={{ marginTop: 12 }}>✕</div>
          <h2 style={{ marginTop: 10 }}>Bu sefer olmadı.</h2>
          <p className="muted">Cevabın yanlıştı. Çözüm, vaka kapandığında açıklanacak.</p>
        </>
      )}
      {result.answer && categories && (
        <p className="small faint" style={{ marginTop: 14 }}>Cevabın: {verdictText(categories, result.answer)}</p>
      )}
      <div style={{ marginTop: 16 }}>
        <Link className="btn ghost sm" to={`/vaka/${no}/siralama`}>Tüm sıralama →</Link>
      </div>
    </div>
  );
}

export default function AnswerForm({ c, onResult }) {
  const [username, setUsername] = useState(() => store.get('kvo-username', ''));
  const [answer, setAnswer] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const cats = c.categories;
  const complete = cats.every((cat) => answer[cat.key]);
  const nameOk = USERNAME_RE.test(normalizeUsername(username));

  function next(e) {
    e.preventDefault();
    setError(null);
    if (!nameOk) return setError('Kullanıcı adı 2–30 karakter olmalı (harf, rakam, . ve _).');
    if (!complete) return setError('Her soruya bir cevap seç.');
    setConfirming(true);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const u = normalizeUsername(username);
    try {
      const r = await api.post(`/api/cases/${c.no}/submit`, { username: u, answer });
      store.set('kvo-username', u);
      onResult(r);
    } catch (e) {
      if (e.data?.result) onResult(e.data.result);
      else setError(e.message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={next} className="card" style={{ display: 'grid', gap: 14 }}>
      <label className="field">
        <span>Kullanıcı adın (Instagram adını yazarsan kazananlar hikâyede etiketlenebilir)</span>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@dedektif"
          autoComplete="nickname"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={31}
          disabled={confirming}
        />
      </label>
      <div className="answer-grid cols" style={{ '--n': cats.length }}>
        {cats.map((cat) => (
          <label className="field" key={cat.key}>
            <span>{QUESTION[cat.key]}</span>
            <select
              className="select"
              value={answer[cat.key] || ''}
              onChange={(e) => setAnswer({ ...answer, [cat.key]: e.target.value })}
              disabled={confirming}
            >
              <option value="">Seç…</option>
              {cat.items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.emoji} {it.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {error && <div className="notice error">{error}</div>}

      {confirming ? (
        <div className="confirm">
          <p className="verdict" style={{ margin: 0 }}>{verdictText(cats, answer)}</p>
          <p className="small muted" style={{ margin: '10px 0 14px' }}>
            Tek hakkın var. Gönderdikten sonra değiştiremezsin.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn primary" onClick={submit} disabled={busy}>
              {busy ? 'Gönderiliyor…' : 'Eminim, gönder'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <button className="btn primary block" type="submit">
          Suçlamayı yap
        </button>
      )}
    </form>
  );
}
