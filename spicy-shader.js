// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glsl = require("glslify");
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -6);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 16);

  const baseGeom = new THREE.IcosahedronGeometry(1, 1);
  const points = baseGeom.vertices;

  const vertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vPosition;

  void main(){
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
  }
  `;

  const fragmentShader = glsl(/* glsl */`
  #pragma glslify: noise = require('glsl-noise/simplex/3d')
  varying vec2 vUv;
  varying vec3 vPosition;

  uniform vec3 color;
  uniform float time;

  uniform vec3 points[POINTS_COUNT];

  void main() {    
    float dist = 10000.0;

    for(int i=0; i < POINTS_COUNT; i++){
      vec3 p = points[i];
      float d = distance(vPosition, p);
      dist = min(d,dist);
    }

    float mask = step(0.15,dist);
    mask = 1.0 - mask;

    vec3 fragColor = mix(color,vec3(1.0), mask);

    gl_FragColor = vec4(vec3(fragColor),1.0);
  }
  `);


  // Setup a material
  const material = new THREE.ShaderMaterial({
    defines: {
      POINTS_COUNT: points.length,
    },
    uniforms: {
      points: { value: points },
      time: { value: 0 },
      color: { value: new THREE.Color("tomato") }
    },
    vertexShader,
    fragmentShader,
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      material.uniforms.time.value = time;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
