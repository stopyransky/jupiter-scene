import THREE from './three';
import * as dat from 'dat.gui';
import * as vertexShaderSrc from './shaders/vertex.glsl';
import * as fragmentShaderSrc from './shaders/fragment.glsl';

import {
  updateTexture,
  needsUpdate,
  shaderParse,
  makeMesh,
  makeGeometry,
  makeControls,
  loadTextures
} from './utils';

const props = {
  blendingMode: {
    'THREE.NoBlending': THREE.NoBlending,
    'THREE.NormalBlending': THREE.NormalBlending,
    'THREE.AdditiveBlending': THREE.AdditiveBlending,
    'THREE.SubtractiveBlending': THREE.SubtractiveBlending,
    'THREE.MultiplyBlending': THREE.MultiplyBlending,
    'THREE.CustomBlending': THREE.CustomBlending
  },

  combine: {
    'THREE.MultiplyOperation': THREE.MultiplyOperation,
    'THREE.MixOperation': THREE.MixOperation,
    'THREE.AddOperation': THREE.AddOperation
  },

  side: {
    'THREE.FrontSide': THREE.FrontSide,
    'THREE.BackSide': THREE.BackSide,
    'THREE.DoubleSide': THREE.DoubleSide
  },

  colors: {
    'THREE.NoColors': THREE.NoColors,
    'THREE.FaceColors': THREE.FaceColors,
    'THREE.VertexColors': THREE.VertexColors
  },

  SCREEN_HEIGHT: window.innerHeight - 2 * 100,
  SCREEN_WIDTH: window.innerWidth
};

let step = 0.0;

let renderer,
  scene,
  camera,
  composer,
  stats,
  orbctrl,
  clock,
  jupiter,
  io,
  europa,
  ganymede,
  callisto,
  sunlight,
  axis;

let renderPass,
  copyPass,
  horizontalBlurPass,
  verticalBlurPass,
  filmPass,
  ccPass,
  bloomPass;

let jupiterAnimatedMaterial, jupiterStaticMaterial;

let findex = 0;

const textures = loadTextures();

