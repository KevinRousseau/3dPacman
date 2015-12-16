'use strict';

import {Grid, Cube, Floor, Pacman, Ghost, Coin} from './svg/';
import {closest, mapRangeSound, mapRangeGhost, dist, randomPos} from './helpers/util';


let OrbitControls = require('three-orbit-controls')(THREE);
//let TWEEN = require('tween.js');

//tags/elements in html & controls
let _three;

let keys = ['Down', 'Right', 'Left', 'Up'];
let ghostColors = [0xFFBCDD, 0x00FFDF, 0xF2100F];

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

//three objects
let scene, camera, renderer;
let floor, grid, cube, cubeHor, cubeVer, pacman, ghost1, ghost2, ghost3;

//push back
let audioContext;

let mediaStreamSource = null, analyser = null, buflen = 1024, buf = new Float32Array( buflen ),
  MIN_SAMPLES = 0, distbt;

let update = false, pushGhost = false, pushingGhost, soundPushDirection = 1, timeinterval, playNum = 0;

//arrays
let collisionGrid = [], outerWalls = [], innerWalls = [], xPosGrid = [], zPosGrid = [], ghosts = [],
  coins = [], coinObjects = [];

//let originalX = 0, originalZ = 0, originalY =(windowSize.width/20)*4;
//let ox = false, oz = false, oy = false;

//true/false
let follow = false, draw = true, startGame = false;

//server
let players = [], game = {}, you;


const init = () => {
  socket = io('http://localhost:3000');

  _three = $('.three');

  audioContext = new AudioContext();

  window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;

  for(let i = 0; i < 760; i++){
    collisionGrid.push(false);
  }

  server();
};

