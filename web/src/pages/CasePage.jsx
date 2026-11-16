import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, store } from '../api.js';
import { CAT_COLOR, Countdown, Elapsed, ErrorBox, Loading, StatusChip, findItem } from '../components/common.jsx';
import LogicGrid, { solutionMarks } from '../components/LogicGrid.jsx';
import AnswerForm, { ResultCard, verdictText } from '../components/AnswerForm.jsx';
import Leaderboard from '../components/Leaderboard.jsx';

export default function CasePage() {
  const { no } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  const [me, setMe] = useState(null);
  const [lbKey, setLbKey] = useState(0);

  const load = useCallback(() => {
    setError(null);
    api.get(`/api/cases/${no}`).then(setC, setError);
    api.get(`/api/cases/${no}/me`).then(setMe, () => setMe({ submitted: false }));
  }, [no]);
  useEffect(load, [load]);

  useEffect(() => {
    if (c?.title) document.title = `Vaka #${c.no}: ${c.title} — kimvarorda.ai`;
    return () => (document.title = 'kimvarorda.ai — Kim? Nerede? Neyle?');
  }, [c]);

  if (error) return <div className="wrap" style={{ paddingTop: 40 }}><ErrorBox error={error} /></div>;
  if (!c) return <Loading />;

  if (c.scheduled) {
    return (
      <div className="wrap narrow center" style={{ paddingTop: 60 }}>
        <div className="kicker">Vaka #{c.no}</div>
        <h1 style={{ marginTop: 12 }}>{c.title}</h1>
        <p className="muted">Dosya henüz açılmadı. Video yayınlandığında saat işlemeye başlar.</p>
        <Countdown to={c.publishAt} onDone={load} />
      </div>
    );
  }

  const live = c.live;
  const closed = c.status === 'closed';

  return (
    <div className="wrap narrow">
      <header className="case-head">
        <div className="kicker">Vaka #{c.no}</div>
        <h1 style={{ marginTop: 10 }}>{c.title}</h1>
        <div className="meta">
          <StatusChip c={c} />
          {live && <span className="chip">⏱ <Elapsed from={c.publishAt} /></span>}
        </div>
      </header>

      <nav className="case-nav" aria-label="Vaka bölümleri">
        <a href="#hikaye">Hikâye</a>
        <a href="#dosya">Dosya</a>
        <a href="#ipuclari">İpuçları</a>
        <a href="#tablo">Tablo</a>
        {closed ? <a href="#cozum">Çözüm</a> : <a href="#cevap">Cevap</a>}
        <a href="#siralama">Sıralama</a>
      </nav>

      <section id="hikaye" className="block">
        <p className="story">{c.story}</p>
      </section>

      <section id="dosya" className="block">
        <h2>Dosya</h2>
        {c.categories.map((cat) => (
          <div key={cat.key} style={{ '--cat': CAT_COLOR[cat.key] }}>
            <div className="cat-title">{cat.label}</div>
            <div className="cards">
              {cat.items.map((it) => (
                <article key={it.id} className="item-card">
                  <div className="em" aria-hidden="true">{it.emoji}</div>
                  <div className="nm">{it.name}</div>
                  {it.desc && <div className="ds">{it.desc}</div>}
                  {it.traits?.length > 0 && (
                    <div className="tr">{it.traits.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Clues c={c} />

      <GridSection c={c} closed={closed} />

      {closed ? (
        <section id="cozum" className="block">
          <h2>Çözüm</h2>
          <div className="solution-box">
            <p className="verdict" style={{ margin: 0 }}>{verdictText(c.categories, c.answer)}</p>
          </div>
          {me?.submitted && <div style={{ marginTop: 14 }}><ResultCard result={me} categories={c.categories} no={c.no} /></div>}
        </section>
      ) : (
        <section id="cevap" className="block">
          <h2>Suçlama</h2>
          {me === null ? (
            <p className="muted">Yükleniyor…</p>
          ) : me.submitted ? (
            <ResultCard result={me} categories={c.categories} no={c.no} />
          ) : live ? (
            <AnswerForm c={c} onResult={(r) => { setMe(r); setLbKey((k) => k + 1); }} />
          ) : (
            <div className="notice">Bu vaka şu an cevaba açık değil.</div>
          )}
        </section>
      )}

      <section id="siralama" className="block">
        <h2>
          Sıralama <small>ilk doğru cevap önde</small>
        </h2>
        <Leaderboard no={c.no} live={live} me={me?.username} limit={20} refreshKey={lbKey} />
        <p style={{ marginTop: 12 }}>
          <Link to={`/vaka/${c.no}/siralama`} className="small muted">Tam sıralama →</Link>
        </p>
      </section>
    </div>
  );
}

function Clues({ c }) {
  const key = `kvo-clues-${c.no}`;
  const [done, setDone] = useState(() => new Set(store.get(key, [])));
  const toggle = (id) => {
    const n = new Set(done);
    n.has(id) ? n.delete(id) : n.add(id);
    setDone(n);
    store.set(key, [...n]);
  };
  const normal = c.clues.filter((x) => !x.speaker);
  const statements = c.clues.filter((x) => x.speaker);

  return (
    <section id="ipuclari" className="block">
      <h2>
        İpuçları <small>kullandığına dokun, üstü çizilsin</small>
      </h2>
      <ol className="clues">
        {normal.map((cl, i) => (
          <li key={cl.id} className={`clue${done.has(cl.id) ? ' done' : ''}`} onClick={() => toggle(cl.id)}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <span className="tx">{cl.text}</span>
          </li>
        ))}
      </ol>
      {statements.length > 0 && (
        <>
          <p className="statements-note">🗣 İfadeler — masumlar doğruyu söyler, yalnızca katil yalan söyler.</p>
          <ol className="clues">
            {statements.map((cl) => {
              const sp = findItem(c.categories, cl.speaker);
              return (
                <li key={cl.id} className={`clue${done.has(cl.id) ? ' done' : ''}`} onClick={() => toggle(cl.id)}>
                  <span className="n">{sp?.emoji}</span>
                  <span className="tx">
                    <span className="sp">{sp?.name}:</span>“{cl.text}”
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

function GridSection({ c, closed }) {
  const key = `kvo-grid-${c.no}`;
  const [marks, setMarks] = useState(() => store.get(key, {}));
  const [autoX, setAutoX] = useState(() => store.get('kvo-autox', true));
  const [showSolution, setShowSolution] = useState(false);
  const solMarks = useMemo(() => (closed && c.solution ? solutionMarks(c.categories, c.solution) : null), [c, closed]);

  const update = (m) => {
    setMarks(m);
    store.set(key, m);
  };

  return (
    <section id="tablo" className="block">
      <h2>
        Tablo <small>dokun: ✕ → ✓ → boş</small>
      </h2>
      <div className="grid-tools">
        <label className="check">
          <input
            type="checkbox"
            checked={autoX}
            onChange={(e) => {
              setAutoX(e.target.checked);
              store.set('kvo-autox', e.target.checked);
            }}
          />
          ✓ koyunca satır/sütunu otomatik ✕’le
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {solMarks && (
            <button className="btn sm" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? 'Benim tablom' : 'Çözümü göster'}
            </button>
          )}
          <button
            className="btn sm ghost"
            onClick={() => confirm('Tablodaki tüm işaretler silinsin mi?') && update({})}
          >
            Temizle
          </button>
        </div>
      </div>
      <LogicGrid
        categories={c.categories}
        marks={showSolution ? solMarks : marks}
        onChange={update}
        autoX={autoX}
        readonly={showSolution}
      />
    </section>
  );
}
