// "Nasıl oynanır?" videosunun senaryosu.
// say      → seslendirmede okunacak metin (ElevenLabs'a gider)
// captions → altyazıda gösterilirken yapılacak değişiklikler (okunuş ≠ yazılış olduğunda)
// Metni değiştirince `npm run video:voice` yalnızca değişen sahneleri yeniden seslendirir.

export const SCENES = [
  {
    id: 'hook',
    say: 'Bir cinayet işlendi. Katil, şüphelilerin arasında. Peki sen bulabilir misin? Kim, nerede, neyle?',
  },
  {
    id: 'dosya',
    say: 'Önce videoyu dikkatle izle. Şüphelileri, silahları ve yerleri tanı. Her şüphelinin elinde tek bir silah var, ve her biri tek bir yerde.',
  },
  {
    id: 'ipucu',
    say: 'Sonra ipuçlarını topla. Ama dikkat: ipuçları isim vermez. Titrek bir ampulün altında, uzun boylu biri. Ampul mahzeni, uzun boy ise iki şüpheliyi işaret ediyor.',
  },
  {
    id: 'tablo',
    say: 'Sitedeki tabloda olasılıkları tek tek ele. Olamayanları çarpıyla sil, kesin olanı tikle işaretle.',
  },
  {
    id: 'cevap',
    say: 'Çözdüğünde siteye gir. Kullanıcı adını yaz; katili, yeri ve silahı seç. Unutma, tek hakkın var.',
  },
  {
    id: 'siralama',
    say: 'Doğru bilenler sıralamaya girer. Ne kadar hızlı çözersen, o kadar öndesin.',
  },
  {
    id: 'cta',
    say: 'Yeni vaka çok yakında. Takipte kal, kimvarorda nokta ey ay sitesinde görüşürüz.',
    captions: [['kimvarorda nokta ey ay', 'kimvarorda.ai']],
  },
];

// ElevenLabs ses efektleri (npm run video:voice -- --sfx). Açıklamalar İngilizce: model en iyi böyle anlıyor.
export const SFX = {
  whoosh: { prompt: 'short dark cinematic whoosh transition', seconds: 1 },
  hit: { prompt: 'deep cinematic suspense impact hit with reverb tail', seconds: 2 },
  pop: { prompt: 'soft subtle UI pop click', seconds: 0.5 },
  type: { prompt: 'old typewriter typing a few quick keys', seconds: 1.5 },
  ding: { prompt: 'bright positive success chime', seconds: 1 },
};