const server = () => {
  socket.on('init', (ps, socketid, gameData) => {
    players = ps;
    players.forEach(p => {
      if(p.socketid === socketid){
        you = p;

        game = gameData;

        if(game.nowPlaying === undefined){
          playNum = '<strong>0</strong>';
        } else{
          playNum = `<strong>${game.nowPlaying}</strong>`;
        }

        $('.numPlaying').html(playNum);

        if(game.start){
          $('.buttons').addClass('hidden');
          $('.title').addClass('hidden');
        }

        if(game.nowPlaying === 4){
          $('.buttons').addClass('hidden');
        }

        $('.pacman-button').click(() => {
          $('.draw-info').removeClass('hidden');
          if(game.pacmanId === undefined){
            game.pacmanId = you.id;
            game.nowPlaying = 1;
            startGame = true;
            socket.emit('update', game);
            $('.people').addClass('hidden');
            setScene();
          }else{
            $('.error-ghost').removeClass('hidden');
          }
        });

        ghostClick();
      }
    });
  });

  socket.on('join', p => {
    players.push(p);
  });

  socket.on('leave', socketid => {
    players.forEach(p => {

      if(p.socketid === socketid && startGame){
        if(p.id === game.pacmanId){
          pacman.position.y = 400;
          game.pacmanId = undefined;
          game.nowPlaying--;
          socket.emit('update', game);
          reset();
        }else if(p.id === game.ghost1Id){
          ghost1.position.y = 400;
          game.ghost1Id = undefined;
          game.nowPlaying--;
        }else if( p.id === game.ghost2Id){
          ghost2.position.y = 400;
          game.ghost2Id = undefined;
          game.nowPlaying--;
        }else if( p.id === game.ghost3Id){
          ghost3.position.y = 400;
          game.ghost3Id = undefined;
          game.nowPlaying--;
        }

        if(game.nowPlaying === 0 || game.nowPlaying === 1){
          socket.emit('update', game);
          reset();
        }

        socket.emit('update', game);

        players.splice(p, 1);
      }
    });
  });

  socket.on('updated', gameData => {
    game = gameData;

    if(startGame){

      if(game.pacmanId){
        pacman.position.y = 0;
      }

      if(game.ghost1Id){
        ghost1.position.y = 0;
      }

      if(game.ghost2Id){
        ghost2.position.y = 0;
      }

      if(game.ghost3Id){
        ghost3.position.y = 0;
      }
    }

    if(you.id === game.pacmanId || you.id === game.ghost1Id
      || you.id === game.ghost2Id || you.id === game.ghost3Id){
      //do nothing
    }else{
      $('.buttons').removeClass('hidden');
    }

    $('.numPlaying').text(game.nowPlaying);

    if(game.nowPlaying === 4){
      $('.buttons').addClass('hidden');
    }

    if(!game.pacmanId){
      reset();
    }

    if(game.nowPlaying === 1 && !game.pacmanId){
      reset();
    }

    if(game.start){
      $('.buttons').addClass('hidden');
      $('.title').addClass('hidden');
    }else{
      if(!you){
        $('.buttons').removeClass('hidden');
        $('.title').removeClass('hidden');
        $('.error-ghost').addClass('hidden');
        $('.error-pacman-first').addClass('hidden');
      }
    }
  });

  socket.on('reset', () => {
    location.reload();
  });

  socket.on('catched', () => {
    follow = false;
    pacman.position.y = 400;
    let message = 'Pacman got caught!';
    socket.emit('spreadMessage', message);

    clearInterval(timeinterval);

    pacman.position.y = 400;
    ghost1.position.y = 400;
    ghost2.position.y = 400;
    ghost3.position.y = 400;

    setTimeout(() => {
      reset();
    }, 5000);
  });

  socket.on('placeCoins', dataObject => {
    coins = dataObject;

    coins.forEach(coin => {
      let newCoin = new Coin(coin.x, coin.z);
      coinObjects.push(newCoin);
      scene.add(newCoin.render());
    });
  });

  let num = 1;

  socket.on('catchedCoin', coinData => {
    coinObjects.forEach(coinObject => {
      if(coinObject.position.x === coinData.x && coinObject.position.z === coinData.z){
        if(coinObject.coin.position.y === 400){
          //do nothing
        }else{
          coinObject.coin.position.y = 400;
          $('.caughtCoins').text(num++);
          if(num === 21){
            follow = false;
            let message = 'Pacman won!';
            socket.emit('spreadMessage', message);

            clearInterval(timeinterval);

            pacman.position.y = 400;
            ghost1.position.y = 400;
            ghost2.position.y = 400;
            ghost3.position.y = 400;

            setTimeout(() => {
              reset();
            }, 5000);
          }
        }
      }
    });
  });

  socket.on('message', message => {
    console.log(message);
    $('.finished span').text(message);
    $('.finished').removeClass('hidden');
  });

};

const ghostClick = () => {
  $('.ghost-button').click(() => {
    if(game.nowPlaying >= 1){
      if(game.ghost1Id === undefined){
        game.ghost1Id = you.id;
        game.nowPlaying++;
        startGame = true;
        socket.emit('update', game);
        $('.people').addClass('hidden');
        setScene();
      }else if(game.ghost2Id === undefined){
        game.ghost2Id = you.id;
        game.nowPlaying++;
        startGame = true;
        socket.emit('update', game);
        $('.people').addClass('hidden');
        setScene();
      }else if(game.ghost3Id === undefined){
        game.ghost3Id = you.id;
        game.nowPlaying++;
        startGame = true;
        socket.emit('update', game);
        $('.people').addClass('hidden');
        setScene();
      }
    }else{
      $('.error-pacman-first').removeClass('hidden');
    }
  });
};

