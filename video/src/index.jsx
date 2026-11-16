import { Composition, registerRoot } from 'remotion';
import { HowTo, HOWTO_TOTAL } from './HowTo.jsx';
import { Vaka, VAKA_TOTAL } from './vaka/Vaka.jsx';
import { FPS, H, W } from './timeline.js';

function Root() {
  return (
    <>
      <Composition id="NasilOynanir" component={HowTo} durationInFrames={HOWTO_TOTAL} fps={FPS} width={W} height={H} />
      <Composition id="Vaka" component={Vaka} durationInFrames={VAKA_TOTAL} fps={FPS} width={W} height={H} />
    </>
  );
}

registerRoot(Root);
