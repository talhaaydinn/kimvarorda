// Örnek vaka — tamamen özgün kurgu.
export const sampleCase = {
  title: 'Fırtınalı Gecede Köşk',
  story:
    "Fırtınanın köşkün pencerelerini dövdüğü gece, antika koleksiyoncusu Necdet Bey'in cansız bedeni bulundu. Elektrikler kesilmiş, yol sular altında kalmıştı; köşkte dört kişi vardı ve hiçbiri dışarı çıkamıyordu.\n\nHer şüpheli gece boyunca tek bir yerdeydi ve elinde tek bir eşya vardı. Aralarından biri katil.\n\nKim? Nerede? Neyle?",
  settings: { difficulty: 'zor', liar: false, style: 'dolayli' },
  categories: [
    {
      key: 'suspect',
      label: 'Şüpheliler',
      items: [
        { id: 's1', name: 'Avukat Selim', emoji: '🎩', proper: true, desc: "Necdet Bey'in vasiyetini hazırlayan avukat. Saatine bakmayı bir an bırakmıyor.", traits: ['uzun boylu', 'solak', 'kahverengi gözlü'], izler: ["saatine sürekli bakan", "vasiyetin her satırını bilen"] },
        { id: 's2', name: 'Leyla Hanım', emoji: '🎤', proper: true, desc: 'O gece salonda konser veren şarkıcı. Fırtına yüzünden köşkte mahsur kaldı.', traits: ['kısa boylu', 'sağlak', 'yeşil gözlü'], izler: ["o gece salonda şarkı söyleyen", "fırtına yüzünden köşkte mahsur kalan"] },
        { id: 's3', name: 'Bahçıvan Rıza', emoji: '🌿', proper: true, desc: 'Otuz yıldır köşkün bahçesine bakıyor. Her kapının anahtarı onda.', traits: ['uzun boylu', 'sağlak', 'yeşil gözlü'], izler: ["anahtar destesi şıngırdayan", "elleri toprak kokan"] },
        { id: 's4', name: 'Doktor Feride', emoji: '🩺', proper: true, desc: "Necdet Bey'in özel doktoru. Çantası hiç yanından ayrılmıyor.", traits: ['kısa boylu', 'sağlak', 'kahverengi gözlü'], izler: ["çantasını bir an bile bırakmayan", "stetoskobu boynundan eksik olmayan"] },
      ],
    },
    {
      key: 'weapon',
      label: 'Silahlar',
      items: [
        { id: 'w1', name: 'Pirinç şamdan', emoji: '🕯️', proper: false, desc: 'Salondaki şöminenin üstünden alınmış, iki kiloluk.', traits: ['ağır', 'metal'], izler: ["şöminenin üstünden eksilen ağır bir şey", "iki kiloluk bir şey"] },
        { id: 'w2', name: 'Zehirli çay', emoji: '🍵', proper: false, desc: 'Porselen fincanda, hâlâ ılık.', traits: ['hafif'], izler: ["porselen bir fincan", "hâlâ ılık bir içecek"] },
        { id: 'w3', name: 'Perde kordonu', emoji: '🪢', proper: false, desc: 'Kadife perdeden sökülmüş, ipek bir kordon.', traits: ['hafif'], izler: ["kadife perdeden sökülen bir şey", "ipekten ince bir şey"] },
        { id: 'w4', name: 'Mektup açacağı', emoji: '✉️', proper: false, desc: 'Gümüş saplı, ucu sivri.', traits: ['hafif', 'metal'], izler: ["gümüş saplı bir şey", "ucu sivri bir şey"] },
      ],
    },
    {
      key: 'location',
      label: 'Yerler',
      items: [
        { id: 'l1', name: 'Kütüphane', emoji: '📚', proper: false, desc: 'Tavana kadar kitap. Şömine hâlâ yanıyor.', traits: ['kapalı'], izler: ["tavana kadar yükselen rafların arasında", "hâlâ yanan bir şöminenin karşısında"] },
        { id: 'l2', name: 'Limonluk', emoji: '🍋', proper: false, desc: 'Camdan bir sera; yağmur tavanı dövüyor.', traits: ['kapalı', 'camlı'], izler: ["yağmurun cam tavanı dövdüğü yerde", "camdan duvarların ardında"] },
        { id: 'l3', name: 'İskele', emoji: '⚓', proper: false, desc: 'Dalgaların vurduğu ahşap iskele.', traits: ['açık'], izler: ["dalgaların ahşap tahtalara vurduğu yerde", "açık havada, ıslak tahtaların üstünde"] },
        { id: 'l4', name: 'Mahzen', emoji: '🍷', proper: false, desc: 'Şarap fıçıları ve tek bir titrek ampul.', traits: ['kapalı', 'karanlık'], izler: ["titrek bir ampulün altında", "şarap fıçılarının arasında"] },
      ],
    },
  ],
  solution: {
    s1: { weapon: 'w4', location: 'l1' },
    s2: { weapon: 'w2', location: 'l2' },
    s3: { weapon: 'w1', location: 'l4' },
    s4: { weapon: 'w3', location: 'l3' },
  },
  killer: 's3',
  clues: [],
};