const controls = makeControls({ textureMapKeys: textures.textureMapKeys, props });

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: controls.antialias,
    alpha: true
  });

  renderer.setSize(props.SCREEN_WIDTH, props.SCREEN_HEIGHT);
  renderer.setClearColor(controls.backgroundColor);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.top = 100 + 'px';
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.backgroundColor = '#000';
  document.getElementById('contents').appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    45,
    props.SCREEN_WIDTH / props.SCREEN_HEIGHT,
    0.001,
    1500000
  );
  camera.position.set(0, 0, 100);
  camera.setFocalLength(controls.focalLength);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(controls.backgroundColor, controls.fogDensity);
  orbctrl = new THREE.OrbitControls(camera, renderer.domElement);

  clock = new THREE.Clock();

  jupiterAnimatedMaterial = new THREE.ShaderMaterial({
    defines: {
      // USE_SHADOWMAP : ''
    },
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib['lights'],
      THREE.UniformsLib['shadowmap'],
      {
        tDiffuse1: { type: 't', value: null }, // first frame
        tDiffuse2: { type: 't', value: null }, // second frame
        tDiffuse3: { type: 't', value: null }, // static texture
        mixRatio: { type: 'f', value: 0.5 }, // mix ratio between 1 and 2 frame
        staticRatio: { type: 'f', value: 0.5 }, // mix ratio between static and dynamic (result of mixing 2 frames)
        opacity: { type: 'f', value: controls.opacity }
      }
    ]),
    vertexShader: shaderParse(vertexShaderSrc),
    fragmentShader: shaderParse(fragmentShaderSrc)
  });

  jupiterAnimatedMaterial.uniforms['tDiffuse1'].value = textures.frames[findex];
  jupiterAnimatedMaterial.uniforms['tDiffuse2'].value = textures.frames[findex + 1];
  jupiterAnimatedMaterial.uniforms['tDiffuse3'].value = textures.textureMaps.tx;
  jupiterAnimatedMaterial.uniforms['mixRatio'].value = controls.cloudspeed;
  jupiterAnimatedMaterial.uniforms['staticRatio'].value = controls.staticMix;
  jupiterAnimatedMaterial.lights = true;

  jupiterStaticMaterial = new THREE.MeshPhongMaterial({
    // // material
    visible: true,
    transparent: controls.transparent,
    opacity: controls.opacity,
    alphaTest: controls.alphaTest,
    depthTest: controls.depthTest,
    depthWrite: controls.depthWrite,
    side: controls.side,
    blending: THREE.AdditiveBlending,
    flatShading : controls.flatShading,

    map: textures.textureMaps.none,
    aoMap: textures.textureMaps.none,
    aoMapIntensity: controls.aoMapIntensity,
    normalMap: textures.textureMaps.none,
    normalScale: controls.normalScale,
    lightMap: textures.textureMaps.none,
    alphaMap: textures.textureMaps.none,
    emissiveMap: textures.textureMaps.none,
    emissive: controls.emissiveColor,
    emissiveIntensity: controls.emissiveIntensity,
    specularMap: textures.textureMaps.none,
    specular: controls.specular,
    shininess: controls.shininess,
    displacementMap: textures.textureMaps.none,
    displacementScale: controls.displacementScale,
    bumpMap: textures.textureMaps.none,
    bumpScale: controls.bumpScale,
    wireframe: controls.wireframe,
    wireframeLinewidth: controls.wireframeLinewidth
  });

  const jupiterGeometry = makeGeometry(new THREE.SphereGeometry(1.0, 128.0, 128.0), {
    scale: new THREE.Matrix4().makeScale(1.064874392, 1.0, 1.064874392)
  });

  jupiter = new THREE.Mesh(jupiterGeometry, jupiterAnimatedMaterial);
  jupiter.rotation.x = (3.13 / 180.0) * Math.PI; // axial tilt
  jupiter.receiveShadow = true;
  jupiter.castShadow = false;
  camera.lookAt(jupiter);
  scene.add(jupiter);

  io = makeMesh('io', {
    geometry: makeGeometry(new THREE.SphereGeometry(0.027247435, 128.0, 128.0), {
      scale: new THREE.Matrix4().makeScale(1.0061748634, 1.0, 0.9981270313)
    }),
    material: new THREE.MeshPhongMaterial({
      map: textures.textureMaps.io,
      shininess: 0,
      bumpMap : textures.textureMaps.iobump
    }),
    castShadow: true,
    receiveShadow: true,
    orbit: createOrbit('ioOrbit', 5.874783193, 5.922340961, 0.05)
  })(scene);

  europa = makeMesh('europa', {
    geometry: new THREE.SphereGeometry(0.023346397, 128.0, 128.0),
    material: new THREE.MeshPhongMaterial({
      map: textures.textureMaps.europa,
      bumpMap: textures.textureMaps.europabump,
      bumpScale: 0.0001,
      specularMap: textures.textureMaps.europabump,
      specular: new THREE.Color('#f0f7ff'),
      shininess: 1
    }),
    castShadow: true,
    receiveShadow: true,
    orbit: createOrbit('euOrbit', 9.298942539, 9.475186035, 0.47)
  })(scene);

  ganymede = makeMesh('ganymede', {
    geometry: new THREE.SphereGeometry(0.039357406, 128.0, 128.0),
    material: new THREE.MeshPhongMaterial({
      map: textures.textureMaps.ganymede,
      bumpMap: textures.textureMaps.ganymedebump,
      bumpScale: 0.001,
      shininess: 0
    }),
    castShadow: true,
    receiveShadow: true,
    orbit: createOrbit('gmOrbit', 14.955519499, 14.989089688, 0.21)
  })(scene);

  callisto = makeMesh('callisto', {
    geometry: new THREE.SphereGeometry(0.036053191, 128.0, 128.0),
    material: new THREE.MeshPhongMaterial({
      map: textures.textureMaps.callisto,
      shininess: 0
    }),
    castShadow: true,
    receiveShadow: true,
    orbit: createOrbit('caOrbit', 26.142785207, 26.53443742, 0.51)
  })(scene);

  addLight(0.995, 0.5, 0.9, 0, 0, 643.462171299);

  const ambientLight = new THREE.AmbientLight(new THREE.Color('#000000'));
  ambientLight.name = 'ambientLight';
  scene.add(ambientLight);

  axis = new THREE.AxesHelper(30);
  axis.visible = controls.axes;
  scene.add(axis);

  createStars();
  createPasses();
  onToggleShaders();
  createGUI();
  clock.start();
  loop();
}