const setScene = () => {
  $('.buttons').addClass('hidden');
  $('h1').addClass('hidden');
  $('.title').addClass('hidden');

  //three setup
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, windowSize.width / windowSize.height, 0.1, 1000);
  camera.position.set(0, (windowSize.width/20)*4, 0); //topview

  renderer = new THREE.WebGLRenderer(); //{alpha: true} = achtergrond (zwart) weg is
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
  if(game.pacmanId){
    pacman.position.y = 0;
  }

  //ghost1
  ghost1 = new Ghost();
  scene.add(ghost1.render(ghostColors[0], {x: -310, z: -130}));
  ghost1.name = 'ghost1';
  ghosts.push(ghost1);
  if(game.ghost1Id){
    ghost1.position.y = 0;
  }

  //ghost2
  ghost2 = new Ghost();
  scene.add(ghost2.render(ghostColors[1], {x: 310, z: 130}));
  ghost2.name = 'ghost2';
  ghosts.push(ghost2);
  if(game.ghost2Id){
    ghost2.position.y = 0;
  }

  //ghost3
  ghost3 = new Ghost();
  scene.add(ghost3.render(ghostColors[2], {x: 310, z: -130}));
  ghost3.name = 'ghost3';
  ghosts.push(ghost3);
  if(game.ghost3Id){
    ghost3.position.y = 0;
  }

  //lights
  let Hlight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.6 );
  Hlight.position.set(20, 65, 0);
  Hlight.castShadow = true;
  Hlight.intensity = 0.6;
  scene.add(Hlight);

  let light = new THREE.PointLight();
  light.position.set(-256, 256, -256);
  scene.add(light);

  //orbitcontrols
  let controls = new OrbitControls(camera);
  controls.enabled = false;

  setWalls();

  render();
};

const setWalls = () => {

  let leftWall = grid.position.x-(18.5*20);
  let topWall = grid.position.z-(9.5*20);

  //hor walls
  for(let i = topWall; i <= -(topWall); i += -(topWall*2)) {
    for(let j = leftWall; j <= -(leftWall); j += 20) {
      addCollision(j, i);
      xPosGrid.push(j);
      cubeHor = new Cube(cubeSize);
      cubeHor._walls(i, j);
      scene.add(cubeHor.render());
      outerWalls.push(cubeHor);
    }
  }
  //vert walls
  for(let i = leftWall; i <= -(leftWall); i += -(leftWall*2)) {
    for(let j = topWall; j <= -(topWall); j += 20) {
      addCollision(i, j);
      zPosGrid.push(j);
      cubeVer = new Cube(cubeSize);
      cubeVer._walls(j, i);
      scene.add(cubeVer.render());
      outerWalls.push(cubeVer);
    }
  }

  if(game.pacmanId === you.id){ //_______________________________________________________CHECK USER = PACMAN = DRAW MAZE
    you.object = pacman;
    you.object.name = 'pacman';
    drawWalls();
  }else{

    let char = true;

    if(game.ghost1Id === you.id){
      you.object = ghost1;
      you.object.name = 'ghost1';
    }else if(game.ghost2Id === you.id){
      you.object = ghost2;
      you.object.name = 'ghost2';
    }else if(game.ghost3Id === you.id){
      you.object = ghost3;
      you.object.name = 'ghost3';
    }else{
      char = false;
    }

    if(char){
      socket.on('setup', data => {
        collisionGrid = data.grid;
        innerWalls = data.walls;

        innerWalls.forEach(w => {
          let c = new Cube(cubeSize);
          c._walls(w.position.z, w.position.x);
          scene.add(c.render());

          c._scaleUp();
        });

        raiseWalls();
        draw = false;
      });
    }
  }
};

const drawWalls = () => {
  let drag = false;

  _three.mouseup(() => {
    drag = false;
  });

  _three.mousedown((event) => {
    drag = true;
    let c1 = convertPos(event);
    drawSingleWall(c1);


    _three.mousemove((e) => {
      if(drag){
        let c2 = convertPos(e);
        drawSingleWall(c2);
      }
    });
  });

  //confirm maze draw with SPACEBAR
  $('body').keyup((e) => {
    if(game.nowPlaying > 2){
      if(e.keyCode === 32){
        if(!follow){
          $('.draw-info').addClass('hidden');
          draw = false;

          game.start = true;
          socket.emit('update', game);

          raiseWalls();

          socket.emit('done-drawing', {
            grid: collisionGrid,
            walls: innerWalls
          });
        }
      }
    }
  });
};

