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
    'width': 15,
    'height': 15,
    'depth': 15
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
  grid = new THREE.GridHelper( 400, 15 );
  grid.setColors( 0xffffff, 0xffffff );
  grid.position.x = 2.5;
  grid.position.z = 2.5;
  grid.position.z = 2.5;
  scene.add(grid);

  let geometry = new THREE.BoxGeometry(cubeSize.width, cubeSize.height, cubeSize.depth, 15, 15, 15); //15 is segmenten voor width, height, depth
  let material = new THREE.MeshBasicMaterial({color: 0x00ff00 });
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
