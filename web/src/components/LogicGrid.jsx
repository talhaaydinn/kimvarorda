import { Fragment, useMemo } from 'react';
import { CAT_COLOR } from './common.jsx';

/**
 * Basamaklı mantık tablosu.
 * Sütunlar: kategoriler[1..]; satırlar: kategoriler[0], son, sondan bir önceki … [2]
 * Bir blok yalnızca (satırKat === 0 || sütunKat < satırKat) iken çizilir — her çift bir kez.
 *
 * marks: { "satırId|sütunId": 1 (X) | 2 (✓) }
 */
export function gridShape(categories) {
  const K = categories.length;
  const cols = categories.slice(1).map((c, j) => ({ ...c, ci: j + 1 }));
  const rows = [{ ...categories[0], ci: 0 }, ...categories.slice(2).map((c, j) => ({ ...c, ci: j + 2 })).reverse()];
  const visible = (rc, cc) => rc === 0 || cc < rc;
  return { K, cols, rows, visible };
}

export const pairKey = (a, b) => `${a}|${b}`;

/** Çözümden tam doluluk haritası (kapanmış vakada göstermek için) */
export function solutionMarks(categories, solution) {
  const { rows, cols, visible } = gridShape(categories);
  const tuples = categories[0].items.map((s) => {
    const t = { [categories[0].key]: s.id };
    categories.slice(1).forEach((c) => (t[c.key] = solution[s.id]?.[c.key]));
    return t;
  });
  const marks = {};
  for (const r of rows) for (const c of cols) {
    if (!visible(r.ci, c.ci)) continue;
    for (const ri of r.items) for (const cj of c.items) {
      const together = tuples.some((t) => t[r.key] === ri.id && t[c.key] === cj.id);
      marks[pairKey(ri.id, cj.id)] = together ? 2 : 1;
    }
  }
  return marks;
}

export default function LogicGrid({ categories, marks, onChange, autoX = true, readonly = false }) {
  const shape = useMemo(() => gridShape(categories), [categories]);
  const { cols, rows, visible } = shape;
  const N = categories[0].items.length;

  function click(rowCat, rowItem, colCat, colItem) {
    if (readonly) return;
    const k = pairKey(rowItem.id, colItem.id);
    const cur = marks[k] || 0;
    const nextVal = (cur + 1) % 3; // boş → X → ✓ → boş
    const next = { ...marks };
    if (nextVal) next[k] = nextVal;
    else delete next[k];
    if (nextVal === 2 && autoX) {
      // aynı bloktaki satır ve sütunun geri kalanına X
      for (const other of colCat.items) {
        const kk = pairKey(rowItem.id, other.id);
        if (other.id !== colItem.id && !next[kk]) next[kk] = 1;
      }
      for (const other of rowCat.items) {
        const kk = pairKey(other.id, colItem.id);
        if (other.id !== rowItem.id && !next[kk]) next[kk] = 1;
      }
    }
    onChange(next);
  }

  return (
    <div className="grid-scroll">
      <table className={`lg${readonly ? ' readonly' : ''}`} role="grid" aria-label="Mantık tablosu">
        <thead>
          <tr>
            <th colSpan={2} rowSpan={2} />
            {cols.map((c) => (
              <th key={c.key} colSpan={N} className="cat-head" style={{ '--cat': CAT_COLOR[c.key] }}>
                {c.label}
              </th>
            ))}
          </tr>
          <tr>
            {cols.map((c) =>
              c.items.map((it) => (
                <th key={it.id} className="col-head" title={it.name}>
                  <span className="vert">
                    <span className="e">{it.emoji}</span>
                    {it.name}
                  </span>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) =>
            r.items.map((ri, i) => (
              <tr key={ri.id} className={i === N - 1 ? 'bb' : ''}>
                {i === 0 && (
                  <th rowSpan={N} className="cat-side" style={{ '--cat': CAT_COLOR[r.key] }}>
                    <span className="vert">{r.label}</span>
                  </th>
                )}
                <th className="row-head" title={ri.name} scope="row">
                  <span className="e">{ri.emoji}</span>
                  {ri.name}
                </th>
                {cols.map((c) =>
                  visible(r.ci, c.ci) ? (
                    <Fragment key={c.key}>
                      {c.items.map((cj, j) => {
                        const m = marks[pairKey(ri.id, cj.id)] || 0;
                        return (
                          <td
                            key={cj.id}
                            className={`cell${m === 1 ? ' x' : m === 2 ? ' v' : ''}${j === N - 1 ? ' br' : ''}`}
                            onClick={() => click(r, ri, c, cj)}
                            aria-label={`${ri.name} – ${cj.name}: ${m === 2 ? 'evet' : m === 1 ? 'hayır' : 'boş'}`}
                          >
                            {m === 1 ? '✕' : m === 2 ? '✓' : ''}
                          </td>
                        );
                      })}
                    </Fragment>
                  ) : (
                    <td key={c.key} colSpan={N} className="void" />
                  ),
                )}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
