import test from 'node:test';
import assert from 'node:assert/strict';
import { generateClues, checkCase, randomSolution, blankCase, isCorrectAnswer, murderAnswer } from '../shared/engine.js';
import { genitive, locative, pastCopula, renderRule } from '../shared/tr.js';
import { sampleCase } from './sample-case.js';

const clone = (x) => structuredClone(x);

test('Türkçe ekler', () => {
  assert.equal(locative('kütüphane'), 'kütüphanede');
  assert.equal(locative('limonluk'), 'limonlukta');
  assert.equal(locative('Selim', true), "Selim'de");
  assert.equal(genitive('Leyla Hanım', true), "Leyla Hanım'ın");
  assert.equal(genitive('Doktor Feride', true), "Doktor Feride'nin");
  assert.equal(genitive('bıçak'), 'bıçağın');
  assert.equal(genitive('perde kordonu'), 'perde kordonunun');
  assert.equal(genitive('mektup açacağı'), 'mektup açacağının');
  assert.equal(pastCopula('mahzende'), 'mahzendeydi');
  assert.equal(pastCopula('limonlukta'), 'limonluktaydı');
});

for (const difficulty of ['kolay', 'orta', 'zor']) {
  for (const liar of [false, true]) {
    test(`üretici benzersiz çözüm verir (${difficulty}${liar ? ', yalancı' : ''})`, () => {
      for (let i = 0; i < 15; i++) {
        const data = clone(sampleCase);
        Object.assign(data, randomSolution(data));
        data.clues = generateClues(data, { difficulty, liar });
        const r = checkCase(data);
        assert.ok(r.unique, `benzersiz değil: ${r.remaining}`);
        assert.ok(r.matchesReal);
        assert.deepEqual(r.falseClues.filter((id) => !data.clues.find((c) => c.id === id).speaker), []);
      }
    });
  }
}

test('sebep kategorisi ile 4x4 ve 5 kişilik vaka', () => {
  for (const [N, motive] of [[4, true], [5, false], [3, true]]) {
    const data = blankCase(N, motive);
    data.categories.forEach((c) => c.items.forEach((it, i) => {
      it.name = `${c.key}${i}`;
      it.traits = i % 2 ? ['x'] : ['y'];
    }));
    Object.assign(data, randomSolution(data));
    const t = Date.now();
    data.clues = generateClues(data, { difficulty: 'orta' });
    const ms = Date.now() - t;
    assert.ok(checkCase(data).unique);
    assert.ok(ms < 8000, `yavaş: ${ms}ms`);
    console.log(`  N=${N} motive=${motive}: ${data.clues.length} ipucu, ${ms}ms`);
  }
});

test('cevap kontrolü', () => {
  const data = clone(sampleCase);
  assert.ok(isCorrectAnswer(data, murderAnswer(data)));
  assert.ok(!isCorrectAnswer(data, { ...murderAnswer(data), weapon: 'w2' }));
  assert.ok(!isCorrectAnswer(data, { suspect: 's3', weapon: 'w1' }));
});

test('örnek ipucu metinleri', () => {
  const data = clone(sampleCase);
  data.clues = generateClues(data, { difficulty: 'orta', liar: true });
  for (const c of data.clues) console.log('  ', c.speaker ? `[${c.speaker}]` : '', c.text);
  console.log('  ', renderRule({ t: 'link', a: 's1', aTrait: 'solak', b: { cat: 'weapon', trait: 'metal' }, neg: false }, data, 0.9));
  console.log('  ', renderRule({ t: 'murder', b: { cat: 'location', trait: 'kapalı' }, neg: false }, data));
});

test('kullanıcı adı anahtarı Türkçe I/ı/İ farkını yok sayar', async () => {
  const { usernameKey } = await import('../shared/format.js');
  const k = usernameKey('ali_dedektif');
  for (const v of ['ALI_dedektif', 'ALİ_DEDEKTİF', 'alı_dedektıf', 'Ali_Dedektif']) assert.equal(usernameKey(v), k, v);
  assert.notEqual(usernameKey('veli'), k);
});

test('dolaylı anlatım: isim yerine izler, mantık yine benzersiz', () => {
  const data = clone(sampleCase);
  // kullanıcının örneği: mahzendeki kişi uzun boylu
  const t = renderRule({ t: 'link', a: 'l4', b: { cat: 'suspect', trait: 'uzun boylu' }, neg: false }, data, 0.3, 'dolayli');
  assert.ok(!/mahzen/i.test(t), t);
  assert.ok(/uzun boylu biri/.test(t), t);
  assert.ok(/titrek bir ampul|şarap fıçı/i.test(t), t);
  for (const difficulty of ['orta', 'zor']) {
    for (let i = 0; i < 20; i++) {
      data.clues = generateClues(data, { difficulty, style: 'dolayli', liar: i % 2 === 1 });
      assert.ok(checkCase(data).unique);
    }
  }
  data.clues = generateClues(data, { difficulty: 'zor', style: 'dolayli' });
  const names = data.categories.flatMap((c) => c.items.map((it) => it.name.toLocaleLowerCase('tr')));
  const single = data.clues.filter((c) => !(c.rule.b.ids?.length > 2));
  for (const c of single) {
    const low = c.text.toLocaleLowerCase('tr');
    assert.ok(!names.some((n) => low.includes(n)), `isim sızdı: ${c.text}`);
  }
  for (const c of data.clues) console.log('   ', c.text);
});
