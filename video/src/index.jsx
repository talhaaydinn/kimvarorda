import { Composition, registerRoot } from 'remotion';
import { HowTo, HOWTO_TOTAL } from './HowTo.jsx';
import { Vaka, VAKA_TOTAL } from './vaka/Vaka.jsx';
import { Tablo, TABLO_TOTAL } from './tablo/Tablo.jsx';
import { Vaka3d, VAKA3D_TOTAL } from './vaka3d/Vaka3d.jsx';
import { FPS, H, W } from './timeline.js';

function Root() {
  return (
    <>
      <Composition id="NasilOynanir" component={HowTo} durationInFrames={HOWTO_TOTAL} fps={FPS} width={W} height={H} />
      <Composition id="Vaka" component={Vaka} durationInFrames={VAKA_TOTAL} fps={FPS} width={W} height={H} />
      <Composition id="Vaka3D" component={Vaka3d} durationInFrames={VAKA3D_TOTAL} fps={FPS} width={W} height={H} />
      <Composition id="TabloRehberi" component={Tablo} durationInFrames={TABLO_TOTAL} fps={FPS} width={W} height={H} />
    </>
  );
}

registerRoot(Root);
