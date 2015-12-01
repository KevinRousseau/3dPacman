'use strict';

// some features need the be polyfilled..
// https://babeljs.io/docs/usage/polyfill/

// import 'babel-core/polyfill';
// or import specific polyfills
import {Grid, Cube, Floor, Pacman, Coin} from './svg/';
import {randomPos, closest} from './helpers/util';

let OrbitControls = require('three-orbit-controls')(THREE);
//let ThreeBSP = require('three-csg');
//require('csg');

//tags/elements in html & controls
let _three;
let keys = ['Down', 'Right', 'Left', 'Up'];

//socket.io
let socket;

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

let numCoins = 5;

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
  zPosGrid = [],
  coins = [],
  xGrid,
  zGrid;

//true/false
let follow = false,
  draw = true;

const init = () => {
  socket = io('http://localhost:3000');

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

  xGrid = xPosGrid;
  zGrid = zPosGrid;

  xGrid.splice(xGrid[0], 2);
  xGrid.pop();

  zGrid.splice(zGrid[0], 2);
  zGrid.pop();

  drawWalls();
};

const drawWalls = () => {
  //drag and draw
  /*let drag = false;

  _three.mouseup((e) => {
    drag = false;
  });

  _three.mousedown((e) => {
    drag = true;
    //drawSingleWall(e);

    _three.mousemove((e) => {
      if(drag){
        drawSingleWall(e);
      }
    });
  });*/

  //click and drag
  let posX;
  let posZ;
  let endPosX;
  let endPosZ;
  let drawDown = false;
  let drawUp = false;

  _three.mousedown((e) => {
    if(!drawDown){
      let c1 = convertPos(e);
      posX = closest(c1.x, xPosGrid);
      posZ = closest(c1.z, zPosGrid);
      drawSingleWall(convertPos(e));
      drawDown = true;
    }
  });

  _three.mousemove((e) => {
    if(drawDown && !drawUp){
      let c2 = convertPos(e);
      endPosX = closest(c2.x, xPosGrid);
      endPosZ = closest(c2.z, zPosGrid);
    }
  });

  _three.mouseup(() => {
    drawUp = true;
    if(drawUp){
      drawDown = false;
      drawUp = false;

      let betweenPos = {};

      if(posX === endPosX){
        if(posZ < endPosZ){
          for(let i = posZ+cubeSize.width; i <= endPosZ; i+=cubeSize.width){
            betweenPos.x = posX;
            betweenPos.z = i;
            drawSingleWall(betweenPos);
          }
        }else{
          for(let i = posZ-cubeSize.width; i >= endPosZ; i-=cubeSize.width){
            betweenPos.x = posX;
            betweenPos.z = i;
            drawSingleWall(betweenPos);
          }
        }

      }else if(posZ === endPosZ){

        if(posX < endPosX){
          for(let i = posX+cubeSize.width; i <= endPosX; i+=cubeSize.width){
            betweenPos.x = i;
            betweenPos.z = posZ;
            drawSingleWall(betweenPos);
          }
        }else{
          for(let i = posX-cubeSize.width; i >= endPosX; i-=cubeSize.width){
            betweenPos.x = i;
            betweenPos.z = posZ;
            drawSingleWall(betweenPos);
          }
        }

      }

      posX = undefined;
      posZ = undefined;
      endPosX = undefined;
      endPosZ = undefined;
    }
  });

  //confirm maze draw with SPACEBAR
  $('body').keyup((e) => {
    if(e.keyCode === 32){
      if(!follow){
        draw = false;
        //drawCoins(); //draw coins here
        raiseWalls();
      }
    }
  });
};

const convertPos = (e) => {
  if(draw){
    let vector = new THREE.Vector3();

    vector.set(
      (e.clientX / windowSize.width)*2-1,
      -(e.clientY / windowSize.height)*2+1,
      0.5);

    vector.unproject(camera);

    let dir = vector.sub(camera.position).normalize();

    let distance = -camera.position.y/dir.y;

    let pos = camera.position.clone().add(dir.multiplyScalar(distance));

    return pos;
  }
};

const drawSingleWall = (e) => {
  if(draw){
    cube = new Cube(cubeSize);

    cube._singleBlock(e, xPosGrid, zPosGrid);

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
  console.log(innerWalls.length);

  /*if(innerWalls.length === 500 && draw){
    draw = false;
    drawCoins();
  }*/
};

const drawCoins = () => {
  //Geef positie terug waar geen coin en geen cube is, plaats daar een coin
  let randomX = randomPos(xGrid);
  let randomZ = randomPos(zGrid);

  let found = false;
  let counter = 0;

  innerWalls.forEach(w => {
    counter++;

    if(found){
      //drawCoins();
    }else{
      if(w.position.x === randomX && w.position.z === randomZ){
        found = true;
      }
    }

    if(counter === innerWalls.length){
      console.log('draw');

      if(coins.length === numCoins){
        console.log('raise walls');
        raiseWalls();
      }else{
        let coin = new Coin(randomX, randomZ);
        scene.add(coin.render());
        coins.push(coin);

        drawCoins();
      }
    }
  });
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
  camera.position.set(pacman.position.x + 80, pacman.position.y + 80, pacman.position.z + 50);
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
