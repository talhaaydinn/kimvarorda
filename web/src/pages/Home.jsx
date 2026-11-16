import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { StatusChip, Elapsed, ErrorBox, useNow } from '../components/common.jsx';

export default function Home() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const now = useNow(10000);

  useEffect(() => {
    api.get('/api/cases').then(setCases, setError);
  }, []);

  const live = cases?.filter((c) => c.status === 'open' && c.publishAt <= now) ?? [];
  const soon = cases?.filter((c) => c.status === 'open' && c.publishAt > now) ?? [];
  const closed = cases?.filter((c) => c.status === 'closed') ?? [];

  return (
    <div className="wrap">
      <section className="hero">
        <div className="kicker">Dedektiflik bulmacası</div>
        <h1 style={{ marginTop: 12 }}>
          Kim? Nerede? <em>Neyle?</em>
        </h1>
        <p className="lead">
          Videoyu izle, şüphelileri tanı, ipuçlarını tabloya işle. Katili ilk bulanlar sıralamaya girer.
        </p>
      </section>

      <ErrorBox error={error} />
      {!cases && !error && <p className="muted">Vakalar yükleniyor…</p>}

      {live.map((c) => (
        <Link key={c.no} to={`/vaka/${c.no}`} className="live-case">
          <div className="row">
            <StatusChip c={c} />
            <span className="no">VAKA #{c.no}</span>
          </div>
          <h2>{c.title}</h2>
          <div className="row small muted">
            <span>⏱ <Elapsed from={c.publishAt} /> önce açıldı</span>
            <span>· {c.solved} kişi çözdü</span>
          </div>
          {c.emojis?.length > 0 && <div className="emojis" aria-hidden="true">{c.emojis.join(' ')}</div>}
          <div className="go">
            <span className="btn primary">Davayı çöz →</span>
          </div>
        </Link>
      ))}

      {soon.length > 0 && (
        <section className="section">
          <h2>Yakında</h2>
          <div className="case-list">
            {soon.map((c) => <CaseRow key={c.no} c={c} />)}
          </div>
        </section>
      )}

      {cases && live.length === 0 && soon.length === 0 && (
        <div className="notice" style={{ marginTop: 20 }}>
          Şu an açık bir vaka yok. Yeni vaka için Instagram’ı takipte kal.
        </div>
      )}

      <section className="section">
        <h2>Nasıl oynanır?</h2>
        <div className="steps">
          <div className="step"><b>1</b>Instagram’daki videoyu izle: hikâye, şüpheliler, silahlar, yerler ve ipuçları.</div>
          <div className="step"><b>2</b>Buradaki tabloya ✓ ve ✕ koyarak olasılıkları ele.</div>
          <div className="step"><b>3</b>Kullanıcı adınla cevabını gönder. Tek hakkın var.</div>
          <div className="step"><b>4</b>Doğru cevaplar geliş sırasına göre sıralanır. Önce gelen önde.</div>
        </div>
        <p style={{ marginTop: 14 }}>
          <Link to="/nasil-oynanir" className="small muted">Ayrıntılı kurallar →</Link>
        </p>
      </section>

      {closed.length > 0 && (
        <section className="section">
          <h2>Kapanmış vakalar</h2>
          <div className="case-list">
            {closed.map((c) => <CaseRow key={c.no} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function CaseRow({ c }) {
  return (
    <Link to={`/vaka/${c.no}`} className="case-row">
      <span className="no">#{c.no}</span>
      <span className="t">{c.title}</span>
      <span className="meta">{c.solved} çözüm</span>
      <StatusChip c={c} />
    </Link>
  );
}
