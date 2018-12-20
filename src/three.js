const THREE = require('three');

window.THREE = THREE;

require('three/examples/js/controls/OrbitControls');
require('three/examples/js/postprocessing/EffectComposer');
require('three/examples/js/postprocessing/MaskPass');
require('three/examples/js/postprocessing/RenderPass');
require('three/examples/js/postprocessing/ShaderPass');
require('three/examples/js/shaders/CopyShader');
require('three/examples/js/shaders/FilmShader');
require('three/examples/js/shaders/ColorCorrectionShader');
require('three/examples/js/shaders/HorizontalBlurShader');
require('three/examples/js/shaders/VerticalBlurShader');
require('three/examples/js/objects/Lensflare');
require('three/examples/js/shaders/LuminosityHighPassShader');
require('three/examples/js/shaders/ConvolutionShader');
require('three/examples/js/postprocessing/UnrealBloomPass');

export default THREE;