const animateJupiter = () => {
  if(controls.animated) {

    let mixratio = jupiterAnimatedMaterial.uniforms['mixRatio'].value;
    mixratio += controls.cloudspeed;

    if (mixratio > 1.0) {
      //findex++;

      if (findex > 12) {
        findex = 0;
        // jupiter rotate (no jump back for frames)
        //jupiter.rotation.y -= Math.PI / 64.0;
      }
      jupiterAnimatedMaterial.uniforms['tDiffuse1'].value = textures.frames[findex];
      jupiterAnimatedMaterial.uniforms['tDiffuse2'].value = textures.frames[++findex];
      mixratio = 0.0;
    }
    jupiterAnimatedMaterial.uniforms['mixRatio'].value = mixratio;
    jupiter.material.needsUpdate = true;
  }
};

function loop() {
  composer.render();

  const delta = clock.getDelta(); // returns time in seconds from last call of this method.

  step += delta * controls.timestep;

  //TWEEN.update();

  animateJupiter();

  filmPass.uniforms['time'].value = Math.random();

  jupiter.rotation.y += 2 * Math.PI * delta * controls.timestep * 0.00000293; // or * controls.rotationY; // 2 * Math.PI / (60 * 1/35730);  0.00000293- real time rotation

  // update moons position
  const iospeed = 2 * Math.PI * 0.000006542 * step;

  io.position.x = 5.874783193 * Math.cos(iospeed);
  io.position.z = -(5.922340961 * Math.sin(iospeed));

  europa.position.x = 9.298942539 * Math.cos(iospeed * 0.498182999);
  europa.position.z = -(9.475186035 * Math.sin(iospeed * 0.498182999));

  ganymede.position.x = 14.955519499 * Math.cos(iospeed * 0.247274428);
  ganymede.position.z = -(14.989089688 * Math.sin(iospeed * 0.247274428));

  callisto.position.x = 26.142785207 * Math.cos(iospeed * 0.106006117);
  callisto.position.z = -(26.53443742 * Math.sin(iospeed * 0.106006117));

  orbctrl.update();

  // stats.update();

  requestAnimationFrame(loop);
}

function addLight(h, s, l, x, y, z) {

  sunlight = new THREE.PointLight(0xffffff, 1.5);
  sunlight.color.setHSL(h, s, l);
  sunlight.position.set(x, y, z);
  sunlight.castShadow = true;
  sunlight.shadowMapEnabled = true;
  sunlight.shadow.mapSize.height = 1024;
  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.camera.near = 0.001;
  sunlight.shadow.camera.far = 150000;
  sunlight.lookAt(jupiter);
  sunlight.name = 'sunlight';

  scene.add(sunlight);

  const flareColor = new THREE.Color(0xffffff);
  flareColor.setHSL(h, s, l + 0.5);

  const lensFlare = new THREE.Lensflare();
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[0], 256, 0.0, flareColor, THREE.AdditiveBlending));
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[1], 3, 0.0, flareColor, THREE.AdditiveBlending));
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[2], 60, 0.6, flareColor, THREE.AdditiveBlending));
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[2], 70, 0.7, flareColor, THREE.AdditiveBlending));
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[2], 120, 0.9, flareColor, THREE.AdditiveBlending));
  lensFlare.addElement(new THREE.LensflareElement(textures.flares[2], 70, 1.0, flareColor, THREE.AdditiveBlending));

  lensFlare.customUpdateCallback = (object) => {
    let f, fl = object.lensFlares.length;
    let flare;
    let vecX = -object.positionScreen.x * 2;
    let vecY = -object.positionScreen.y * 2;
    for (f = 0; f < fl; f++) {
      flare = object.lensFlares[f];
      flare.x = object.positionScreen.x + vecX * flare.distance;
      flare.y = object.positionScreen.y + vecY * flare.distance;
      flare.rotation = 0;
    }
    object.lensFlares[1].y += 0.025;
    object.lensFlares[2].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad(45);
  };
  lensFlare.position.copy(sunlight.position);
  lensFlare.name = 'sunflare';
  scene.add(lensFlare);
}

