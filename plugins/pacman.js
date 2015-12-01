'use strict';

module.exports.register = (server, options, next) => {

  let io = require('socket.io')(server.listener);

  console.log('Hello Pacman');

  io.on('connection', socket => {
    console.log('socket io connection');
  });

  next();

};

module.exports.register.attributes = {
  name: 'pacman',
  version: '0.1.0'
};
