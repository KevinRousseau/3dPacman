'use strict';

// some features need the be polyfilled..
// https://babeljs.io/docs/usage/polyfill/

// import 'babel-core/polyfill';
// or import specific polyfills
import {Grid, Cube, Floor, Pacman} from './svg/';

let OrbitControls = require('three-orbit-controls')(THREE);
//let ThreeBSP = require('three-csg');
//require('csg');

//tags/elements in html & controls
let _three;
let keys = ['Down', 'Right', 'Left', 'Up'];

//sizes
let windowSize = { //1140 x 750
  'width': window.innerWidth,
  'height': window.innerHeight
};

let cubeSize = {
  'width': 20,
  'height': 1,
  'depth': 20
};

//three objects
let scene,
  camera,
  renderer;

let floor,
  grid,
  cube,
  cubeHor,
  cubeVer,
  pacman;

//arrays
let outerWalls = [],
  innerWalls = [],
  xPosGrid = [],
  zPosGrid = [];

//true/false
let follow = false,
  draw = true;


const init = () => {
  _three = $('.three');

  if(_three){
    setScene();
  }
};

const setScene = () => {
  //three setup
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, windowSize.width / windowSize.height, 0.1, 1000);
  camera.position.set(0, (windowSize.width/20)*4, 0); //topview

  renderer = new THREE.WebGLRenderer(/*{alpha: true}*/); //alpha true zorgt dat de achtergrond (zwart) weg is
  renderer.setSize(windowSize.width, windowSize.height);

  _three.append(renderer.domElement);

  //floor
  floor = new Floor(windowSize);
  scene.add(floor.render());

  //grid
  grid = new Grid(windowSize);
  scene.add(grid.render());

  //pacman
  pacman = new Pacman();
  scene.add(pacman.render());

  //light
  let light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.6 );
  light.position.set(20, 65, 0);
  light.castShadow = true;
  light.intensity = 1;
  scene.add(light);

  //new OrbitControls(camera);
  let controls = new OrbitControls(camera); //bestuur camera met muis
  controls.enabled = false; //uitgeschakeld

  setWalls();

  render();
};

const setWalls = () => {

  let leftWall = grid.position.x-(18.5*20);
  let topWall = grid.position.z-(9.5*20);

  //horizontale muren
  for(let i = topWall; i <= -(topWall); i += -(topWall*2)) {
    for(let j = leftWall; j <= -(leftWall); j += 20) {
      xPosGrid.push(j);
      cubeHor = new Cube(cubeSize);
      cubeHor._walls(i, j);
      scene.add(cubeHor.render());
      outerWalls.push(cubeHor);
    }
  }
  //verticale muren
  for(let i = leftWall; i <= -(leftWall); i += -(leftWall*2)) {
    for(let j = topWall; j <= -(topWall); j += 20) {
      zPosGrid.push(j);
      cubeVer = new Cube(cubeSize);
      cubeVer._walls(j, i);
      scene.add(cubeVer.render());
      outerWalls.push(cubeVer);
    }
  }

  drawWalls();
};

const drawWalls = () => {
  let drag = false;

  _three.mouseup(() => {
    drag = false;
  });

  _three.mousedown(() => {
    drag = true;
    drawSingleWall();

    _three.mousemove(() => {
      if(drag){
        drawSingleWall();
      }
    });
  });

  $('body').keyup((e) => {
    if(e.keyCode === 32){
      if(!follow){
        draw = false;
        drawCoins();
      }
    }
  });
};

const drawSingleWall = () => {
  if(draw){
    let vector = new THREE.Vector3();

    vector.set(
        (event.clientX / windowSize.width)*2-1,
        -(event.clientY / windowSize.height)*2+1,
        0.5);

    vector.unproject(camera);

    let dir = vector.sub(camera.position).normalize();

    let distance = -camera.position.y/dir.y;

    let pos = camera.position.clone().add(dir.multiplyScalar(distance));

    cube = new Cube(cubeSize);

    cube._singleBlock(pos, xPosGrid, zPosGrid);

    if(cube.position.x === 10 && cube.position.z === 10 ||
      cube.position.x === 10 && cube.position.z === -10 ||
      cube.position.x === -10 && cube.position.z === 10 ||
      cube.position.x === -10 && cube.position.z === -10){
      //don't add
    }else{
      scene.add(cube.render());
      innerWalls.push(cube);
    }
  }

  /*if(innerWalls.length === 10000 && draw){
    draw = false;
    raiseWalls();
  }*/
};

const drawCoins = () => {
  xPosGrid.forEach(() => {
    zPosGrid.forEach(num => {
      console.log(num);
    });
  });

  raiseWalls();
};

const raiseWalls = () => {
  outerWalls.forEach(wallCube => { //scale muren naar normale grootte (bij camera draaien)
    wallCube._scaleUp();
  });

  innerWalls.forEach(innerCube => {
    innerCube._scaleUp();
  });

  grid.changepos();
  floor.changepos();

  setFocus();
};

const setFocus = () => {
  camera.position.set(pacman.position.x + 80, pacman.position.y + 60, pacman.position.z + 50);
  camera.lookAt(pacman.position);
  follow = true;
};

const movePacman = (event, object) => {
  let keypressed = event.keyIdentifier;

  if(keys.indexOf(keypressed) === -1){
    return;
  }

  event.preventDefault();

  switch(keypressed){
  case 'Up':
    object.position.x-=10;
    object.rotation.y = 0;
    break;

  case 'Down':
    object.position.x+=10;
    object.rotation.y = Math.PI;
    break;

  case 'Left':
    object.position.z+=10;
    object.rotation.y = Math.PI/2;
    break;

  case 'Right':
    object.position.z-=10;
    object.rotation.y = (Math.PI/2)*3;
    break;
  }
};

const render = () => {
  if(follow){
    setFocus();
  }

  if(!draw){
    let shouldHandleKeyDown = true;

    document.onkeydown = e => {
      if (!shouldHandleKeyDown) return;
      shouldHandleKeyDown = false;
      movePacman(e, pacman);
    };

    document.onkeyup = () => {
      shouldHandleKeyDown = true;
    };
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

init();
