'use strict';

module.exports.register = (server, options, next) => {

  let Player = require('../models/Player');
  let io = require('socket.io')(server.listener);

  let players = [];
  let coins;
  let game = {};
  game.pacmanPos = 0;
  game.ghost1Pos = 1;
  game.ghost2Pos = 2;
  game.ghost3Pos = 3;

  io.on('connection', socket => {
    socket.on('disconnect', () => {
      players.forEach(p => {
        if(p.socketid === socket.id){
          players.splice(players.indexOf(p, 1));
        }
      });

      socket.broadcast.emit('leave', socket.id);
    });

    let maxID = 0;

    if(players.length > 0){
      players.forEach(player => {
        if(player.id > maxID){
          maxID = player.id;
        }
      });
    }

    let player = new Player(maxID + 1, socket.id);

    players.unshift(player); //push = last pos ____ unshift = first pos

    socket.emit('init', players, player.socketid, game); //only myself

    socket.broadcast.emit('join', player); //broadcast to everyone

    socket.on('done-drawing', data => {
      socket.broadcast.emit('setup', data);
    });

    socket.on('move', (pos, object) => {
      socket.broadcast.emit('moved', pos, object);

      switch(object.name){
      case 'pacman':
        game.pacmanPos = pos;
        break;
      case 'ghost1':
        game.ghost1Pos = pos;
        break;
      case 'ghost2':
        game.ghost2Pos = pos;
        break;
      case 'ghost3':
        game.ghost3Pos = pos;
        break;
      }

      if(game.pacmanPos === game.ghost1Pos || game.pacmanPos === game.ghost2Pos ||
        game.pacmanPos === game.ghost3Pos){
        socket.broadcast.emit('catched');
        socket.emit('catched');
      }

      if(object.name === 'pacman'){
        coins.forEach(coin => {
          if(coin.arrPos === pos-1){
            socket.emit('catchedCoin', coin);
            socket.broadcast.emit('catchedCoin', coin);
          }
        });
      }

    });

    socket.on('coinsSet', data => {
      coins = data;
      socket.broadcast.emit('placeCoins', data);
    });

    socket.on('update', gameData => {
      game = gameData;
      socket.broadcast.emit('updated', gameData);
    });

    socket.on('spreadMessage', message => {
      socket.emit('message', message);
      socket.broadcast.emit('message', message);
    });

    socket.on('out', () => {
      players = [];
      game = {};
      game.pacmanPos = 0;
      game.ghost1Pos = 1;
      game.ghost2Pos = 2;
      game.ghost3Pos = 3;

      socket.broadcast.emit('reset');
    });
  });

  next();

};

module.exports.register.attributes = {
  name: 'pacman',
  version: '0.1.0'
};