const addCollision = (x, y) => {
  let newX, newY;
  let arrPosX, arrPosY;
  let xWidth = 38;
  let yWidth = 20;

  //X
  if(x === -10){
    arrPosX = (xWidth/2)-1;
  }else if(x === 10){
    arrPosX = (xWidth/2);
  }else if(x < -10){
    newX = x-10;
    arrPosX = (newX/20)+xWidth/2;
  }else if(x > 10){
    newX = x-10;
    arrPosX = (newX/20)+xWidth/2;
  }

  //Y
  if(y === -10){
    arrPosY = (yWidth/2)-1;
  }else if(y === 10){
    arrPosY = yWidth/2;
  }else if(y < -10){
    newY = y-10;
    arrPosY = ((newY/20)+10);
  }else if(y > 10){
    newY = y-10;
    arrPosY = (newY/20)+10;
  }

  let arrPos = (arrPosY * xWidth)+arrPosX;
  collisionGrid[arrPos] = true;
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

    if(cube.position.x === 30 && cube.position.z === 30 ||
      cube.position.x === 30 && cube.position.z === -30 ||
      cube.position.x === -30 && cube.position.z === 30 ||
      cube.position.x === -30 && cube.position.z === -30){
      //don't add
    }else{

      if(cube.position.x === 10 && cube.position.z === 10 ||
      cube.position.x === 10 && cube.position.z === -10 ||
      cube.position.x === -10 && cube.position.z === 10 ||
      cube.position.x === -10 && cube.position.z === -10){
        //don't add
      }else{
        if(cube.position.x === -310 && cube.position.z === -130 ||
          cube.position.x === 310 && cube.position.z === 130 ||
          cube.position.x === 310 && cube.position.z === -130){
          //don't add
        }else{
          addCollision(closest(cube.position.x, xPosGrid),
          closest(cube.position.z, zPosGrid));
          scene.add(cube.render());
          innerWalls.push(cube);
        }
      }

    }
  }
};

const setCoins = () => {
  for(let i = 0; i < 100; i++){
    if(coins.length < 20){
      let coinPosX = randomPos(xPosGrid);
      let coinPosZ = randomPos(zPosGrid);

      let coinPosGrid = move(coinPosX, coinPosZ);

      if(!collisionGrid[coinPosGrid+1]){
        let coin = new Coin(coinPosX, coinPosZ);
        coinObjects.push(coin);
        coins.push({x: coinPosX, z: coinPosZ, arrPos: coinPosGrid});
        scene.add(coin.render());
      }
    }
  }
};

const raiseWalls = () => {
  if(you.id === game.pacmanId){
    setCoins();
    socket.emit('coinsSet', coins);
  }

  $('.timing').removeClass('hidden');

  if(you.id === game.pacmanId){
    getSound();
  }

  outerWalls.forEach(wallCube => {
    wallCube._scaleUp();
  });

  if(game.pacmanId === you.id){
    innerWalls.forEach(innerCube => {
      innerCube._scaleUp();
    });
  }

  grid.changepos();
  floor.changepos();

  timer();

  setFocus();
};

const timer = () => {
  let sec = 60;
  let timeinterval = setInterval(() => {
    sec--;
    $('.countdown').text(sec);

    if(sec === 0){
      let message = 'Time\'s up!';
      socket.emit('spreadMessage', message);

      clearInterval(timeinterval);

      pacman.position.y = 400;
      ghost1.position.y = 400;
      ghost2.position.y = 400;
      ghost3.position.y = 400;

      setTimeout(() => {
        reset();
      }, 5000);
    }
  }, 1000);
};

const reset = () => {
  $('.timing').addClass('hidden');
  game = {};
  game = {nowPlaying: 0};
  socket.emit('update', game);
  socket.emit('out');
  location.reload();
};

const setFocus = () => {
  /*//TWEEN
  //new tween
  //easing
  //onupdate
  //oncomplete
  //start

  /*new TWEEN.Tween( camera.position )
  .easing( TWEEN.Easing.Sinusoidal.EaseInOut)
  .to({
    x: you.object.position.x,
    y: you.object.position.y,
    z: you.object.position.z
  }, 600 )
  .start();*/

  camera.position.set(you.object.position.x + 80,
      you.object.position.y + 80,
      you.object.position.z + 50);

  camera.lookAt(you.object.position);
  follow = true;
};