function createOrbit(name, radiusx, radiusy, inclinationDegree) {
  const curve = new THREE.EllipseCurve(
    0,
    0,
    radiusx,
    radiusy,
    0,
    2 * Math.PI,
    false
  );

  const geo = new THREE.Geometry().setFromPoints(curve.getPoints(512));
  const mat = new THREE.LineBasicMaterial({ fog: true, color: 0x545454 });
  const ellipse = new THREE.Line(geo, mat); // object3d
  ellipse.rotation.x = Math.PI / 2.0;
  ellipse.rotation.z = (inclinationDegree / 180) * Math.PI;
  ellipse.name = name;
  ellipse.visible = controls.helpers;

  return ellipse;
}

function createStars() {
  var starfieldRadius = 150000;
  var starsCount = 100000;
  // var TAU = Math.PI * 2;

  var starsGeo = new THREE.Geometry();

  for (var i = 0; i < starsCount; i++) {
    var x = Math.random() * 2 - 1;
    var y = Math.random() * 2 - 1;
    var z = Math.random() * 2 - 1;
    var v = new THREE.Vector3(x, y, z);
    v.normalize();
    v.multiplyScalar(starfieldRadius);

    starsGeo.vertices.push(v);

    var c = Math.random();
    starsGeo.colors.push(new THREE.Color(c / 1.2, c / 1.05, c));
  }

  var starsMat = new THREE.PointsMaterial({
    size: 500 + Math.random() * 500,
    vertexColors: THREE.VertexColors,
    blending: THREE.AdditiveBlending
  });

  var stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);
}

function createPasses() {
  renderPass = new THREE.RenderPass(scene, camera);

  horizontalBlurPass = new THREE.ShaderPass(THREE.HorizontalBlurShader);
  horizontalBlurPass.uniforms['h'].value = 1.0 / controls.hBlurLevel;

  verticalBlurPass = new THREE.ShaderPass(THREE.VerticalBlurShader);
  verticalBlurPass.uniforms['v'].value = 1.0 / controls.vBlurLevel;

  filmPass = new THREE.ShaderPass(THREE.FilmShader);
  filmPass.uniforms['time'].value = controls.filmTime;
  filmPass.uniforms['grayscale'].value = controls.filmGrayscale;
  filmPass.uniforms['sCount'].value = controls.filmSCount;
  filmPass.uniforms['sIntensity'].value = controls.filmSIntensity;
  filmPass.uniforms['nIntensity'].value = controls.filmNIntensity;

  bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( props.SCREEN_WIDTH, props.SCREEN_HEIGHT ), 1.5, 0.4, 0.85 );
  bloomPass.renderToScreen = true;
  bloomPass.threshold = controls.bloomThreshold;
  bloomPass.strength = controls.bloomStrength;
  bloomPass.radius = controls.bloomRadius;

  ccPass = new THREE.ShaderPass(THREE.ColorCorrectionShader);
  ccPass.uniforms['powRGB'].value = new THREE.Vector3(
    controls.ccPowerFactor,
    controls.ccPowerFactor,
    controls.ccPowerFactor
  );

  copyPass = new THREE.ShaderPass(THREE.CopyShader);
  copyPass.renderToScreen = true;
}

function onToggleShaders() {
  composer = new THREE.EffectComposer(renderer);
  renderPass.setSize = () => {};
  composer.addPass(renderPass);

  if (controls.hBlurEnabled) composer.addPass(horizontalBlurPass);
  if (controls.vBlurEnabled) composer.addPass(verticalBlurPass);
  if (controls.filmEnabled) composer.addPass(filmPass);
  if (controls.bloomEnabled) {
    composer.addPass(bloomPass);
  }
  if (controls.ccEnabled) composer.addPass(ccPass);

  composer.addPass(copyPass);

  copyPass.renderToScreen = true;
}

