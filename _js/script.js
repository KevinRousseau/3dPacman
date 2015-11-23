'use strict';

// some features need the be polyfilled..
// https://babeljs.io/docs/usage/polyfill/

// import 'babel-core/polyfill';
// or import specific polyfills
// import {$} from './helpers/util';

//tags/elements in html
let _three;

//objects
let windowSize;

//three objects
let scene,
  camera,
  renderer;

let grid;

let cube,
  cubeSize;

let OrbitControls = require('three-orbit-controls')(THREE);

const init = () => {
  _three = $('.three');

  windowSize = {
    'width': window.innerWidth,
    'height': window.innerHeight
  };

  cubeSize = {
    'width': 20,
    'height': 20,
    'depth': 20
  };

  if(_three){
    setScene();
  }
};

const setScene = () => {
  //three setup
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, windowSize.width / windowSize.height, 0.1, 1000 );
  camera.position.set(0, 250, 0); //topview

  renderer = new THREE.WebGLRenderer(/*{alpha: true}*/); //alpha true zorgt dat de achtergrond (zwart) weg is
  renderer.setSize(windowSize.width, windowSize.height);

  _three.append(renderer.domElement);

  //grid
  grid = new THREE.GridHelper( 400, 20 );
  grid.setColors( 0xffffff, 0xffffff );
  //herpositioneren grid zodat 0 van cube overeenkomt op grid
  grid.position.x = 10;
  grid.position.z = 10;
  grid.position.z = 10;
  scene.add(grid);

  let geometry = new THREE.BoxGeometry(cubeSize.width, cubeSize.height, cubeSize.depth, 5, 5, 5); //laatste 3 parameterz zijn segmenten voor width, height, depth
  let material = new THREE.MeshBasicMaterial({color: 0x0000ff});
  cube = new THREE.Mesh(geometry, material);
  cube.position.y = cubeSize.height/2;
  scene.add( cube );

  //camera.position.z = 250;

  new OrbitControls(camera); //bestuur camera met muis

  render();
};

const render = () => {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

init();