const moveCharacter = (event, object) => {
  let keypressed = event.keyIdentifier;

  if(keys.indexOf(keypressed) === -1){
    return;
  }

  event.preventDefault();

  let arrPos;

  switch(keypressed){
  case 'Up':
    arrPos = move(object.position.x, object.position.z);

    if(!collisionGrid[arrPos]){
      object.position.x-=20;
      object.rotation.y = 0;

      socket.emit('move', arrPos, you.object);
    }
    break;

  case 'Down':
    arrPos = move(object.position.x, object.position.z)+2;

    if(!collisionGrid[arrPos]){
      object.position.x+=20;
      object.rotation.y = Math.PI;

      socket.emit('move', arrPos, you.object);
    }
    break;

  case 'Left':
    arrPos = move(object.position.x, object.position.z)+39;

    if(!collisionGrid[arrPos]){
      object.position.z+=20;
      object.rotation.y = Math.PI/2;

      socket.emit('move', arrPos, you.object);
    }
    break;

  case 'Right':
    arrPos = move(object.position.x, object.position.z)-37;

    if(!collisionGrid[arrPos]){
      object.position.z-=20;
      object.rotation.y = (Math.PI/2)*3;

      socket.emit('move', arrPos, you.object);
    }
    break;
  }
};

const move = (x, y) => {
  let newX, newY;
  let arrPosX, arrPosY;
  let xWidth = 38;
  let yWidth = 20;

  //X
  if(x === -10){
    arrPosX = (xWidth/2)-1;
  }else if(x === 10){
    arrPosX = (xWidth/2);
  }else if(x < -10){
    newX = x-10;
    arrPosX = (newX/20)+xWidth/2;
  }else if(x > 10){
    newX = x-10;
    arrPosX = (newX/20)+xWidth/2;
  }

  //Y
  if(y === -10){
    arrPosY = (yWidth/2)-1;
  }else if(y === 10){
    arrPosY = yWidth/2;
  }else if(y < -10){
    newY = y-10;
    arrPosY = ((newY/20)+10);
  }else if(y > 10){
    newY = y-10;
    arrPosY = (newY/20)+10;
  }

  let arrPos = (arrPosY * xWidth)+arrPosX;
  return arrPos-1;
};

const opponentMove = () => {
  socket.on('moved', (pos, object) =>{
    switch(object.name){
    case 'pacman':
      pacman.position.x = object.position.x;
      pacman.position.z = object.position.z;
      break;
    case 'ghost1':
      ghost1.position.x = object.position.x;
      ghost1.position.z = object.position.z;
      break;
    case 'ghost2':
      ghost2.position.x = object.position.x;
      ghost2.position.z = object.position.z;
      break;
    case 'ghost3':
      ghost3.position.x = object.position.x;
      ghost3.position.z = object.position.z;
      break;
    }
  });
};

//get user media call
const getSound = () => {
  getUserMedia(
    {
      'audio': {
        'mandatory': {
          'googEchoCancellation': 'false',
          'googAutoGainControl': 'false',
          'googNoiseSuppression': 'false',
          'googHighpassFilter': 'false'
        },
        'optional': []
      }
    }, gotStream
  );
};

//callback
const getUserMedia = (dictionary, callback) => {
  try {
    navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
    navigator.getUserMedia(dictionary, callback, error);
  } catch (e) {
    //console.log(e);
  }
};

//check stream source.
const gotStream = (stream) => {
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  mediaStreamSource.connect( analyser );
  update = true;
  pushingGhost = ghost1;
};

//update: check if yell/whistle.
const updatePitch = () => {
  analyser.getFloatTimeDomainData( buf );
  let ac = autoCorrelate( buf, audioContext.sampleRate );
  if (ac === -1) {
    if(pushGhost){
      pushingGhost.position.x = closest(pushingGhost.position.x, xPosGrid);
      pushingGhost.position.z = closest(pushingGhost.position.z, zPosGrid);

      let movePos = move(pushingGhost.position.x, pushingGhost.position.z);

      if(collisionGrid[movePos+1]){
        switch(soundPushDirection){
        case 0:
          pushingGhost.position.x-=20;
          break;
        case 1:
          pushingGhost.position.x+=20;
          break;
        case 2:
          pushingGhost.position.z+=20;
          break;
        case 3:
          pushingGhost.position.z-=20;
          break;
        }
      }else{
        socket.emit('move', movePos, pushingGhost);
      }
    }

    pushGhost = false;
    return;
  } else {
    pushGhost = true;
    moveGhosts(mapRangeSound(Math.round(ac)));
  }
};

