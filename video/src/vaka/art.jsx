// Vaka çizimleri kayıt defteri: her vakanın çizimleri arts/ altında ayrı dosyada, başlığıyla eşleşir.
// Eşleşme yoksa video emojili sade görünüme döner.
// { title, World, ITEM_ART: { s1: Bileşen, … }, POV?: { ipucuId: Bileşen } }
import { VAKA } from './vaka.js';
import sonVapur from './arts/son-vapur.jsx';
import kardaKalanTren from './arts/karda-kalan-tren.jsx';

export const ARTS = [sonVapur, kardaKalanTren];
export const ART = ARTS.find((a) => a.title === VAKA.title) ?? null;
