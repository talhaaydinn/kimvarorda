// Remotion ("Nasıl oynanır?" videosu) ayarları — bkz. video/src
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('video/src/index.jsx');
Config.setPublicDir('video/public');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
