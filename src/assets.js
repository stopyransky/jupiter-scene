import * as csvFile from './data/data.csv';
import * as jsonFile from './data/data.json';
import * as txtFile from './data/data.txt';
import * as fragmentShader from './shaders/fragment.glsl';
import * as vertexShader from './shaders/vertex.glsl';

import * as frame1 from './assets/frames/sharp/frame1.png';
import * as frame2 from './assets/frames/sharp/frame2.png';
import * as frame3 from './assets/frames/sharp/frame3.png';
import * as frame4 from './assets/frames/sharp/frame4.png';
import * as frame5 from './assets/frames/sharp/frame5.png';
import * as frame6 from './assets/frames/sharp/frame6.png';
import * as frame7 from './assets/frames/sharp/frame7.png';
import * as frame8 from './assets/frames/sharp/frame8.png';
import * as frame9 from './assets/frames/sharp/frame9.png';
import * as frame10 from './assets/frames/sharp/frame10.png';
import * as frame11 from './assets/frames/sharp/frame11.png';
import * as frame12 from './assets/frames/sharp/frame12.png';
import * as frame13 from './assets/frames/sharp/frame13.png';
import * as frame14 from './assets/frames/sharp/frame14.png';

import * as jupiterxl from './assets/jupiterxl.png';
import * as jupiterxlbump from './assets/jupiterxl_bump.png';
import * as jupiterxlspec from './assets/jupiterxl_spec.png';
import * as io from './assets/io.jpg';
import * as europa from './assets/europa.jpg';
import * as europabump from './assets/europa_bump.jpg';
import * as ganymede from './assets/ganymede.jpg';
import * as ganymedebump from './assets/ganymede_bump.jpg';
import * as callisto from './assets/callisto.png';
import * as callistobump from './assets/callisto_bump.png';

import * as textureFlare0 from './assets/lensflare/lensflare0.png';
import * as textureFlare1 from './assets/lensflare/lensflare2.png';
import * as textureFlare2 from './assets/lensflare/lensflare3.png';

export default {
  csvFile,
  jsonFile,
  txtFile,
  fragmentShader,
  vertexShader,
  jupiter: {
    frames: [
      frame1,
      frame2,
      frame3,
      frame4,
      frame5,
      frame6,
      frame7,
      frame8,
      frame9,
      frame10,
      frame11,
      frame12,
      frame13,
      frame14
    ]
  },
  jupiterxl,
  jupiterxlbump,
  jupiterxlspec,
  io,
  europa,
  europabump,
  ganymede,
  ganymedebump,
  callisto,
  callistobump,
  lensFlare: { textureFlare0, textureFlare1, textureFlare2 }
};
