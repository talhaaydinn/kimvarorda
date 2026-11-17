// "Karda Kalan Tren" — baştan sona birinci şahıs (POV), 3B hikâye videosu.
// Şüphelilerin özellikleri ve ipuçlarının listesi YALNIZCA sitede; video olayı hikâye olarak anlatır.
// İpuçları sitedeki sırayla (c1…c6) hikâyenin içinde geçer. Çözüm burada yok.
//   npm run video:voice -- --vaka3d   →   npm run video:render:vaka3d
export const TITLE = 'Karda Kalan Tren';
export const NO = 2;
export const SITE = 'kimvarorda.onrender.com';
const SITE_SAY = 'kimvarorda nokta onrender nokta com';

// ElevenLabs "Doga V2.0 – The Multilingual Audiobook Master"
export const VOICE = 'ctoYieZ4J7WwcdhujpMq';
export const SPEED = 1.08;

// clue: o sahnede geçen ipucunun sitedeki numarası; clueAt: ipucunun başladığı kelime(ler)
export const SCENES = [
  {
    id: 'giris',
    say: `Vaka ${NO}: ${TITLE}. Kars'a giden gece treni, tipinin ortasında karlara saplandı. Donmuş kapıyı omzunla itip içeri giriyorsun. Emekli hâkim Cevdet Bey ölü bulunmuş. Trenden kimse inemedi, kimse binemedi.`,
    tail: 0.3,
  },
  {
    id: 'koridor',
    say: 'Koridorda üç yolcu seni bekliyor: Kondüktör Rasim, Aşçı Nermin ve Fotoğrafçı Selin. O gece her biri tek bir yerdeydi, elinde tek bir şey vardı. Rasim elini uzatıyor; beyaz eldivenlerinde tek bir kurum lekesi bile yok.',
    clue: 1,
    clueAt: 'Rasim elini',
    tail: 0.4,
  },
  {
    id: 'ceset',
    say: 'Cesedin yanına diz çöküyorsun. Paltosunun üstünde hâlâ erimemiş kar taneleri var.',
    clue: 2,
    clueAt: 'Paltosunun',
    tail: 0.5,
  },
  {
    id: 'yemekli',
    say: 'Yemekli vagona geçiyorsun. Ekmek tahtasında kırıntılar duruyor, ama yanındaki dişli kesici yerinde yok.',
    clue: 3,
    clueAt: 'Ekmek tahtasında',
    tail: 0.3,
  },
  {
    id: 'ayna',
    say: 'Buğulu aynaya bakıyorsun. Çorba buharının ardında, o gece burada oturanın kalın, kır bıyığı seçiliyor.',
    clue: 4,
    clueAt: 'Çorba buharının',
    tail: 0.5,
  },
  {
    id: 'kompartiman',
    say: 'Yataklı kompartımanın kapısını aralıyorsun. İçerideki gölge, başını üst ranzaya çarpmamak için eğiliyor.',
    clue: 5,
    clueAt: 'İçerideki gölge',
    tail: 0.5,
  },
  {
    id: 'balkon',
    say: 'Son vagonun kapısını itiyorsun; tipi yüzüne çarpıyor. Buz tutmuş korkuluğa dokunuyorsun. Buzun üstünde tek bir dişli çizik bile yok.',
    clue: 6,
    clueAt: 'Buz tutmuş',
    tail: 0.5,
  },
  {
    id: 'final',
    say: `Kim? Nerede? Neyle? Şüphelilerin özellikleri ve bütün ipuçları ${SITE_SAY} adresinde. Tabloyu doldur, katili bul; adın sıralamaya yazılsın.`,
    tail: 1.8,
  },
];
