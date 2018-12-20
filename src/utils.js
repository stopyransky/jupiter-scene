import * as THREE from 'three';
import assets from './assets';

export function updateTexture(mat, materialKey, textures) {
  return function(key) {
    mat[materialKey] = textures[key];
    mat.needsUpdate = true;
  };
}

export function needsUpdate(material, geometry) {
  return function() {
    material.shading = +material.shading; //Ensure number
    material.vertexColors = +material.vertexColors; //Ensure number
    material.side = +material.side; //Ensure number
    material.needsUpdate = true;
    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
  };
}
// builds shader code from shaderchunks defined by three -> used in shaders' scripts!
function replaceThreeChunkFn(a, b) {
  return THREE.ShaderChunk[b] + '\n';
}

// replaces any '// chunk(name_of_THREE_predefined_shader_chunk)' to code of inside the shaderchunk
export function shaderParse(glsl) {
  return glsl.replace(/\/\/\s?chunk\(\s?(\w+)\s?\);/g, replaceThreeChunkFn);
}

export function map(n, start1, stop1, start2, stop2) {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}


export const makeMesh = (name, { geometry, material, castShadow, receiveShadow, orbit }) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;

  return (scene) => {
    scene.add(mesh);
    scene.add(orbit);
    return mesh;
  };
};

export const makeGeometry = (geo, { scale }) => {
  if(scale) {
    geo.applyMatrix(scale);
  }
  return geo;
};


export function makeControls({ textureMapKeys, props }) {
  return {
    // scene
    timestep: 1000,
    backgroundColor: '#000000',
    ambientColor: '#000000',
    antialias: true,
    helpers: false,
    axes: false,
    fogDensity: 0.0,

    //camera
    fov: 45,
    focalLength: 200,
    filmGauge: 1,
    focus: 1.0,
    // post effects
    hBlurEnabled: false,
    vBlurEnabled: false,
    hBlurLevel: window.innerWidth,
    vBlurLevel: window.innerHeight,
    bloomEnabled: false,
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0.1,
    bloomRadius: 0.8,
    filmEnabled: true,
    filmTime: 0.0,
    filmGrayscale: false,
    filmSCount: props.SCREEN_HEIGHT * 2,
    filmSIntensity: 0.42,
    filmNIntensity: 0.24,
    ccEnabled: true,
    ccPowerFactor: 1.58,
    //texture
    anisotropy: 1.0,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,

    // jupiter
    rotationY: 1 / 35730.0, // jupiter 1 rotation speed per second
    cloudspeed: 0.01,
    staticMix: 1.0,
    transparent: false,
    opacity: 1.0,
    alphaTest: 0,
    flatShading: false,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: true,
    side: props.side,
    wireframe: false,
    wireframeLinewidth: 1.0,
    animated: true,
    map: textureMapKeys,
    lightMap: textureMapKeys,
    normalMap: textureMapKeys,
    normalScale: 0.0,
    alphaMap: textureMapKeys,
    specularMap: textureMapKeys,
    specular: '#252525',
    shininess: 0.0,
    aoMap: textureMapKeys,
    aoMapIntensity: 0.0,
    bumpMap: textureMapKeys,
    bumpScale: 0.0,
    emissiveMap: textureMapKeys,
    emissiveColor: '#00ff00',
    emissiveIntensity: 0.0,
    displacementMap: textureMapKeys,
    displacementScale: 0.0,

    // directional light
    sunpositionX: 1,
    sunpositionY: 0,
    sunpositionZ: 100,
    sunlightVisible: true,
    sunlightColor: '#ffffff',
    sunlightIntensity: 0.9,
    castShadow: true
  };
}

export const loadTextures = () => {
  const loader = new THREE.TextureLoader();
  const frames = [];

  for (let i = 0; i < 14; i++) {
    frames[i] = loader.load(assets.jupiter.frames[i]);
  }

  const textureMaps = {
    none: null,
    tx: loader.load(assets.jupiterxl),
    txframe: frames[0],
    txbump: loader.load(assets.jupiterxlbump),
    txspecular: loader.load(assets.jupiterxlspec),
    io: loader.load(assets.io),
    europa: loader.load(assets.europa),
    europabump: loader.load(assets.europabump),
    ganymede: loader.load(assets.ganymede),
    ganymedebump: loader.load(assets.ganymedebump),
    callisto: loader.load(assets.callisto),
    callistobump: loader.load(assets.callistobump)
  };
  const textureFlare0 = loader.load(assets.lensFlare.textureFlare0);
  const textureFlare1 = loader.load(assets.lensFlare.textureFlare1);
  const textureFlare2 = loader.load(assets.lensFlare.textureFlare2);

  return {
    textureMaps: textureMaps,
    textureMapKeys: Object.keys(textureMaps),
    flares: [ textureFlare0, textureFlare1, textureFlare2],
    frames
  };
};