function createGUI() {
  const gui = new dat.GUI();
  gui.close();
  const f01 = gui.addFolder('Camera');

  f01.add(controls, 'fov', 0.1, 180)
    .step(0.1)
    .onChange(function(value) {
      camera.fov = value;
      camera.updateProjectionMatrix();
    });

  f01.add(controls, 'focalLength', 1, 1200)
    .step(1)
    .onChange(function(value) {
      camera.setFocalLength(value);
      camera.updateProjectionMatrix();
    });

  const f02 = gui.addFolder('Scene');

  f02.add(controls, 'timestep', -10000, 10000).step(100);

  f02.addColor(controls, 'backgroundColor').onChange(function(value) {
    renderer.setClearColor(new THREE.Color(value));
    scene.fog.color = new THREE.Color(value);
  });

  f02.addColor(controls, 'ambientColor').onChange(function(value) {
    scene.getObjectByName('ambientLight').color = new THREE.Color(value);
  });

  f02.add(controls, 'fogDensity', 0.0, 1.0)
    .step(0.01)
    .onChange(function(value) {
      scene.fog.density = value;
    });

  f02.add(controls, 'helpers').onChange(function(value) {
    scene.getObjectByName('ioOrbit').visible = value;
    scene.getObjectByName('euOrbit').visible = value;
    scene.getObjectByName('gmOrbit').visible = value;
    scene.getObjectByName('caOrbit').visible = value;
    // scene.getObjectByName('sunlightHelper').visible = value;
  });

  f02.add(controls, 'axes').onChange(function(value) {
    axis.visible = value;
  });

  const f03 = gui.addFolder('Postprocessing');

  f03.add(controls, 'hBlurEnabled').onChange(onToggleShaders);
  f03.add(controls, 'vBlurEnabled').onChange(onToggleShaders);
  f03.add(controls, 'hBlurLevel', window.innerWidth, window.innerWidth * 2.5)
    .step(1.0)
    .onChange(function() {
      horizontalBlurPass.uniforms['h'].value = 1.0 / controls.hBlurLevel;
    });
  f03.add(controls, 'vBlurLevel', window.innerHeight, window.innerHeight * 2.5)
    .step(1.0)
    .onChange(function() {
      verticalBlurPass.uniforms['v'].value = 1.0 / controls.vBlurLevel;
    });
  f03.add(controls, 'bloomEnabled').onChange( onToggleShaders );

  f03.add(controls, 'exposure', 0.0, 4 ).onChange( function ( value ) {
    renderer.toneMappingExposure = Math.pow( value, 4.0 );
  } );
  f03.add(controls, 'bloomThreshold', 0.0, 5.0 ).onChange( function ( value ) {
    bloomPass.threshold = +value;
  } );
  f03.add(controls, 'bloomStrength', 0.0, 5.0 ).onChange( function ( value ) {
    bloomPass.strength = +value;
  } );
  f03.add(controls, 'bloomRadius', 0.0, 5.0 ).step( 0.05 ).onChange( function ( value ) {
    bloomPass.radius = +value;
  } );

  f03.add(controls, 'filmEnabled').onChange(onToggleShaders);

  f03.add(controls, 'filmTime', 0.0, 1.0)
    .step(0.01)
    .onChange(function() {
      filmPass.uniforms['time'].value = controls.filmTime;
    });

  f03.add(controls, 'filmGrayscale').onChange(function() {
    filmPass.uniforms['grayscale'].value = controls.filmGrayscale;
  });

  f03.add(controls, 'filmSCount', 512, 8192)
    .step(32)
    .onChange(function() {
      filmPass.uniforms['sCount'].value = controls.filmSCount;
    });

  f03.add(controls, 'filmSIntensity', 0.0, 1.0)
    .step(0.01)
    .onChange(function() {
      filmPass.uniforms['sIntensity'].value = controls.filmSIntensity;
    });

  f03.add(controls, 'filmNIntensity', 0.0, 1.0)
    .step(0.01)
    .onChange(function() {
      filmPass.uniforms['nIntensity'].value = controls.filmNIntensity;
    });

  f03.add(controls, 'ccEnabled').onChange(onToggleShaders);

  f03.add(controls, 'ccPowerFactor', 1.0, 3.0)
    .step(0.1)
    .onChange(function() {
      ccPass.uniforms['powRGB'].value.set(
        controls.ccPowerFactor,
        controls.ccPowerFactor,
        controls.ccPowerFactor
      );
    });

  const f1 = gui.addFolder('Jupiter Basic');

  //f1.add( controls, 'rotationY', -1.0, 1.0 ); // its constant
  f1.add(controls, 'animated').onChange(function() {
    if (controls.animated) {
      jupiter.material = jupiterAnimatedMaterial;
      needsUpdate(jupiter.material, jupiter.geometry);
    } else {
      jupiter.material = jupiterStaticMaterial;
      needsUpdate(jupiter.material, jupiter.geometry);
    }
  });

  f1.add(controls, 'cloudspeed', 0.001, 0.5).step(0.002);

  f1.add(controls, 'staticMix', 0.0, 1.0)
    .step(0.01)
    .onChange(function() {
      jupiterAnimatedMaterial.uniforms['staticRatio'].value = controls.staticMix;
    });

  f1.add(jupiter.material, 'transparent');

  f1.add(controls, 'opacity', 0.0, 1.0).onChange(function() {
    if (controls.transparent) {
      jupiterAnimatedMaterial.uniforms.opacity.value = controls.opacity;
      needsUpdate(jupiter.material, jupiter.geometry);
    }
  });

  f1.add(jupiter.material, 'alphaTest', 0, 1)
    .step(1)
    .onChange(needsUpdate(jupiter.material, jupiter.geometry));

  f1.add(jupiter.material, 'depthTest');

  f1.add(jupiter.material, 'depthWrite');

  f1.add(jupiter.material, 'side', props.side).onChange(
    needsUpdate(jupiter.material, jupiter.geometry)
  );

  f1.add(jupiter.material, 'flatShading', controls.flatShading).onChange(
    needsUpdate(jupiter.material, jupiter.geometry)
  );

  const f2 = gui.addFolder('Jupiter Maps');

  f2.add(controls, 'alphaMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'alphaMap', textures.textureMaps)
  );

  f2.add(controls, 'map', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'map', textures.textureMaps)
  );

  f2.add(controls, 'normalMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'normalMap', textures.textureMaps)
  );

  f2.add(controls, 'normalScale', 0.0, 5.0)
    .step(0.1)
    .onChange(function() {
      jupiter.material.normalScale = controls.normalScale;
    });

  f2.add(controls, 'lightMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'lightMap', textures.textureMaps)
  );

  f2.add(controls, 'aoMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'aoMap', textures.textureMaps)
  );

  f2.add(controls, 'aoMapIntensity', 0.0, 5.0).step(0.2);

  f2.add(controls, 'specularMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'specularMap', textures.textureMaps)
  );

  f2.addColor(controls, 'specular').onChange(function(value) {
    jupiter.material.specular = new THREE.Color(value);
  });

  f2.add(controls, 'shininess', 0.0, 100.0)
    .step(0.2)
    .onChange(function() {
      jupiter.material.shininess = controls.shininess;
    });

  f2.add(controls, 'emissiveMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'emissiveMap', textures.textureMaps)
  );

  f2.addColor(controls, 'emissiveColor').onChange(function(value) {
    jupiter.material.emissive = new THREE.Color(value);
  });
  f2.add(controls, 'emissiveIntensity', 0.0, 2.0)
    .step(0.05)
    .onChange(function() {
      jupiter.material.emissiveIntensity = controls.emissiveIntensity;
    });

  f2.add(controls, 'bumpMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'bumpMap', textures.textureMaps)
  );

  f2.add(controls, 'bumpScale', 0.0, 0.05)
    .step(0.0001)
    .onChange(function() {
      jupiter.material.bumpScale = controls.bumpScale;
    });

  f2.add(controls, 'displacementScale', 0.0, 0.1).onChange(function() {
    jupiter.material.displacementScale = controls.displacementScale;
  });

  f2.add(controls, 'displacementMap', textures.textureMapKeys).onChange(
    updateTexture(jupiter.material, 'displacementMap', textures.textureMaps)
  );

  const f3 = gui.addFolder('Sunlight');

  f3.add(controls, 'sunpositionX', -5000, 5000).onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    var sunflare = scene.getObjectByName('sunflare');
    sunlight.position.x = controls.sunpositionX;
    sunflare.position.x = controls.sunpositionX;
    sunlight.lookAt(jupiter.position);
    jupiter.material.needsUpdate = true;
  });

  f3.add(controls, 'sunpositionZ', -12000, 12000)
    .step(100)
    .onChange(function() {
      var sunlight = scene.getObjectByName('sunlight');
      var sunflare = scene.getObjectByName('sunflare');
      sunlight.position.z = controls.sunpositionZ;
      sunflare.position.z = controls.sunpositionZ;
      sunlight.lookAt(jupiter.position);
      jupiter.material.needsUpdate = true;
    });

  f3.add(controls, 'sunpositionY', -500, 500).onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    var sunflare = scene.getObjectByName('sunflare');
    sunlight.position.y = controls.sunpositionY;
    sunflare.position.y = controls.sunpositionY;
    sunlight.lookAt(jupiter.position);
    jupiter.material.needsUpdate = true;
  });

  f3.add(controls, 'sunlightVisible').onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    sunlight.visible = controls.sunlightVisible;
  });

  f3.addColor(controls, 'sunlightColor').onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    sunlight.color = new THREE.Color(controls.sunlightColor);
  });

  f3.add(controls, 'sunlightIntensity', 0.0, 5.0).onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    sunlight.intensity = controls.sunlightIntensity;
  });

  f3.add(controls, 'castShadow').onChange(function() {
    var sunlight = scene.getObjectByName('sunlight');
    sunlight.castShadow = controls.castShadow;
    jupiter.material.needsUpdate = true;
  });
}

