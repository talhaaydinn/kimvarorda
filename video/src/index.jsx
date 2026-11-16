import { Composition, registerRoot } from 'remotion';
import { HowTo } from './HowTo.jsx';
import { FPS, H, TOTAL, W } from './timeline.js';

function Root() {
  return <Composition id="NasilOynanir" component={HowTo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
}

registerRoot(Root);
