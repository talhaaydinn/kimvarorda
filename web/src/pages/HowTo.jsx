import { Link } from 'react-router-dom';

export default function HowTo() {
  return (
    <div className="wrap narrow">
      <header className="case-head">
        <div className="kicker">Kurallar</div>
        <h1 style={{ marginTop: 10 }}>Nasıl oynanır?</h1>
      </header>

      <div className="block" style={{ display: 'grid', gap: 18 }}>
        <Rule n="1" t="Dosyayı oku">
          Her vakada şüpheliler, silahlar ve yerler vardır (bazen sebepler de). Kartlardaki özelliklere dikkat et:
          “solak”, “uzun boylu”, “metal” gibi ayrıntılar ipuçlarında gizlice kullanılır.
        </Rule>
        <Rule n="2" t="Her şüpheli = tam bir silah + tam bir yer">
          Olay anında her şüpheli tek bir yerdeydi ve elinde tek bir silah vardı. İki şüpheli aynı yerde ya da aynı
          silahla olamaz. Yani tablonun her bloğunda her satırda ve her sütunda tam bir ✓ bulunur.
        </Rule>
        <Rule n="3" t="Tabloyu doldur">
          Bir ipucu bir eşleşmeyi imkânsız kılıyorsa ✕, kesinleştiriyorsa ✓ koy. Bir satırda tek boş kutu kaldıysa o
          kutu ✓’dir. Bir ✓ bulduğunda bu bilgiyi diğer bloklara taşı: Selim kütüphanedeyse ve kütüphanede şamdan
          varsa, şamdan Selim’dedir.
        </Rule>
        <Rule n="4" t="İfadeler: katil yalan söyler">
          Bazı vakalarda şüphelilerin ifadeleri vardır. Masumlar her zaman doğruyu söyler; yalnızca katilin ifadesi
          yanlıştır. Hangi ifadenin diğerleriyle çeliştiğini bul.
        </Rule>
        <Rule n="5" t="Suçlamayı yap">
          Kullanıcı adını yaz, katili, yeri ve silahı seç. <b>Tek hakkın var.</b> Doğru cevaplar geliş sırasına göre
          sıralanır. Ne kadar hızlı, o kadar önde.
        </Rule>
        <Rule n="6" t="Çözüm">
          Vaka kapandığında çözüm ve tam tablo bu sitede açıklanır.
        </Rule>
      </div>

      <p style={{ marginTop: 28 }}>
        <Link to="/" className="btn primary">Vakalara git →</Link>
      </p>
    </div>
  );
}

function Rule({ n, t, children }) {
  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 12 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 30, color: 'var(--accent)', lineHeight: 1 }}>{n}</div>
      <div>
        <h3>{t}</h3>
        <p className="muted" style={{ margin: '6px 0 0' }}>{children}</p>
      </div>
    </div>
  );
}
