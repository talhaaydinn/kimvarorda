import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { CAT_COLOR, findItem } from '../../components/common.jsx';
import { murderAnswer } from '@shared/engine.js';
import { itemLoc, itemName } from '@shared/tr.js';

const SITE = import.meta.env.VITE_SITE_NAME || 'kimvarorda.ai';
const Q = { suspect: 'Kim?', location: 'Nerede?', weapon: 'Neyle?', motive: 'Neden?' };

function buildSlides(c, reveal) {
  const d = c.data;
  const slides = [];
  slides.push({ type: 'cover' });
  d.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).forEach((p) => slides.push({ type: 'text', text: p }));
  d.categories.forEach((cat) => slides.push({ type: 'cat', cat }));
  const normal = d.clues.filter((x) => !x.speaker);
  const statements = d.clues.filter((x) => x.speaker);
  normal.forEach((cl, i) => slides.push({ type: 'clue', clue: cl, n: i + 1, total: normal.length }));
  if (statements.length) {
    slides.push({ type: 'text', text: 'Şimdi ifadeler.\nMasumlar doğruyu söyler.\nYalnızca katil yalan söyler.' });
    statements.forEach((cl) => slides.push({ type: 'statement', clue: cl }));
  }
  slides.push({ type: 'all' });
  slides.push({ type: 'cta' });
  if (reveal) slides.push({ type: 'reveal' });
  return slides;
}

function duration(s) {
  const len = (s.text || s.clue?.text || '').length;
  switch (s.type) {
    case 'cover': return 3500;
    case 'cat': return 2500 + s.cat.items.length * 1800;
    case 'all': return 6000;
    case 'cta': return 5000;
    default: return 2500 + len * 55;
  }
}

export default function Presentation() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [i, setI] = useState(0);
  const [scale, setScale] = useState(0.3);
  const [auto, setAuto] = useState(false);
  const [reveal, setReveal] = useState(sp.get('cozum') === '1');
  const [hint, setHint] = useState(true);
  const timer = useRef();

  useEffect(() => {
    api.get(`/api/admin/cases/${id}`).then(setC, (e) => e.status === 401 && nav('/admin/giris'));
  }, [id, nav]);

  const slides = useMemo(() => (c ? buildSlides(c, reveal) : []), [c, reveal]);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1080, window.innerHeight / 1920));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const key = (e) => {
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) setI((x) => Math.min(x + 1, slides.length - 1));
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) setI((x) => Math.max(x - 1, 0));
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'p' || e.key === 'P') setAuto((a) => !a);
      else if (e.key === 'r' || e.key === 'R') setReveal((r) => !r);
      else if (e.key === 'h' || e.key === 'H') setHint((h) => !h);
      else if (e.key === 'Escape') nav(`/admin/vaka/${id}`);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [slides.length, id, nav]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (auto && slides[i] && i < slides.length - 1) {
      timer.current = setTimeout(() => setI((x) => x + 1), duration(slides[i]));
    }
    return () => clearTimeout(timer.current);
  }, [auto, i, slides]);

  if (!c) return <div className="pres show-cursor"><p style={{ color: '#888' }}>Yükleniyor…</p></div>;
  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <div className={`pres${hint ? ' show-cursor' : ''}`} onClick={() => setI((x) => Math.min(x + 1, slides.length - 1))}>
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        <Slide s={s} c={c} />
        <div className="s-foot">
          <span>{SITE}</span>
          <span>VAKA #{c.no}</span>
        </div>
      </div>
      {hint && (
        <div className="pres-hint">
          {i + 1}/{slides.length} · ← → gezin · P otomatik {auto ? '(açık)' : ''} · R çözüm slaytı {reveal ? '(açık)' : ''} · H gizle · Esc çık
        </div>
      )}
    </div>
  );
}

function Slide({ s, c }) {
  const d = c.data;
  switch (s.type) {
    case 'cover':
      return (
        <>
          <div className="s-kicker">Vaka #{c.no}</div>
          <div className="s-title">{d.title}</div>
          <div className="s-q">{d.categories.map((cat) => <span key={cat.key}>{Q[cat.key]}</span>)}</div>
        </>
      );
    case 'text':
      return <div className="s-text">{s.text}</div>;
    case 'cat':
      return (
        <div style={{ '--cat': CAT_COLOR[s.cat.key] }}>
          <div className="s-kicker" style={{ color: 'var(--cat)' }}>{s.cat.label}</div>
          <div className="s-items">
            {s.cat.items.map((it) => (
              <div className="s-item" key={it.id}>
                <div className="em">{it.emoji}</div>
                <div>
                  <div className="nm">{it.name}</div>
                  {it.desc && <div className="ds">{it.desc}</div>}
                  {it.traits?.length > 0 && <div className="tr">{it.traits.map((t) => <span key={t}>{t}</span>)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'clue':
      return (
        <>
          <div className="s-clue-n">İPUCU {s.n}/{s.total}</div>
          <div className="s-clue">{s.clue.text}</div>
        </>
      );
    case 'statement': {
      const sp = findItem(d.categories, s.clue.speaker);
      return (
        <>
          <div style={{ fontSize: 150, lineHeight: 1 }}>{sp?.emoji}</div>
          <div className="s-speaker">{sp?.name} diyor ki:</div>
          <div className="s-clue">“{s.clue.text}”</div>
        </>
      );
    }
    case 'all': {
      const normal = d.clues.filter((x) => !x.speaker);
      const st = d.clues.filter((x) => x.speaker);
      return (
        <>
          <div className="s-kicker">Tüm ipuçları · ekran görüntüsü al 📸</div>
          <div className="s-all">
            {normal.map((cl, i) => <div key={cl.id}><b>{i + 1}</b><span>{cl.text}</span></div>)}
            {st.map((cl) => {
              const sp = findItem(d.categories, cl.speaker);
              return <div key={cl.id}><b>{sp?.emoji}</b><span>{sp?.name}: “{cl.text}”</span></div>;
            })}
          </div>
        </>
      );
    }
    case 'cta':
      return (
        <>
          <div className="s-text">Çözdün mü?</div>
          <div className="s-cta-url">{SITE}</div>
          <div className="s-text" style={{ fontSize: 52 }}>
            Vaka #{c.no} sayfasına gir,{'\n'}cevabını yaz.{'\n'}İlk çözenler sıralamada!
          </div>
          <div className="s-text faint" style={{ fontSize: 40, marginTop: 40 }}>Link profilde 🔗</div>
        </>
      );
    case 'reveal': {
      const a = murderAnswer(d);
      const it = (k) => findItem(d.categories, a[k]);
      const sus = it('suspect');
      const loc = it('location');
      const wep = it('weapon');
      const mot = it('motive');
      return (
        <>
          <div className="s-kicker">Çözüm</div>
          <div style={{ fontSize: 170, lineHeight: 1, marginTop: 40 }}>{sus?.emoji}</div>
          <div className="s-title">{sus?.name}</div>
          <div className="s-text" style={{ marginTop: 40 }}>
            {loc?.emoji} {loc && itemLoc(loc)}{'\n'}
            {wep?.emoji} {wep && itemName(wep)} ile
            {mot && <>{'\n'}{mot.emoji} sebep: {itemName(mot)}</>}
          </div>
        </>
      );
    }
    default:
      return null;
  }
}
