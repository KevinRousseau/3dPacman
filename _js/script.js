'use strict';

// some features need the be polyfilled..
// https://babeljs.io/docs/usage/polyfill/

// import 'babel-core/polyfill';
// or import specific polyfills
import {Grid, Cube} from './svg/';

let ThreeBSP = require('three-csg');
require('csg');

let keys = ['Down', 'Right', 'Left', 'Up'];
let startSpeed = 2;
let maxSpeed = 15;
let result;

//tags/elements in html
let _three;

//objects
let windowSize;

//three objects
let scene,
  camera,
  renderer;

let grid,
  outerWalls = [],
  innerWalls = [],
  xPosGrid = [],
  zPosGrid = [];

let cube,
  cubeHor,
  cubeVer,
  cubeSize,
  draw = true;

let OrbitControls = require('three-orbit-controls')(THREE);

const init = () => {
  _three = $('.three');

  windowSize = { //1140 x 750
    'width': window.innerWidth,
    'height': window.innerHeight
  };

  cubeSize = {
    'width': 20,
    'height': 1,
    'depth': 20
  };

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

  //light
  let light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.6 );
  light.position.set(20, 65, 0);
  light.castShadow = true;
  light.intensity = 1;
  scene.add(light);

  //grid
  grid = new Grid(windowSize);
  scene.add(grid.render());

  makePacman();

  //new OrbitControls(camera);
  let controls = new OrbitControls(camera); //bestuur camera met muis
  controls.enabled = false; //uitgeschakeld

  setWalls();
};

const makePacman = () => {
  //FLOOR
  let floorMaterial = new THREE.MeshLambertMaterial( {color: 0x444444, side: THREE.DoubleSide} );
  let floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  let floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.5;
  floor.rotation.x = Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  //PACMAN SPHERE
  let sphereGeometry = new THREE.SphereGeometry(5, 50, 50, 0);
  let sphereMaterial = new THREE.MeshLambertMaterial( {color: 0xffee00, side: THREE.FrontSide} );
  let sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  sphere.geometry.computeVertexNormals();

  sphere.position.y = 5;
  sphere.position.x = 50;

  //shadow
  sphere.castShadow = true;
  sphere.receiveShadow = true;

  //TRIANGLE
  let triangleMaterial = new THREE.MeshLambertMaterial({color: 0x000000});

  // Shape to extrude
  let shape = new THREE.Shape([
    new THREE.Vector2(0, 1),
    new THREE.Vector2(-5, 1),
    new THREE.Vector2(-2.5, 6)
  ]);

  let v1 = new THREE.Vector3(0, 0, 0);
  let v2 = new THREE.Vector3(0, 0, 10);
  let path = new THREE.LineCurve3(v1, v2);
  let extrudeSettings2 = {
    bevelEnabled: false,
    steps: 1,
    extrudePath: path
  };

  let geometry2 = new THREE.ExtrudeGeometry(shape, extrudeSettings2);
  let mesh2 = new THREE.Mesh(geometry2, triangleMaterial);
  mesh2.position.set(44, 2, -5);

  //shadow
  mesh2.castShadow = true;
  mesh2.receiveShadow = true;

  let sphereBSP = new ThreeBSP(sphere);
  let mesh2BSP = new ThreeBSP(mesh2);
  let subtractBSP = sphereBSP.subtract(mesh2BSP);
  result = subtractBSP.toMesh(new THREE.MeshLambertMaterial({ color: 0xffee00}));
  //name to use later
  result.name = 'pacman';

  scene.add(result);

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
      draw = false;
      raiseWalls();
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

    scene.add(cube.render());

    innerWalls.push(cube);
  }

  /*if(innerWalls.length === 10000 && draw){
    draw = false;
    raiseWalls();
  }*/
};

const raiseWalls = () => {
  outerWalls.forEach(wallCube => { //scale muren naar normale grootte (bij camera draaien)
    wallCube._scaleUp();
  });

  innerWalls.forEach(innerCube => {
    innerCube._scaleUp();
  });

  grid.changepos();
  tiltCamera();
};

const tiltCamera = () => {
  //set camera on pacman
};

const movePacman = (event, pacman) => {

  let keypressed = event.keyIdentifier;
  if(keys.indexOf(keypressed) === -1){
    return;
  }
  event.preventDefault();

  if(startSpeed>=maxSpeed){
    startSpeed+=0;
  }else{
    startSpeed+=1;
  }

  switch(keypressed){

  case 'Up':
    pacman.position.x-=startSpeed;
    pacman.rotation.y = 0;
    break;

  case 'Down':
    pacman.position.x+=startSpeed;
    pacman.rotation.y = Math.PI;
    break;

  case 'Left':
    pacman.position.z+=startSpeed;
    pacman.rotation.y = Math.PI/2;
    break;

  case 'Right':
    pacman.position.z-=startSpeed;
    pacman.rotation.y = (Math.PI/2)*3;
    break;
  }
};

const setFocus = (object, focusCamera) => {
  focusCamera.position.set(object.position.x + 20, object.position.y + 10, object.position.z);
  focusCamera.lookAt(object.position);
};

/*const rotate = (pacman, angle) => {
  let easing = pacman.rotation.y - angle;
  console.log(easing);
  pacman.rotation.y+=0.001*easing;
};*/

const render = () => {
  //let pacman = scene.getObjectByName('pacman');

  setFocus(result, camera);

  let shouldHandleKeyDown = true;
  document.onkeydown = function(event){
    if (!shouldHandleKeyDown) return;
    shouldHandleKeyDown = false;
    movePacman(event, result);
  };

  document.onkeyup = function(){
    shouldHandleKeyDown = true;
  };

  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

init();
