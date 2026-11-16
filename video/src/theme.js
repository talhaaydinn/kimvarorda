// Sitenin tasarım dili (web/src/styles.css ile aynı renkler ve yazı tipleri)
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadPlexSans } from '@remotion/google-fonts/IBMPlexSans';
import { loadFont as loadPlexMono } from '@remotion/google-fonts/IBMPlexMono';
import { loadFont as loadEmoji } from '@remotion/google-fonts/NotoColorEmoji';

const subsets = ['latin', 'latin-ext']; // ç, ğ, ı, ş için latin-ext şart
// Emojiler her makinede aynı görünsün (Windows 10'un emoji yazı tipi 🪢 gibi yenileri tanımıyor)
const EMOJI = loadEmoji().fontFamily;
export const SERIF = `${loadFraunces('normal', { weights: ['700', '900'], subsets }).fontFamily}, ${EMOJI}`;
export const SANS = `${loadPlexSans('normal', { weights: ['500', '600', '700'], subsets }).fontFamily}, ${EMOJI}`;
export const MONO = `${loadPlexMono('normal', { weights: ['400', '600'], subsets }).fontFamily}, ${EMOJI}`;
export { EMOJI };

export const C = {
  bg: '#0e0d0b',
  surface: '#1b1915',
  surface2: '#24211c',
  line: '#36312a',
  line2: '#4a443a',
  text: '#f1eadc',
  muted: '#a59d8e',
  faint: '#6f685c',
  accent: '#ff4f3b',
  ok: '#5fd39a',
  gold: '#f2b84b',
  bad: '#ff6b5e',
  suspect: '#ff7a6b',
  weapon: '#f2b84b',
  location: '#4cc2a8',
};
