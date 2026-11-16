import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { CAT_COLOR, ErrorBox, StatusChip } from '../../components/common.jsx';
import {
  blankCase, makeItems, randomSolution, generateClues, checkCase, CAT_META, LIMITS,
} from '@shared/engine.js';
import { renderRule, ruleSummary, itemGen, itemLoc, itemIzler } from '@shared/tr.js';
import { useAdminGuard } from './useAdmin.js';
import StatusControls from './StatusControls.jsx';

const uid = () => 'c' + Math.random().toString(36).slice(2, 9);

export default function AdminEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const guard = useAdminGuard();
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(() => (isNew ? blankCase(4, false) : null));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (isNew) return;
    api.get(`/api/admin/cases/${id}`).then((r) => {
      setMeta(r);
      setData(r.data);
      setDirty(false);
    }, guard(setError));
  }, [id, isNew, guard]);
  useEffect(load, [load]);

  useEffect(() => {
    const h = (e) => dirty && (e.preventDefault(), (e.returnValue = ''));
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const update = (fn) => {
    setData((d) => {
      const n = structuredClone(d);
      fn(n);
      return n;
    });
    setDirty(true);
    setMsg(null);
  };

  const deferred = useDeferredValue(data);
  const check = useMemo(() => {
    if (!deferred) return null;
    try {
      return checkCase(deferred);
    } catch (e) {
      return { error: e.message };
    }
  }, [deferred]);

  if (error) return <div className="wrap" style={{ paddingTop: 30 }}><ErrorBox error={error} /></div>;
  if (!data) return <div className="wrap" style={{ paddingTop: 30 }}><p className="muted">Yükleniyor…</p></div>;

  const N = data.categories[0].items.length;
  const hasMotive = data.categories.some((c) => c.key === 'motive');

  function setSize(n) {
    if (hasMotive && n > LIMITS.maxNWithMotive) return alert(`Sebep kategorisiyle en fazla ${LIMITS.maxNWithMotive} öğe olabilir.`);
    update((d) => {
      d.categories.forEach((c) => (c.items = makeItems(c.key, n, c.items)));
      cleanSolution(d);
    });
  }
  function setMotive(on) {
    if (on && N > LIMITS.maxNWithMotive) return alert(`Sebep eklemek için öğe sayısı en fazla ${LIMITS.maxNWithMotive} olmalı.`);
    update((d) => {
      if (on) d.categories.push({ key: 'motive', label: CAT_META.motive.label, items: makeItems('motive', N) });
      else d.categories = d.categories.filter((c) => c.key !== 'motive');
      cleanSolution(d);
    });
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      if (isNew) {
        const r = await api.post('/api/admin/cases', { data });
        setDirty(false);
        nav(`/admin/vaka/${r.id}`, { replace: true });
      } else {
        const r = await api.put(`/api/admin/cases/${id}`, { data });
        setMeta(r);
        setDirty(false);
        setMsg('Kaydedildi ✓');
      }
    } catch (e) {
      guard((x) => setMsg(x.message))(e);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Bu vaka ve tüm cevapları KALICI olarak silinsin mi?')) return;
    await api.del(`/api/admin/cases/${id}`);
    nav('/admin');
  }

  function exportJson() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ no: meta?.no, ...data }, null, 2)], { type: 'application/json' }));
    a.download = `vaka-${meta?.no ?? 'yeni'}.json`;
    a.click();
  }

  async function beforeStatus(next) {
    if (dirty) {
      alert('Önce değişiklikleri kaydet.');
      return false;
    }
    if (next === 'open' && check && !check.unique) {
      return confirm('Uyarı: ipuçları tek bir çözüme götürmüyor. Yine de yayınlansın mı?');
    }
    return true;
  }

  return (
    <div className="wrap">
      <div className="admin-bar">
        <div>
          <div className="kicker">{isNew ? 'Yeni vaka' : `Vaka #${meta?.no}`}</div>
          <h1 style={{ fontSize: 30, marginTop: 6 }}>{data.title || 'Başlıksız vaka'}</h1>
        </div>
        {!isNew && meta && (
          <div className="row-actions">
            <StatusChip c={meta} />
            <StatusControls id={id} status={meta.status} onChange={load} beforeAction={beforeStatus} />
            <Link className="btn sm" to={`/admin/vaka/${id}/sunum`}>Video sunumu</Link>
            <Link className="btn sm" to={`/admin/vaka/${id}/cevaplar`}>Cevaplar</Link>
            {meta.status !== 'draft' && <Link className="btn sm ghost" to={`/vaka/${meta.no}`}>Sayfa ↗</Link>}
          </div>
        )}
      </div>

      {/* ---- Genel ---- */}
      <section className="ed-section card">
        <h3>Hikâye</h3>
        <div className="ed-grid">
          <label className="field">
            <span>Başlık</span>
            <input className="input" value={data.title} onChange={(e) => update((d) => (d.title = e.target.value))} placeholder="Fırtınalı Gecede Köşk" />
          </label>
          <label className="field">
            <span>Hikâye (videoda anlatılan giriş; boş satırla paragraflara böl)</span>
            <textarea className="textarea" rows={6} value={data.story} onChange={(e) => update((d) => (d.story = e.target.value))} />
          </label>
          <div className="row-actions" style={{ alignItems: 'center' }}>
            <label className="field" style={{ width: 160 }}>
              <span>Öğe sayısı</span>
              <select className="select sm" value={N} onChange={(e) => setSize(Number(e.target.value))}>
                {[3, 4, 5].map((n) => <option key={n} value={n}>{n} × {n}</option>)}
              </select>
            </label>
            <label className="check" style={{ marginTop: 18 }}>
              <input type="checkbox" checked={hasMotive} onChange={(e) => setMotive(e.target.checked)} />
              Sebep (motif) kategorisi
            </label>
          </div>
        </div>
      </section>

      {/* ---- Kategoriler ---- */}
      {data.categories.map((cat, ci) => (
        <section className="ed-section card" key={cat.key} style={{ '--cat': CAT_COLOR[cat.key] }}>
          <h3>
            <span style={{ color: 'var(--cat)' }}>●</span>
            <input
              className="input sm"
              style={{ width: 200 }}
              value={cat.label}
              onChange={(e) => update((d) => (d.categories[ci].label = e.target.value))}
            />
            <span className="small muted" style={{ fontFamily: 'var(--sans)', fontWeight: 400 }}>
              Özellikler virgülle: {cat.key === 'suspect' ? 'uzun boylu, solak, yeşil gözlü' : cat.key === 'weapon' ? 'ağır, metal' : cat.key === 'location' ? 'kapalı, karanlık' : 'maddi'}
            </span>
          </h3>
          <div className="ed-grid two">
            {cat.items.map((it, ii) => (
              <ItemEditor
                key={it.id}
                item={it}
                catKey={cat.key}
                onChange={(patch) => update((d) => Object.assign(d.categories[ci].items[ii], patch))}
              />
            ))}
          </div>
        </section>
      ))}

      {/* ---- Çözüm ---- */}
      <section className="ed-section card">
        <h3>
          Gerçek çözüm
          <button className="btn sm" onClick={() => update((d) => Object.assign(d, randomSolution(d)))}>🎲 Rastgele dağıt</button>
        </h3>
        <div className="table-wrap">
          <table className="table sol-table">
            <thead>
              <tr>
                <th>Şüpheli</th>
                {data.categories.slice(1).map((c) => <th key={c.key}>{c.label}</th>)}
                <th>Katil</th>
              </tr>
            </thead>
            <tbody>
              {data.categories[0].items.map((s) => (
                <tr key={s.id}>
                  <td>{s.emoji} {s.name || s.id}</td>
                  {data.categories.slice(1).map((c) => (
                    <td key={c.key}>
                      <select
                        className="select sm"
                        value={data.solution?.[s.id]?.[c.key] || ''}
                        onChange={(e) => update((d) => {
                          d.solution ??= {};
                          d.solution[s.id] ??= {};
                          d.solution[s.id][c.key] = e.target.value || undefined;
                        })}
                      >
                        <option value="">—</option>
                        {c.items.map((it) => <option key={it.id} value={it.id}>{it.emoji} {it.name || it.id}</option>)}
                      </select>
                    </td>
                  ))}
                  <td>
                    <input
                      type="radio"
                      name="killer"
                      checked={data.killer === s.id}
                      onChange={() => update((d) => (d.killer = s.id))}
                      style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {check && !check.solutionValid && (
          <div className="notice warn" style={{ marginTop: 10 }}>
            Her şüpheliye her kategoriden <b>farklı</b> bir öğe ata ve bir katil seç.
          </div>
        )}
      </section>

      {/* ---- İpuçları ---- */}
      <CluesEditor data={data} update={update} check={check} />

      {/* ---- Doğrulama ---- */}
      <section className="ed-section card">
        <h3>Doğrulama</h3>
        <CheckPanel check={check} />
      </section>

      <div className="sticky-save">
        {msg && <span className="notice" style={{ padding: '8px 12px' }}>{msg}</span>}
        {!isNew && <button className="btn ghost danger" onClick={remove}>Vakayı sil</button>}
        <button className="btn" onClick={exportJson}>JSON indir</button>
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Kaydediliyor…' : dirty || isNew ? 'Kaydet •' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}

function cleanSolution(d) {
  const ids = new Set(d.categories.flatMap((c) => c.items.map((i) => i.id)));
  const sus = new Set(d.categories[0].items.map((i) => i.id));
  const sol = {};
  for (const [sid, row] of Object.entries(d.solution || {})) {
    if (!sus.has(sid)) continue;
    sol[sid] = {};
    for (const c of d.categories.slice(1)) if (ids.has(row[c.key])) sol[sid][c.key] = row[c.key];
  }
  d.solution = sol;
  if (!sus.has(d.killer)) d.killer = null;
}

// İzlerin dil bilgisi kalıbı kategoriye göre değişir (bkz. shared/tr.js → dolaylı anlatım)
const IZ_HINT = {
  suspect: { ph: 'izler (; ile): saatine sürekli bakan; elleri toprak kokan', show: (z) => `«${z} biri»` },
  location: { ph: 'izler (; ile): titrek bir ampulün altında; şarap fıçılarının arasında', show: (z) => `«${z}»` },
  weapon: { ph: 'izler (; ile): gümüş saplı bir şey; ucu sivri bir şey', show: (z) => `«${z}»` },
};

function ItemEditor({ item, catKey, onChange }) {
  return (
    <div className="item-edit">
      <div className="top">
        <input className="input sm" value={item.emoji} onChange={(e) => onChange({ emoji: e.target.value })} placeholder="🙂" aria-label="Emoji" style={{ textAlign: 'center', fontSize: 20 }} />
        <input className="input sm" value={item.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={catKey === 'suspect' ? 'Avukat Selim' : 'Ad'} aria-label="Ad" />
      </div>
      <input className="input sm" value={item.desc} onChange={(e) => onChange({ desc: e.target.value })} placeholder="Kısa açıklama" aria-label="Açıklama" />
      <input
        key={item.id + (item.traits || []).join(',')}
        className="input sm"
        defaultValue={(item.traits || []).join(', ')}
        onBlur={(e) => onChange({ traits: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        placeholder="özellikler, virgülle"
        aria-label="Özellikler"
      />
      <input
        key={item.id + '|iz|' + (item.izler || []).join(';')}
        className="input sm"
        defaultValue={(item.izler || []).join('; ')}
        onBlur={(e) => onChange({ izler: e.target.value.split(';').map((s) => s.trim()).filter(Boolean) })}
        placeholder={IZ_HINT[catKey]?.ph}
        aria-label="İzler (dolaylı anlatım)"
        title="Dolaylı anlatımda adın yerine bu ifadeler kullanılır. Noktalı virgülle ayır."
      />
      {itemIzler(item).length > 0 && IZ_HINT[catKey] && (
        <span className="small faint">
          İpucunda: {itemIzler(item).map((z) => IZ_HINT[catKey].show(z)).join(' · ')}
        </span>
      )}
      <details>
        <summary>Dil bilgisi: {item.name ? `${itemGen(item)} · ${itemLoc(item)}` : '—'}</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <label className="check">
            <input type="checkbox" checked={!!item.proper} onChange={(e) => onChange({ proper: e.target.checked })} />
            Özel isim (kesme işaretiyle: Selim’in)
          </label>
          <div className="forms">
            <input className="input sm" value={item.forms?.gen || ''} onChange={(e) => onChange({ forms: { ...item.forms, gen: e.target.value } })} placeholder={`-in hâli: ${item.name ? itemGen({ ...item, forms: {} }) : ''}`} />
            <input className="input sm" value={item.forms?.loc || ''} onChange={(e) => onChange({ forms: { ...item.forms, loc: e.target.value } })} placeholder={`-de hâli: ${item.name ? itemLoc({ ...item, forms: {} }) : ''}`} />
          </div>
          <span className="small faint">Otomatik ek yanlışsa (ör. “Galata Kulesi” → “Galata Kulesi’nde”) buraya doğrusunu yaz.</span>
        </div>
      </details>
    </div>
  );
}

function CluesEditor({ data, update, check }) {
  const [difficulty, setDifficulty] = useState(data.settings?.difficulty || 'orta');
  const [liar, setLiar] = useState(!!data.settings?.liar);
  const [err, setErr] = useState(null);
  const style = data.settings?.style || 'duz';
  const suspects = data.categories[0].items;
  const falseSet = new Set(check?.falseClues || []);
  // dolaylı anlatımda adıyla anılmak zorunda kalacak öğeler (izi ve kendine özgü özelliği yok)
  const named = style === 'dolayli'
    ? data.categories.filter((c) => c.key !== 'motive').flatMap((c) => c.items.filter((it) =>
        !itemIzler(it).length && !(it.traits || []).some((t) => c.items.filter((o) => (o.traits || []).includes(t)).length === 1)))
    : [];

  function generate() {
    setErr(null);
    try {
      const keepManual = data.clues.some((c) => !c.auto) && confirm('Elle eklediğin ipuçları korunsun mu? (İptal = hepsini sil)');
      const clues = generateClues(data, { difficulty, liar, keepManual, style });
      update((d) => {
        d.clues = clues;
        d.settings = { ...d.settings, difficulty, liar, style };
      });
    } catch (e) {
      setErr(e.message);
    }
  }

  const move = (i, dir) => update((d) => {
    const j = i + dir;
    if (j < 0 || j >= d.clues.length) return;
    [d.clues[i], d.clues[j]] = [d.clues[j], d.clues[i]];
  });

  return (
    <section className="ed-section card">
      <h3>İpuçları</h3>
      <div className="row-actions" style={{ alignItems: 'center', marginBottom: 12 }}>
        <select className="select sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: 'auto' }}>
          <option value="kolay">Kolay</option>
          <option value="orta">Orta</option>
          <option value="zor">Zor</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={liar} onChange={(e) => setLiar(e.target.checked)} />
          İfadeler (katil yalan söyler)
        </label>
        <select
          className="select sm"
          value={style}
          onChange={(e) => update((d) => (d.settings = { ...d.settings, style: e.target.value }))}
          style={{ width: 'auto' }}
          title="Dolaylı: isimler yerine izler ve özellikler kullanılır"
        >
          <option value="dolayli">Anlatım: dolaylı (sahne)</option>
          <option value="duz">Anlatım: düz (isimlerle)</option>
        </select>
        <button className="btn sm primary" onClick={generate}>⚙︎ Otomatik ipucu üret</button>
      </div>
      {named.length > 0 && (
        <div className="notice warn small" style={{ marginBottom: 10 }}>
          Dolaylı anlatımda şunlar yine adıyla geçecek, çünkü izleri ya da kendine özgü bir özelliği yok:{' '}
          {named.map((it) => it.name || it.id).join(', ')}
        </div>
      )}
      <p className="small muted" style={{ marginTop: 0 }}>
        Üretici, gerçek çözümü tek başına kanıtlayan en az sayıda ipucunu seçer. Metinleri istediğin gibi düzenleyebilirsin;
        mantık değişmez. Tekrar bastıkça farklı bir set gelir. Dolaylı anlatımda isimler yerine öğelerin <b>izleri</b> kullanılır;
        izler, oyuncunun Dosya'daki açıklamalardan çıkarabileceği şeyler olmalı.
      </p>
      {err && <div className="notice error" style={{ marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'grid', gap: 8 }}>
        {data.clues.map((cl, i) => (
          <div key={cl.id} className={`clue-edit${falseSet.has(cl.id) ? ' bad' : ''}`}>
            <div className="bar">
              <span className="rule-tag">
                #{i + 1} · {ruleSummary(cl.rule, data)}
                {cl.speaker && ` · 🗣 ${suspects.find((s) => s.id === cl.speaker)?.name}${cl.speaker === data.killer ? ' (katil → yalan)' : ''}`}
                {falseSet.has(cl.id) && <b style={{ color: 'var(--bad)' }}> · ÇÖZÜMLE ÇELİŞİYOR</b>}
              </span>
              <span className="row-actions">
                {cl.rule && (
                  <button className="btn sm ghost" title="Metni kuraldan yeniden yaz" onClick={() => update((d) => (d.clues[i].text = renderRule(cl.rule, d, Math.random(), style)))}>↻</button>
                )}
                <button className="btn sm ghost" onClick={() => move(i, -1)} aria-label="Yukarı">↑</button>
                <button className="btn sm ghost" onClick={() => move(i, 1)} aria-label="Aşağı">↓</button>
                <button className="btn sm ghost danger" onClick={() => update((d) => d.clues.splice(i, 1))} aria-label="Sil">✕</button>
              </span>
            </div>
            <textarea
              className="textarea"
              rows={2}
              style={{ minHeight: 0 }}
              value={cl.text}
              onChange={(e) => update((d) => (d.clues[i].text = e.target.value))}
            />
          </div>
        ))}
      </div>

      <RuleBuilder data={data} onAdd={(clue) => update((d) => d.clues.push(clue))} />
    </section>
  );
}

function RuleBuilder({ data, onAdd }) {
  const [t, setT] = useState('link');
  const [a, setA] = useState('');
  const [cat, setCat] = useState('');
  const [target, setTarget] = useState('');
  const [neg, setNeg] = useState(true);
  const [speaker, setSpeaker] = useState('');
  const [free, setFree] = useState('');

  const aCat = data.categories.find((c) => c.items.some((it) => it.id === a))?.key;
  const targetCats = data.categories.filter((c) => t === 'murder' || c.key !== aCat);
  const tc = data.categories.find((c) => c.key === cat);
  const traits = tc ? [...new Set(tc.items.flatMap((it) => it.traits || []))] : [];

  const rule = useMemo(() => {
    if (!cat || !target || (t === 'link' && !a)) return null;
    const b = target.startsWith('trait:') ? { cat, trait: target.slice(6) } : { cat, ids: [target.slice(3)] };
    return t === 'link' ? { t, a, b, neg } : { t, b, neg };
  }, [t, a, cat, target, neg]);
  const preview = rule ? renderRule(rule, data, 0.1) : '';

  function add() {
    if (rule) onAdd({ id: uid(), text: preview, rule, speaker: speaker || undefined, auto: false });
    else if (free.trim()) onAdd({ id: uid(), text: free.trim(), auto: false });
    setFree('');
  }

  return (
    <div className="builder" style={{ marginTop: 14 }}>
      <b className="small">Elle ipucu ekle</b>
      <div className="row">
        <select className="select sm" value={t} onChange={(e) => { setT(e.target.value); setTarget(''); }}>
          <option value="link">Eşleşme (A ile B)</option>
          <option value="murder">Cinayet hakkında</option>
        </select>
        {t === 'link' && (
          <select className="select sm" value={a} onChange={(e) => { setA(e.target.value); setCat(''); setTarget(''); }}>
            <option value="">A öğesi…</option>
            {data.categories.map((c) => (
              <optgroup key={c.key} label={c.label}>
                {c.items.map((it) => <option key={it.id} value={it.id}>{it.emoji} {it.name || it.id}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        <select className="select sm" value={cat} onChange={(e) => { setCat(e.target.value); setTarget(''); }}>
          <option value="">Kategori…</option>
          {targetCats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select className="select sm" value={target} onChange={(e) => setTarget(e.target.value)} disabled={!tc}>
          <option value="">B (öğe ya da özellik)…</option>
          {tc?.items.map((it) => <option key={it.id} value={`id:${it.id}`}>{it.emoji} {it.name || it.id}</option>)}
          {traits.map((tr) => <option key={tr} value={`trait:${tr}`}>özellik: {tr}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={neg} onChange={(e) => setNeg(e.target.checked)} /> değil
        </label>
        <select className="select sm" value={speaker} onChange={(e) => setSpeaker(e.target.value)}>
          <option value="">Anlatıcı (ifade değil)</option>
          {data.categories[0].items.map((s) => <option key={s.id} value={s.id}>🗣 {s.name || s.id} söylüyor</option>)}
        </select>
      </div>
      {rule ? (
        <div className="small">Önizleme: <i>{preview}</i></div>
      ) : (
        <input className="input sm" value={free} onChange={(e) => setFree(e.target.value)} placeholder="…ya da serbest metin (mantık kontrolüne katılmaz)" />
      )}
      <div>
        <button className="btn sm" onClick={add} disabled={!rule && !free.trim()}>+ Ekle</button>
      </div>
    </div>
  );
}

function CheckPanel({ check }) {
  if (!check) return null;
  if (check.error) return <div className="notice error">{check.error}</div>;
  return (
    <div className="check-panel">
      {!check.solutionValid ? (
        <div className="bad">✕ Çözüm eksik ya da tekrar eden öğe var.</div>
      ) : check.falseClues.length ? (
        <div className="bad">✕ {check.falseClues.length} ipucu gerçek çözümle çelişiyor (kırmızı çerçeveli).</div>
      ) : (
        <div className="ok">✓ Tüm ipuçları gerçek çözümle tutarlı.</div>
      )}
      {check.unique ? (
        <div className="ok">✓ Benzersiz çözüm: ipuçlarından tek bir tablo çıkıyor.</div>
      ) : check.remaining === 0 ? (
        <div className="bad">✕ İpuçları birbiriyle çelişiyor: hiçbir çözüm yok.</div>
      ) : (
        <div className={check.answerUnique ? 'warn' : 'bad'}>
          {check.answerUnique ? '△' : '✕'} {check.remaining.toLocaleString('tr-TR')} olası tablo kaldı
          {check.answerUnique ? ' — ama cevap (kim/nerede/neyle) yine de tek. Tam tablo için ipucu ekle.' : ` — ${check.possibleAnswers} farklı cevap mümkün. İpucu ekle ya da yeniden üret.`}
        </div>
      )}
      {check.freeTextClues.length > 0 && (
        <div className="warn">△ {check.freeTextClues.length} serbest metin ipucu kontrole dahil edilmedi.</div>
      )}
      <div className="faint small">Toplam olasılık uzayı: {check.total.toLocaleString('tr-TR')}</div>
    </div>
  );
}
