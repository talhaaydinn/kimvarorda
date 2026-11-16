// "Tablo nasıl doldurulur?" videosunun senaryosu (npm run video:voice -- --tablo).
// Örnek tamamen uydurma bir mini vaka; hiçbir yayındaki vakanın çözümünü göstermez.
export const SITE = 'kimvarorda.onrender.com';
const SITE_SAY = 'kimvarorda nokta onrender nokta com';

export const SCENES = [
  { id: 'giris', kind: 'giris', say: 'Vakayı tabloyla nasıl çözersin? Bir dakikada öğren.', tail: 0.4 },
  { id: 'kutu', kind: 'kutu', say: 'Tablodaki her kutu bir soru sorar: bu kişi, bu silahı mı kullandı?', tail: 0.5 },
  { id: 'tik', kind: 'tik', say: 'Kutuya bir kez tıkla: çarpı, yani olamaz. İkinci kez tıkla: tik, yani kesin. Üçüncü tıklama kutuyu boşaltır.', tail: 0.6 },
  { id: 'kural', kind: 'kural', say: 'Altın kural: her satırda ve her sütunda yalnızca bir tik olur. Çünkü her şüphelinin elinde tek bir silah var.', tail: 0.6 },
  { id: 'ornek-1', kind: 'ornek', step: 1, say: 'Hadi deneyelim. İpucu: Selim şamdana hiç dokunmadı. Selim ile şamdanın kutusuna çarpı.', tail: 0.5 },
  { id: 'ornek-2', kind: 'ornek', step: 2, say: 'İpucu: zehirli çay Leyla’nın elindeydi. Bu kutuya tik. Tik koyunca Leyla’nın satırı ve çayın sütunu kendiliğinden çarpıyla dolar.', tail: 0.6 },
  { id: 'ornek-3', kind: 'ornek', step: 3, say: 'Şimdi Selim’e bak: iki çarpı var, geriye tek kutu kaldı. Demek ki perde kordonu Selim’de. Rıza’ya da son kalan şamdan düşer.', tail: 0.8 },
  { id: 'hepsi', kind: 'hepsi', say: 'Yerleri de aynı mantıkla çöz. Bütün tikler yerine oturunca cevabın hazır: kim, nerede, neyle.', tail: 0.6 },
  { id: 'cta', kind: 'cta', say: `Tablo, ${SITE_SAY} adresinde her vakanın sayfasında seni bekliyor.`, tail: 1.6 },
];