//calculate pitch on sound.
const autoCorrelate = (buff, sampleRate) => {
  let SIZE = buff.length;
  let MAX_SAMPLES = Math.floor(SIZE/2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  let correlations = new Array(MAX_SAMPLES);

  for (let i=0; i<SIZE; i++){
    let val = buff[i];
    rms += val*val;
  }
  rms = Math.sqrt(rms/SIZE);
  if (rms<0.01){ //not enough signal
    return -1;
  }

  let lastCorrelation=1;
  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i=0; i<MAX_SAMPLES; i++) {
      correlation += Math.abs((buff[i])-(buff[i+offset]));
    }
    correlation = 1 - (correlation/MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation>0.9) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation){
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around bestOffset in order to better determine precise
      // (anti-aliased) offset.

      // we know bestOffset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      let shift = (correlations[bestOffset+1] - correlations[bestOffset-1])/correlations[bestOffset];
      return sampleRate/(bestOffset+(8*shift));
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.01) {
    return sampleRate/bestOffset;
  }
  return -1;
};

const moveGhosts = value => {
  ghosts.forEach(ghost => {
    //map distance & multiply = radius
    distbt = dist(pacman.position.x, pacman.position.y, pacman.position.z, ghost.position.x, ghost.position.y, ghost.position.z);
    let multiply = mapRangeGhost(distbt);
    //X VALUES
    // pacman in front of cube
    if(pacman.position.x < ghost.position.x){
      //pacman faced to cube
      if(pacman.rotation._y === Math.PI){
        if(pacman.position.z === ghost.position.z && ghost.position.y === 0){
          soundPushDirection = 0;
          pushingGhost = ghost;
          ghost.position.x+=value * multiply;
        }
      }
    }else{
      //pacman in front of cube faced the other way
      if(pacman.rotation._y === 0){
        if(pacman.position.z === ghost.position.z && ghost.position.y === 0){
          soundPushDirection = 1;
          pushingGhost = ghost;
          ghost.position.x-=value * multiply;
        }
      }
    }
    //Z VALUES
    if(pacman.position.z > ghost.position.z){
      //pacman faced to the cube
      if(pacman.rotation._y === (Math.PI/2)*3){
        if(pacman.position.x === ghost.position.x && ghost.position.y === 0){
          soundPushDirection = 2;
          pushingGhost = ghost;
          ghost.position.z-=value * multiply;
        }
      }
    } else {
      //pacman in front of cube faced the other way
      if(pacman.rotation._y === (Math.PI/2)){
        if(pacman.position.x === ghost.position.x && ghost.position.y === 0){
          soundPushDirection = 3;
          pushingGhost = ghost;
          ghost.position.z+=value * multiply;
        }
      }
    }
  });
};

const render = () => {
  if(follow){
    setFocus();
  }

  if(update){
    updatePitch();
  }

  if(!draw){ //active when pressed on spacebar
    let shouldHandleKeyDown = true;

    opponentMove();

    document.onkeydown = e => {
      if (!shouldHandleKeyDown) return;
      shouldHandleKeyDown = false;

      if(game.pacmanId === you.id){ //______________________________________________________________________PACMAN CHECK
        moveCharacter(e, pacman);
      }else if(game.ghost1Id === you.id){
        moveCharacter(e, ghost1);
      }else if(game.ghost2Id === you.id){
        moveCharacter(e, ghost2);
      }else if(game.ghost3Id === you.id){
        moveCharacter(e, ghost3);
      }
    };

    document.onkeyup = () => {
      shouldHandleKeyDown = true;
    };
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

const error = () => {
  console.log('stream gen failed');
};

init();