function onResize() {
  props.SCREEN_WIDTH = window.innerWidth;
  props.SCREEN_HEIGHT = window.innerHeight - 2 * 100;

  camera.aspect = props.SCREEN_WIDTH / props.SCREEN_HEIGHT;

  renderer.setSize(props.SCREEN_WIDTH, props.SCREEN_HEIGHT);

  composer.setSize(props.SCREEN_WIDTH, props.SCREEN_HEIGHT);

  camera.updateProjectionMatrix();
}

window.document.onkeydown = function(e) {
  if (e.keyCode === 83) {
    // s
    stats.domElement.style.zIndex *= -1;
  }
};

/* 2DO */
// - on event postprocessing effect (glitch on re-looping jupiter animation)
// - fix orbit inclination y axis error
// - antialias? -> make blurred edges (bloom?)
// - camera fly-by navigation including: focal length smooth travel - design short camera takes
// - cubemap sky instead of generated starfield
// - loader
// - shadow cast / received with sunlight

/* DATA FOR PLANETS */

// radiusx = 3,660.0 / 2 = 1830
// radiusy = 3,637.4 / 2 = 1818.7
// radiusz = 3,630.6 / 2 = 1815.3
//
// JUPITER
// Jupiter radiusx 71492 km
// Jupiter radiusy 66854 km / 1
// Jupiter radiusz 71492 km
// Jupiter distanceFromSun avg 778412020 km  / 5,20336	  j.a
// Jupiter distanceFromSun min 740742600 km  / 4,95155843 j.a.
// Jupiter distanceFromSun max 816081455 km  / 5,45516759 j.a.
// Jupiter distanceFromSun where jupiter radius = 1 -> 11643.462171299
//
// rotation around its own axis 2PI --- 9 h 55 m 30 s, how much will it be for 1 s ?
// 2PI --- 35730 seconds
// x ---- 1
// x =  2 PI / 35730
// multiply x * timedelta variable
//
// BRIGHT ZONES AND DARK BELTS
// The cloud tops are higher in a belt, and lower in a zone.
// Measurements show that the winds of Jupiter, within a belt or a zone are usually 225 miles/hour!
// Wind blows east in a belt, and west in a zone. The clouds rise up in a belt, and drop down in a zone,
//
//														Radius (km)
// 						Mass (10^20 kg)          avg	x 		y 		z 	     Mean density    (radius, jupiter =1)
// Jupiter 												71492   66854	71492
// Io (JI) radius avg              893.2       1821.6   1830    1818.7	1815.3		3530             0.027247435
// Europa (JII)                    480.0       1560.8   NA     	NA		NA			3010             0.023346397
// Ganymede (JIII)                1481.9       2631.2   NA     	NA		NA	     	1940             0.039357406
// Callisto (JIV)                 1075.9       2410.3   NA     	NA		NA	     	1830         	 0.036053191
//
//                                   			 axis        Period*    Period    Inclination  Eccentricity
//                              (km)		(Jovian Radii)    (days)     (days)    (degrees)
// Io (JI)                      421600		5.897163319     1.769138      S         0.04        0.004
// Io Periapsis					420000		5.874783193
// Io Apoapsis					423400 		5.922340961
// Europa (JII)                 670900 		9.384266771     3.551181      S         0.47        0.0101
// Europa periapsis				664800		9.298942539
// Europa apoapsis  			677400 		9.475186035
// Ganymede (JIII)             1070400 		    14.97       7.154553      S         0.21        0.0015
// Ganymede Periapsis          1069200 		14.955519499
// Ganymede Apoapsis 		   1071600		14.989089688
// Callisto (JIV)              1882700 		    26.33      16.689018      S         0.51        0.007
// Callisto Periapsis  		   1869000 	    26.142785207
// Callisto Apoapsis		   1897000		26.53443742

export default {
  init, onResize
};
