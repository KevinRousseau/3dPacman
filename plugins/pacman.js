'use strict';

module.exports.register = (server, options, next) => {

  let Player = require('../models/Player');
  let io = require('socket.io')(server.listener);

  let players = [];
  let game = {};

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
    });

    socket.on('update', gameData => {
      game = gameData;
      socket.broadcast.emit('updated', gameData);
    });

    socket.on('out', () => {
      socket.broadcast.emit('reset');
    });
  });

  next();

};

module.exports.register.attributes = {
  name: 'pacman',
  version: '0.1.0'
};
